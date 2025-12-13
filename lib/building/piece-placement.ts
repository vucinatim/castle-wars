import Matter from "matter-js";
import { PIECES } from "./registry";
import { compileBlueprintToRects } from "./compile-blueprint";
import { emptyToken, materialToToken } from "./material-utils";
import { worldifyRects } from "./worldify-rects";
import { translateRects } from "./translate-blueprint";
import { getFootprintOrigin, getOccupiedOffsets, getPieceFootprint } from "./place-utils";
import { MaterialId, PieceId, PlacedRect, Rotation } from "./types";
import { GridCell, GridSpec, cellToWorldCenter, getGridCols, getGridRows } from "@/lib/grid/grid";
import { isGroundBody } from "@/types/matter";

const { Composite, Query } = Matter;

export const getPiecePlacement = ({
  grid,
  pieceId,
  rotation,
  material,
  anchorCell,
}: {
  grid: GridSpec;
  pieceId: PieceId;
  rotation: Rotation;
  material: MaterialId;
  anchorCell: GridCell;
}): { occupiedCells: GridCell[]; placedRects: PlacedRect[] } => {
  const piece = PIECES[pieceId];
  const footprint = getPieceFootprint(piece, rotation);
  const origin = getFootprintOrigin(footprint);

  const occupiedOffsets = getOccupiedOffsets(footprint);
  const occupiedCells = occupiedOffsets.map(({ dx, dy }) => ({
    x: anchorCell.x + dx,
    y: anchorCell.y + dy,
  }));

  const token = materialToToken(material);
  const empty = emptyToken();
  const localRows = footprint.map((row) =>
    row.map((v) => (v === 1 ? token : empty)).join("")
  );

  const rectsLocal = compileBlueprintToRects(localRows);
  const topLeftX = anchorCell.x - origin.x;
  const topLeftY = anchorCell.y - origin.y;
  const rectsGlobal = translateRects(rectsLocal, topLeftX, topLeftY);
  const placedRects = worldifyRects(grid, rectsGlobal);

  return { occupiedCells, placedRects };
};

export const canPlace = ({
  grid,
  occupiedCells,
  occupiedMap,
  engine,
  groundTopY,
  placedRects,
}: {
  grid: GridSpec;
  occupiedCells: GridCell[];
  occupiedMap: Record<string, unknown>;
  engine: Matter.Engine;
  groundTopY: number;
  placedRects: PlacedRect[];
}): boolean => {
  const cols = getGridCols(grid);
  const rows = getGridRows(grid);

  for (const cell of occupiedCells) {
    if (cell.x < 0 || cell.y < 0 || cell.x >= cols || cell.y >= rows) return false;
    if (occupiedMap[`${cell.x},${cell.y}`]) return false;

    const center = cellToWorldCenter(grid, cell);
    if (center.y + grid.cellSize / 2 > groundTopY) return false;
  }

  const bodies = Composite.allBodies(engine.world);
  for (const rect of placedRects) {
    const eps = 0.5;
    const region = {
      min: {
        x: rect.worldX - rect.worldW / 2 + eps,
        y: rect.worldY - rect.worldH / 2 + eps,
      },
      max: {
        x: rect.worldX + rect.worldW / 2 - eps,
        y: rect.worldY + rect.worldH / 2 - eps,
      },
    };
    const hits = Query.region(bodies, region);
    const blocking = hits.some((b) => !isGroundBody(b));
    if (blocking) return false;
  }

  return true;
};
