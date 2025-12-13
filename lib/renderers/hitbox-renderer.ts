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

    // Transform to body's position and rotation
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    // Draw body outline using vertices (these are the actual collision shapes)
    const vertices = body.vertices;
    if (vertices && vertices.length > 0) {
      ctx.beginPath();

      // Transform vertices to local coordinates
      // body.vertices are in world space, so we transform them to local space
      const localX = vertices[0].x - body.position.x;
      const localY = vertices[0].y - body.position.y;
      ctx.moveTo(localX, localY);

      for (let i = 1; i < vertices.length; i++) {
        const vx = vertices[i].x - body.position.x;
        const vy = vertices[i].y - body.position.y;
        ctx.lineTo(vx, vy);
      }

      // Close the path
      ctx.closePath();

      // Draw filled area with transparency
      ctx.fill();

      // Draw outline with neon color
      ctx.stroke();
    }

    // Draw center point (body position)
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Restore context after each body to prevent state pollution
    ctx.restore();
  });
};
