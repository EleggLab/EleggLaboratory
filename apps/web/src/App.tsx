import { ConnectionBanner } from "./components/ConnectionBanner";
import { ToastStack } from "./components/ToastStack";
import { GameEndScreen } from "./screens/GameEndScreen";
import { HintMarketScreen } from "./screens/HintMarketScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LobbyScreen } from "./screens/LobbyScreen";
import { SettlementScreen } from "./screens/SettlementScreen";
import { StockMarketScreen } from "./screens/StockMarketScreen";
import { gameActions, useGameStore } from "./store/useGameStore";

export default function App() {
  const state = useGameStore();
  const snapshot = state.snapshot;
  const playerToken = state.session?.playerToken ?? null;

  return (
    <div className="app-shell">
      <ConnectionBanner connectionStatus={state.connectionStatus} />

      {!snapshot && (
        <HomeScreen
          connectionStatus={state.connectionStatus}
          nickname={state.nickname}
          savedSession={state.session}
          lastError={state.lastError}
          onNicknameChange={gameActions.setNickname}
          onCreateRoom={gameActions.createRoomAndConnect}
          onJoinRoom={gameActions.joinRoomAndConnect}
          onRejoinSavedRoom={gameActions.rejoinSavedRoom}
        />
      )}

      {snapshot?.phase === "LOBBY" && (
        <LobbyScreen
          snapshot={snapshot}
          onStartGame={gameActions.startGame}
          onLeaveRoom={gameActions.leaveRoom}
        />
      )}

      {snapshot?.phase === "HINT_MARKET_OPEN" && playerToken && (
        <HintMarketScreen
          snapshot={snapshot}
          playerToken={playerToken}
          onSendAction={gameActions.sendAction}
        />
      )}

      {snapshot?.phase === "STOCK_MARKET_OPEN" && playerToken && (
        <StockMarketScreen
          snapshot={snapshot}
          playerToken={playerToken}
          onSendAction={gameActions.sendAction}
        />
      )}

      {snapshot?.phase === "ROUND_SETTLEMENT" && playerToken && (
        <SettlementScreen
          snapshot={snapshot}
          playerToken={playerToken}
          onSendAction={gameActions.sendAction}
        />
      )}

      {snapshot?.phase === "GAME_END" && (
        <GameEndScreen
          snapshot={snapshot}
          onCreateRoom={() => gameActions.createRoomAndConnect(state.nickname || snapshot.self.nickname)}
          onGoHome={gameActions.goHome}
        />
      )}

      <ToastStack toasts={state.toasts} onDismiss={gameActions.dismissToast} />
    </div>
  );
}
