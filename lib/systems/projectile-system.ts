import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore, PlayerTeam } from "@/store/game-store";
import { CAT } from "@/lib/constants";
import { SoldierBody, isSoldierBody } from "@/types/matter";

const { Bodies, Body, Composite } = Matter;

/**
 * Gets the current active soldier for a team
 */
export const getCurrentSoldier = (
  currentPlayer: PlayerTeam
): SoldierBody | undefined => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return undefined;

  const bodies = Composite.allBodies(engine.world);
  const soldier = bodies.find(
    (b) => isSoldierBody(b) && b.team === currentPlayer
  );
  return soldier as SoldierBody | undefined;
};

/**
 * Fires a projectile from the soldier
 */
export const fireProjectile = (
  soldier: Matter.Body,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  currentPlayer: PlayerTeam
) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const dx = startX - currentX;
  const dy = startY - currentY;

  if (Math.hypot(dx, dy) < 10) return;

  const spawnX = soldier.position.x;
  const spawnY = soldier.position.y - 30;

  const isRed = currentPlayer === "red";
  const myCategory = isRed ? CAT.RED_PROJ : CAT.BLUE_PROJ;
  const enemyTeam = isRed ? CAT.BLUE_TEAM : CAT.RED_TEAM;
  const myMask = CAT.GROUND | enemyTeam | CAT.RED_TEAM | CAT.BLUE_TEAM;

  const store = useGameStore.getState();
  const config = store.config;

  const ball = Bodies.circle(spawnX, spawnY, config.projectileRadius, {
    label: "projectile",
    density: 0.008,
    frictionAir: 0.005,
    restitution: 0.6,
    friction: 0.005,
    collisionFilter: { category: myCategory, mask: myMask },
  });

  let vx = dx * config.velocityMultiplier;
  let vy = dy * config.velocityMultiplier;

  const speed = Math.hypot(vx, vy);
  if (speed > config.maxSpeed) {
    const scale = config.maxSpeed / speed;
    vx *= scale;
    vy *= scale;
  }

  Body.setVelocity(ball, { x: vx, y: vy });
  Composite.add(engine.world, ball);

  store.switchPlayer();

  // Remove projectile after 5 seconds
  setTimeout(() => {
    if (engine.world.bodies.includes(ball)) {
      Composite.remove(engine.world, ball);
    }
  }, 5000);
};
