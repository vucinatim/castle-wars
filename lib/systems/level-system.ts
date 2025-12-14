import Matter from "matter-js";
import { useEngineStore } from "@/store/engine-store";
import { useGameStore, PlayerTeam } from "@/store/game-store";
import { CAT } from "@/lib/constants";
import { SoldierBody } from "@/types/matter";
import {
  createGridSpec,
  cellToWorldCenter,
  getGridCols,
  getGridRows,
} from "@/lib/grid/grid";
import { compileBlueprintToRects } from "@/lib/building/compile-blueprint";
import { CASTLE_BLUEPRINT } from "@/lib/building/blueprints/castle-blueprint";
import { getSoldierSpawnCells } from "@/lib/building/blueprint-utils";
import { translateRects } from "@/lib/building/translate-blueprint";
import { worldifyRects } from "@/lib/building/worldify-rects";
import { getTeamCollision, spawnRectBody } from "@/lib/building/spawn-rects";

const { Bodies, Composite } = Matter;

/**
 * Resets the level with ground and castles
 */
export const resetLevel = () => {
  const engine = useEngineStore.getState().engine;
  if (!engine) return;

  const { width, height, config } = useGameStore.getState();

  Composite.clear(engine.world, false);
  useGameStore.getState().setOccupiedCells({});

  // Create ground
  const ground = Bodies.rectangle(
    width / 2,
    height - config.groundHeight / 2,
    width,
    config.groundHeight,
    {
      isStatic: true,
      label: "ground",
      friction: 0.9,
      frictionStatic: 1.0,
      render: { fillStyle: config.colors.ground },
      collisionFilter: { category: CAT.GROUND, mask: -1 },
    }
  ) as Matter.Body;
  Composite.add(engine.world, ground);

  // Build castles
  const padding = Math.min(260, width * 0.15);
  buildCastle(padding, height - config.groundHeight, "red");
  buildCastle(width - padding, height - config.groundHeight, "blue");
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

  const createSoldier = (x: number, y: number) => {
    const { config } = useGameStore.getState();
    const collision = getTeamCollision(team);
    return Bodies.circle(x, y, config.soldierRadius, {
      label: "soldier",
      friction: 0.5,
      restitution: 0.2,
      density: 0.005,
      render: { fillStyle: team },
      team,
      collisionFilter: collision,
    }) as SoldierBody;
  };

  const { width, height, config } = useGameStore.getState();
  const grid = createGridSpec(width, height, config.blockSize);

  const bpRows =
    team === "blue"
      ? CASTLE_BLUEPRINT.rows.map((r) => r.split("").reverse().join(""))
      : CASTLE_BLUEPRINT.rows;
  const bpH = bpRows.length;
  const bpW = bpRows[0]?.length ?? 0;

  const anchorXCell = Math.round(centerX / config.blockSize - 0.5);
  const anchorBottomYCell = Math.floor(groundY / config.blockSize) - 1;
  const cols = getGridCols(grid);
  const rows = getGridRows(grid);

  const unclampedTopLeftX = anchorXCell - Math.floor(bpW / 2);
  const unclampedTopLeftY = anchorBottomYCell - (bpH - 1);
  const topLeftCellX =
    bpW <= cols ? Math.max(0, Math.min(cols - bpW, unclampedTopLeftX)) : 0;
  const topLeftCellY =
    bpH <= rows ? Math.max(0, Math.min(rows - bpH, unclampedTopLeftY)) : 0;

  const rectsLocal = compileBlueprintToRects(bpRows);
  const rectsGlobal = translateRects(rectsLocal, topLeftCellX, topLeftCellY);
  const placedRects = worldifyRects(grid, rectsGlobal);

  const collision = getTeamCollision(team);
  const bodies: Matter.Body[] = [];

  for (const r of placedRects) {
    bodies.push(
      spawnRectBody({
        worldX: r.worldX,
        worldY: r.worldY,
        worldW: r.worldW,
        worldH: r.worldH,
        material: r.material,
        team,
        config,
        collision,
        gridCells: r.gridCells,
      })
    );
  }

  const localSpawns = getSoldierSpawnCells(bpRows);
  for (const spawn of localSpawns) {
    const cell = { x: topLeftCellX + spawn.x, y: topLeftCellY + spawn.y };
    const pos = cellToWorldCenter(grid, cell);
    bodies.push(createSoldier(pos.x, pos.y));
  }

  for (const r of placedRects) {
    useGameStore
      .getState()
      .occupyCells(r.gridCells, { material: r.material, team });
  }

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
    const { config } = useGameStore.getState();
    Matter.Body.setPosition(ground, {
      x: width / 2,
      y: height - config.groundHeight / 2,
    });
  }
};
