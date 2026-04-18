import {
  createRoomBodySchema,
  joinRoomBodySchema,
  startGameBodySchema,
} from "@tong/shared/schema";
import { createRoomCode, createSeededRng } from "@tong/shared/utils";
import { Env, GameRoomDurableObject } from "./room";

export { GameRoomDurableObject };

async function routeToRoom(env: Env, roomCode: string, path: string, request: Request): Promise<Response> {
  const id = env.ROOMS.idFromName(roomCode);
  const stub = env.ROOMS.get(id);
  const url = new URL(request.url);
  const target = new URL(url.toString());
  target.pathname = path;
  return stub.fetch(
    new Request(target.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      duplex: "half",
    } as RequestInit),
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (url.pathname === "/api/rooms" && request.method === "POST") {
        const body = createRoomBodySchema.parse(await request.json());
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const roomCode = createRoomCode(createSeededRng(`${Date.now()}:${attempt}:${Math.random()}`));
          const existsResponse = await routeToRoom(
            env,
            roomCode,
            "/exists",
            new Request(url.toString(), { method: "GET" }),
          );
          const exists = (await existsResponse.json()) as { initialized: boolean };
          if (!exists.initialized) {
            const createUrl = new URL(url.toString());
            createUrl.searchParams.set("roomCode", roomCode);
            return routeToRoom(
              env,
              roomCode,
              "/create",
              new Request(createUrl.toString(), {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
              }),
            );
          }
        }
        return new Response(JSON.stringify({ message: "방 코드를 만들지 못했습니다." }), {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)(?:\/(join|start|ws))?$/);
      if (!roomMatch) {
        return new Response(JSON.stringify({ message: "API 경로를 찾을 수 없습니다." }), {
          status: 404,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      const [, roomCode, action] = roomMatch;
      if (!roomCode || !action) {
        return new Response(JSON.stringify({ message: "잘못된 API 요청입니다." }), {
          status: 404,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }

      if (action === "join" && request.method === "POST") {
        const body = joinRoomBodySchema.parse(await request.json());
        return routeToRoom(
          env,
          roomCode,
          "/join",
          new Request(url.toString(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          }),
        );
      }

      if (action === "start" && request.method === "POST") {
        const body = startGameBodySchema.parse(await request.json());
        return routeToRoom(
          env,
          roomCode,
          "/start",
          new Request(url.toString(), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          }),
        );
      }

      if (action === "ws" && request.headers.get("Upgrade") === "websocket") {
        const wsUrl = new URL(url.toString());
        wsUrl.pathname = "/ws";
        return routeToRoom(
          env,
          roomCode,
          "/ws",
          new Request(wsUrl.toString(), {
            method: "GET",
            headers: request.headers,
          }),
        );
      }

      return new Response(JSON.stringify({ message: "지원하지 않는 요청입니다." }), {
        status: 405,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "요청 처리에 실패했습니다.";
      return new Response(JSON.stringify({ message }), {
        status: 400,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
  },
};
