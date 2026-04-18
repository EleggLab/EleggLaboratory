import { useEffect, useState } from "react";
import { formatRemaining } from "../lib/time";

interface CountdownProps {
  phaseEndsAt: number | null;
  serverOffsetMs: number;
}

export function Countdown({ phaseEndsAt, serverOffsetMs }: CountdownProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  return <span>{formatRemaining(phaseEndsAt, serverOffsetMs)}</span>;
}
