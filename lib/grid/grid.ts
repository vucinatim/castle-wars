export type GridSpec = {
  cellSize: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
};

export type GridCell = { x: number; y: number };

export const createGridSpec = (
  width: number,
  height: number,
  cellSize: number,
  originX = 0,
  originY = 0
): GridSpec => ({
  width,
  height,
  cellSize,
  originX,
  originY,
});

export const getGridCols = (grid: GridSpec) =>
  Math.max(1, Math.floor(grid.width / grid.cellSize));

export const getGridRows = (grid: GridSpec) =>
  Math.max(1, Math.floor(grid.height / grid.cellSize));

export const cellToWorldCenter = (grid: GridSpec, cell: GridCell) => ({
  x: grid.originX + (cell.x + 0.5) * grid.cellSize,
  y: grid.originY + (cell.y + 0.5) * grid.cellSize,
});

export const worldToCell = (grid: GridSpec, world: { x: number; y: number }) => ({
  x: Math.floor((world.x - grid.originX) / grid.cellSize),
  y: Math.floor((world.y - grid.originY) / grid.cellSize),
});

export const clampCellToGrid = (grid: GridSpec, cell: GridCell): GridCell => {
  const cols = getGridCols(grid);
  const rows = getGridRows(grid);
  return {
    x: Math.max(0, Math.min(cols - 1, cell.x)),
    y: Math.max(0, Math.min(rows - 1, cell.y)),
  };
};

