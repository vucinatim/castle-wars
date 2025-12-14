"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { useBuildStore } from "@/store/build-store";
import type { MaterialId } from "@/lib/building/types";

const MaterialButton = ({
  id,
  label,
  color,
  active,
  onClick,
}: {
  id: MaterialId;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded border transition-colors ${
      active
        ? "bg-white/15 border-white/20"
        : "bg-white/5 border-white/10 hover:bg-white/10"
    }`}
  >
    <span className="text-xs text-white/90">{label}</span>
    <span
      className="w-5 h-5 rounded border border-white/20"
      style={{ backgroundColor: color }}
      aria-label={id}
    />
  </button>
);

export default function BuildSidebar() {
  const router = useRouter();
  const config = useGameStore((s) => s.config);
  const setBuildMode = useGameStore((s) => s.setBuildMode);

  const selectedMaterial = useBuildStore((s) => s.selectedMaterial);
  const setSelectedMaterial = useBuildStore((s) => s.setSelectedMaterial);
  const tool = useBuildStore((s) => s.tool);
  const setTool = useBuildStore((s) => s.setTool);
  const viewMode = useBuildStore((s) => s.viewMode);
  const setViewMode = useBuildStore((s) => s.setViewMode);
  const selection = useBuildStore((s) => s.selection);
  const clearSelection = useBuildStore((s) => s.clearSelection);
  const clearAll = useBuildStore((s) => s.clearAll);
  const loadCastleTemplateCentered = useBuildStore(
    (s) => s.loadCastleTemplateCentered
  );

  const [exportOpen, setExportOpen] = useState(false);

  const blueprintText = useBuildStore((s) =>
    s.exportBlueprintRowsTrimmed().join("\n")
  );
  const blueprintTs = useMemo(
    () =>
      `blueprintFromText(\`\n${blueprintText}\n\`)`,
    [blueprintText]
  );

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(blueprintText);
    } catch {}
  };

  const copyExportTs = async () => {
    try {
      await navigator.clipboard.writeText(blueprintTs);
    } catch {}
  };

  return (
    <aside className="w-[320px] shrink-0 h-full bg-black/60 backdrop-blur-md border-l border-white/10 p-4 text-white flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Builder</div>
        <button
          onClick={() => {
            setBuildMode(false);
            router.push("/");
          }}
          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Back
        </button>
      </div>

      <div className="text-[11px] text-white/60">
        Paint squares into the grid. Empty is `-`, soldier spawn is `p`. Export copies rows top → bottom.
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("game")}
          className={`flex-1 text-xs px-2 py-2 rounded border ${
            viewMode === "game"
              ? "bg-white/15 border-white/20"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          Game Preview
        </button>
        <button
          onClick={() => setViewMode("cells")}
          className={`flex-1 text-xs px-2 py-2 rounded border ${
            viewMode === "cells"
              ? "bg-white/15 border-white/20"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          Cells
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTool("paint")}
          className={`flex-1 text-xs px-2 py-2 rounded border ${
            tool === "paint"
              ? "bg-cyan-500/20 border-cyan-300/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          Paint
        </button>
        <button
          onClick={() => setTool("erase")}
          className={`flex-1 text-xs px-2 py-2 rounded border ${
            tool === "erase"
              ? "bg-rose-500/20 border-rose-300/30"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          Erase
        </button>
      </div>

      <div className="flex">
        <button
          onClick={() => setTool("soldier")}
          className={`w-full text-xs px-2 py-2 rounded border ${
            tool === "soldier"
              ? "bg-white/15 border-white/20"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          Soldier Spawn (p)
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTool("select")}
          className={`flex-1 text-xs px-2 py-2 rounded border ${
            tool === "select"
              ? "bg-white/15 border-white/20"
              : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}
        >
          Select / Move
        </button>
        <button
          onClick={() => clearSelection()}
          disabled={!selection}
          className={`flex-1 text-xs px-2 py-2 rounded border ${
            selection
              ? "bg-white/10 hover:bg-white/20 border-white/10"
              : "bg-white/5 border-white/5 text-white/30 cursor-not-allowed"
          }`}
        >
          Clear Sel
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[11px] uppercase tracking-wider text-cyan-200">
          Materials
        </div>
        <MaterialButton
          id="wood"
          label="Wood (w)"
          color={config.colors.wood}
          active={selectedMaterial === "wood"}
          onClick={() => setSelectedMaterial("wood")}
        />
        <MaterialButton
          id="stone"
          label="Stone (s)"
          color={config.colors.stone}
          active={selectedMaterial === "stone"}
          onClick={() => setSelectedMaterial("stone")}
        />
        <MaterialButton
          id="steel"
          label="Steel (t)"
          color={config.colors.steel}
          active={selectedMaterial === "steel"}
          onClick={() => setSelectedMaterial("steel")}
        />
        <MaterialButton
          id="glass"
          label="Glass (g)"
          color={config.colors.glass}
          active={selectedMaterial === "glass"}
          onClick={() => setSelectedMaterial("glass")}
        />
      </div>

      <div className="mt-1 flex gap-2">
        <button
          onClick={() => loadCastleTemplateCentered()}
          className="flex-1 text-xs px-2 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10"
        >
          Load Castle Template
        </button>
        <button
          onClick={() => clearAll()}
          className="text-xs px-2 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10"
        >
          Clear
        </button>
      </div>

      <div className="mt-2">
        <button
          onClick={() => setExportOpen((v) => !v)}
          className="w-full text-xs px-2 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10"
        >
          {exportOpen ? "Hide Export" : "Export Blueprint"}
        </button>
      </div>

      {exportOpen && (
        <div className="flex flex-col gap-2">
          <textarea
            value={blueprintText}
            readOnly
            className="w-full h-[280px] bg-black/30 border border-white/10 rounded p-2 font-mono text-[10px] leading-[14px] text-white/80"
          />
          <div className="flex gap-2">
            <button
              onClick={() => copyExport()}
              className="flex-1 text-xs px-2 py-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-300/20"
            >
              Copy Text
            </button>
            <button
              onClick={() => copyExportTs()}
              className="flex-1 text-xs px-2 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10"
            >
              Copy TS
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
