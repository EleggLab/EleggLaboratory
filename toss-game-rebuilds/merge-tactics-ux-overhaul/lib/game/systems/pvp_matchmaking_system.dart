import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';

class MatchmakingResult {
  const MatchmakingResult({
    required this.opponentId,
    required this.opponentTrophies,
    required this.isAiFallback,
  });

  final String opponentId;
  final int opponentTrophies;
  final bool isAiFallback;
}

class PvpMatchmakingSystem {
  PvpMatchmakingSystem({
    FirebaseFirestore? firestore,
    this.matchTimeout = const Duration(seconds: 12),
    this.trophyRange = 200,
  }) : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;
  final Duration matchTimeout;
  final int trophyRange;

  CollectionReference<Map<String, dynamic>> get _queue {
    return _firestore.collection('match_queue');
  }

  Future<MatchmakingResult> findMatch({
    required String playerId,
    required int trophies,
  }) async {
    final DateTime startAt = DateTime.now();
    final DocumentReference<Map<String, dynamic>> myTicket = _queue.doc();

    await myTicket.set(<String, dynamic>{
      'playerId': playerId,
      'trophies': trophies,
      'status': 'waiting',
      'opponentId': null,
      'createdAt': FieldValue.serverTimestamp(),
    });

    while (DateTime.now().difference(startAt) < matchTimeout) {
      final MatchmakingResult? directMatch = await _tryDirectMatch(
        myTicket: myTicket,
        playerId: playerId,
        trophies: trophies,
      );
      if (directMatch != null) {
        return directMatch;
      }

      final DocumentSnapshot<Map<String, dynamic>> snapshot = await myTicket
          .get();
      final Map<String, dynamic>? data = snapshot.data();
      if (data != null && data['status'] == 'matched') {
        final String opponentId = (data['opponentId'] ?? 'unknown').toString();
        final int opponentTrophies = (data['opponentTrophies'] as int?) ?? 0;
        return MatchmakingResult(
          opponentId: opponentId,
          opponentTrophies: opponentTrophies,
          isAiFallback: false,
        );
      }

      await Future<void>.delayed(const Duration(milliseconds: 800));
    }

    await myTicket.update(<String, dynamic>{
      'status': 'timeout',
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return _fallbackAiMatch(trophies);
  }

  Future<MatchmakingResult?> _tryDirectMatch({
    required DocumentReference<Map<String, dynamic>> myTicket,
    required String playerId,
    required int trophies,
  }) async {
    final QuerySnapshot<Map<String, dynamic>> candidates = await _queue
        .where('status', isEqualTo: 'waiting')
        .where('trophies', isGreaterThanOrEqualTo: trophies - trophyRange)
        .where('trophies', isLessThanOrEqualTo: trophies + trophyRange)
        .limit(10)
        .get();

    for (final QueryDocumentSnapshot<Map<String, dynamic>> ticket
        in candidates.docs) {
      final Map<String, dynamic> data = ticket.data();
      final String candidatePlayer = (data['playerId'] ?? '').toString();
      if (candidatePlayer.isEmpty || candidatePlayer == playerId) {
        continue;
      }

      final bool locked = await _lockMatchPair(
        myTicket: myTicket,
        opponentTicket: ticket.reference,
        playerId: playerId,
        opponentId: candidatePlayer,
        playerTrophies: trophies,
        opponentTrophies: (data['trophies'] as int?) ?? 0,
      );

      if (locked) {
        return MatchmakingResult(
          opponentId: candidatePlayer,
          opponentTrophies: (data['trophies'] as int?) ?? 0,
          isAiFallback: false,
        );
      }
    }

    return null;
  }

  Future<bool> _lockMatchPair({
    required DocumentReference<Map<String, dynamic>> myTicket,
    required DocumentReference<Map<String, dynamic>> opponentTicket,
    required String playerId,
    required String opponentId,
    required int playerTrophies,
    required int opponentTrophies,
  }) async {
    try {
      await _firestore.runTransaction((Transaction transaction) async {
        final DocumentSnapshot<Map<String, dynamic>> mySnapshot =
            await transaction.get(myTicket);
        final DocumentSnapshot<Map<String, dynamic>> opponentSnapshot =
            await transaction.get(opponentTicket);

        final String myStatus = (mySnapshot.data()?['status'] ?? '').toString();
        final String opponentStatus = (opponentSnapshot.data()?['status'] ?? '')
            .toString();
        if (myStatus != 'waiting' || opponentStatus != 'waiting') {
          throw StateError('Ticket already matched.');
        }

        transaction.update(myTicket, <String, dynamic>{
          'status': 'matched',
          'opponentId': opponentId,
          'opponentTrophies': opponentTrophies,
          'updatedAt': FieldValue.serverTimestamp(),
        });
        transaction.update(opponentTicket, <String, dynamic>{
          'status': 'matched',
          'opponentId': playerId,
          'opponentTrophies': playerTrophies,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  MatchmakingResult _fallbackAiMatch(int trophies) {
    return MatchmakingResult(
      opponentId: 'AI_BOT',
      opponentTrophies: trophies,
      isAiFallback: true,
    );
  }
}
