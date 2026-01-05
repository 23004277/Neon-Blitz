import type { Vector, Wall } from '../../types';

class Node {
  x: number;
  y: number;
  g: number = 0; // cost from start
  h: number = 0; // heuristic cost to end
  f: number = 0; // g + h
  parent: Node | null = null;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// Diagonal distance heuristic, more accurate for grids allowing 8-directional movement
function heuristic(a: Node, b: Node) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  // D = 1 (cost of cardinal move), D2 = sqrt(2) (cost of diagonal move)
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

// A* pathfinding algorithm with diagonal movement
export function findPath(grid: number[][], startPos: Vector, endPos: Vector, cellSize: number): Vector[] | null {
  const startNode = new Node(Math.floor(startPos.x / cellSize), Math.floor(startPos.y / cellSize));
  const endNode = new Node(Math.floor(endPos.x / cellSize), Math.floor(endPos.y / cellSize));

  // Check if start or end nodes are valid
  if (!grid[startNode.y] || grid[startNode.y][startNode.x] === 1 || !grid[endNode.y] || grid[endNode.y][endNode.x] === 1) {
    return null; // Start or end is on an obstacle or out of bounds
  }

  const openSet: Node[] = [startNode];
  // Using a Set for closedSet provides O(1) average time complexity for lookups
  const closedSet = new Set<string>(); 

  while (openSet.length > 0) {
    // Find the node with the lowest F score in the open set
    let lowestFIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[lowestFIndex].f) {
        lowestFIndex = i;
      }
    }
    const currentNode = openSet[lowestFIndex];

    // Path found, reconstruct and return it
    if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
      const path: Vector[] = [];
      let temp: Node | null = currentNode;
      while (temp) {
        path.push({ x: temp.x * cellSize + cellSize / 2, y: temp.y * cellSize + cellSize / 2 });
        temp = temp.parent;
      }
      return path.reverse();
    }

    // Move current node from open to closed set
    openSet.splice(lowestFIndex, 1);
    closedSet.add(`${currentNode.x},${currentNode.y}`);

    // Get neighbors (cardinal and diagonal)
    const neighbors: Node[] = [];
    const { x, y } = currentNode;
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight && grid[ny][nx] === 0) {
          // If it's a diagonal move, check for corner cutting
          if (dx !== 0 && dy !== 0) {
            if (grid[y][nx] !== 0 || grid[ny][x] !== 0) {
              continue; // Blocked by a corner
            }
          }
          neighbors.push(new Node(nx, ny));
        }
      }
    }

    for (const neighbor of neighbors) {
      // Skip if neighbor is in the closed set
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
        continue;
      }
      
      const isDiagonal = neighbor.x !== currentNode.x && neighbor.y !== currentNode.y;
      const gScore = currentNode.g + (isDiagonal ? Math.SQRT2 : 1);

      let isBetterPath = false;

      const openNode = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);
      if (openNode) {
        // If we found a better path to this node, update it
        if (gScore < openNode.g) {
          openNode.g = gScore;
          isBetterPath = true;
        }
      } else {
        // This is a new node, add it to the open set
        neighbor.g = gScore;
        openSet.push(neighbor);
        isBetterPath = true;
      }

      if (isBetterPath) {
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.parent = currentNode;
      }
    }
  }

  return null; // No path found
}


// Creates a 2D grid representing the arena, with 1s for obstacles
export function createNavGrid(width: number, height: number, cellSize: number, walls: Wall[], agentWidth: number, agentHeight: number): number[][] {
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  const grid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));

  const agentRadius = Math.max(agentWidth, agentHeight) / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cellCenterX = x * cellSize + cellSize / 2;
      const cellCenterY = y * cellSize + cellSize / 2;
      
      // Inflate walls by agent radius to create a buffer
      for (const wall of walls) {
        const closestX = Math.max(wall.x, Math.min(cellCenterX, wall.x + wall.width));
        const closestY = Math.max(wall.y, Math.min(cellCenterY, wall.y + wall.height));
        const distance = Math.hypot(cellCenterX - closestX, cellCenterY - closestY);

        if (distance < agentRadius) {
          grid[y][x] = 1;
          break;
        }
      }
    }
  }
  return grid;
}

// Simple line-of-sight check by stepping along the line
export function hasLineOfSight(start: Vector, end: Vector, walls: Wall[]): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const steps = Math.floor(distance / 10); // Check every 10 pixels

  if (steps === 0) return true;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const pointX = start.x + t * dx;
    const pointY = start.y + t * dy;

    for (const wall of walls) {
      if (
        pointX >= wall.x &&
        pointX <= wall.x + wall.width &&
        pointY >= wall.y &&
        pointY <= wall.y + wall.height
      ) {
        return false; // Hit a wall
      }
    }
  }
  return true; // No obstruction
}

// "String pulling" or path straightening
export function smoothPath(path: Vector[], walls: Wall[]): Vector[] | null {
  if (!path || path.length < 2) {
    return path;
  }

  const newPath: Vector[] = [path[0]];
  let currentIndex = 0;

  while (currentIndex < path.length - 1) {
    let lastVisibleIndex = currentIndex + 1;
    for (let i = currentIndex + 2; i < path.length; i++) {
      if (hasLineOfSight(path[currentIndex], path[i], walls)) {
        lastVisibleIndex = i;
      } else {
        break;
      }
    }
    newPath.push(path[lastVisibleIndex]);
    currentIndex = lastVisibleIndex;
  }

  return newPath;
}

function lineLineIntersection(p1: Vector, p2: Vector, p3: Vector, p4: Vector): boolean {
    const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (den === 0) return false;
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;
    return t > 0 && t < 1 && u > 0 && u < 1;
}

export function lineIntersectsRect(p1: Vector, p2: Vector, rect: {x: number, y: number, width: number, height: number}): boolean {
    const { x, y, width, height } = rect;
    const r1 = { x, y };
    const r2 = { x: x + width, y };
    const r3 = { x: x + width, y: y + height };
    const r4 = { x, y: y + height };

    return (
        lineLineIntersection(p1, p2, r1, r2) ||
        lineLineIntersection(p1, p2, r2, r3) ||
        lineLineIntersection(p1, p2, r3, r4) ||
        lineLineIntersection(p1, p2, r4, r1) ||
        (p1.x >= x && p1.x <= x + width && p1.y >= y && p1.y <= y + height)
    );
}
