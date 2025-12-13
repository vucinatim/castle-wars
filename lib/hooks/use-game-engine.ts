"use client";

import { useEffect } from "react";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import {
  createEngine,
  createGhostEngine,
  clearEngines,
} from "@/lib/systems/physics-system";
import { setupCollisionHandlers } from "@/lib/systems/collision-system";
import { resetLevel, updateGroundPosition } from "@/lib/systems/level-system";
import { initializeClouds } from "@/lib/renderers/sky-renderer";

/**
 * Hook that manages the physics engine lifecycle
 */
export const useGameEngine = () => {
  const setEngine = useEngineStore((state) => state.setEngine);
  const setGhostEngine = useEngineStore((state) => state.setGhostEngine);
  const setDimensions = useGameStore((state) => state.setDimensions);
  const setClouds = useGameStore((state) => state.setClouds);
  const resetGame = useGameStore((state) => state.resetGame);

  useEffect(() => {
    // Create engines
    const engine = createEngine();
    const ghostEngine = createGhostEngine();

    setEngine(engine);
    setGhostEngine(ghostEngine);

    // Setup collision handlers
    setupCollisionHandlers();

    // Handle resize
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions(w, h);

      // Update canvas if it exists
      const canvas = useEngineStore.getState().canvasRef;
      if (canvas) {
        canvas.width = w;
        canvas.height = h;
      }

      // Reinitialize clouds
      const clouds = initializeClouds(w, h);
      setClouds(clouds);

      // Update ground position
      updateGroundPosition(w, h);
    };

    // Initial setup
    const w = window.innerWidth;
    const h = window.innerHeight;
    setDimensions(w, h);

    // Initialize level
    resetLevel();

    // Initialize clouds
    const clouds = initializeClouds(w, h);
    setClouds(clouds);

    window.addEventListener("resize", handleResize);

    // Keyboard handler for reset
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        resetLevel();
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Reset game event listener
    const handleReset = () => {
      resetLevel();
      resetGame();
    };
    window.addEventListener("resetGame", handleReset);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resetGame", handleReset);
      clearEngines();
      setEngine(null);
      setGhostEngine(null);
    };
  }, [setEngine, setGhostEngine, setDimensions, setClouds, resetGame]);
};
