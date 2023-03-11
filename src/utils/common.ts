import { DrawData } from "@/types";

export const splitContent = (content: string): string[] =>
  content.replace(/\r\n?/g, "\n").split("\n");

export const getMaxDis = (coor: number, length: number) =>
  Math.max(coor, coor + length);

export const getMinDis = (coor: number, length: number) =>
  Math.min(coor, coor + length);

export const getDrawDataDis = (
  drawData: DrawData
): [minX: number, maxX: number, minY: number, maxY: number] => [
  getMinDis(drawData.x, drawData.width),
  getMaxDis(drawData.x, drawData.width),
  getMinDis(drawData.y, drawData.height),
  getMaxDis(drawData.y, drawData.height),
];
