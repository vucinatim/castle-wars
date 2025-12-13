import { BlueprintToken, MaterialId } from "./types";

export const EMPTY_CELL: BlueprintToken = "-";

export const tokenToMaterial = (token: string): MaterialId | null => {
  switch (token) {
    case "w":
      return "wood";
    case "t":
      return "steel";
    case "s":
      return "stone";
    case "g":
      return "glass";
    case "-":
    case ".":
    case "□":
    default:
      return null;
  }
};

export const isSoldierSpawnToken = (token: string) => token === "p";

export const normalizeBlueprintRows = (rows: readonly string[]) => {
  const width = rows.reduce((max, r) => Math.max(max, r.length), 0);
  return rows.map((r) => r.padEnd(width, EMPTY_CELL));
};

export const getSoldierSpawnCells = (rows: readonly string[]) => {
  const normalized = normalizeBlueprintRows(rows);
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < normalized.length; y += 1) {
    const row = normalized[y] ?? "";
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === "p") cells.push({ x, y });
    }
  }
  return cells;
};
