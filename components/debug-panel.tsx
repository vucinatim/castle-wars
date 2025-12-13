"use client";

import { useGameStore } from "@/store/game-store";
import { GameConfig } from "@/lib/constants";
import { PIECES } from "@/lib/building/registry";

type DebugKeyItem = {
  key: keyof GameConfig;
  label: string;
  step: number;
  min: number;
  max: number;
};

export default function DebugPanel() {
  const debugPanelOpen = useGameStore((state) => state.debugPanelOpen);
  const config = useGameStore((state) => state.config);
  const updateConfig = useGameStore((state) => state.updateConfig);
  const toggleDebugPanel = useGameStore((state) => state.toggleDebugPanel);
  const showGrid = useGameStore((state) => state.showGrid);
  const setShowGrid = useGameStore((state) => state.setShowGrid);
  const buildMode = useGameStore((state) => state.buildMode);
  const setBuildMode = useGameStore((state) => state.setBuildMode);
  const selectedMaterial = useGameStore((state) => state.selectedMaterial);
  const setSelectedMaterial = useGameStore(
    (state) => state.setSelectedMaterial
  );
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);
  const setSelectedPieceId = useGameStore((state) => state.setSelectedPieceId);
  const selectedRotation = useGameStore((state) => state.selectedRotation);
  const rotateSelectedPiece = useGameStore(
    (state) => state.rotateSelectedPiece
  );

  const debugKeys = [
    { key: "physicsSpeed", label: "Time Scale", step: 0.1, min: 0.1, max: 2.0 },
    {
      key: "velocityMultiplier",
      label: "Throw Power",
      step: 0.01,
      min: 0.01,
      max: 1.0,
    },
    {
      key: "maxSpeed",
      label: "Max Projectile Speed",
      step: 1,
      min: 10,
      max: 100,
    },
    {
      key: "minDamageVelocity",
      label: "Min Dmg Velocity",
      step: 1,
      min: 0,
      max: 20,
    },
    {
      key: "damageMultiplier",
      label: "Dmg Multiplier",
      step: 0.1,
      min: 0.1,
      max: 10.0,
    },
    {
      key: "blockMaxHealth",
      label: "Wood Health",
      step: 10,
      min: 10,
      max: 1000,
    },
    {
      key: "steelMaxHealth",
      label: "Steel Health",
      step: 10,
      min: 10,
      max: 2000,
    },
    {
      key: "stoneMaxHealth",
      label: "Stone Health",
      step: 10,
      min: 10,
      max: 2000,
    },
    {
      key: "glassMaxHealth",
      label: "Glass Health",
      step: 5,
      min: 10,
      max: 100,
    },
    { key: "projectileRadius", label: "Ball Size", step: 1, min: 2, max: 50 },
    { key: "soldierRadius", label: "Soldier Size", step: 1, min: 5, max: 50 },
  ] satisfies DebugKeyItem[];

  const handleInputChange = (key: keyof GameConfig, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateConfig({ [key]: numValue });

      // Dispatch event to notify game component of config change
      const event = new CustomEvent("configUpdate", {
        detail: { key, value: numValue },
      });
      window.dispatchEvent(event);
    }
  };

  if (!debugPanelOpen) return null;

  return (
    <>
      <div className="absolute top-[60px] right-5 w-[280px] bg-[rgba(20,20,20,0.9)] text-gray-200 p-4 rounded-xl font-mono text-xs z-1000 backdrop-blur-lg shadow-2xl border border-white/10 max-h-[80vh] overflow-y-auto">
        <h3 className="m-0 mb-4 text-sm uppercase tracking-wider text-cyan-300 border-b border-gray-600 pb-2 flex justify-between">
          Game Settings
          <span
            onClick={toggleDebugPanel}
            className="cursor-pointer opacity-50 hover:opacity-100"
          >
            ×
          </span>
        </h3>
        <div>
          {debugKeys.map((item) => (
            <div
              key={item.key}
              className="mb-3 flex items-center justify-between"
            >
              <label className="text-gray-400 flex-1">{item.label}</label>
              <input
                type="number"
                value={config[item.key]}
                step={item.step}
                min={item.min}
                onChange={(e) => handleInputChange(item.key, e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-[70px] bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-right font-mono focus:outline-none focus:border-cyan-400 focus:bg-gray-700"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-800 pt-3">
          <h4 className="m-0 mb-2 text-[11px] uppercase tracking-wider text-cyan-200">
            Building
          </h4>

          <label className="mb-2 flex items-center justify-between gap-2">
            <span className="text-gray-400 flex-1">Show Grid</span>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </label>

          <label className="mb-2 flex items-center justify-between gap-2">
            <span className="text-gray-400 flex-1">Build Mode (B)</span>
            <input
              type="checkbox"
              checked={buildMode}
              onChange={(e) => setBuildMode(e.target.checked)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </label>

          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-gray-400 flex-1">Material</span>
            <select
              value={selectedMaterial}
              onChange={(e) =>
                setSelectedMaterial(e.target.value as typeof selectedMaterial)
              }
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-right font-mono focus:outline-none focus:border-cyan-400 focus:bg-gray-700"
            >
              <option value="wood">Wood</option>
              <option value="stone">Stone</option>
              <option value="steel">Steel</option>
              <option value="glass">Glass</option>
            </select>
          </div>

          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-gray-400 flex-1">Piece</span>
            <select
              value={selectedPieceId}
              onChange={(e) =>
                setSelectedPieceId(e.target.value as typeof selectedPieceId)
              }
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-right font-mono focus:outline-none focus:border-cyan-400 focus:bg-gray-700"
            >
              {Object.values(PIECES).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-400 flex-1">Rotation</span>
            <button
              onClick={() => rotateSelectedPiece()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded font-mono hover:bg-gray-700"
            >
              {selectedRotation}°
            </button>
          </div>
        </div>
        <div className="mt-4 text-[10px] text-gray-600 leading-snug border-t border-gray-800 pt-2.5">
          • Physics/Damage updates apply instantly.
          <br />• Health/Radius updates apply on Reset.
        </div>
      </div>
    </>
  );
}
