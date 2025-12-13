import { useGameStore } from "@/store/game-store";
import { getCurrentSoldier } from "@/lib/systems/projectile-system";
import { renderSky, renderClouds } from "./sky-renderer";
import { renderGround } from "./ground-renderer";
import { renderBlocks, renderGlassBlocks } from "./block-renderer";
import { renderGrid } from "./grid-renderer";
import {
  renderSoldiers,
  renderActiveSoldierHighlight,
} from "./soldier-renderer";
import { renderProjectiles } from "./projectile-renderer";
import {
  renderFloatingTexts,
  renderAimingLine,
  updateTelemetry,
} from "./effects-renderer";
import { renderHitboxes } from "./hitbox-renderer";

/**
 * Main render function that orchestrates all renderers
 */
export const render = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) => {
  const { input, currentPlayer, debugPanelOpen, showGrid, showHitboxes } =
    useGameStore.getState();

  // Background
  renderSky(ctx, canvas);
  renderClouds(ctx);

  // Get active soldier for highlight
  const activeSoldier = getCurrentSoldier(currentPlayer);
  if (activeSoldier) {
    renderActiveSoldierHighlight(ctx, activeSoldier);
  }

  // Environment
  renderGround(ctx);

  // Debug overlays
  if (debugPanelOpen && showGrid) {
    renderGrid(ctx, canvas);
  }

  // Game objects (order matters for layering)
  renderBlocks(ctx);
  renderSoldiers(ctx);
  renderProjectiles(ctx);
  renderGlassBlocks(ctx); // Glass last for transparency

  // Effects
  renderFloatingTexts(ctx);

  // Aiming line when dragging
  if (input.isDragging && activeSoldier) {
    renderAimingLine(ctx, activeSoldier);
  }

  // Debug: Render hitboxes on top of everything
  if (debugPanelOpen && showHitboxes) {
    renderHitboxes(ctx);
  }

  // Update HUD
  updateTelemetry();
};
