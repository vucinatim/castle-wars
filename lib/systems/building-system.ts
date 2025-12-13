import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import { createGridSpec, worldToCell } from "@/lib/grid/grid";
import { canPlace, getPiecePlacement } from "@/lib/building/piece-placement";
import { getTeamCollision, spawnRectBody } from "@/lib/building/spawn-rects";

const { Composite } = Matter;

export const getPlacementPreviewAtWorld = (worldX: number, worldY: number) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return null;

  const store = useGameStore.getState();
  const grid = createGridSpec(store.width, store.height, store.config.blockSize);
  const anchorCell = worldToCell(grid, { x: worldX, y: worldY });

  const { occupiedCells, placedRects } = getPiecePlacement({
    grid,
    pieceId: store.selectedPieceId,
    rotation: store.selectedRotation,
    material: store.selectedMaterial,
    anchorCell,
  });

  const ok = canPlace({
    grid,
    occupiedCells,
    occupiedMap: store.occupiedCells,
    engine,
    groundTopY: store.height - store.config.groundHeight,
    placedRects,
  });

  return { anchorCell, occupiedCells, placedRects, ok };
};

export const tryPlaceSelectedPieceAtWorld = (worldX: number, worldY: number) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return false;

  const store = useGameStore.getState();
  const preview = getPlacementPreviewAtWorld(worldX, worldY);
  if (!preview || !preview.ok) return false;

  const collision = getTeamCollision(store.currentPlayer);
  const bodies: Matter.Body[] = [];

  for (const rect of preview.placedRects) {
    bodies.push(
      spawnRectBody({
        worldX: rect.worldX,
        worldY: rect.worldY,
        worldW: rect.worldW,
        worldH: rect.worldH,
        material: rect.material,
        team: store.currentPlayer,
        config: store.config,
        collision,
        gridCells: rect.gridCells,
      })
    );
  }

  Composite.add(engine.world, bodies);
  store.occupyCells(preview.occupiedCells, {
    material: store.selectedMaterial,
    team: store.currentPlayer,
  });
  return true;
};

