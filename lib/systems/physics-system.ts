import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore } from "@/store/game-store";
import { isBlockBody } from "@/types/matter";

const { Engine, Composite } = Matter;

/**
 * Creates and initializes the main physics engine
 */
export const createEngine = (): Matter.Engine => {
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.y = 1.5;
  // More solver iterations = firmer contacts under load.
  engine.positionIterations = 12;
  engine.velocityIterations = 10;
  engine.constraintIterations = 4;
  return engine;
};

/**
 * Creates a ghost engine for trajectory prediction
 */
export const createGhostEngine = (): Matter.Engine => {
  const ghostEngine = Engine.create({ enableSleeping: false });
  ghostEngine.gravity.y = 1.5;
  ghostEngine.positionIterations = 12;
  ghostEngine.velocityIterations = 10;
  ghostEngine.constraintIterations = 4;
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
      if (b.gridCells) {
        useGameStore.getState().freeCells(b.gridCells);
      }
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
