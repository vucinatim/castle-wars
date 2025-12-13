import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";

/**
 * Renders the ground
 */
export const renderGround = (ctx: CanvasRenderingContext2D) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { config, width } = useGameStore.getState();

  const ground = engine.world.bodies.find((b) => b.label === "ground");
  if (ground) {
    ctx.save();
    ctx.translate(ground.position.x, ground.position.y);
    ctx.fillStyle = config.colors.ground;
    const w = width;
    const h = config.groundHeight;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = config.colors.groundDark;
    ctx.fillRect(-w / 2, -h / 2, w, 5);
    ctx.restore();
  }
};
