import { BlueprintToken, MaterialId } from "./types";

export const EMPTY_CELL: BlueprintToken = "-";

export const tokenToMaterial = (token: BlueprintToken): MaterialId | null => {
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
    default:
      return null;
  }
};

export const normalizeBlueprintRows = (rows: readonly string[]) => {
  const width = rows.reduce((max, r) => Math.max(max, r.length), 0);
  return rows.map((r) => r.padEnd(width, EMPTY_CELL));
};
