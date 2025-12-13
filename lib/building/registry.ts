import { PieceDef, MaterialId } from "./types";

export const MATERIAL_LABEL: Record<MaterialId, "block" | "steel" | "stone" | "glass"> =
  {
    wood: "block",
    steel: "steel",
    stone: "stone",
    glass: "glass",
  };

export const PIECES: Record<PieceDef["id"], PieceDef> = {
  unit: {
    id: "unit",
    label: "Unit (1x1)",
    footprint: [[1]],
  },
  beam3: {
    id: "beam3",
    label: "Beam (3x1)",
    footprint: [[1, 1, 1]],
  },
  pillar3: {
    id: "pillar3",
    label: "Pillar (1x3)",
    footprint: [[1], [1], [1]],
  },
};

