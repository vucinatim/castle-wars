import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import {
  isBlockBody,
  isSoldierBody,
  isProjectileBody,
  isGroundBody,
} from "@/types/matter";

const { Composite } = Matter;

/**
 * Renders Matter.js collision shapes (hitboxes) for all bodies when debug mode is enabled.
 * Uses body.vertices which represents the actual collision shape used by Matter.js physics.
 *
 * IMPORTANT: part.vertices are in WORLD SPACE and already account for position and rotation.
 * Render them directly without additional transforms so visuals match physics exactly.
 */
export const renderHitboxes = (ctx: CanvasRenderingContext2D) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const allBodies = Composite.allBodies(engine.world);

  allBodies.forEach((body) => {
    ctx.save();

    // Determine neon color based on body type
    let strokeColor: string;
    let fillColor: string;
    if (isGroundBody(body)) {
      strokeColor = "#FF00FF"; // Neon magenta for ground
      fillColor = "rgba(255, 0, 255, 0.2)";
    } else if (isBlockBody(body)) {
      if (body.label === "steel") {
        strokeColor = "#00FFFF"; // Neon cyan for steel
        fillColor = "rgba(0, 255, 255, 0.2)";
      } else if (body.label === "stone") {
        strokeColor = "#FFFF00"; // Neon yellow for stone
        fillColor = "rgba(255, 255, 0, 0.2)";
      } else if (body.label === "glass") {
        strokeColor = "#00FF00"; // Neon green for glass
        fillColor = "rgba(0, 255, 0, 0.2)";
      } else {
        strokeColor = "#FF6600"; // Neon orange for wood blocks
        fillColor = "rgba(255, 102, 0, 0.2)";
      }
    } else if (isSoldierBody(body)) {
      strokeColor = body.team === "red" ? "#FF0080" : "#0080FF"; // Neon pink/blue for soldiers
      fillColor =
        body.team === "red"
          ? "rgba(255, 0, 128, 0.2)"
          : "rgba(0, 128, 255, 0.2)";
    } else if (isProjectileBody(body)) {
      strokeColor = "#FFD700"; // Neon gold for projectiles
      fillColor = "rgba(255, 215, 0, 0.2)";
    } else {
      strokeColor = "#FFFFFF"; // White for unknown
      fillColor = "rgba(255, 255, 255, 0.2)";
    }

    // Set rendering properties
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 1.0;

    // Render all parts of the body (for compound bodies)
    // Matter.js simple bodies have body.parts = [body], so this works for both
    const parts =
      body.parts && body.parts.length > 1 ? body.parts.slice(1) : [body];

    parts.forEach((part) => {
      const vertices = part.vertices;
      if (vertices && vertices.length > 0) {
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        ctx.closePath();

        // Draw filled area with transparency
        ctx.fill();

        // Draw outline with neon color
        ctx.stroke();
      }
    });

    // Draw center point (body position) in world space
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(body.position.x, body.position.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Restore context after each body to prevent state pollution
    ctx.restore();
  });
};
