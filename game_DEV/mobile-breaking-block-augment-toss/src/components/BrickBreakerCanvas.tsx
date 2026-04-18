import { useEffect, useRef } from 'react';
import {
  BALL_RADIUS,
  BOARD_COLS,
  BOARD_ROWS,
  LAUNCHER_Y,
} from '../game/engine';
import { getBlockCatalogByKind, getBossById, getCrewById } from '../game/content';
import type { RunState } from '../game/types';

type PreviewPoint = {
  x: number;
  y: number;
};

type BrickBreakerCanvasProps = {
  state: RunState;
  preview: PreviewPoint[];
  onAimStart: (pointerId: number, x: number, y: number) => void;
  onAimMove: (pointerId: number, x: number, y: number) => void;
  onAimEnd: () => void;
};

const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 628;
const PADDING_X = 22;
const TOP_Y = 84;
const CELL = 42;
const BOARD_PIXEL_WIDTH = BOARD_COLS * CELL;
const BOARD_PIXEL_HEIGHT = BOARD_ROWS * CELL;
const LAUNCHER_Y_PX = TOP_Y + ((LAUNCHER_Y - 0.1) * CELL);

function boardToCanvasX(x: number) {
  return PADDING_X + (x * CELL);
}

function boardToCanvasY(y: number) {
  return TOP_Y + (y * CELL);
}

function canvasToBoardPosition(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  return {
    x: (x - PADDING_X) / CELL,
    y: (y - TOP_Y) / CELL,
  };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

export function BrickBreakerCanvas({
  state,
  preview,
  onAimStart,
  onAimMove,
  onAimEnd,
}: BrickBreakerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const background = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    background.addColorStop(0, '#F6FAFF');
    background.addColorStop(0.48, '#EEF5FF');
    background.addColorStop(1, '#E2EDFF');
    context.fillStyle = background;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.fillStyle = 'rgba(22, 100, 255, 0.06)';
    context.beginPath();
    context.arc(310, 88, 92, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(76, 548, 120, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#FFFFFF';
    drawRoundedRect(context, PADDING_X - 10, TOP_Y - 16, BOARD_PIXEL_WIDTH + 20, BOARD_PIXEL_HEIGHT + 116, 28);
    context.fill();

    context.strokeStyle = 'rgba(22, 100, 255, 0.14)';
    context.lineWidth = 1;
    for (let column = 0; column <= BOARD_COLS; column += 1) {
      const x = PADDING_X + (column * CELL);
      context.beginPath();
      context.moveTo(x, TOP_Y);
      context.lineTo(x, TOP_Y + BOARD_PIXEL_HEIGHT);
      context.stroke();
    }

    for (let row = 0; row <= BOARD_ROWS; row += 1) {
      const y = TOP_Y + (row * CELL);
      context.beginPath();
      context.moveTo(PADDING_X, y);
      context.lineTo(PADDING_X + BOARD_PIXEL_WIDTH, y);
      context.stroke();
    }

    const dangerY = TOP_Y + ((BOARD_ROWS - 1) * CELL);
    context.fillStyle = 'rgba(255, 139, 61, 0.08)';
    context.fillRect(PADDING_X, dangerY, BOARD_PIXEL_WIDTH, CELL);
    context.strokeStyle = 'rgba(255, 139, 61, 0.35)';
    context.setLineDash([8, 8]);
    context.beginPath();
    context.moveTo(PADDING_X, dangerY);
    context.lineTo(PADDING_X + BOARD_PIXEL_WIDTH, dangerY);
    context.stroke();
    context.setLineDash([]);

    if (preview.length > 1) {
      context.strokeStyle = 'rgba(22, 100, 255, 0.42)';
      context.lineWidth = 3;
      context.beginPath();
      preview.forEach((point, index) => {
        const x = boardToCanvasX(point.x);
        const y = boardToCanvasY(point.y);
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      });
      context.stroke();
    }

    if (state.boss && state.boss.alive) {
      const boss = getBossById(state.boss.bossId);
      const x = boardToCanvasX(state.boss.col);
      const y = boardToCanvasY(state.boss.row);
      const width = state.boss.width * CELL;
      const height = state.boss.height * CELL;
      context.fillStyle = boss.color;
      drawRoundedRect(context, x + 3, y + 3, width - 6, height - 6, 18);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.2)';
      context.fillRect(x + 16, y + 22, width - 32, 10);
      context.fillStyle = '#FFF7ED';
      context.fillRect(x + 16, y + 22, ((width - 32) * state.boss.hp) / state.boss.maxHp, 10);
      context.fillStyle = '#FFFFFF';
      context.font = '700 15px "SUIT Variable", "Pretendard Variable", sans-serif';
      context.fillText(boss.name, x + 16, y + 58);
      context.font = '600 13px "SUIT Variable", "Pretendard Variable", sans-serif';
      context.fillText(`${state.boss.hp}/${state.boss.maxHp}`, x + 16, y + 78);
    }

    for (const block of state.blocks) {
      if (!block.alive) {
        continue;
      }

      const x = boardToCanvasX(block.col);
      const y = boardToCanvasY(block.row);
      const tone = getBlockCatalogByKind(block.kind).tone;
      const innerX = x + 4;
      const innerY = y + 4;
      const innerSize = CELL - 8;

      context.save();
      if (block.kind === 'triangle' && block.orientation) {
        context.beginPath();
        switch (block.orientation) {
          case 'tl':
            context.moveTo(innerX, innerY);
            context.lineTo(innerX + innerSize, innerY);
            context.lineTo(innerX, innerY + innerSize);
            break;
          case 'tr':
            context.moveTo(innerX + innerSize, innerY);
            context.lineTo(innerX + innerSize, innerY + innerSize);
            context.lineTo(innerX, innerY);
            break;
          case 'bl':
            context.moveTo(innerX, innerY + innerSize);
            context.lineTo(innerX + innerSize, innerY + innerSize);
            context.lineTo(innerX, innerY);
            break;
          case 'br':
            context.moveTo(innerX + innerSize, innerY + innerSize);
            context.lineTo(innerX + innerSize, innerY);
            context.lineTo(innerX, innerY + innerSize);
            break;
        }
        context.closePath();
        context.fillStyle = tone;
        context.fill();
      } else {
        context.fillStyle = tone;
        drawRoundedRect(context, innerX, innerY, innerSize, innerSize, block.kind === 'ball' ? 18 : 14);
        context.fill();
      }

      if (block.kind === 'bomb') {
        context.fillStyle = '#FFF7ED';
        context.beginPath();
        context.arc(x + (CELL / 2), y + (CELL / 2), 8, 0, Math.PI * 2);
        context.fill();
      }

      if (block.kind === 'ball') {
        context.strokeStyle = '#FFF7ED';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(x + (CELL / 2), y + (CELL / 2), 12, 0, Math.PI * 2);
        context.stroke();
      }

      if (block.kind === 'cactus') {
        context.strokeStyle = 'rgba(255,255,255,0.6)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x + 14, y + 16);
        context.lineTo(x + 14, y + 30);
        context.moveTo(x + 28, y + 12);
        context.lineTo(x + 28, y + 32);
        context.stroke();
      }

      context.fillStyle = '#FFFFFF';
      context.font = '700 14px "SUIT Variable", "Pretendard Variable", sans-serif';
      context.textAlign = 'center';
      context.fillText(String(block.hp), x + (CELL / 2), y + 28);
      context.restore();
    }

    for (const ball of state.balls) {
      if (!ball.active) {
        continue;
      }

      context.fillStyle = '#FF9A30';
      context.beginPath();
      context.arc(
        boardToCanvasX(ball.x),
        boardToCanvasY(ball.y),
        BALL_RADIUS * CELL,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    const crew = getCrewById(state.crewId);
    context.fillStyle = 'rgba(11, 38, 92, 0.08)';
    context.fillRect(PADDING_X, TOP_Y + BOARD_PIXEL_HEIGHT + 18, BOARD_PIXEL_WIDTH, 58);
    context.fillStyle = '#0B265C';
    context.font = '600 14px "SUIT Variable", "Pretendard Variable", sans-serif';
    context.fillText(`루프 ${state.loop}`, PADDING_X + 26, TOP_Y - 28);
    context.fillText(`턴 ${state.turn}`, PADDING_X + 88, TOP_Y - 28);
    context.fillText(`선택 승무원 ${crew.name}`, PADDING_X + 188, TOP_Y - 28);
    context.fillText(`볼 ${state.ballsOwned}`, PADDING_X + 304, TOP_Y - 28);

    context.fillStyle = '#0B265C';
    context.beginPath();
    context.arc(boardToCanvasX(state.launcherX), LAUNCHER_Y_PX, 13, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(boardToCanvasX(state.launcherX), LAUNCHER_Y_PX, 6, 0, Math.PI * 2);
    context.fill();
  }, [preview, state]);

  return (
    <canvas
      ref={canvasRef}
      className="breaker-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onPointerDown={(event) => {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        canvas.setPointerCapture(event.pointerId);
        const position = canvasToBoardPosition(canvas, event.clientX, event.clientY);
        onAimStart(event.pointerId, position.x, position.y);
      }}
      onPointerMove={(event) => {
        const canvas = canvasRef.current;
        if (!canvas) {
          return;
        }

        const position = canvasToBoardPosition(canvas, event.clientX, event.clientY);
        onAimMove(event.pointerId, position.x, position.y);
      }}
      onPointerUp={() => onAimEnd()}
      onPointerCancel={() => onAimEnd()}
      aria-label="바운스 스택 플레이 캔버스"
    />
  );
}
