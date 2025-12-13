import Matter from "matter-js";
import { CAT, GameConfig } from "@/lib/constants";
import { MaterialId } from "./types";
import { MATERIAL_LABEL } from "./registry";
import { BlockBody } from "@/types/matter";
import { PlayerTeam } from "@/store/game-store";

const { Bodies } = Matter;

export const spawnRectBody = ({
  worldX,
  worldY,
  worldW,
  worldH,
  material,
  team,
  config,
  collision,
  gridCells,
}: {
  worldX: number;
  worldY: number;
  worldW: number;
  worldH: number;
  material: MaterialId;
  team: PlayerTeam;
  config: GameConfig;
  collision: { category: number; mask: number };
  gridCells: Array<{ x: number; y: number }>;
}): BlockBody => {
  const label = MATERIAL_LABEL[material];

  if (material === "stone") {
    const body = Bodies.rectangle(worldX, worldY, worldW, worldH, {
      label,
      isStatic: true,
      friction: 0.8,
      restitution: 0.1,
      density: 0.01,
      render: {
        fillStyle: config.colors.stone,
        strokeStyle: config.colors.stoneStroke,
      },
      team,
      health: config.stoneMaxHealth,
      maxHealth: config.stoneMaxHealth,
      collisionFilter: collision,
    }) as BlockBody;

    const textureSpots: Array<{ x: number; y: number; size: number }> = [];
    const seed = worldX * 1000 + worldY;
    let seedValue = seed;
    for (let i = 0; i < 8; i++) {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      const r1 = seedValue / 233280;
      seedValue = (seedValue * 9301 + 49297) % 233280;
      const r2 = seedValue / 233280;
      seedValue = (seedValue * 9301 + 49297) % 233280;
      const r3 = seedValue / 233280;

      textureSpots.push({
        x: (r1 - 0.5) * worldW * 0.8,
        y: (r2 - 0.5) * worldH * 0.8,
        size: 2 + r3 * 3,
      });
    }
    body.stoneTexture = textureSpots;
    body.gridCells = gridCells;
    return body;
  }

  if (material === "steel") {
    const body = Bodies.rectangle(worldX, worldY, worldW, worldH, {
      label,
      isStatic: false,
      friction: 0.8,
      restitution: 0.1,
      density: 0.05,
      render: {
        fillStyle: config.colors.steel,
        strokeStyle: config.colors.steelStroke,
      },
      team,
      health: config.steelMaxHealth,
      maxHealth: config.steelMaxHealth,
      collisionFilter: collision,
    }) as BlockBody;
    body.gridCells = gridCells;
    return body;
  }

  if (material === "glass") {
    const body = Bodies.rectangle(worldX, worldY, worldW, worldH, {
      label,
      isStatic: false,
      friction: 0.05,
      restitution: 0.8,
      density: 0.0015,
      render: {
        fillStyle: config.colors.glass,
        strokeStyle: config.colors.glassStroke,
      },
      team,
      health: config.glassMaxHealth,
      maxHealth: config.glassMaxHealth,
      collisionFilter: collision,
    }) as BlockBody;
    body.gridCells = gridCells;
    return body;
  }

  const body = Bodies.rectangle(worldX, worldY, worldW, worldH, {
    label,
    isStatic: false,
    friction: 0.8,
    restitution: 0.1,
    density: 0.002,
    render: {
      fillStyle: config.colors.wood,
      strokeStyle: config.colors.woodStroke,
    },
    team,
    health: config.blockMaxHealth,
    maxHealth: config.blockMaxHealth,
    collisionFilter: collision,
  }) as BlockBody;
  body.gridCells = gridCells;
  return body;
};

export const getTeamCollision = (team: PlayerTeam) => {
  const isRed = team === "red";
  const myCategory = isRed ? CAT.RED_TEAM : CAT.BLUE_TEAM;
  const myMask =
    CAT.GROUND |
    CAT.RED_TEAM |
    CAT.BLUE_TEAM |
    (isRed ? CAT.BLUE_PROJ : CAT.RED_PROJ);
  return { category: myCategory, mask: myMask };
};

export const getPlacementCollision = (team: PlayerTeam) => {
  const isRed = team === "red";
  const myCategory = isRed ? CAT.RED_TEAM : CAT.BLUE_TEAM;
  const myMask = CAT.GROUND | CAT.RED_TEAM | CAT.BLUE_TEAM;
  return { category: myCategory, mask: myMask };
};
