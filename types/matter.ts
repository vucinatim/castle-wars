import { PlayerTeam } from "@/store/game-store";
import Matter from "matter-js";

declare module "matter-js" {
  interface Body {
    health?: number;
    maxHealth?: number;
    team?: PlayerTeam;
    gridCells?: Array<{ x: number; y: number }>;
  }

  interface IBodyRenderOptions {
    fillStyle?: string;
    strokeStyle?: string;
  }

  interface IBodyDefinition {
    team?: PlayerTeam;
    health?: number;
    maxHealth?: number;
    gridCells?: Array<{ x: number; y: number }>;
  }

  interface IChamferableBodyDefinition {
    team?: PlayerTeam;
    health?: number;
    maxHealth?: number;
    gridCells?: Array<{ x: number; y: number }>;
  }
}

// Extended body types for game-specific bodies
export type GameBody = Matter.Body & {
  health?: number;
  maxHealth?: number;
  team?: PlayerTeam;
  gridCells?: Array<{ x: number; y: number }>;
  render?: Matter.IBodyRenderOptions & {
    fillStyle?: string;
    strokeStyle?: string;
  };
};

export type StoneTextureSpot = {
  x: number;
  y: number;
  size: number;
};

export type BlockBody = GameBody & {
  label: "block" | "steel" | "stone" | "glass";
  health: number;
  maxHealth: number;
  stoneTexture?: StoneTextureSpot[]; // Pre-generated texture pattern for stone blocks
};

export type SoldierBody = GameBody & {
  label: "soldier";
  team: PlayerTeam;
};

export type ProjectileBody = GameBody & {
  label: "projectile";
};

export type GroundBody = GameBody & {
  label: "ground";
};

// Type guards
export function isBlockBody(body: Matter.Body): body is BlockBody {
  return (
    body.label === "block" ||
    body.label === "steel" ||
    body.label === "stone" ||
    body.label === "glass"
  );
}

export function isSoldierBody(body: Matter.Body): body is SoldierBody {
  return body.label === "soldier";
}

export function isProjectileBody(body: Matter.Body): body is ProjectileBody {
  return body.label === "projectile";
}

export function isGroundBody(body: Matter.Body): body is GroundBody {
  return body.label === "ground";
}

// Helper functions for type-safe property access
export function getBodyHealth(body: Matter.Body): number | undefined {
  return isBlockBody(body) ? body.health : undefined;
}

export function getBodyMaxHealth(body: Matter.Body): number | undefined {
  return isBlockBody(body) ? body.maxHealth : undefined;
}

export function getBodyTeam(body: Matter.Body): PlayerTeam | undefined {
  if (isSoldierBody(body) || isBlockBody(body)) {
    return body.team;
  }
  return undefined;
}
