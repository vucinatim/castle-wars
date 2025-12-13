"use client";

import { useEffect, useRef, RefObject } from "react";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import { updatePhysics, cleanupDeadBodies } from "@/lib/systems/physics-system";
import { render } from "@/lib/renderers/main-renderer";

/**
 * Hook that manages the game loop
 */
export const useGameLoop = (canvasRef: RefObject<HTMLCanvasElement | null>) => {
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Store canvas ref for resize handler
    useEngineStore.getState().setCanvasRef(canvas);

    // Set initial canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gameLoop = () => {
      const engine = useEngineStore.getState().engine;
      if (!engine || !ctx) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Update physics
      updatePhysics();

      // Cleanup dead blocks
      cleanupDeadBodies();

      // Update floating texts
      useGameStore.getState().updateFloatingTexts();

      // Render
      render(ctx, canvas);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      useEngineStore.getState().setCanvasRef(null);
    };
  }, [canvasRef]);
};
