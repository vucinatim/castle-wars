import Matter from "matter-js";

const { Vector } = Matter;

export type LocalBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export const worldToBodyLocal = (
  body: Matter.Body,
  point: Matter.Vector
): Matter.Vector => {
  const relative = Vector.sub(point, body.position);
  return Vector.rotate(relative, -body.angle);
};

export const getBodyLocalVertices = (body: Matter.Body): Matter.Vector[] => {
  return body.vertices.map((v) => worldToBodyLocal(body, v));
};

export const getLocalBounds = (vertices: Matter.Vector[]): LocalBounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
};

