import { CALCULATE_SELECTION_GAP } from "@/config";
import { DrawData } from "@/types";

export const splitContent = (content: string): string[] =>
  content.replace(/\r\n?/g, "\n").split("\n");

export const getMaxDis = (position: number, value: number) =>
  Math.max(position, position + value);

export const getMinDis = (position: number, value: number) =>
  Math.min(position, position + value);

export const getDrawDataDis = (
  drawData: DrawData
): [minX: number, maxX: number, minY: number, maxY: number] => [
  getMinDis(drawData.x, drawData.width),
  getMaxDis(drawData.x, drawData.width),
  getMinDis(drawData.y, drawData.height),
  getMaxDis(drawData.y, drawData.height),
];

export const getValueWithoutGap = (x: number) =>
  x > CALCULATE_SELECTION_GAP ? x - CALCULATE_SELECTION_GAP : 0;

export const getValueWithGap = (x: number) => x + CALCULATE_SELECTION_GAP;

export const isInRange = (value: number, small: number, large?: number) =>
  value >= getValueWithoutGap(small) &&
  value <= getValueWithGap(large ?? small);

export const getContentArea = (
  data: DrawData[]
): [number, number, number, number] => {
  let x1 = -Infinity;
  let y1 = -Infinity;
  let x2 = Infinity;
  let y2 = Infinity;

  data.forEach((d) => {
    const [minX, maxX, minY, maxY] = getDrawDataDis(d);

    if (maxX > x1) {
      x1 = maxX;
    }
  
    if (minX < x2) {
      x2 = minX;
    }

    if (maxY > y1) {
      y1 = maxY;
    }
    
    if (minY < y2) {
      y2 = minY;
    }
  });

  return [x2, x1, y2, y1];
};
