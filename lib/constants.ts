export interface GameConfig {
  blockSize: number;
  soldierRadius: number;
  projectileRadius: number;
  physicsSpeed: number;
  velocityMultiplier: number;
  maxSpeed: number;
  minDamageVelocity: number;
  damageMultiplier: number;
  blockMaxHealth: number;
  steelMaxHealth: number;
  stoneMaxHealth: number;
  glassMaxHealth: number;
  colors: {
    skyTop: string;
    skyBottom: string;
    ground: string;
    groundDark: string;
    wood: string;
    woodStroke: string;
    steel: string;
    steelStroke: string;
    stone: string;
    stoneStroke: string;
    glass: string;
    glassStroke: string;
    redTeam: string;
    blueTeam: string;
    projectile: string;
  };
}

export const CONFIG = {
  blockSize: 40,
  soldierRadius: 15,
  projectileRadius: 10,
  physicsSpeed: 0.3,
  velocityMultiplier: 0.18,
  maxSpeed: 50,
  minDamageVelocity: 4,
  damageMultiplier: 4.0,
  blockMaxHealth: 100,
  steelMaxHealth: 250,
  stoneMaxHealth: 250,
  glassMaxHealth: 40,
  colors: {
    skyTop: "#1E90FF",
    skyBottom: "#87CEEB",
    ground: "#5D9634",
    groundDark: "#436e24",
    wood: "#D2B48C",
    woodStroke: "#8B4513",
    steel: "#708090",
    steelStroke: "#2F4F4F",
    stone: "#696969",
    stoneStroke: "#363636",
    glass: "#E0F2F1",
    glassStroke: "#80CBC4",
    redTeam: "#ff6b6b",
    blueTeam: "#4ecdc4",
    projectile: "#333",
  },
} satisfies GameConfig;

export const CAT = {
  GROUND: 0x0001,
  RED_TEAM: 0x0002,
  BLUE_TEAM: 0x0004,
  RED_PROJ: 0x0008,
  BLUE_PROJ: 0x0010,
} as const;

export type CollisionCategory = (typeof CAT)[keyof typeof CAT];
