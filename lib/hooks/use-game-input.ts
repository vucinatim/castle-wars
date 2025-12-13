"use client";

import { useEffect, RefObject } from "react";
import { useGameStore } from "@/store/game-store";
import {
  getCurrentSoldier,
  fireProjectile,
} from "@/lib/systems/projectile-system";

/**
 * Hook that manages mouse/touch input for the game
 */
export const useGameInput = (
  canvasRef: RefObject<HTMLCanvasElement | null>
) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      const store = useGameStore.getState();
      const soldier = getCurrentSoldier(store.currentPlayer);
      if (!soldier) return;

      store.setInput({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const store = useGameStore.getState();
      if (store.input.isDragging) {
        store.setInput({
          currentX: e.clientX,
          currentY: e.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      const store = useGameStore.getState();
      if (store.input.isDragging) {
        const soldier = getCurrentSoldier(store.currentPlayer);
        if (soldier) {
          fireProjectile(
            soldier,
            store.input.startX,
            store.input.startY,
            store.input.currentX,
            store.input.currentY,
            store.currentPlayer
          );
        }
        store.resetInput();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const store = useGameStore.getState();
      const soldier = getCurrentSoldier(store.currentPlayer);
      if (!soldier) return;

      const touch = e.touches[0];
      store.setInput({
        isDragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const store = useGameStore.getState();
      if (store.input.isDragging && e.touches[0]) {
        store.setInput({
          currentX: e.touches[0].clientX,
          currentY: e.touches[0].clientY,
        });
      }
    };

    const handleTouchEnd = () => {
      const store = useGameStore.getState();
      if (store.input.isDragging) {
        const soldier = getCurrentSoldier(store.currentPlayer);
        if (soldier) {
          fireProjectile(
            soldier,
            store.input.startX,
            store.input.startY,
            store.input.currentX,
            store.input.currentY,
            store.currentPlayer
          );
        }
        store.resetInput();
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canvasRef]);
};
