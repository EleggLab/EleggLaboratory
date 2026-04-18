import net from "node:net";

const ports = [
  { port: 5173, label: "웹(Vite)" },
  { port: 8787, label: "Worker" },
];

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && typeof error === "object" && "code" in error && error.code === "EADDRINUSE") {
        reject(new Error(`포트 ${port}가 이미 사용 중입니다.`));
        return;
      }
      reject(error);
    });

    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve());
    });
  });
}

async function main() {
  const occupied = [];

  for (const item of ports) {
    try {
      await checkPort(item.port);
    } catch (error) {
      occupied.push({
        ...item,
        message: error instanceof Error ? error.message : `포트 ${item.port}를 확인하지 못했습니다.`,
      });
    }
  }

  if (occupied.length === 0) {
    console.log("개발 포트 점검 완료: 5173, 8787 사용 가능");
    return;
  }

  console.error("개발 서버를 시작하기 전에 아래 포트를 비워 주세요.");
  for (const item of occupied) {
    console.error(`- ${item.label} ${item.port}: ${item.message}`);
  }
  console.error("기존 dev 서버를 종료한 뒤 다시 `corepack pnpm dev`를 실행하면 항상 같은 주소로 열립니다.");
  process.exit(1);
}

await main();
