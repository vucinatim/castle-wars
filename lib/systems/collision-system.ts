import Matter from "matter-js";
import { useGameStore, FloatingText } from "@/store/game-store";
import { useEngineStore } from "@/store/engine-store";
import { isBlockBody } from "@/types/matter";

const { Vector, Events } = Matter;

/**
 * Sets up collision event handlers on the engine
 */
export const setupCollisionHandlers = () => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  Events.on(engine, "collisionStart", (event) => {
    const store = useGameStore.getState();
    handleCollisions(event, store.addFloatingText, store.config);
  });
};

/**
 * Handles collision events and applies damage
 */
const handleCollisions = (
  event: Matter.IEventCollision<Matter.Engine>,
  addFloatingText: (text: FloatingText) => void,
  config: { minDamageVelocity: number; damageMultiplier: number }
) => {
  const pairs = event.pairs;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    const relVel = Vector.magnitude(Vector.sub(bodyA.velocity, bodyB.velocity));

    if (relVel > config.minDamageVelocity) {
      const damage =
        (relVel - config.minDamageVelocity) * config.damageMultiplier;
      applyDamage(bodyA, damage, addFloatingText);
      applyDamage(bodyB, damage, addFloatingText);
    }
  }
};

/**
 * Applies damage to a body and shows floating text
 */
export const applyDamage = (
  body: Matter.Body,
  damage: number,
  addFloatingText: (text: FloatingText) => void
) => {
  if (isBlockBody(body)) {
    body.health -= damage;

    if (damage > 1) {
      const isBigHit = damage > 20;
      const fontSize = isBigHit ? 24 : 14;
      const color = isBigHit ? "#ff4d4d" : "#ffffff";
      const lifeTime = isBigHit ? 1.5 : 0.8;

      addFloatingText({
        x: body.position.x + (Math.random() - 0.5) * 20,
        y: body.position.y - 20,
        text: Math.round(damage).toString(),
        life: lifeTime,
        maxLife: lifeTime,
        color,
        size: fontSize,
        vy: -1 - Math.random() * 1,
      });
    }
  }
};
