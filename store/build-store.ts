import { create } from "zustand";
import { MaterialId } from "@/lib/building/types";
import { CASTLE_BLUEPRINT } from "@/lib/building/blueprints/castle-blueprint";
import { EMPTY_CELL } from "@/lib/building/blueprint-utils";

type Tool = "paint" | "erase" | "soldier" | "select";
type ViewMode = "cells" | "game";
type Cell = { x: number; y: number };
type SelectionRect = { x0: number; y0: number; x1: number; y1: number };

type BuildState = {
  cols: number;
  rows: number;
  cellSize: number;
  selectedMaterial: MaterialId;
  tool: Tool;
  viewMode: ViewMode;
  isPointerDown: boolean;
  cells: Record<string, MaterialId>;
  spawns: Record<string, true>;

  selection: SelectionRect | null;
  selectionAnchor: Cell | null;
  movingAnchor: Cell | null;
  moveOffset: { dx: number; dy: number };
  moveValid: boolean;
  moveCells: Array<{ x: number; y: number; mat: MaterialId }>;
  moveSpawns: Array<Cell>;

  setGrid: (cols: number, rows: number, cellSize: number) => void;
  setSelectedMaterial: (material: MaterialId) => void;
  setTool: (tool: Tool) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setPointerDown: (down: boolean) => void;
  paintCell: (x: number, y: number) => void;
  clearCell: (x: number, y: number) => void;
  toggleSpawn: (x: number, y: number) => void;
  clearSelection: () => void;
  beginSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  finalizeSelection: () => void;
  startMoveSelection: (x: number, y: number) => void;
  updateMoveSelection: (x: number, y: number) => void;
  commitMoveSelection: () => void;
  clearAll: () => void;
  loadCastleTemplateCentered: () => void;
  exportBlueprintRows: () => string[];
};

const keyOf = (x: number, y: number) => `${x},${y}`;
const normalizeRect = (r: SelectionRect): SelectionRect => ({
  x0: Math.min(r.x0, r.x1),
  y0: Math.min(r.y0, r.y1),
  x1: Math.max(r.x0, r.x1),
  y1: Math.max(r.y0, r.y1),
});
const inRect = (x: number, y: number, r: SelectionRect) =>
  x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

export const useBuildStore = create<BuildState>((set, get) => ({
  cols: 40,
  rows: 22,
  cellSize: 40,
  selectedMaterial: "wood",
  tool: "paint",
  viewMode: "game",
  isPointerDown: false,
  cells: {},
  spawns: {},

  selection: null,
  selectionAnchor: null,
  movingAnchor: null,
  moveOffset: { dx: 0, dy: 0 },
  moveValid: true,
  moveCells: [],
  moveSpawns: [],

  setGrid: (cols, rows, cellSize) => set({ cols, rows, cellSize }),
  setSelectedMaterial: (selectedMaterial) => set({ selectedMaterial }),
  setTool: (tool) =>
    set((state) => ({
      tool,
      ...(tool === "select"
        ? {}
        : {
            selectionAnchor: null,
            movingAnchor: null,
            moveOffset: { dx: 0, dy: 0 },
            moveValid: true,
            moveCells: [],
            moveSpawns: [],
          }),
      ...(tool === "select" ? {} : state.selection ? { selection: null } : {}),
    })),
  setViewMode: (viewMode) => set({ viewMode }),
  setPointerDown: (isPointerDown) => set({ isPointerDown }),

  paintCell: (x, y) =>
    set((state) => ({
      cells: { ...state.cells, [keyOf(x, y)]: state.selectedMaterial },
      spawns: (() => {
        const next = { ...state.spawns };
        delete next[keyOf(x, y)];
        return next;
      })(),
      selection: state.selection,
    })),

  clearCell: (x, y) =>
    set((state) => {
      const next = { ...state.cells };
      delete next[keyOf(x, y)];
      const nextSpawns = { ...state.spawns };
      delete nextSpawns[keyOf(x, y)];
      return { cells: next, spawns: nextSpawns };
    }),

  toggleSpawn: (x, y) =>
    set((state) => {
      const k = keyOf(x, y);
      const nextSpawns = { ...state.spawns };
      const nextCells = { ...state.cells };
      if (nextSpawns[k]) delete nextSpawns[k];
      else {
        nextSpawns[k] = true;
        delete nextCells[k];
      }
      return { spawns: nextSpawns, cells: nextCells };
    }),

  clearSelection: () =>
    set({
      selection: null,
      selectionAnchor: null,
      movingAnchor: null,
      moveOffset: { dx: 0, dy: 0 },
      moveValid: true,
      moveCells: [],
      moveSpawns: [],
    }),

  beginSelection: (x, y) =>
    set(() => ({
      selection: { x0: x, y0: y, x1: x, y1: y },
      selectionAnchor: { x, y },
      movingAnchor: null,
      moveOffset: { dx: 0, dy: 0 },
      moveValid: true,
      moveCells: [],
      moveSpawns: [],
    })),

  updateSelection: (x, y) =>
    set((state) => {
      if (!state.selection || !state.selectionAnchor) return {};
      return {
        selection: { ...state.selection, x1: x, y1: y },
      };
    }),

  finalizeSelection: () =>
    set((state) => {
      if (!state.selection) return { selectionAnchor: null };
      return { selection: normalizeRect(state.selection), selectionAnchor: null };
    }),

  startMoveSelection: (x, y) =>
    set((state) => {
      if (!state.selection) return {};
      const sel = normalizeRect(state.selection);
      if (!inRect(x, y, sel)) return {};

      const moveCells: Array<{ x: number; y: number; mat: MaterialId }> = [];
      for (const [k, mat] of Object.entries(state.cells)) {
        const [xs, ys] = k.split(",");
        const cx = Number(xs);
        const cy = Number(ys);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
        if (inRect(cx, cy, sel)) moveCells.push({ x: cx, y: cy, mat });
      }
      const moveSpawns: Array<Cell> = [];
      for (const k of Object.keys(state.spawns)) {
        const [xs, ys] = k.split(",");
        const sx = Number(xs);
        const sy = Number(ys);
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
        if (inRect(sx, sy, sel)) moveSpawns.push({ x: sx, y: sy });
      }

      return {
        selection: sel,
        movingAnchor: { x, y },
        moveOffset: { dx: 0, dy: 0 },
        moveValid: true,
        moveCells,
        moveSpawns,
        selectionAnchor: null,
      };
    }),

  updateMoveSelection: (x, y) =>
    set((state) => {
      if (!state.movingAnchor || !state.selection) return {};
      const dx = x - state.movingAnchor.x;
      const dy = y - state.movingAnchor.y;

      const selectedKeys = new Set<string>();
      for (const c of state.moveCells) selectedKeys.add(keyOf(c.x, c.y));
      for (const s of state.moveSpawns) selectedKeys.add(keyOf(s.x, s.y));

      let moveValid = true;

      for (const c of state.moveCells) {
        const nx = c.x + dx;
        const ny = c.y + dy;
        if (nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows) {
          moveValid = false;
          break;
        }
        const nk = keyOf(nx, ny);
        const occupiedByOther =
          (!!state.spawns[nk] || !!state.cells[nk]) && !selectedKeys.has(nk);
        if (occupiedByOther) {
          moveValid = false;
          break;
        }
      }
      if (moveValid) {
        for (const s of state.moveSpawns) {
          const nx = s.x + dx;
          const ny = s.y + dy;
          if (nx < 0 || ny < 0 || nx >= state.cols || ny >= state.rows) {
            moveValid = false;
            break;
          }
          const nk = keyOf(nx, ny);
          const occupiedByOther =
            (!!state.spawns[nk] || !!state.cells[nk]) && !selectedKeys.has(nk);
          if (occupiedByOther) {
            moveValid = false;
            break;
          }
        }
      }

      return { moveOffset: { dx, dy }, moveValid };
    }),

  commitMoveSelection: () =>
    set((state) => {
      if (!state.selection || !state.movingAnchor) return {};
      if (!state.moveValid) {
        return { movingAnchor: null, moveOffset: { dx: 0, dy: 0 }, moveCells: [], moveSpawns: [] };
      }

      const dx = state.moveOffset.dx;
      const dy = state.moveOffset.dy;
      if (dx === 0 && dy === 0) {
        return { movingAnchor: null, moveOffset: { dx: 0, dy: 0 }, moveCells: [], moveSpawns: [] };
      }

      const selectedKeys = new Set<string>();
      for (const c of state.moveCells) selectedKeys.add(keyOf(c.x, c.y));
      for (const s of state.moveSpawns) selectedKeys.add(keyOf(s.x, s.y));

      const nextCells = { ...state.cells };
      const nextSpawns = { ...state.spawns };
      for (const k of selectedKeys) {
        delete nextCells[k];
        delete nextSpawns[k];
      }

      for (const c of state.moveCells) {
        const nx = c.x + dx;
        const ny = c.y + dy;
        nextCells[keyOf(nx, ny)] = c.mat;
      }
      for (const s of state.moveSpawns) {
        const nx = s.x + dx;
        const ny = s.y + dy;
        nextSpawns[keyOf(nx, ny)] = true;
      }

      const sel = normalizeRect(state.selection);
      const movedSel: SelectionRect = {
        x0: sel.x0 + dx,
        y0: sel.y0 + dy,
        x1: sel.x1 + dx,
        y1: sel.y1 + dy,
      };

      return {
        cells: nextCells,
        spawns: nextSpawns,
        selection: movedSel,
        movingAnchor: null,
        moveOffset: { dx: 0, dy: 0 },
        moveValid: true,
        moveCells: [],
        moveSpawns: [],
      };
    }),

  clearAll: () =>
    set({
      cells: {},
      spawns: {},
      selection: null,
      selectionAnchor: null,
      movingAnchor: null,
      moveOffset: { dx: 0, dy: 0 },
      moveValid: true,
      moveCells: [],
      moveSpawns: [],
    }),

  loadCastleTemplateCentered: () =>
    set((state) => {
      const rows = CASTLE_BLUEPRINT.rows;
      const bpH = rows.length;
      const bpW = rows[0]?.length ?? 0;
      const offX = Math.max(0, Math.floor((state.cols - bpW) / 2));
      const offY = Math.max(0, Math.floor((state.rows - bpH) / 2));

      const next: Record<string, MaterialId> = {};
      const nextSpawns: Record<string, true> = {};
      for (let y = 0; y < bpH; y += 1) {
        for (let x = 0; x < bpW; x += 1) {
          const token = rows[y]?.[x] ?? EMPTY_CELL;
          const gx = offX + x;
          const gy = offY + y;
          if (gx < 0 || gy < 0 || gx >= state.cols || gy >= state.rows) continue;
          if (token === "w") next[keyOf(gx, gy)] = "wood";
          if (token === "t") next[keyOf(gx, gy)] = "steel";
          if (token === "s") next[keyOf(gx, gy)] = "stone";
          if (token === "g") next[keyOf(gx, gy)] = "glass";
          if (token === "p") nextSpawns[keyOf(gx, gy)] = true;
        }
      }
      return { cells: next, spawns: nextSpawns };
    }),

  exportBlueprintRows: () => {
    const { cols, rows, cells, spawns } = get();
    const out: string[] = [];
    for (let y = 0; y < rows; y += 1) {
      let row = "";
      for (let x = 0; x < cols; x += 1) {
        const k = keyOf(x, y);
        if (spawns[k]) row += "p";
        else {
          const mat = cells[k];
          if (!mat) row += "-";
        else if (mat === "wood") row += "w";
        else if (mat === "steel") row += "t";
        else if (mat === "stone") row += "s";
        else row += "g";
        }
      }
      out.push(row);
    }
    return out;
  },
}));
