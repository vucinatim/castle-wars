import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import { BlockBody, isBlockBody } from "@/types/matter";
import { generateCrackPattern, renderCrackSegments } from "./crack-generator";

const { Composite } = Matter;

/**
 * Renders all non-glass blocks
 */
export const renderBlocks = (ctx: CanvasRenderingContext2D) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { config } = useGameStore.getState();
  const activeBodies = Composite.allBodies(engine.world);

  const otherBodies = activeBodies.filter((body) => {
    if (body.label === "ground") return false;
    if (isBlockBody(body) && body.label === "glass") return false;
    return isBlockBody(body);
  });

  ctx.lineWidth = 2;

  otherBodies.forEach((body) => {
    if (!isBlockBody(body)) return;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const renderProps = body.render || {};
    ctx.fillStyle = renderProps.fillStyle || config.colors.wood;
    ctx.strokeStyle = renderProps.strokeStyle || config.colors.woodStroke;

    // Draw shape
    ctx.beginPath();
    const vertices = body.vertices;
    ctx.moveTo(
      vertices[0].x - body.position.x,
      vertices[0].y - body.position.y
    );
    for (let j = 1; j < vertices.length; j += 1) {
      ctx.lineTo(
        vertices[j].x - body.position.x,
        vertices[j].y - body.position.y
      );
    }
    ctx.lineTo(
      vertices[0].x - body.position.x,
      vertices[0].y - body.position.y
    );
    ctx.fill();
    ctx.stroke();

    // Steel texture details
    if (body.label === "steel") {
      renderSteelTexture(ctx, body, config);
    }

    // Stone texture details
    if (body.label === "stone") {
      renderStoneTexture(ctx, body, config);
    }

    // Crack visuals
    renderBlockCracks(ctx, body);

    ctx.restore();
  });
};

/**
 * Renders glass blocks with transparency
 */
export const renderGlassBlocks = (ctx: CanvasRenderingContext2D) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { config } = useGameStore.getState();
  const activeBodies = Composite.allBodies(engine.world);

  const glassBodies = activeBodies.filter(
    (body) => isBlockBody(body) && body.label === "glass"
  );

  glassBodies.forEach((body) => {
    if (!isBlockBody(body)) return;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const renderProps = body.render || {};

    // Draw glass with transparency
    ctx.beginPath();
    const vertices = body.vertices;
    ctx.moveTo(
      vertices[0].x - body.position.x,
      vertices[0].y - body.position.y
    );
    for (let j = 1; j < vertices.length; j += 1) {
      ctx.lineTo(
        vertices[j].x - body.position.x,
        vertices[j].y - body.position.y
      );
    }
    ctx.lineTo(
      vertices[0].x - body.position.x,
      vertices[0].y - body.position.y
    );

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = renderProps.fillStyle || config.colors.glass;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.strokeStyle = renderProps.strokeStyle || config.colors.glassStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glass highlight effect
    const b = body.bounds;
    const w = b.max.x - b.min.x;
    const h = b.max.y - b.min.y;

    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 4, -h / 2);
    ctx.lineTo(w / 5, h / 3);
    ctx.lineTo(-w / 2, h / 3);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 4, h / 3);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Glass cracks
    renderGlassCracks(ctx, body);

    ctx.restore();
  });
};

const renderSteelTexture = (
  ctx: CanvasRenderingContext2D,
  body: BlockBody,
  config: { colors: { steel: string } }
) => {
  const renderProps = body.render || {};
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  const b = body.bounds;
  const w = b.max.x - b.min.x;
  const h = b.max.y - b.min.y;
  const off = 5;
  ctx.beginPath();
  ctx.arc(-w / 2 + off, -h / 2 + off, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w / 2 - off, -h / 2 + off, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-w / 2 + off, h / 2 - off, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w / 2 - off, h / 2 - off, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = renderProps.fillStyle || config.colors.steel;
};

const renderStoneTexture = (
  ctx: CanvasRenderingContext2D,
  body: BlockBody,
  config: { colors: { stone: string } }
) => {
  const renderProps = body.render || {};
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  const textureSpots = body.stoneTexture;
  if (textureSpots) {
    textureSpots.forEach((spot: { x: number; y: number; size: number }) => {
      ctx.beginPath();
      const r = Number.isFinite(spot.size) ? Math.max(0.25, spot.size) : 0.25;
      ctx.arc(spot.x, spot.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.fillStyle = renderProps.fillStyle || config.colors.stone;
};

const renderBlockCracks = (ctx: CanvasRenderingContext2D, body: BlockBody) => {
  if (body.health === undefined || body.maxHealth === undefined) return;

  const healthRatio = body.health / body.maxHealth;
  if (healthRatio >= 1) return;

  const crackSegments = generateCrackPattern(body, healthRatio);

  if (body.label === "steel" || body.label === "stone") {
    renderCrackSegments(ctx, crackSegments, "#1a1a1a", 1.5);
  } else {
    renderCrackSegments(ctx, crackSegments, "#5c4033", 1.5);
  }
};

const renderGlassCracks = (ctx: CanvasRenderingContext2D, body: BlockBody) => {
  if (body.health === undefined || body.maxHealth === undefined) return;

  const healthRatio = body.health / body.maxHealth;
  if (healthRatio >= 1) return;

  const crackSegments = generateCrackPattern(body, healthRatio);
  renderCrackSegments(ctx, crackSegments, "rgba(255, 255, 255, 0.9)", 1.5);
};
