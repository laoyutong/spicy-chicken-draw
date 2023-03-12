import { Coordinate, DrawData, DrawType } from "@/types";
import { getDrawDataDis } from "./common";
import { SELECTION_GAP } from "@/config";

const getValueWithoutGap = (x: number) =>
  x > SELECTION_GAP ? x - SELECTION_GAP : 0;

const getValueWithGap = (x: number) => x + SELECTION_GAP;

const isInRange = (value: number, small: number, large?: number) =>
  value >= getValueWithoutGap(small) &&
  value <= getValueWithGap(large ?? small);

const getDistance = (x1: number, x2: number, y1: number, y2: number) =>
  Math.pow(
    Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2),
    1 / 2
  );

export const getHoverElementByCoordinate = (
  { x, y }: Coordinate,
  drawData: DrawData[]
): DrawData | null => {
  // selected的优先级高
  const selectedHoverElement = drawData.find((item) => {
    const [minX, maxX, minY, maxY] = getDrawDataDis(item);
    return item.selected && x >= minX && x <= maxX && y >= minY && y <= maxY;
  });

  if (selectedHoverElement) {
    return selectedHoverElement;
  }

  for (const graghItem of drawData) {
    const [minX, maxX, minY, maxY] = getDrawDataDis(graghItem);

    if (graghItem.type === DrawType.text) {
      if (isInRange(x, minX, maxX) && isInRange(y, minY, maxY)) {
        return graghItem;
      }
    }

    if (graghItem.type === DrawType.rectangle) {
      if (
        ((isInRange(x, minX) || isInRange(x, maxX)) &&
          isInRange(y, minY, maxY)) ||
        ((isInRange(y, minY) || isInRange(y, maxY)) && isInRange(x, minX, maxX))
      ) {
        return graghItem;
      }
    }

    if (graghItem.type === DrawType.circle) {
      const halfWidth = graghItem.width / 2;
      const halfHeight = graghItem.height / 2;
      const value =
        Math.pow(x - (graghItem.x + halfWidth), 2) / Math.pow(halfWidth, 2) +
        Math.pow(y - (graghItem.y + halfHeight), 2) / Math.pow(halfHeight, 2);

      if (value <= 1.1 && value >= 0.9) {
        return graghItem;
      }
    }

    if (graghItem.type === DrawType.diamond) {
      const targetArea = graghItem.width * graghItem.height;
      const disX = Math.abs(x - (graghItem.x + graghItem.width / 2));
      const disY = Math.abs(y - (graghItem.y + graghItem.height / 2));
      const maxArea =
        (getValueWithGap(disX) * graghItem.height +
          getValueWithGap(disY) * graghItem.width) *
        2;
      const minArea =
        (getValueWithoutGap(disX) * graghItem.height +
          getValueWithoutGap(disY) * graghItem.width) *
        2;

      if (maxArea >= targetArea && minArea <= targetArea) {
        return graghItem;
      }
    }

    if (graghItem.type === DrawType.arrow) {
      const target = Math.round(getDistance(minX, maxX, minY, maxY));
      const active = Math.round(
        getDistance(x, graghItem.x, y, graghItem.y) +
          getDistance(
            x,
            graghItem.x + graghItem.width,
            y,
            graghItem.y + graghItem.height
          )
      );

      if (
        active >= target - SELECTION_GAP / 2 &&
        active <= target + SELECTION_GAP / 2
      ) {
        return graghItem;
      }
    }
  }

  return null;
};
