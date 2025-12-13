import { GridRect } from "./types";
import { EMPTY_CELL, normalizeBlueprintRows, tokenToMaterial } from "./blueprint-utils";

type CellMat = ReturnType<typeof tokenToMaterial>;

export const compileBlueprintToRects = (rows: readonly string[]): GridRect[] => {
  const normalized = normalizeBlueprintRows(rows);
  const height = normalized.length;
  const width = normalized[0]?.length ?? 0;

  const materialAt = (x: number, y: number): CellMat => {
    const ch = normalized[y]?.[x] ?? EMPTY_CELL;
    return tokenToMaterial(ch);
  };

  // Horizontal-priority tiling:
  // 1) Create horizontal runs per row (height=1 rects).
  // 2) Merge vertically only when identical runs stack across rows.
  const output: GridRect[] = [];
  let activeByKey = new Map<string, GridRect>();

  const runKey = (x: number, w: number, material: NonNullable<CellMat>) =>
    `${x}:${w}:${material}`;

  for (let y = 0; y < height; y += 1) {
    const nextActive = new Map<string, GridRect>();

    let x = 0;
    while (x < width) {
      const mat = materialAt(x, y);
      if (!mat) {
        x += 1;
        continue;
      }

      let w = 1;
      while (x + w < width && materialAt(x + w, y) === mat) w += 1;

      const key = runKey(x, w, mat);
      const prev = activeByKey.get(key);
      if (prev && prev.y + prev.h === y) {
        prev.h += 1;
        nextActive.set(key, prev);
      } else {
        const rect: GridRect = { x, y, w, h: 1, material: mat };
        nextActive.set(key, rect);
        output.push(rect);
      }

      x += w;
    }

    activeByKey = nextActive;
  }

  return output;
};
