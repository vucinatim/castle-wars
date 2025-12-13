import { useGameStore, Cloud, CloudPuff } from "@/store/game-store";

/**
 * Renders the sky gradient background
 */
export const renderSky = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) => {
  const { config } = useGameStore.getState();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, config.colors.skyTop);
  gradient.addColorStop(1, config.colors.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

/**
 * Updates cloud positions and renders them
 */
export const renderClouds = (ctx: CanvasRenderingContext2D) => {
  const { clouds, width, height } = useGameStore.getState();

  const sortedClouds = [...clouds].sort((a, b) => a.layerIndex - b.layerIndex);

  sortedClouds.forEach((cloud) => {
    // Update position
    cloud.x += cloud.speed;

    const visualWidth = cloud.width * cloud.scale;
    if (cloud.x > width + visualWidth / 2) {
      cloud.x = -(visualWidth / 2) - 100;
      cloud.y = 50 + Math.random() * (height * 0.4);
    }

    // Render
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
};

/**
 * Creates cloud layer configurations
 */
export const CLOUD_LAYERS = [
  { count: 4, speed: 0.15, scale: 0.5, color: "#CBE5F7" },
  { count: 3, speed: 0.3, scale: 0.8, color: "#E1F5FE" },
  { count: 3, speed: 0.5, scale: 1.1, color: "#FFFFFF" },
] as const;

/**
 * Creates a cloud with puffs
 */
export const createCloud = (
  startX: number,
  baseScale: number,
  baseSpeed: number,
  color: string,
  layerIndex: number,
  cloudHeight: number
): Cloud => {
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
};

/**
 * Initializes clouds for the scene
 */
export const initializeClouds = (width: number, height: number): Cloud[] => {
  const clouds: Cloud[] = [];
  CLOUD_LAYERS.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      const startX = Math.random() * width;
      clouds.push(
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
  return clouds;
};
