import { GridRect } from "./types";

export const translateRects = (rects: GridRect[], dx: number, dy: number) =>
  rects.map((r) => ({ ...r, x: r.x + dx, y: r.y + dy }));

