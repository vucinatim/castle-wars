import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";

const { Composite } = Matter;

/**
 * Renders all projectiles
 */
export const renderProjectiles = (ctx: CanvasRenderingContext2D) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { config } = useGameStore.getState();
  const activeBodies = Composite.allBodies(engine.world);

  const projectiles = activeBodies.filter(
    (body) => body.label === "projectile"
  );

  ctx.lineWidth = 2;

  projectiles.forEach((body) => {
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    ctx.beginPath();
    ctx.arc(0, 0, config.projectileRadius, 0, Math.PI * 2);
    ctx.fillStyle = config.colors.projectile;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.stroke();

    ctx.restore();
  });
};
