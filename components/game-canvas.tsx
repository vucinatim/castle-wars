"use client";

import { useRef } from "react";
import { useGameEngine } from "@/lib/hooks/use-game-engine";
import { useGameInput } from "@/lib/hooks/use-game-input";
import { useGameLoop } from "@/lib/hooks/use-game-loop";

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGameEngine();
  useGameInput(canvasRef);
  useGameLoop(canvasRef);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{
        background: "linear-gradient(to bottom, #1E90FF, #87CEEB)",
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );
};

export default GameCanvas;
