"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";

export default function HUD() {
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const buildMode = useGameStore((state) => state.buildMode);
  const setBuildMode = useGameStore((state) => state.setBuildMode);
  const router = useRouter();

  useEffect(() => {
    if (buildMode) router.push("/build");
  }, [buildMode, router]);

  return (
    <div className="absolute top-5 left-0 w-full text-center pointer-events-none z-10">
      <div className="inline-flex flex-col items-center gap-1 bg-black/60 text-white px-6 py-3 rounded-[30px] backdrop-blur-md shadow-lg border border-white/10">
        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1 rounded-[15px] transition-all ${
              currentPlayer === "red"
                ? "opacity-100 bg-white/20 scale-110"
                : "opacity-50"
            }`}
            style={{ color: "#ff6b6b" }}
          >
            Red Team
          </div>
          <span className="text-sm opacity-50">VS</span>
          <div
            className={`px-3 py-1 rounded-[15px] transition-all ${
              currentPlayer === "blue"
                ? "opacity-100 bg-white/20 scale-110"
                : "opacity-50"
            }`}
            style={{ color: "#4ecdc4" }}
          >
            Blue Team
          </div>
        </div>
        <div className="text-xs opacity-80 font-normal mt-1">
          Drag Back & Release to Throw
        </div>
        <div
          id="telemetry"
          className="mt-2 text-[11px] font-mono text-cyan-300 border-t border-white/10 pt-1.5 w-full text-center opacity-90"
        >
          Ready
        </div>
        <button
          id="reset-btn"
          onClick={() => {
            const event = new CustomEvent("resetGame");
            window.dispatchEvent(event);
          }}
          className="pointer-events-auto mt-2.5 bg-white/20 border-none text-white px-4 py-1.5 rounded text-xs cursor-pointer hover:bg-white/40 transition-colors"
        >
          Reset Game (R)
        </button>

        <button
          onClick={() => {
            setBuildMode(true);
            router.push("/build");
          }}
          className="pointer-events-auto mt-2 bg-cyan-500/20 border border-cyan-200/20 text-white px-4 py-1.5 rounded text-xs cursor-pointer hover:bg-cyan-500/30 transition-colors"
        >
          Open Builder
        </button>
      </div>
    </div>
  );
}
