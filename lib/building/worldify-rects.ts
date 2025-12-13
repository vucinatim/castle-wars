import { GridSpec, cellToWorldCenter } from "@/lib/grid/grid";
import { GridRect, PlacedRect } from "./types";

export const worldifyRects = (grid: GridSpec, rects: GridRect[]): PlacedRect[] =>
  rects.map((r) => {
    const worldW = r.w * grid.cellSize;
    const worldH = r.h * grid.cellSize;

    const centerCell = {
      x: r.x + r.w / 2 - 0.5,
      y: r.y + r.h / 2 - 0.5,
    };

    const center = cellToWorldCenter(grid, centerCell);

    const gridCells: Array<{ x: number; y: number }> = [];
    for (let yy = 0; yy < r.h; yy += 1) {
      for (let xx = 0; xx < r.w; xx += 1) {
        gridCells.push({ x: r.x + xx, y: r.y + yy });
      }
    }

    return {
      ...r,
      worldX: center.x,
      worldY: center.y,
      worldW,
      worldH,
      gridCells,
    };
  });

