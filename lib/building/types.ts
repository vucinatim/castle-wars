export type MaterialId = "wood" | "steel" | "stone" | "glass";

export type BlueprintToken = "-" | "w" | "t" | "s" | "g";

export type Blueprint = {
  rows: readonly string[];
};

export type GridRect = {
  x: number; // cell-space top-left
  y: number; // cell-space top-left
  w: number; // cells
  h: number; // cells
  material: MaterialId;
};

export type PlacedRect = GridRect & {
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  gridCells: Array<{ x: number; y: number }>;
};

export type PieceId = "unit" | "beam3" | "pillar3";

export type PieceDef = {
  id: PieceId;
  label: string;
  footprint: ReadonlyArray<ReadonlyArray<0 | 1>>;
};

export type Rotation = 0 | 90 | 180 | 270;
