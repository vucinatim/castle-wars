import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore, PlayerTeam } from "@/store/game-store";
import { CONFIG, CAT } from "@/lib/constants";
import { BlockBody, SoldierBody } from "@/types/matter";

const { Bodies, Composite } = Matter;

/**
 * Resets the level with ground and castles
 */
export const resetLevel = () => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { width, height } = useGameStore.getState();

  Composite.clear(engine.world, false);

  // Create ground
  const ground = Bodies.rectangle(width / 2, height - 25, width, 50, {
    isStatic: true,
    label: "ground",
    friction: 1,
    render: { fillStyle: CONFIG.colors.ground },
    collisionFilter: { category: CAT.GROUND, mask: -1 },
  }) as Matter.Body;
  Composite.add(engine.world, ground);

  // Build castles
  const padding = Math.min(400, width * 0.25);
  buildCastle(padding, height - 50, "red");
  buildCastle(width - padding, height - 50, "blue");
};

/**
 * Builds a castle for the specified team
 */
export const buildCastle = (
  centerX: number,
  groundY: number,
  team: PlayerTeam
) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const isRed = team === "red";
  const myCategory = isRed ? CAT.RED_TEAM : CAT.BLUE_TEAM;
  const myMask =
    CAT.GROUND |
    CAT.RED_TEAM |
    CAT.BLUE_TEAM |
    (isRed ? CAT.BLUE_PROJ : CAT.RED_PROJ);

  const createBlock = (
    x: number,
    y: number,
    w: number,
    h: number,
    material: "wood" | "steel" | "stone" | "glass"
  ) => {
    if (material === "stone") {
      const stoneBody = Bodies.rectangle(x, y, w, h, {
        label: "stone",
        isStatic: true,
        friction: 0.8,
        restitution: 0.1,
        density: 0.01,
        render: {
          fillStyle: CONFIG.colors.stone,
          strokeStyle: CONFIG.colors.stoneStroke,
        },
        team,
        health: CONFIG.stoneMaxHealth,
        maxHealth: CONFIG.stoneMaxHealth,
        collisionFilter: { category: myCategory, mask: myMask },
      }) as BlockBody;

      // Generate stone texture pattern
      const textureSpots: Array<{ x: number; y: number; size: number }> = [];
      const seed = x * 1000 + y;
      let seedValue = seed;
      for (let i = 0; i < 8; i++) {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        const r1 = seedValue / 233280;
        seedValue = (seedValue * 9301 + 49297) % 233280;
        const r2 = seedValue / 233280;
        seedValue = (seedValue * 9301 + 49297) % 233280;
        const r3 = seedValue / 233280;

        textureSpots.push({
          x: (r1 - 0.5) * w * 0.8,
          y: (r2 - 0.5) * h * 0.8,
          size: 2 + r3 * 3,
        });
      }
      stoneBody.stoneTexture = textureSpots;

      return stoneBody;
    } else if (material === "steel") {
      return Bodies.rectangle(x, y, w, h, {
        label: "steel",
        isStatic: false,
        friction: 0.8,
        restitution: 0.1,
        density: 0.05,
        render: {
          fillStyle: CONFIG.colors.steel,
          strokeStyle: CONFIG.colors.steelStroke,
        },
        team,
        health: CONFIG.steelMaxHealth,
        maxHealth: CONFIG.steelMaxHealth,
        collisionFilter: { category: myCategory, mask: myMask },
      }) as BlockBody;
    } else if (material === "glass") {
      return Bodies.rectangle(x, y, w, h, {
        label: "glass",
        isStatic: false,
        friction: 0.05,
        restitution: 0.8,
        density: 0.0015,
        render: {
          fillStyle: CONFIG.colors.glass,
          strokeStyle: CONFIG.colors.glassStroke,
        },
        team,
        health: CONFIG.glassMaxHealth,
        maxHealth: CONFIG.glassMaxHealth,
        collisionFilter: { category: myCategory, mask: myMask },
      }) as BlockBody;
    } else {
      return Bodies.rectangle(x, y, w, h, {
        label: "block",
        isStatic: false,
        friction: 0.8,
        restitution: 0.1,
        density: 0.002,
        render: {
          fillStyle: CONFIG.colors.wood,
          strokeStyle: CONFIG.colors.woodStroke,
        },
        team,
        health: CONFIG.blockMaxHealth,
        maxHealth: CONFIG.blockMaxHealth,
        collisionFilter: { category: myCategory, mask: myMask },
      }) as BlockBody;
    }
  };

  const createSoldier = (x: number, y: number) => {
    return Bodies.circle(x, y, CONFIG.soldierRadius, {
      label: "soldier",
      friction: 0.5,
      restitution: 0.2,
      density: 0.005,
      render: { fillStyle: team },
      team,
      collisionFilter: { category: myCategory, mask: myMask },
    }) as SoldierBody;
  };

  const bodies: Matter.Body[] = [];

  // === FOUNDATION & GROUND FLOOR ===
  const foundationW = 280;
  const pillarW = 25;
  const pillarH = 120;
  const beamH = 18;

  const leftPillarX = centerX - foundationW / 2;
  const rightPillarX = centerX + foundationW / 2;
  const centerPillarX = centerX;

  bodies.push(
    createBlock(leftPillarX, groundY - pillarH / 2, pillarW, pillarH, "steel")
  );
  bodies.push(
    createBlock(rightPillarX, groundY - pillarH / 2, pillarW, pillarH, "steel")
  );
  bodies.push(
    createBlock(centerPillarX, groundY - pillarH / 2, pillarW, pillarH, "steel")
  );

  const foundationBeamY = groundY - pillarH - beamH / 2;
  bodies.push(
    createBlock(centerX, foundationBeamY, foundationW + 40, beamH, "stone")
  );

  const boxS = 45;
  bodies.push(
    createBlock(centerX - 80, groundY - boxS / 2, boxS, boxS, "wood")
  );
  bodies.push(
    createBlock(centerX - 40, groundY - boxS / 2, boxS, boxS, "wood")
  );
  bodies.push(
    createBlock(centerX + 40, groundY - boxS / 2, boxS, boxS, "wood")
  );
  bodies.push(
    createBlock(centerX + 80, groundY - boxS / 2, boxS, boxS, "wood")
  );

  // === FIRST PLATFORM ===
  const platform1Height = 100;
  const platform1Y = foundationBeamY - beamH / 2 - platform1Height / 2;
  const platform1Width = 120;
  const platform1X = centerX - foundationW / 4;

  bodies.push(
    createBlock(
      platform1X - 40,
      foundationBeamY - beamH / 2 - platform1Height / 4,
      20,
      platform1Height / 2,
      "steel"
    )
  );
  bodies.push(
    createBlock(
      platform1X + 40,
      foundationBeamY - beamH / 2 - platform1Height / 4,
      20,
      platform1Height / 2,
      "steel"
    )
  );
  bodies.push(
    createBlock(platform1X, platform1Y, platform1Width, beamH, "stone")
  );

  // === SECOND PLATFORM ===
  const platform2Height = 100;
  const platform2Y = foundationBeamY - beamH / 2 - platform2Height / 2;
  const platform2Width = 120;
  const platform2X = centerX + foundationW / 4;

  bodies.push(
    createBlock(
      platform2X - 40,
      foundationBeamY - beamH / 2 - platform2Height / 4,
      20,
      platform2Height / 2,
      "steel"
    )
  );
  bodies.push(
    createBlock(
      platform2X + 40,
      foundationBeamY - beamH / 2 - platform2Height / 4,
      20,
      platform2Height / 2,
      "steel"
    )
  );
  bodies.push(
    createBlock(platform2X, platform2Y, platform2Width, beamH, "stone")
  );

  // === CENTER TOWER ===
  const towerPillarHeight = 130;
  const towerPillarY = foundationBeamY - beamH / 2 - towerPillarHeight / 2;
  const towerPillarW = 20;

  bodies.push(
    createBlock(
      centerX - 60,
      towerPillarY,
      towerPillarW,
      towerPillarHeight,
      "steel"
    )
  );
  bodies.push(
    createBlock(
      centerX + 60,
      towerPillarY,
      towerPillarW,
      towerPillarHeight,
      "steel"
    )
  );

  const towerBaseBeamY =
    foundationBeamY - beamH / 2 - towerPillarHeight - beamH / 2;
  bodies.push(
    createBlock(centerX, towerBaseBeamY, foundationW / 2 + 20, beamH, "stone")
  );

  const towerWallH = 90;
  const towerWallW = 25;
  const towerBaseY = towerBaseBeamY - beamH / 2 - towerWallH / 2;

  bodies.push(
    createBlock(
      centerX - foundationW / 4,
      towerBaseY,
      towerWallW,
      towerWallH,
      "glass"
    )
  );
  bodies.push(
    createBlock(
      centerX + foundationW / 4,
      towerBaseY,
      towerWallW,
      towerWallH,
      "glass"
    )
  );

  const platform3Y = towerBaseY - towerWallH / 2 - beamH / 2;
  const platform3Width = foundationW / 2;
  bodies.push(createBlock(centerX, platform3Y, platform3Width, beamH, "stone"));

  // === TOP PLATFORM ===
  const topWallH = 60;
  const topWallY = platform3Y - beamH / 2 - topWallH / 2;

  bodies.push(createBlock(centerX - 70, topWallY, 25, topWallH, "glass"));
  bodies.push(createBlock(centerX + 70, topWallY, 25, topWallH, "glass"));
  bodies.push(
    createBlock(centerX, platform3Y - beamH / 2 - 15, 40, 15, "glass")
  );

  // === SOLDIERS ===
  const soldier1Y = platform1Y - beamH / 2 - 25 - CONFIG.soldierRadius;
  const soldier1 = createSoldier(platform1X, soldier1Y);
  bodies.push(soldier1);

  const soldier2Y = platform3Y - beamH / 2 - 30 - CONFIG.soldierRadius;
  const soldier2 = createSoldier(centerX, soldier2Y);
  bodies.push(soldier2);

  const soldier3Y = platform2Y - beamH / 2 - 25 - CONFIG.soldierRadius;
  const soldier3 = createSoldier(platform2X, soldier3Y);
  bodies.push(soldier3);

  // === ROOF ===
  const roofHeight = 70;
  const roofWidth = 180;
  const roofY = topWallY - topWallH / 2 - roofHeight / 2 - 5;

  const roof = Bodies.trapezoid(centerX, roofY, roofWidth, roofHeight, 0.5, {
    label: "block",
    friction: 1,
    render: {
      fillStyle: CONFIG.colors.wood,
      strokeStyle: CONFIG.colors.woodStroke,
    },
    team,
    health: 100,
    maxHealth: 100,
    collisionFilter: { category: myCategory, mask: myMask },
  }) as BlockBody;
  bodies.push(roof);

  // === ADDITIONAL DEFENSIVE BLOCKS ===
  bodies.push(createBlock(centerX - 140, groundY - 60, 30, 40, "wood"));
  bodies.push(createBlock(centerX + 140, groundY - 60, 30, 40, "wood"));

  Composite.add(engine.world, bodies);
};

/**
 * Updates ground position on resize
 */
export const updateGroundPosition = (width: number, height: number) => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const ground = engine.world.bodies.find((b) => b.label === "ground");
  if (ground) {
    Matter.Body.setPosition(ground, { x: width / 2, y: height - 25 });
  }
};
