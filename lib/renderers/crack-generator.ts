import Matter from "matter-js";
import { BlockBody } from "@/types/matter";

/**
 * Represents a single crack segment with branching points
 */
type CrackSegment = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  branches: CrackSegment[];
};

/**
 * Checks if a point is within the block boundaries using ray casting algorithm
 */
const isPointInBlock = (
  x: number,
  y: number,
  vertices: Matter.Vector[]
): boolean => {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    const dy = yj - yi;
    if (Math.abs(dy) < 1e-10) continue; // Skip horizontal edges

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / dy + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Clips a line segment to stay within block boundaries
 */
const clipLineToBlock = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  vertices: Matter.Vector[]
): { x: number; y: number } | null => {
  // Simple approach: if end point is outside, find intersection with boundary
  if (isPointInBlock(endX, endY, vertices)) {
    return { x: endX, y: endY };
  }

  // Binary search for boundary intersection
  let t0 = 0;
  let t1 = 1;
  const dx = endX - startX;
  const dy = endY - startY;

  for (let iter = 0; iter < 20; iter++) {
    const t = (t0 + t1) / 2;
    const testX = startX + dx * t;
    const testY = startY + dy * t;

    if (isPointInBlock(testX, testY, vertices)) {
      t0 = t;
    } else {
      t1 = t;
    }
  }

  const finalX = startX + dx * t0;
  const finalY = startY + dy * t0;

  if (isPointInBlock(finalX, finalY, vertices)) {
    return { x: finalX, y: finalY };
  }

  return null;
};

/**
 * Generates a seeded random number
 */
const seededRandom = (seed: number): number => {
  return ((seed * 9301 + 49297) % 233280) / 233280;
};

/**
 * Generates a crack pattern for a block based on health and position
 */
export const generateCrackPattern = (
  body: BlockBody,
  healthRatio: number
): CrackSegment[] => {
  if (healthRatio >= 1) return [];

  const b = body.bounds;
  const w = b.max.x - b.min.x;
  const h = b.max.y - b.min.y;
  const centerX = (b.min.x + b.max.x) / 2 - body.position.x;
  const centerY = (b.min.y + b.max.y) / 2 - body.position.y;

  // Create seed from body position for consistency
  const seed = body.position.x * 1000 + body.position.y;
  let seedValue = seed;

  // Transform vertices to local coordinates
  const localVertices = body.vertices.map((v) => ({
    x: v.x - body.position.x,
    y: v.y - body.position.y,
  }));

  const cracks: CrackSegment[] = [];
  const damageLevel = 1 - healthRatio;

  // Number of main cracks based on damage
  const mainCrackCount = Math.floor(2 + damageLevel * 4);
  const maxDepth = Math.floor(2 + damageLevel * 2);

  for (let i = 0; i < mainCrackCount; i++) {
    seedValue = (seedValue * 9301 + 49297) % 233280;
    const r1 = seededRandom(seedValue);
    seedValue = (seedValue * 9301 + 49297) % 233280;
    const r2 = seededRandom(seedValue);

    // Start point - prefer edges but can be anywhere
    let startX: number;
    let startY: number;

    if (r1 < 0.6) {
      // Start from edge
      const edge = Math.floor(r2 * 4);
      seedValue = (seedValue * 9301 + 49297) % 233280;
      const edgePos = seededRandom(seedValue);

      switch (edge) {
        case 0: // top
          startX = -w / 2 + edgePos * w;
          startY = -h / 2;
          break;
        case 1: // right
          startX = w / 2;
          startY = -h / 2 + edgePos * h;
          break;
        case 2: // bottom
          startX = -w / 2 + edgePos * w;
          startY = h / 2;
          break;
        default: // left
          startX = -w / 2;
          startY = -h / 2 + edgePos * h;
          break;
      }
    } else {
      // Start from random point
      startX = -w / 2 + r1 * w;
      startY = -h / 2 + r2 * h;
    }

    // Ensure start is within bounds
    if (!isPointInBlock(startX, startY, localVertices)) continue;

    // Generate main crack with branches
    const mainCrack = generateCrackBranch(
      startX,
      startY,
      centerX,
      centerY,
      w,
      h,
      localVertices,
      maxDepth,
      damageLevel,
      seedValue + i * 1000
    );

    if (mainCrack) {
      cracks.push(mainCrack);
    }
  }

  return cracks;
};

/**
 * Recursively generates a crack branch with sub-branches
 */
const generateCrackBranch = (
  startX: number,
  startY: number,
  centerX: number,
  centerY: number,
  w: number,
  h: number,
  vertices: Matter.Vector[],
  depth: number,
  damageLevel: number,
  seed: number
): CrackSegment | null => {
  if (depth <= 0) return null;

  let seedValue = seed;

  // Determine crack direction - tend toward center or continue in similar direction
  seedValue = (seedValue * 9301 + 49297) % 233280;
  const towardCenter = seededRandom(seedValue) < 0.4;

  let endX: number;
  let endY: number;

  if (towardCenter) {
    // Crack toward center
    const dx = centerX - startX;
    const dy = centerY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const length = dist * (0.3 + damageLevel * 0.5);

    seedValue = (seedValue * 9301 + 49297) % 233280;
    const angleVariation = (seededRandom(seedValue) - 0.5) * 0.8;
    const angle = Math.atan2(dy, dx) + angleVariation;

    endX = startX + Math.cos(angle) * length;
    endY = startY + Math.sin(angle) * length;
  } else {
    // Random direction
    seedValue = (seedValue * 9301 + 49297) % 233280;
    const angle = seededRandom(seedValue) * Math.PI * 2;
    const length = Math.min(w, h) * (0.2 + damageLevel * 0.4);

    endX = startX + Math.cos(angle) * length;
    endY = startY + Math.sin(angle) * length;
  }

  // Clip to block boundaries
  const clippedEnd = clipLineToBlock(startX, startY, endX, endY, vertices);
  if (!clippedEnd) return null;

  endX = clippedEnd.x;
  endY = clippedEnd.y;

  const segment: CrackSegment = {
    startX,
    startY,
    endX,
    endY,
    branches: [],
  };

  // Generate branches based on depth and damage
  if (depth > 1) {
    const branchCount = Math.floor(
      (damageLevel > 0.5 ? 2 : 1) * seededRandom(seedValue + 100)
    );

    for (let i = 0; i < branchCount; i++) {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      const branchPoint = seededRandom(seedValue);

      const branchStartX = startX + (endX - startX) * branchPoint;
      const branchStartY = startY + (endY - startY) * branchPoint;

      if (!isPointInBlock(branchStartX, branchStartY, vertices)) continue;

      const branch = generateCrackBranch(
        branchStartX,
        branchStartY,
        centerX,
        centerY,
        w,
        h,
        vertices,
        depth - 1,
        damageLevel,
        seedValue + i * 500
      );

      if (branch) {
        segment.branches.push(branch);
      }
    }
  }

  return segment;
};

/**
 * Renders crack segments to canvas with varying line width based on branch depth
 */
export const renderCrackSegments = (
  ctx: CanvasRenderingContext2D,
  segments: CrackSegment[],
  strokeStyle: string,
  baseLineWidth: number = 1.5
) => {
  ctx.strokeStyle = strokeStyle;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawSegment = (segment: CrackSegment, depth: number = 0) => {
    // Thinner lines for deeper branches
    ctx.lineWidth = baseLineWidth * (1 - depth * 0.2);
    ctx.lineWidth = Math.max(0.5, ctx.lineWidth);

    ctx.beginPath();
    ctx.moveTo(segment.startX, segment.startY);
    ctx.lineTo(segment.endX, segment.endY);
    ctx.stroke();

    // Draw branches recursively with increased depth
    segment.branches.forEach((branch) => {
      drawSegment(branch, depth + 1);
    });
  };

  segments.forEach((segment) => {
    drawSegment(segment);
  });
};
