"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "@/store/game-store";
import { useBuildStore } from "@/store/build-store";
import { compileBlueprintToRects } from "@/lib/building/compile-blueprint";

export default function BuildCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const config = useGameStore((s) => s.config);
  const {
    cells,
    spawns,
    cols,
    rows,
    cellSize,
    tool,
    viewMode,
    selection,
    selectionAnchor,
    movingAnchor,
    moveOffset,
    moveValid,
    moveCells,
    moveSpawns,
  } = useBuildStore();
  const setGrid = useBuildStore((s) => s.setGrid);
  const setPointerDown = useBuildStore((s) => s.setPointerDown);
  const paintCell = useBuildStore((s) => s.paintCell);
  const clearCell = useBuildStore((s) => s.clearCell);
  const toggleSpawn = useBuildStore((s) => s.toggleSpawn);
  const exportBlueprintRows = useBuildStore((s) => s.exportBlueprintRows);
  const beginSelection = useBuildStore((s) => s.beginSelection);
  const updateSelection = useBuildStore((s) => s.updateSelection);
  const finalizeSelection = useBuildStore((s) => s.finalizeSelection);
  const startMoveSelection = useBuildStore((s) => s.startMoveSelection);
  const updateMoveSelection = useBuildStore((s) => s.updateMoveSelection);
  const commitMoveSelection = useBuildStore((s) => s.commitMoveSelection);

  const colors = useMemo(
    () => ({
      wood: config.colors.wood,
      woodStroke: config.colors.woodStroke,
      steel: config.colors.steel,
      stone: config.colors.stone,
      glass: config.colors.glass,
    }),
    [config.colors]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      const nextCellSize = config.blockSize;
      setGrid(
        Math.max(1, Math.floor(canvas.width / nextCellSize)),
        Math.max(1, Math.floor(canvas.height / nextCellSize)),
        nextCellSize
      );
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [config.blockSize, setGrid]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (viewMode === "game") {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, config.colors.skyTop);
      g.addColorStop(1, config.colors.skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground preview
      ctx.save();
      const gh = config.groundHeight;
      ctx.fillStyle = config.colors.ground;
      ctx.fillRect(0, canvas.height - gh, canvas.width, gh);
      ctx.fillStyle = config.colors.groundDark;
      ctx.fillRect(0, canvas.height - gh, canvas.width, Math.min(5, gh));
      ctx.restore();
    } else {
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Shade the "below ground" area so it's obvious it won't export/place in-game.
    const groundTopY = canvas.height - config.groundHeight;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, groundTopY, canvas.width, canvas.height - groundTopY);
    ctx.restore();

    const drawSpawnMarker = (cx: number, cy: number) => {
      const r = Math.max(6, Math.min(14, cellSize * 0.22));
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const normalizeRect = (r: { x0: number; y0: number; x1: number; y1: number }) => ({
      x0: Math.min(r.x0, r.x1),
      y0: Math.min(r.y0, r.y1),
      x1: Math.max(r.x0, r.x1),
      y1: Math.max(r.y0, r.y1),
    });

    const buildCharGrid = () => {
      const grid: string[][] = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => "-")
      );

      for (const [k, mat] of Object.entries(cells)) {
        const [xs, ys] = k.split(",");
        const x = Number(xs);
        const y = Number(ys);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const ch = mat === "wood" ? "w" : mat === "steel" ? "t" : mat === "stone" ? "s" : "g";
        grid[y][x] = ch;
      }
      for (const k of Object.keys(spawns)) {
        const [xs, ys] = k.split(",");
        const x = Number(xs);
        const y = Number(ys);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        grid[y][x] = "p";
      }

      if (movingAnchor) {
        const selectedSet = new Set<string>();
        for (const c of moveCells) selectedSet.add(`${c.x},${c.y}`);
        for (const s of moveSpawns) selectedSet.add(`${s.x},${s.y}`);

        for (const k of selectedSet) {
          const [xs, ys] = k.split(",");
          const x = Number(xs);
          const y = Number(ys);
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          grid[y][x] = "-";
        }

        for (const c of moveCells) {
          const nx = c.x + moveOffset.dx;
          const ny = c.y + moveOffset.dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const ch = c.mat === "wood" ? "w" : c.mat === "steel" ? "t" : c.mat === "stone" ? "s" : "g";
          grid[ny][nx] = ch;
        }
        for (const s of moveSpawns) {
          const nx = s.x + moveOffset.dx;
          const ny = s.y + moveOffset.dy;
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          grid[ny][nx] = "p";
        }
      }

      return grid.map((r) => r.join(""));
    };

    if (viewMode === "game") {
      const rowsForRender = movingAnchor ? buildCharGrid() : exportBlueprintRows();
      const rects = compileBlueprintToRects(rowsForRender);
      for (const r of rects) {
        const cx = (r.x + r.w / 2) * cellSize;
        const cy = (r.y + r.h / 2) * cellSize;
        const w = r.w * cellSize;
        const h = r.h * cellSize;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = r.material === "glass" ? 0.25 : 1;
        ctx.fillStyle =
          r.material === "wood"
            ? colors.wood
            : r.material === "steel"
              ? colors.steel
              : r.material === "stone"
                ? colors.stone
                : colors.glass;
        ctx.strokeStyle =
          r.material === "wood"
            ? colors.woodStroke
            : r.material === "steel"
              ? "rgba(47,79,79,0.8)"
              : r.material === "stone"
                ? "rgba(54,54,54,0.9)"
                : "rgba(128,203,196,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Simple stone texture preview (deterministic)
        if (r.material === "stone") {
          const mod = (n: number, m: number) => ((n % m) + m) % m;
          const seed = cx * 1000 + cy;
          let seedValue = seed;
          ctx.fillStyle = "rgba(0,0,0,0.18)";
          for (let i = 0; i < 8; i += 1) {
            seedValue = mod(seedValue * 9301 + 49297, 233280);
            const r1 = seedValue / 233280;
            seedValue = mod(seedValue * 9301 + 49297, 233280);
            const r2 = seedValue / 233280;
            seedValue = mod(seedValue * 9301 + 49297, 233280);
            const r3 = seedValue / 233280;
            const sx = (r1 - 0.5) * w * 0.8;
            const sy = (r2 - 0.5) * h * 0.8;
            const sr = Math.max(0.25, 2 + r3 * 3);
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      for (let y = 0; y < rowsForRender.length; y += 1) {
        const row = rowsForRender[y] ?? "";
        for (let x = 0; x < row.length; x += 1) {
          if (row[x] !== "p") continue;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          drawSpawnMarker(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2
          );
        }
      }
    } else {
      // Cells (raw editor view)
      const skipKeys = new Set<string>();
      if (movingAnchor) {
        for (const c of moveCells) skipKeys.add(`${c.x},${c.y}`);
        for (const s of moveSpawns) skipKeys.add(`${s.x},${s.y}`);
      }

      for (const [k, mat] of Object.entries(cells)) {
        if (skipKeys.has(k)) continue;
        const [xs, ys] = k.split(",");
        const x = Number(xs);
        const y = Number(ys);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;

        const px = x * cellSize;
        const py = y * cellSize;
        ctx.fillStyle =
          mat === "wood"
            ? colors.wood
            : mat === "steel"
              ? colors.steel
              : mat === "stone"
                ? colors.stone
                : colors.glass;
        ctx.globalAlpha = mat === "glass" ? 0.35 : 0.9;
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        ctx.globalAlpha = 1;

        ctx.strokeStyle =
          mat === "wood" ? colors.woodStroke : "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
      }

      for (const k of Object.keys(spawns)) {
        if (skipKeys.has(k)) continue;
        const [xs, ys] = k.split(",");
        const x = Number(xs);
        const y = Number(ys);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        drawSpawnMarker(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
      }

      if (movingAnchor) {
        ctx.save();
        ctx.globalAlpha = 0.65;
        for (const c of moveCells) {
          const x = c.x + moveOffset.dx;
          const y = c.y + moveOffset.dy;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          const px = x * cellSize;
          const py = y * cellSize;
          ctx.fillStyle =
            c.mat === "wood"
              ? colors.wood
              : c.mat === "steel"
                ? colors.steel
                : c.mat === "stone"
                  ? colors.stone
                  : colors.glass;
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
        }
        for (const s of moveSpawns) {
          const x = s.x + moveOffset.dx;
          const y = s.y + moveOffset.dy;
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          drawSpawnMarker(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
        }
        ctx.restore();
      }
    }

    // Grid
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += cellSize) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += cellSize) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();

    // Selection overlay (after grid)
    const activeRect = selectionAnchor && selection
      ? normalizeRect(selection)
      : selection
        ? normalizeRect(selection)
        : null;

    if (activeRect) {
      const x = activeRect.x0 * cellSize;
      const y = activeRect.y0 * cellSize;
      const w = (activeRect.x1 - activeRect.x0 + 1) * cellSize;
      const h = (activeRect.y1 - activeRect.y0 + 1) * cellSize;

      ctx.save();
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.strokeStyle = movingAnchor
        ? moveValid
          ? "rgba(56, 189, 248, 0.9)"
          : "rgba(255, 100, 100, 0.9)"
        : "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.restore();
    }
  }, [
    cells,
    spawns,
    cols,
    rows,
    cellSize,
    colors,
    viewMode,
    config.colors.skyTop,
    config.colors.skyBottom,
    config.colors.ground,
    config.colors.groundDark,
    config.groundHeight,
    exportBlueprintRows,
    selection,
    selectionAnchor,
    movingAnchor,
    moveOffset.dx,
    moveOffset.dy,
    moveValid,
    moveCells,
    moveSpawns,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cellFromEvent = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      return { x: cx, y: cy };
    };

    const applyToolAt = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      // Disallow editing into the ground band (matches in-game ground top).
      const canvas = canvasRef.current;
      if (canvas) {
        const groundTopY = canvas.height - config.groundHeight;
        const cellBottomY = (y + 1) * cellSize;
        if (cellBottomY > groundTopY) return;
      }
      if (tool === "select") return;
      if (tool === "erase") clearCell(x, y);
      else if (tool === "soldier") toggleSpawn(x, y);
      else paintCell(x, y);
    };

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      setPointerDown(true);
      const c = cellFromEvent(e);
      if (tool === "select") {
        const state = useBuildStore.getState();
        if (
          state.selection &&
          (() => {
            const r = {
              x0: Math.min(state.selection.x0, state.selection.x1),
              y0: Math.min(state.selection.y0, state.selection.y1),
              x1: Math.max(state.selection.x0, state.selection.x1),
              y1: Math.max(state.selection.y0, state.selection.y1),
            };
            return (
              c.x >= r.x0 && c.x <= r.x1 && c.y >= r.y0 && c.y <= r.y1
            );
          })()
        ) {
          startMoveSelection(c.x, c.y);
        } else {
          beginSelection(c.x, c.y);
        }
        return;
      }
      applyToolAt(c.x, c.y);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!useBuildStore.getState().isPointerDown) return;
      if (useBuildStore.getState().tool === "soldier") return;
      if (useBuildStore.getState().tool === "select") {
        const c = cellFromEvent(e);
        const state = useBuildStore.getState();
        if (state.movingAnchor) updateMoveSelection(c.x, c.y);
        else if (state.selectionAnchor) updateSelection(c.x, c.y);
        return;
      }
      const c = cellFromEvent(e);
      applyToolAt(c.x, c.y);
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      if (useBuildStore.getState().tool === "select") {
        const state = useBuildStore.getState();
        if (state.movingAnchor) commitMoveSelection();
        else if (state.selectionAnchor) finalizeSelection();
      }
      setPointerDown(false);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      setPointerDown(false);
    };
  }, [
    cellSize,
    cols,
    rows,
    tool,
    paintCell,
    clearCell,
    toggleSpawn,
    setPointerDown,
    beginSelection,
    updateSelection,
    finalizeSelection,
    startMoveSelection,
    updateMoveSelection,
    commitMoveSelection,
    config.groundHeight,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: "none", userSelect: "none" }}
      />
    </div>
  );
}
