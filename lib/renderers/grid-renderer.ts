import { useGameStore } from "@/store/game-store";

export const renderGrid = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) => {
  const { config } = useGameStore.getState();
  const cell = config.blockSize;
  if (cell <= 4) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = 0; x <= w; x += cell) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
  }
  for (let y = 0; y <= h; y += cell) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
};

