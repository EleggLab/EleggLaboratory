import { LoaderCircle, RefreshCw, WifiOff } from "lucide-react";

interface ConnectionBannerProps {
  connectionStatus: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
}

export function ConnectionBanner({ connectionStatus }: ConnectionBannerProps) {
  if (connectionStatus === "connected" || connectionStatus === "idle") {
    return null;
  }

  const content =
    connectionStatus === "connecting"
      ? {
          icon: <LoaderCircle size={18} className="spin" />,
          message: "방에 연결 중입니다.",
        }
      : connectionStatus === "reconnecting"
        ? {
            icon: <RefreshCw size={18} className="spin" />,
            message: "연결이 끊겼어요. 다시 붙는 중입니다.",
          }
        : {
            icon: <WifiOff size={18} />,
            message: "연결이 끊겼습니다. 페이지를 새로 열어 다시 들어와 주세요.",
          };

  return (
    <div className={`connection-banner connection-${connectionStatus}`}>
      <span className="status-icon">{content.icon}</span>
      <span>{content.message}</span>
    </div>
  );
}
