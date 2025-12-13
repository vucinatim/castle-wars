"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import {
  useGameStore,
  GameStoreState,
  InputState,
  Cloud,
  FloatingText,
  GameConfig,
  CloudPuff,
  PlayerTeam,
} from "@/store/gameStore";
import { CONFIG, CAT } from "@/lib/constants";
import {
  BlockBody,
  SoldierBody,
  isBlockBody,
  isSoldierBody,
} from "@/types/matter";

const { Engine, Bodies, Composite, Body, Vector, Events } = Matter;

// Cloud creation function (moved outside component to prevent recreation on each render)
function createCloud(
  startX: number,
  baseScale: number,
  baseSpeed: number,
  color: string,
  layerIndex: number,
  cloudHeight: number
) {
  const puffs: CloudPuff[] = [];
  const cloudWidth = 200 + Math.random() * 200;
  const puffRadiusBase = 40;
  const puffsInBase = Math.ceil(cloudWidth / (puffRadiusBase * 1.2));

  for (let i = 0; i < puffsInBase; i++) {
    const xPos = i * (puffRadiusBase * 1.2) - cloudWidth / 2;
    puffs.push({
      x: xPos,
      y: 0,
      radius: puffRadiusBase + Math.random() * 20,
    });
  }

  const puffsInTop = Math.floor(puffsInBase / 1.5);
  for (let i = 0; i < puffsInTop; i++) {
    const xPos =
      i * (puffRadiusBase * 1.2) - cloudWidth / 3 + Math.random() * 20;
    puffs.push({
      x: xPos,
      y: -puffRadiusBase * 0.8,
      radius: puffRadiusBase * 1.2 + Math.random() * 25,
    });
  }

  return {
    x: startX,
    y: 50 + Math.random() * (cloudHeight * 0.4),
    scale: baseScale * (0.9 + Math.random() * 0.2),
    speed: baseSpeed * (0.9 + Math.random() * 0.2),
    color,
    layerIndex,
    width: cloudWidth,
    puffs,
  };
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ghostEngineRef = useRef<Matter.Engine | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { width, height, setDimensions, setClouds } = useGameStore();

  // Initialize clouds
  useEffect(() => {
    if (width === 0 || height === 0) return;

    const layers = [
      { count: 4, speed: 0.15, scale: 0.5, color: "#CBE5F7" },
      { count: 3, speed: 0.3, scale: 0.8, color: "#E1F5FE" },
      { count: 3, speed: 0.5, scale: 1.1, color: "#FFFFFF" },
    ];

    const newClouds: ReturnType<typeof createCloud>[] = [];
    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        const startX = Math.random() * width;
        newClouds.push(
          createCloud(
            startX,
            layer.scale,
            layer.speed,
            layer.color,
            layerIndex,
            height
          )
        );
      }
    });

    setClouds(newClouds);
  }, [width, height, setClouds]);

  // Initialize Matter.js engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create engine
    const engine = Engine.create();
    engine.world.gravity.y = 1.5;
    engineRef.current = engine;

    // Create ghost engine for trajectory prediction
    const ghostEngine = Engine.create();
    ghostEngine.world.gravity.y = 1.5;
    ghostEngineRef.current = ghostEngine;

    // Handle collisions
    Events.on(engine, "collisionStart", (event) => {
      const store = useGameStore.getState();
      handleCollisions(event, engine, store.addFloatingText, store.config);
    });

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      setDimensions(w, h);

      // Reinitialize clouds on resize
      const layers = [
        { count: 4, speed: 0.15, scale: 0.5, color: "#CBE5F7" },
        { count: 3, speed: 0.3, scale: 0.8, color: "#E1F5FE" },
        { count: 3, speed: 0.5, scale: 1.1, color: "#FFFFFF" },
      ];
      const newClouds: Cloud[] = [];
      layers.forEach((layer, layerIndex) => {
        for (let i = 0; i < layer.count; i++) {
          const startX = Math.random() * w;
          newClouds.push(
            createCloud(
              startX,
              layer.scale,
              layer.speed,
              layer.color,
              layerIndex,
              h
            )
          );
        }
      });
      setClouds(newClouds);

      const ground = engine.world.bodies.find((b) => b.label === "ground");
      if (ground) {
        Body.setPosition(ground, { x: w / 2, y: h - 25 });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        const store = useGameStore.getState();
        resetLevel(engine, store.width, store.height);
        store.resetGame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Reset game event listener
    const handleReset = () => {
      const store = useGameStore.getState();
      resetLevel(engine, store.width, store.height);
      store.resetGame();
    };
    window.addEventListener("resetGame", handleReset);

    // Initialize level
    const initialStore = useGameStore.getState();
    resetLevel(engine, initialStore.width, initialStore.height);

    // Input handlers - using store.getState() to access current values
    const handleMouseDown = (e: MouseEvent) => {
      const store = useGameStore.getState();
      const soldier = getCurrentSoldier(engine, store.currentPlayer);
      if (!soldier) return;

      // Allow dragging anywhere on the canvas
      store.setInput({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const store = useGameStore.getState();
      if (store.input.isDragging) {
        store.setInput({
          currentX: e.clientX,
          currentY: e.clientY,
        });
      }
    };

    const handleMouseUp = () => {
      const store = useGameStore.getState();
      if (store.input.isDragging) {
        const soldier = getCurrentSoldier(engine, store.currentPlayer);
        if (soldier) {
          fireProjectile(
            engine,
            soldier,
            store.input.startX,
            store.input.startY,
            store.input.currentX,
            store.input.currentY,
            store.currentPlayer,
            store.switchPlayer
          );
        }
        store.resetInput();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const store = useGameStore.getState();
      const soldier = getCurrentSoldier(engine, store.currentPlayer);
      if (!soldier) return;

      const touch = e.touches[0];
      // Allow dragging anywhere on the canvas
      store.setInput({
        isDragging: true,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const store = useGameStore.getState();
      if (store.input.isDragging && e.touches[0]) {
        store.setInput({
          currentX: e.touches[0].clientX,
          currentY: e.touches[0].clientY,
        });
      }
    };

    const handleTouchEnd = () => {
      const store = useGameStore.getState();
      if (store.input.isDragging) {
        const soldier = getCurrentSoldier(engine, store.currentPlayer);
        if (soldier) {
          fireProjectile(
            engine,
            soldier,
            store.input.startX,
            store.input.startY,
            store.input.currentX,
            store.input.currentY,
            store.currentPlayer,
            store.switchPlayer
          );
        }
        store.resetInput();
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    // Game loop
    const gameLoop = () => {
      if (!engine || !ctx) return;

      const store = useGameStore.getState();
      Engine.update(engine, (1000 / 60) * store.config.physicsSpeed);

      // Cleanup dead blocks
      const bodies = Composite.allBodies(engine.world);
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (isBlockBody(b) && b.health <= 0) {
          Composite.remove(engine.world, b);
        }
      }

      // Update floating texts
      store.updateFloatingTexts();

      // Render
      render(ctx, engine, ghostEngine, canvas, store);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resetGame", handleReset);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      Composite.clear(engine.world, false);
      Composite.clear(ghostEngine.world, false);
    };
  }, [setDimensions, setClouds]);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{
        background: "linear-gradient(to bottom, #1E90FF, #87CEEB)",
        touchAction: "none",
        userSelect: "none",
      }}
    />
  );
}

function resetLevel(engine: Matter.Engine, width: number, height: number) {
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

  // Build castles - increased padding for larger castles
  const padding = Math.min(400, width * 0.25);
  buildBiggerCastle(padding, height - 50, "red", engine);
  buildBiggerCastle(width - padding, height - 50, "blue", engine);
}

function buildBiggerCastle(
  centerX: number,
  groundY: number,
  team: PlayerTeam,
  engine: Matter.Engine
) {
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
      // Stone: static, sturdy, same as old steel characteristics
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

      // Generate stone texture pattern once and store it
      const textureSpots: Array<{ x: number; y: number; size: number }> = [];
      // Use position as seed for deterministic random pattern
      const seed = x * 1000 + y;
      let seedValue = seed;
      for (let i = 0; i < 8; i++) {
        // Simple seeded random
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
      // Steel: affected by gravity but heavy with high inertia (hard to move)
      return Bodies.rectangle(x, y, w, h, {
        label: "steel",
        isStatic: false, // Affected by gravity
        friction: 0.8,
        restitution: 0.1,
        density: 0.05, // Much higher density for high inertia (5x heavier than stone) - makes it very hard to move/tip
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
        isStatic: false, // Glass is affected by gravity
        friction: 0.05, // Very low friction - ball slides through
        restitution: 0.8, // High bounciness - ball keeps momentum
        density: 0.0015, // Lighter than wood
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
      // wood
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
  const foundationW = 280; // Wider base
  const pillarW = 25;
  const pillarH = 120;
  const beamH = 18;

  // Main foundation pillars (steel - vertical)
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

  // Foundation beam (stone - horizontal)
  const foundationBeamY = groundY - pillarH - beamH / 2;
  bodies.push(
    createBlock(centerX, foundationBeamY, foundationW + 40, beamH, "stone")
  );

  // Ground floor defensive blocks
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

  // === FIRST PLATFORM (Lowest - Left Platform) ===
  const platform1Height = 100;
  const platform1Y = foundationBeamY - beamH / 2 - platform1Height / 2;
  const platform1Width = 120;
  const platform1X = centerX - foundationW / 4;

  // Support for platform 1 (steel - vertical)
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
  // Platform 1 beam (stone - horizontal)
  bodies.push(
    createBlock(platform1X, platform1Y, platform1Width, beamH, "stone")
  );

  // === SECOND PLATFORM (Middle - Right Platform) ===
  const platform2Height = 100;
  const platform2Y = foundationBeamY - beamH / 2 - platform2Height / 2;
  const platform2Width = 120;
  const platform2X = centerX + foundationW / 4;

  // Support for platform 2 (steel - vertical)
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
  // Platform 2 beam (stone - horizontal)
  bodies.push(
    createBlock(platform2X, platform2Y, platform2Width, beamH, "stone")
  );

  // === CENTER TOWER ===
  // Support pillars from foundation to tower level
  const towerPillarHeight = 130;
  const towerPillarY = foundationBeamY - beamH / 2 - towerPillarHeight / 2;

  // Center support pillars (steel - vertical) - connect foundation to tower
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

  // Tower base beam (stone - horizontal) - supports the tower walls
  const towerBaseBeamY =
    foundationBeamY - beamH / 2 - towerPillarHeight - beamH / 2;
  bodies.push(
    createBlock(centerX, towerBaseBeamY, foundationW / 2 + 20, beamH, "stone")
  );

  // Center tower walls - positioned on top of the tower base beam (glass)
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

  // Center tower beam (Platform 3 - Top Center) (stone - horizontal)
  const platform3Y = towerBaseY - towerWallH / 2 - beamH / 2;
  const platform3Width = foundationW / 2;
  bodies.push(createBlock(centerX, platform3Y, platform3Width, beamH, "stone"));

  // === TOP PLATFORM ===
  const topWallH = 60;
  const topWallY = platform3Y - beamH / 2 - topWallH / 2;

  // Top walls - positioned to avoid soldiers (glass)
  bodies.push(createBlock(centerX - 70, topWallY, 25, topWallH, "glass"));
  bodies.push(createBlock(centerX + 70, topWallY, 25, topWallH, "glass"));
  // Center decorative block - small enough to not interfere (glass)
  bodies.push(
    createBlock(centerX, platform3Y - beamH / 2 - 15, 40, 15, "glass")
  );

  // === SOLDIERS - 3 on different platforms ===
  // Soldier 1 on left platform (Platform 1)
  const soldier1Y = platform1Y - beamH / 2 - 25 - CONFIG.soldierRadius;
  const soldier1 = createSoldier(platform1X, soldier1Y);
  bodies.push(soldier1);

  // Soldier 2 on center platform (Platform 3)
  const soldier2Y = platform3Y - beamH / 2 - 30 - CONFIG.soldierRadius;
  const soldier2 = createSoldier(centerX, soldier2Y);
  bodies.push(soldier2);

  // Soldier 3 on right platform (Platform 2)
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
  // Side defensive structures
  bodies.push(createBlock(centerX - 140, groundY - 60, 30, 40, "wood"));
  bodies.push(createBlock(centerX + 140, groundY - 60, 30, 40, "wood"));

  Composite.add(engine.world, bodies);
}

function getCurrentSoldier(
  engine: Matter.Engine,
  currentPlayer: PlayerTeam
): SoldierBody | undefined {
  const bodies = Composite.allBodies(engine.world);
  const soldier = bodies.find(
    (b) => isSoldierBody(b) && b.team === currentPlayer
  );
  return soldier as SoldierBody | undefined;
}

function fireProjectile(
  engine: Matter.Engine,
  soldier: Matter.Body,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  currentPlayer: PlayerTeam,
  switchPlayer: () => void
) {
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

  switchPlayer();

  setTimeout(() => {
    Composite.remove(engine.world, ball);
  }, 5000);
}

function handleCollisions(
  event: Matter.IEventCollision<Matter.Engine>,
  engine: Matter.Engine,
  addFloatingText: (text: FloatingText) => void,
  config: GameConfig
) {
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
}

function applyDamage(
  body: Matter.Body,
  damage: number,
  addFloatingText: (text: FloatingText) => void
) {
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
}

function render(
  ctx: CanvasRenderingContext2D,
  engine: Matter.Engine,
  ghostEngine: Matter.Engine,
  canvas: HTMLCanvasElement,
  store: GameStoreState
) {
  const { input, currentPlayer, clouds, floatingTexts, config, width, height } =
    store;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, config.colors.skyTop);
  gradient.addColorStop(1, config.colors.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw clouds
  updateAndDrawClouds(ctx, clouds, width, height);

  // Highlight active soldier
  const activeSoldier = getCurrentSoldier(engine, currentPlayer);
  if (activeSoldier) {
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
  }

  // Draw ground
  const ground = engine.world.bodies.find((b) => b.label === "ground");
  if (ground) {
    ctx.save();
    ctx.translate(ground.position.x, ground.position.y);
    ctx.fillStyle = config.colors.ground;
    const w = width;
    const h = 50;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = config.colors.groundDark;
    ctx.fillRect(-w / 2, -h / 2, w, 5);
    ctx.restore();
  }

  // Draw bodies - separate glass blocks to draw last for transparency
  const activeBodies = Composite.allBodies(engine.world);
  const glassBodies: Matter.Body[] = [];
  const otherBodies: Matter.Body[] = [];

  // Separate glass from other bodies
  activeBodies.forEach((body) => {
    if (body.label === "ground") return;
    if (isBlockBody(body) && body.label === "glass") {
      glassBodies.push(body);
    } else {
      otherBodies.push(body);
    }
  });

  ctx.lineWidth = 2;

  // Draw non-glass bodies first
  otherBodies.forEach((body) => {
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    if (isBlockBody(body)) {
      const renderProps = body.render || {};
      ctx.fillStyle = renderProps.fillStyle || config.colors.wood;
      ctx.strokeStyle = renderProps.strokeStyle || config.colors.woodStroke;

      ctx.beginPath();
      const vertices = body.vertices;
      ctx.moveTo(
        vertices[0].x - body.position.x,
        vertices[0].y - body.position.y
      );
      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(
          vertices[j].x - body.position.x,
          vertices[j].y - body.position.y
        );
      }
      ctx.lineTo(
        vertices[0].x - body.position.x,
        vertices[0].y - body.position.y
      );
      ctx.fill();
      ctx.stroke();

      // Texture details for steel
      if (body.label === "steel") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        const b = body.bounds;
        const w = b.max.x - b.min.x;
        const h = b.max.y - b.min.y;
        const off = 5;
        ctx.beginPath();
        ctx.arc(-w / 2 + off, -h / 2 + off, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 2 - off, -h / 2 + off, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-w / 2 + off, h / 2 - off, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 2 - off, h / 2 - off, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = renderProps.fillStyle || config.colors.steel;
      }

      // Texture details for stone (rough surface pattern)
      if (body.label === "stone") {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        // Use pre-generated texture pattern stored on the body
        const textureSpots = body.stoneTexture;
        if (textureSpots) {
          textureSpots.forEach(
            (spot: { x: number; y: number; size: number }) => {
              ctx.beginPath();
              ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
              ctx.fill();
            }
          );
        }
        ctx.fillStyle = renderProps.fillStyle || config.colors.stone;
      }

      // Crack visuals for non-glass blocks
      if (body.health !== undefined && body.maxHealth !== undefined) {
        const healthRatio = body.health / body.maxHealth;
        if (healthRatio < 1) {
          if (body.label === "steel" || body.label === "stone") {
            ctx.strokeStyle = "#1a1a1a";
          } else {
            ctx.strokeStyle = "#5c4033";
          }
          ctx.lineWidth = 2;
          ctx.beginPath();

          const b = body.bounds;
          const w = b.max.x - b.min.x;
          const h = b.max.y - b.min.y;

          if (healthRatio < 0.8) {
            ctx.moveTo(-w / 4, -h / 4);
            ctx.lineTo(0, 0);
          }
          if (healthRatio < 0.5) {
            ctx.moveTo(w / 3, h / 3);
            ctx.lineTo(0, 0);
            ctx.lineTo(-w / 3, h / 4);
          }
          if (healthRatio < 0.3) {
            ctx.moveTo(-w / 3, -h / 3);
            ctx.lineTo(-w / 2, 0);
          }
          ctx.stroke();
        }
      }
    } else if (isSoldierBody(body)) {
      const teamColor =
        body.team === "red" ? config.colors.redTeam : config.colors.blueTeam;
      ctx.beginPath();
      ctx.arc(0, 0, config.soldierRadius, 0, Math.PI * 2);
      ctx.fillStyle = teamColor;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(-5, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(-5, -2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (body.label === "projectile") {
      ctx.beginPath();
      ctx.arc(0, 0, config.projectileRadius, 0, Math.PI * 2);
      ctx.fillStyle = config.colors.projectile;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.stroke();
    }

    ctx.restore();
  });

  // Draw glass blocks last with true transparency (so they appear see-through)
  glassBodies.forEach((body) => {
    if (!isBlockBody(body)) return;

    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    const renderProps = body.render || {};

    // Draw glass with very low opacity for transparency
    ctx.beginPath();
    const vertices = body.vertices;
    ctx.moveTo(
      vertices[0].x - body.position.x,
      vertices[0].y - body.position.y
    );
    for (let j = 1; j < vertices.length; j += 1) {
      ctx.lineTo(
        vertices[j].x - body.position.x,
        vertices[j].y - body.position.y
      );
    }
    ctx.lineTo(
      vertices[0].x - body.position.x,
      vertices[0].y - body.position.y
    );

    // Very transparent fill - you can see through it
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = renderProps.fillStyle || config.colors.glass;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Visible stroke to show glass edges
    ctx.strokeStyle = renderProps.strokeStyle || config.colors.glassStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add glass highlight effect
    const b = body.bounds;
    const w = b.max.x - b.min.x;
    const h = b.max.y - b.min.y;

    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 4, -h / 2);
    ctx.lineTo(w / 5, h / 3);
    ctx.lineTo(-w / 2, h / 3);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 4, h / 3);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Crack visuals for glass
    if (body.health !== undefined && body.maxHealth !== undefined) {
      const healthRatio = body.health / body.maxHealth;
      if (healthRatio < 1) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (healthRatio < 0.8) {
          ctx.moveTo(-w / 4, -h / 4);
          ctx.lineTo(0, 0);
        }
        if (healthRatio < 0.5) {
          ctx.moveTo(w / 3, h / 3);
          ctx.lineTo(0, 0);
          ctx.lineTo(-w / 3, h / 4);
        }
        if (healthRatio < 0.3) {
          ctx.moveTo(-w / 3, -h / 3);
          ctx.lineTo(-w / 2, 0);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  });

  // Draw floating texts
  updateAndDrawFloatingTexts(ctx, floatingTexts);

  // Draw aiming line
  if (input.isDragging && activeSoldier) {
    drawAimingLine(
      ctx,
      activeSoldier,
      input,
      config,
      engine,
      ghostEngine,
      width,
      height
    );
  }

  // Update telemetry
  updateTelemetry(engine, width, height);
}

function updateAndDrawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  width: number,
  height: number
) {
  const sortedClouds = [...clouds].sort((a, b) => a.layerIndex - b.layerIndex);

  sortedClouds.forEach((cloud) => {
    cloud.x += cloud.speed;

    const visualWidth = cloud.width * cloud.scale;
    if (cloud.x > width + visualWidth / 2) {
      cloud.x = -(visualWidth / 2) - 100;
      cloud.y = 50 + Math.random() * (height * 0.4);
    }

    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    ctx.scale(cloud.scale, cloud.scale);
    ctx.fillStyle = cloud.color;

    cloud.puffs.forEach((puff: CloudPuff) => {
      ctx.beginPath();
      ctx.moveTo(puff.x + puff.radius, puff.y);
      ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  });
}

function updateAndDrawFloatingTexts(
  ctx: CanvasRenderingContext2D,
  floatingTexts: FloatingText[]
) {
  ctx.textAlign = "center";

  floatingTexts.forEach((ft) => {
    const alpha = Math.min(1.0, ft.life * 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${ft.size}px Arial`;
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;

    ctx.strokeText(ft.text.toString(), ft.x, ft.y);
    ctx.fillText(ft.text.toString(), ft.x, ft.y);

    ctx.restore();
  });
}

function drawAimingLine(
  ctx: CanvasRenderingContext2D,
  soldier: Matter.Body,
  input: InputState,
  config: GameConfig,
  engine: Matter.Engine,
  ghostEngine: Matter.Engine,
  width: number,
  height: number
) {
  const startX = soldier.position.x;
  const startY = soldier.position.y - 30;

  const dragX = input.startX - input.currentX;
  const dragY = input.startY - input.currentY;

  let vx = dragX * config.velocityMultiplier;
  let vy = dragY * config.velocityMultiplier;

  const speed = Math.hypot(vx, vy);
  if (speed > config.maxSpeed) {
    const scale = config.maxSpeed / speed;
    vx *= scale;
    vy *= scale;
  }

  // Setup ghost simulation
  Composite.clear(ghostEngine.world, false);

  // Ensure Ghost Gravity matches Real Gravity
  ghostEngine.world.gravity.x = engine.world.gravity.x;
  ghostEngine.world.gravity.y = engine.world.gravity.y;
  ghostEngine.world.gravity.scale = engine.world.gravity.scale;

  const ghostBall = Bodies.circle(startX, startY, config.projectileRadius, {
    density: 0.008,
    frictionAir: 0.005,
    restitution: 0.6,
    friction: 0.005,
  });

  Body.setVelocity(ghostBall, { x: vx, y: vy });
  Composite.add(ghostEngine.world, ghostBall);

  // Draw path
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);

  const simulationSteps = 100;
  const simulationDelta = (1000 / 60) * config.physicsSpeed;

  for (let i = 0; i < simulationSteps; i++) {
    Engine.update(ghostEngine, simulationDelta);
    ctx.lineTo(ghostBall.position.x, ghostBall.position.y);
    if (ghostBall.position.y > height - 25) break;
  }

  ctx.stroke();
  ctx.setLineDash([]);

  // Draw drag line from anchor point to current cursor position
  ctx.beginPath();
  ctx.moveTo(input.startX, input.startY);
  ctx.lineTo(input.currentX, input.currentY);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw drag handle at the starting point (anchor point)
  ctx.beginPath();
  ctx.arc(input.startX, input.startY, 15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function updateTelemetry(engine: Matter.Engine, width: number, height: number) {
  const el = document.getElementById("telemetry");
  if (!el) return;

  const bodies = Composite.allBodies(engine.world);
  const projectile = bodies.find((b) => b.label === "projectile");
  const moving = bodies.filter((b) => b.speed > 0.1 && !b.isStatic).length;

  if (projectile) {
    const speed = projectile.speed.toFixed(1);
    const altitude = (height - projectile.position.y).toFixed(0);
    el.textContent = `Speed: ${speed} | Alt: ${altitude} | Active: ${moving}`;
  } else {
    el.textContent = `Ready | Active: ${moving}`;
  }
}
