import { Rotation, PieceDef } from "./types";

export const rotateFootprint = (
  footprint: ReadonlyArray<ReadonlyArray<0 | 1>>,
  rotation: Rotation
) => {
  const h = footprint.length;
  const w = footprint[0]?.length ?? 0;
  const at = (x: number, y: number) => (footprint[y]?.[x] ?? 0) as 0 | 1;

  if (rotation === 0) return footprint.map((r) => [...r]) as (0 | 1)[][];

  if (rotation === 90) {
    const out: (0 | 1)[][] = Array.from({ length: w }, () =>
      Array.from({ length: h }, () => 0 as 0 | 1)
    );
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        out[x][h - 1 - y] = at(x, y);
      }
    }
    return out;
  }

  if (rotation === 180) {
    const out: (0 | 1)[][] = Array.from({ length: h }, () =>
      Array.from({ length: w }, () => 0 as 0 | 1)
    );
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        out[h - 1 - y][w - 1 - x] = at(x, y);
      }
    }
    return out;
  }

  const out: (0 | 1)[][] = Array.from({ length: w }, () =>
    Array.from({ length: h }, () => 0 as 0 | 1)
  );
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      out[w - 1 - x][y] = at(x, y);
    }
  }
  return out;
};

export const getFootprintOrigin = (
  footprint: ReadonlyArray<ReadonlyArray<0 | 1>>
) => {
  const h = footprint.length;
  const w = footprint[0]?.length ?? 0;
  return { x: Math.floor(w / 2), y: h - 1 };
};

export const getOccupiedOffsets = (
  footprint: ReadonlyArray<ReadonlyArray<0 | 1>>
) => {
  const origin = getFootprintOrigin(footprint);
  const offsets: Array<{ dx: number; dy: number }> = [];
  for (let y = 0; y < footprint.length; y += 1) {
    for (let x = 0; x < (footprint[0]?.length ?? 0); x += 1) {
      if (footprint[y]?.[x] === 1) {
        offsets.push({ dx: x - origin.x, dy: y - origin.y });
      }
    }
  }
  return offsets;
};

export const getPieceFootprint = (piece: PieceDef, rotation: Rotation) =>
  rotateFootprint(piece.footprint, rotation);
