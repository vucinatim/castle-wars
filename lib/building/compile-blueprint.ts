import { BlueprintToken, GridRect } from "./types";
import { EMPTY_CELL, normalizeBlueprintRows, tokenToMaterial } from "./blueprint-utils";

type CellMat = ReturnType<typeof tokenToMaterial>;

export const compileBlueprintToRects = (rows: readonly string[]): GridRect[] => {
  const normalized = normalizeBlueprintRows(rows);
  const height = normalized.length;
  const width = normalized[0]?.length ?? 0;

  const visited: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );

  const materialAt = (x: number, y: number): CellMat => {
    const ch = (normalized[y]?.[x] ?? EMPTY_CELL) as BlueprintToken;
    return tokenToMaterial(ch);
  };

  const rects: GridRect[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (visited[y]?.[x]) continue;
      const mat = materialAt(x, y);
      if (!mat) {
        visited[y][x] = true;
        continue;
      }

      let w = 1;
      while (x + w < width) {
        if (visited[y][x + w]) break;
        if (materialAt(x + w, y) !== mat) break;
        w += 1;
      }

      let h = 1;
      outer: while (y + h < height) {
        for (let xx = 0; xx < w; xx += 1) {
          if (visited[y + h][x + xx]) break outer;
          if (materialAt(x + xx, y + h) !== mat) break outer;
        }
        h += 1;
      }

      for (let yy = 0; yy < h; yy += 1) {
        for (let xx = 0; xx < w; xx += 1) {
          visited[y + yy][x + xx] = true;
        }
      }

      rects.push({ x, y, w, h, material: mat });
    }
  }

  return rects;
};
