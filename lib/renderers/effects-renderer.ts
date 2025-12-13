import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";

const { Engine, Bodies, Body, Composite } = Matter;

/**
 * Renders floating damage text
 */
export const renderFloatingTexts = (ctx: CanvasRenderingContext2D) => {
  const { floatingTexts } = useGameStore.getState();

  ctx.textAlign = "center";

  floatingTexts.forEach((ft) => {
    const alpha = Math.min(1.0, ft.life * 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${ft.size}px Arial`;
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    ctx.strokeText(ft.text.toString(), ft.x, ft.y);
    ctx.fillText(ft.text.toString(), ft.x, ft.y);

    ctx.restore();
  });
};

/**
 * Renders the aiming line and trajectory prediction
 */
export const renderAimingLine = (
  ctx: CanvasRenderingContext2D,
  soldier: Matter.Body
) => {
  const engine = useEngineStore.getState().engine;
  const ghostEngine = useEngineStore.getState().ghostEngine;
  if (!engine || !ghostEngine) return;

  const { input, config, height } = useGameStore.getState();

  const startX = soldier.position.x;
  const startY = soldier.position.y - 30;

  const dragX = input.startX - input.currentX;
  const dragY = input.startY - input.currentY;

  let vx = dragX * config.velocityMultiplier;
  let vy = dragY * config.velocityMultiplier;

  const speed = Math.hypot(vx, vy);
  if (speed > config.maxSpeed) {
    const scale = config.maxSpeed / speed;
    vx *= scale;
    vy *= scale;
  }

  // Setup ghost simulation
  Composite.clear(ghostEngine.world, false);

  // Match gravity
  ghostEngine.world.gravity.x = engine.world.gravity.x;
  ghostEngine.world.gravity.y = engine.world.gravity.y;
  ghostEngine.world.gravity.scale = engine.world.gravity.scale;

  const ghostBall = Bodies.circle(startX, startY, config.projectileRadius, {
    density: 0.008,
    frictionAir: 0.005,
    restitution: 0.6,
    friction: 0.005,
  });

  Body.setVelocity(ghostBall, { x: vx, y: vy });
  Composite.add(ghostEngine.world, ghostBall);

  // Draw trajectory path
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);

  const simulationSteps = 100;
  const simulationDelta = (1000 / 60) * config.physicsSpeed;

  for (let i = 0; i < simulationSteps; i++) {
    Engine.update(ghostEngine, simulationDelta);
    ctx.lineTo(ghostBall.position.x, ghostBall.position.y);
    if (ghostBall.position.y > height - config.groundHeight / 2) break;
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // Draw drag line
  ctx.beginPath();
  ctx.moveTo(input.startX, input.startY);
  ctx.lineTo(input.currentX, input.currentY);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw drag handle
  ctx.beginPath();
  ctx.arc(input.startX, input.startY, 15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();
};

/**
 * Updates telemetry display
 */
export const updateTelemetry = () => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { height } = useGameStore.getState();

  const el = document.getElementById("telemetry");
  if (!el) return;

  const bodies = Composite.allBodies(engine.world);
  const projectile = bodies.find((b) => b.label === "projectile");
  const moving = bodies.filter((b) => b.speed > 0.1 && !b.isStatic).length;

  if (projectile) {
    const speed = projectile.speed.toFixed(1);
    const altitude = (height - projectile.position.y).toFixed(0);
    el.textContent = `Speed: ${speed} | Alt: ${altitude} | Active: ${moving}`;
  } else {
    el.textContent = `Ready | Active: ${moving}`;
  }
};
