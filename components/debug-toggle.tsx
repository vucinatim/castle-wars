"use client";

import { useGameStore } from "@/store/game-store";

export default function DebugToggle() {
  const toggleDebugPanel = useGameStore((state) => state.toggleDebugPanel);

  return (
    <button
      id="debug-toggle"
      onClick={toggleDebugPanel}
      className="absolute top-5 right-5 z-1001 bg-black/50 text-white border border-white/20 px-3 py-2 rounded-lg cursor-pointer font-mono backdrop-blur-sm transition-colors hover:bg-black/80"
    >
      ⚙️ Debug Config
    </button>
  );
}
