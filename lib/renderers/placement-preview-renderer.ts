import { useGameStore } from "@/store/game-store";
import { createGridSpec, cellToWorldCenter } from "@/lib/grid/grid";
import { getPlacementPreviewAtWorld } from "@/lib/systems/building-system";

export const renderPlacementPreview = (ctx: CanvasRenderingContext2D) => {
  const store = useGameStore.getState();
  if (!store.buildMode) return;
  if (!store.hoverCell) return;

  const grid = createGridSpec(store.width, store.height, store.config.blockSize);
  const world = cellToWorldCenter(grid, store.hoverCell);
  const preview = getPlacementPreviewAtWorld(world.x, world.y);
  if (!preview) return;

  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.strokeStyle = preview.ok ? "rgba(100,255,140,0.9)" : "rgba(255,100,100,0.9)";
  ctx.fillStyle = preview.ok ? "rgba(100,255,140,0.12)" : "rgba(255,100,100,0.12)";

  for (const r of preview.placedRects) {
    const x = r.worldX - r.worldW / 2;
    const y = r.worldY - r.worldH / 2;
    ctx.beginPath();
    ctx.rect(x, y, r.worldW, r.worldH);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
};

