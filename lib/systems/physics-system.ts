import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import { isBlockBody } from "@/types/matter";

const { Engine, Composite } = Matter;

/**
 * Creates and initializes the main physics engine
 */
export const createEngine = (): Matter.Engine => {
  const engine = Engine.create();
  engine.world.gravity.y = 1.5;
  return engine;
};

/**
 * Creates a ghost engine for trajectory prediction
 */
export const createGhostEngine = (): Matter.Engine => {
  const ghostEngine = Engine.create();
  ghostEngine.world.gravity.y = 1.5;
  return ghostEngine;
};

/**
 * Updates physics simulation for one frame
 */
export const updatePhysics = () => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { config } = useGameStore.getState();
  Engine.update(engine, (1000 / 60) * config.physicsSpeed);
};

/**
 * Removes dead blocks (health <= 0) from the world
 */
export const cleanupDeadBodies = () => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const bodies = Composite.allBodies(engine.world);
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (isBlockBody(b) && b.health <= 0) {
      Composite.remove(engine.world, b);
    }
  }
};

/**
 * Clears both engines
 */
export const clearEngines = () => {
  const { engine, ghostEngine } = useEngineStore.getState();
  if (engine) {
    Composite.clear(engine.world, false);
  }
  if (ghostEngine) {
    Composite.clear(ghostEngine.world, false);
  }
};
