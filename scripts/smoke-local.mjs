const webUrl = process.env.TONG_WEB_URL ?? "http://localhost:5173";
const workerUrl = process.env.TONG_WORKER_URL ?? "http://127.0.0.1:8787";
const smokeTimeoutMs = Number(process.env.TONG_SMOKE_TIMEOUT_MS ?? "6000");

function toWebSocketUrl(httpUrl) {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${payload.message ?? "request failed"}`);
  }
  return payload;
}

async function ensureReachable(url, label) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `${label} is not reachable at ${url}. Verify the supplied URL, start the dev servers with "corepack pnpm dev", or run "corepack pnpm smoke:boot".`,
    );
  }

  if (!response.ok) {
    throw new Error(`${label} responded with ${response.status} at ${url}.`);
  }

  return response;
}

async function advanceAll(streamEntries) {
  for (const entry of streamEntries) {
    entry.stream.send({ type: "endTurn", playerToken: entry.playerToken });
  }
}

class EventStream {
  constructor(name, url) {
    this.name = name;
    this.url = url;
    this.events = [];
    this.waiters = [];
    this.latestSnapshot = null;
    this.socket = new WebSocket(url);
    this.openPromise = new Promise((resolve, reject) => {
      const cleanup = () => {
        this.socket.removeEventListener("open", handleOpen);
        this.socket.removeEventListener("error", handleError);
      };

      const handleOpen = () => {
        cleanup();
        resolve();
      };

      const handleError = () => {
        cleanup();
        reject(new Error(`${this.name} websocket failed to open.`));
      };

      this.socket.addEventListener("open", handleOpen);
      this.socket.addEventListener("error", handleError);
    });

    this.socket.addEventListener("message", (event) => {
      const parsed = JSON.parse(String(event.data));
      if (parsed.type === "roomSnapshot") {
        this.latestSnapshot = parsed.snapshot;
      }
      this.events.push(parsed);
      this.flushWaiters();
    });

    this.socket.addEventListener("close", () => {
      this.rejectWaiters(new Error(`${this.name} websocket closed before the expected event arrived.`));
    });

    this.socket.addEventListener("error", () => {
      this.rejectWaiters(new Error(`${this.name} websocket reported an error.`));
    });
  }

  async open() {
    await this.openPromise;
    return this;
  }

  send(payload) {
    this.socket.send(JSON.stringify(payload));
  }

  waitFor(predicate, label, timeoutMs = smokeTimeoutMs) {
    const existing = this.events.find(predicate);
    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((waiter) => waiter !== waiterRecord);
        reject(new Error(`Timed out waiting for ${label} on ${this.name}.`));
      }, timeoutMs);

      const waiterRecord = {
        predicate,
        resolve: (event) => {
          clearTimeout(timer);
          resolve(event);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };

      this.waiters.push(waiterRecord);
    });
  }

  async waitForSnapshot(predicate, label, timeoutMs = smokeTimeoutMs) {
    const event = await this.waitFor(
      (currentEvent) => currentEvent.type === "roomSnapshot" && predicate(currentEvent.snapshot),
      label,
      timeoutMs,
    );
    return event.snapshot;
  }

  close() {
    this.socket.close();
  }

  flushWaiters() {
    const remaining = [];
    for (const waiter of this.waiters) {
      const matched = this.events.find(waiter.predicate);
      if (matched) {
        waiter.resolve(matched);
      } else {
        remaining.push(waiter);
      }
    }
    this.waiters = remaining;
  }

  rejectWaiters(error) {
    const currentWaiters = [...this.waiters];
    this.waiters = [];
    for (const waiter of currentWaiters) {
      waiter.reject(error);
    }
  }
}

async function main() {
  console.log("[smoke] checking local endpoints");
  const webResponse = await ensureReachable(webUrl, "Web app");
  const webHtml = await webResponse.text();
  if (!webHtml.includes("통이 크시네")) {
    throw new Error(`Web app at ${webUrl} did not return the expected HTML shell.`);
  }
  await ensureReachable(workerUrl, "Worker");

  console.log("[smoke] creating room");
  const host = await fetchJson(`${workerUrl}/api/rooms`, {
    method: "POST",
    body: JSON.stringify({ nickname: "스모크호스트" }),
  });

  const hostStream = await new EventStream(
    "host",
    toWebSocketUrl(`${workerUrl}/api/rooms/${host.roomCode}/ws?playerToken=${host.playerToken}`),
  ).open();

  await hostStream.waitFor((event) => event.type === "reconnectAccepted", "host reconnect acceptance");
  const hostLobbySnapshot = await hostStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "LOBBY" && snapshot.players.length === 1,
    "host lobby snapshot",
  );

  console.log("[smoke] joining second player");
  const guest = await fetchJson(`${workerUrl}/api/rooms/${host.roomCode}/join`, {
    method: "POST",
    body: JSON.stringify({ nickname: "스모크게스트" }),
  });

  console.log("[smoke] verifying that only connected players satisfy the lobby start rule");
  const prematureStart = await fetch(`${workerUrl}/api/rooms/${host.roomCode}/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerToken: host.playerToken }),
  });
  if (prematureStart.ok) {
    throw new Error("Game started even though only one player was connected.");
  }

  const guestStream = await new EventStream(
    "guest",
    toWebSocketUrl(`${workerUrl}/api/rooms/${host.roomCode}/ws?playerToken=${guest.playerToken}`),
  ).open();

  await guestStream.waitFor((event) => event.type === "reconnectAccepted", "guest reconnect acceptance");
  await guestStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "LOBBY" && snapshot.players.length === 2,
    "guest lobby snapshot with two players",
  );
  await hostStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "LOBBY" && snapshot.players.length === 2,
    "host lobby snapshot with two players",
  );

  console.log("[smoke] starting game");
  await fetchJson(`${workerUrl}/api/rooms/${host.roomCode}/start`, {
    method: "POST",
    body: JSON.stringify({ playerToken: host.playerToken }),
  });

  await hostStream.waitFor(
    (event) => event.type === "phaseStarted" && event.phase === "HINT_MARKET_OPEN" && event.roundNumber === 1,
    "host hint market start",
  );
  const hostHintSnapshot = await hostStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "HINT_MARKET_OPEN" && snapshot.roundNumber === 1,
    "host hint market snapshot",
  );
  await guestStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "HINT_MARKET_OPEN" && snapshot.roundNumber === 1,
    "guest hint market snapshot",
  );

  const hintToSell = hostHintSnapshot.readableHints.find((hint) => hint.canSell);
  if (!hintToSell) {
    throw new Error("Host did not receive a sellable hint during the hint market.");
  }

  console.log("[smoke] executing hint trade");
  hostStream.send({
    type: "placeSellOrder",
    playerToken: host.playerToken,
    hintId: hintToSell.id,
    price: 1,
    adTag: "즉시 활용",
  });

  const orderSnapshot = await hostStream.waitForSnapshot(
    (snapshot) => snapshot.sellOrders.some((order) => order.sellerPlayerId === host.playerId),
    "open sell order in snapshot",
  );
  const openedOrder = orderSnapshot.sellOrders.find((order) => order.sellerPlayerId === host.playerId);
  if (!openedOrder) {
    throw new Error("Host sell order did not appear in the order book.");
  }

  guestStream.send({
    type: "buySellOrder",
    playerToken: guest.playerToken,
    orderId: openedOrder.id,
  });

  await hostStream.waitFor((event) => event.type === "tradeExecuted", "host trade execution");
  await guestStream.waitFor((event) => event.type === "tradeExecuted", "guest trade execution");
  await guestStream.waitForSnapshot(
    (snapshot) => snapshot.readableHints.some((hint) => hint.id === hintToSell.id),
    "guest readable hints after trade",
  );

  console.log("[smoke] verifying all-connected end turn flow");
  hostStream.send({ type: "endTurn", playerToken: host.playerToken });
  await hostStream.waitForSnapshot(
    (snapshot) =>
      snapshot.phase === "HINT_MARKET_OPEN" &&
      snapshot.phaseReadyPlayerIds.includes(host.playerId) &&
      !snapshot.phaseReadyPlayerIds.includes(guest.playerId),
    "host ready state while waiting for guest",
  );
  await delay(350);

  guestStream.send({ type: "endTurn", playerToken: guest.playerToken });
  await hostStream.waitFor(
    (event) => event.type === "phaseStarted" && event.phase === "STOCK_MARKET_OPEN" && event.roundNumber === 1,
    "stock market start",
  );
  const stockSnapshot = await hostStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "STOCK_MARKET_OPEN" && snapshot.roundNumber === 1,
    "stock market snapshot",
  );

  console.log("[smoke] executing stock trade");
  const stockId = stockSnapshot.stocks[0]?.id;
  if (!stockId) {
    throw new Error("No stock was available during the stock market.");
  }

  hostStream.send({ type: "buyStock", playerToken: host.playerToken, stockId });
  await hostStream.waitFor((event) => event.type === "stockActionApplied", "stock action event");
  await hostStream.waitForSnapshot(
    (snapshot) => snapshot.self.holdings[stockId] >= 1,
    "host holdings after stock purchase",
  );

  console.log("[smoke] resolving settlement and next round");
  hostStream.send({ type: "endTurn", playerToken: host.playerToken });
  guestStream.send({ type: "endTurn", playerToken: guest.playerToken });
  await hostStream.waitFor((event) => event.type === "roundSettled", "round settlement event");
  await hostStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "ROUND_SETTLEMENT" && snapshot.roundNumber === 1,
    "round settlement snapshot",
  );

  hostStream.send({ type: "endTurn", playerToken: host.playerToken });
  guestStream.send({ type: "endTurn", playerToken: guest.playerToken });
  await hostStream.waitFor(
    (event) => event.type === "phaseStarted" && event.phase === "HINT_MARKET_OPEN" && event.roundNumber === 2,
    "round two hint market start",
  );
  await hostStream.waitForSnapshot(
    (snapshot) => snapshot.phase === "HINT_MARKET_OPEN" && snapshot.roundNumber === 2,
    "round two hint market snapshot",
  );

  console.log("[smoke] advancing through the remaining rounds");
  for (let roundNumber = 2; roundNumber <= 10; roundNumber += 1) {
    await advanceAll([
      { stream: hostStream, playerToken: host.playerToken },
      { stream: guestStream, playerToken: guest.playerToken },
    ]);
    await hostStream.waitFor(
      (event) => event.type === "phaseStarted" && event.phase === "STOCK_MARKET_OPEN" && event.roundNumber === roundNumber,
      `stock market start for round ${roundNumber}`,
    );
    await hostStream.waitForSnapshot(
      (snapshot) => snapshot.phase === "STOCK_MARKET_OPEN" && snapshot.roundNumber === roundNumber,
      `stock market snapshot for round ${roundNumber}`,
    );

    await advanceAll([
      { stream: hostStream, playerToken: host.playerToken },
      { stream: guestStream, playerToken: guest.playerToken },
    ]);
    await hostStream.waitFor(
      (event) => event.type === "roundSettled" && event.summary?.roundNumber === roundNumber,
      `round ${roundNumber} settlement event`,
    );
    await hostStream.waitForSnapshot(
      (snapshot) => snapshot.phase === "ROUND_SETTLEMENT" && snapshot.roundNumber === roundNumber,
      `round ${roundNumber} settlement snapshot`,
    );

    await advanceAll([
      { stream: hostStream, playerToken: host.playerToken },
      { stream: guestStream, playerToken: guest.playerToken },
    ]);

    if (roundNumber < 10) {
      await hostStream.waitFor(
        (event) => event.type === "phaseStarted" && event.phase === "HINT_MARKET_OPEN" && event.roundNumber === roundNumber + 1,
        `round ${roundNumber + 1} hint market start`,
      );
      await hostStream.waitForSnapshot(
        (snapshot) => snapshot.phase === "HINT_MARKET_OPEN" && snapshot.roundNumber === roundNumber + 1,
        `round ${roundNumber + 1} hint market snapshot`,
      );
      continue;
    }

    await hostStream.waitFor((event) => event.type === "gameEnded", "host game ended event");
    await guestStream.waitFor((event) => event.type === "gameEnded", "guest game ended event");
    const finalSnapshot = await hostStream.waitForSnapshot(
      (snapshot) => snapshot.phase === "GAME_END" && snapshot.roundNumber === 10,
      "final game end snapshot",
    );

    if (finalSnapshot.leaderboard.length !== 2) {
      throw new Error(`Expected two leaderboard entries at game end, received ${finalSnapshot.leaderboard.length}.`);
    }

    const incompleteHistory = finalSnapshot.stocks.find((stock) => stock.priceHistory.length !== 11);
    if (incompleteHistory) {
      throw new Error(
        `Expected full price history for ${incompleteHistory.code}, received ${incompleteHistory.priceHistory.length} entries.`,
      );
    }
  }

  hostStream.close();
  guestStream.close();

  console.log("[smoke] ok - create/join/ws/hint trade/stock trade/full game lifecycle passed");
}

main().catch((error) => {
  console.error(`[smoke] failed: ${error.message}`);
  process.exitCode = 1;
});
