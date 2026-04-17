import { useEffect, useRef } from 'react';
import { ENEMIES, SPELLS } from '../game/content';
import type { BattleState } from '../game/types';

type BattleCanvasProps = {
  state: BattleState;
};

const CANVAS_WIDTH = 390;
const CANVAS_HEIGHT = 720;
const BARRIER_Y = 626;

export function BattleCanvas({ state }: BattleCanvasProps) {
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

    const gradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1b103d');
    gradient.addColorStop(0.55, '#140b2d');
    gradient.addColorStop(1, '#090611');
    context.fillStyle = gradient;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.fillStyle = 'rgba(255,255,255,0.04)';
    for (let index = 0; index < 18; index += 1) {
      context.beginPath();
      context.arc(22 + index * 24, 120 + (index % 4) * 46, 1.8 + (index % 3), 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = 'rgba(84, 45, 138, 0.45)';
    context.fillRect(0, BARRIER_Y + 30, CANVAS_WIDTH, CANVAS_HEIGHT - BARRIER_Y);

    context.strokeStyle = state.barrierFlashMs > 0 ? '#FFE49B' : '#A48CF9';
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(42, BARRIER_Y);
    context.lineTo(CANVAS_WIDTH - 42, BARRIER_Y);
    context.stroke();

    context.fillStyle = state.barrierFlashMs > 0 ? '#FFF3C1' : '#8066FF';
    context.beginPath();
    context.arc(CANVAS_WIDTH / 2, BARRIER_Y, 26, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#FFD18C';
    context.beginPath();
    context.arc(CANVAS_WIDTH / 2, 590, 18, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#FFF8E9';
    context.beginPath();
    context.arc(CANVAS_WIDTH / 2, 560, 12, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = '#FFB27E';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(CANVAS_WIDTH / 2, 574);
    context.lineTo(CANVAS_WIDTH / 2 - 16, 610);
    context.moveTo(CANVAS_WIDTH / 2, 574);
    context.lineTo(CANVAS_WIDTH / 2 + 16, 610);
    context.stroke();

    for (const projectile of state.projectiles) {
      const spell = SPELLS[projectile.spellId];
      context.fillStyle = spell.color;
      context.beginPath();
      context.arc(projectile.x, projectile.y, Math.max(5, projectile.radius * 0.16), 0, Math.PI * 2);
      context.fill();
    }

    for (const enemy of state.enemies) {
      const archetype = ENEMIES[enemy.archetypeId];
      context.fillStyle = enemy.hitFlashMs > 0 ? '#FFF4D8' : archetype.color;
      context.beginPath();
      context.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = '#140B1F';
      context.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2, 4);
      context.fillStyle = '#FF7C7C';
      context.fillRect(
        enemy.x - enemy.radius,
        enemy.y - enemy.radius - 10,
        (enemy.radius * 2 * enemy.hp) / enemy.maxHp,
        4,
      );
    }

    context.fillStyle = '#FFFFFF';
    context.font = '600 14px "SUIT Variable", "Pretendard", sans-serif';
    context.fillText(`웨이브 ${state.waveIndex + 1} / 8`, 22, 48);
    context.fillText(`레벨 ${state.level}`, CANVAS_WIDTH - 88, 48);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      className="battle-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-label="오늘의 마법수업 전투 화면"
    />
  );
}

