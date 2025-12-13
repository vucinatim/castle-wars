import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import { isSoldierBody, SoldierBody } from "@/types/matter";

const { Composite } = Matter;

/**
 * Renders the active soldier highlight
 */
export const renderActiveSoldierHighlight = (
  ctx: CanvasRenderingContext2D,
  activeSoldier: SoldierBody
) => {
  const { config } = useGameStore.getState();

  // Outer glow
  ctx.beginPath();
  ctx.arc(
    activeSoldier.position.x,
    activeSoldier.position.y,
    config.soldierRadius + 20,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fill();

  // Pulsing ring
  const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
  ctx.beginPath();
  ctx.arc(
    activeSoldier.position.x,
    activeSoldier.position.y,
    config.soldierRadius + 10 + pulse * 5,
    0,
    Math.PI * 2
  );
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();
};

/**
 * Renders all soldiers
 */
export const renderSoldiers = (ctx: CanvasRenderingContext2D) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { config } = useGameStore.getState();
  const activeBodies = Composite.allBodies(engine.world);

  const soldiers = activeBodies.filter((body) => isSoldierBody(body));

  ctx.lineWidth = 2;

  soldiers.forEach((body) => {
    if (!isSoldierBody(body)) return;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const teamColor =
      body.team === "red" ? config.colors.redTeam : config.colors.blueTeam;

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, config.soldierRadius, 0, Math.PI * 2);
    ctx.fillStyle = teamColor;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();

    // Eyes (white part)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-5, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(-5, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
};
