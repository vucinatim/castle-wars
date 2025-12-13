import { create } from "zustand";
import { CONFIG, GameConfig } from "@/lib/constants";
import { GridCell } from "@/lib/grid/grid";
import { MaterialId, PieceId, Rotation } from "@/lib/building/types";

export interface InputState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface CloudPuff {
  x: number;
  y: number;
  radius: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  color: string;
  layerIndex: number;
  width: number;
  puffs: CloudPuff[];
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  vy: number;
}

export type PlayerTeam = "red" | "blue";
export type { GameConfig } from "@/lib/constants";

interface GameState {
  width: number;
  height: number;
  input: InputState;
  currentPlayer: PlayerTeam;
  clouds: Cloud[];
  floatingTexts: FloatingText[];
  debugPanelOpen: boolean;
  config: GameConfig;

  // Building/placement
  showGrid: boolean;
  showHitboxes: boolean;
  buildMode: boolean;
  selectedMaterial: MaterialId;
  selectedPieceId: PieceId;
  selectedRotation: Rotation;
  hoverCell: GridCell | null;
  occupiedCells: Record<string, { material: MaterialId; team: PlayerTeam }>;

  // Actions
  setDimensions: (width: number, height: number) => void;
  setInput: (input: Partial<InputState>) => void;
  resetInput: () => void;
  switchPlayer: () => void;
  setCurrentPlayer: (player: PlayerTeam) => void;
  setClouds: (clouds: Cloud[]) => void;
  addFloatingText: (text: FloatingText) => void;
  updateFloatingTexts: () => void;
  toggleDebugPanel: () => void;
  updateConfig: (updates: Partial<GameConfig>) => void;
  setShowGrid: (show: boolean) => void;
  setShowHitboxes: (show: boolean) => void;
  toggleBuildMode: () => void;
  setBuildMode: (enabled: boolean) => void;
  setSelectedMaterial: (material: MaterialId) => void;
  setSelectedPieceId: (pieceId: PieceId) => void;
  rotateSelectedPiece: () => void;
  setHoverCell: (cell: GridCell | null) => void;
  setOccupiedCells: (
    cells: Record<string, { material: MaterialId; team: PlayerTeam }>
  ) => void;
  occupyCells: (
    cells: Array<{ x: number; y: number }>,
    entry: { material: MaterialId; team: PlayerTeam }
  ) => void;
  freeCells: (cells: Array<{ x: number; y: number }>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1920,
  height: typeof window !== "undefined" ? window.innerHeight : 1080,
  input: {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  },
  currentPlayer: "red",
  clouds: [],
  floatingTexts: [],
  debugPanelOpen: false,
  config: CONFIG,

  showGrid: true,
  showHitboxes: false,
  buildMode: false,
  selectedMaterial: "wood",
  selectedPieceId: "unit",
  selectedRotation: 0,
  hoverCell: null,
  occupiedCells: {},

  setDimensions: (width, height) => set({ width, height }),

  setInput: (input) =>
    set((state) => ({
      input: { ...state.input, ...input },
    })),

  resetInput: () =>
    set({
      input: {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      },
    }),

  switchPlayer: () =>
    set((state) => ({
      currentPlayer: state.currentPlayer === "red" ? "blue" : "red",
    })),

  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setClouds: (clouds) => set({ clouds }),

  addFloatingText: (text) =>
    set((state) => ({
      floatingTexts: [...state.floatingTexts, text],
    })),

  updateFloatingTexts: () =>
    set((state) => ({
      floatingTexts: state.floatingTexts
        .map((ft) => ({
          ...ft,
          life: ft.life - 0.02,
          y: ft.y + ft.vy,
        }))
        .filter((ft) => ft.life > 0),
    })),

  toggleDebugPanel: () =>
    set((state) => ({
      debugPanelOpen: !state.debugPanelOpen,
    })),

  updateConfig: (updates) =>
    set((state) => ({
      config: { ...state.config, ...updates },
    })),

  setShowGrid: (show) => set({ showGrid: show }),

  setShowHitboxes: (show) => set({ showHitboxes: show }),

  toggleBuildMode: () => set((state) => ({ buildMode: !state.buildMode })),

  setBuildMode: (enabled) => set({ buildMode: enabled }),

  setSelectedMaterial: (material) => set({ selectedMaterial: material }),

  setSelectedPieceId: (pieceId) => set({ selectedPieceId: pieceId }),

  rotateSelectedPiece: () =>
    set((state) => ({
      selectedRotation: ((state.selectedRotation + 90) % 360) as Rotation,
    })),

  setHoverCell: (cell) => set({ hoverCell: cell }),

  setOccupiedCells: (cells) => set({ occupiedCells: cells }),

  occupyCells: (cells, entry) =>
    set((state) => {
      const next = { ...state.occupiedCells };
      for (const cell of cells) {
        next[`${cell.x},${cell.y}`] = entry;
      }
      return { occupiedCells: next };
    }),

  freeCells: (cells) =>
    set((state) => {
      const next = { ...state.occupiedCells };
      for (const cell of cells) {
        delete next[`${cell.x},${cell.y}`];
      }
      return { occupiedCells: next };
    }),

  resetGame: () =>
    set({
      currentPlayer: "red",
      floatingTexts: [],
      buildMode: false,
      hoverCell: null,
      input: {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      },
    }),
}));

// Helper type for store state
export type GameStoreState = ReturnType<typeof useGameStore.getState>;
