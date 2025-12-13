"use client";

import { useEffect } from "react";
import BuildCanvas from "@/components/build-canvas";
import BuildSidebar from "@/components/build-sidebar";
import { useGameStore } from "@/store/game-store";

export default function BuildPage() {
  const setBuildMode = useGameStore((s) => s.setBuildMode);

  useEffect(() => {
    setBuildMode(true);
    return () => setBuildMode(false);
  }, [setBuildMode]);

  return (
    <main className="relative w-full h-screen overflow-hidden flex">
      <div className="flex-1 h-full">
        <BuildCanvas />
      </div>
      <BuildSidebar />
    </main>
  );
}

