import { Coordinate, DrawData, DrawType } from "@/types";
import {
  getDrawDataDis,
  isInRange,
  getValueWithGap,
  getValueWithoutGap,
  getContentArea,
} from "./common";
import {
  HAS_BOUNDING_ELEMENTS_LIST,
  CALCULATE_SELECTION_GAP,
  TEXT_BOUND_GAP,
} from "@/config";

/**
 * 获取两个坐标点之间的距离
 */
const getDistance = (x1: number, x2: number, y1: number, y2: number) =>
  Math.pow(
    Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2),
    1 / 2
  );

export const getHoverElement = (
  { x, y }: Coordinate,
  drawData: DrawData[]
): DrawData | null => {
  const selectedList = drawData.filter((i) => i.selected);
  if (selectedList.length) {
    if (selectedList.length > 1) {
      const [minX, maxX, minY, maxY] = getContentArea(selectedList);
      if (isInRange(x, minX, maxX) && isInRange(y, minY, maxY)) {
        //  TODO: 需要返回整个list，外层逻辑需要同步处理
        return selectedList[0]
      }
    } else {
      const [minX, maxX, minY, maxY] = getDrawDataDis(selectedList[0]);
      if (isInRange(x, minX, maxX) && isInRange(y, minY, maxY)) {
        return selectedList[0];
      }
    }
  }

  for (const graphItem of drawData) {
    const [minX, maxX, minY, maxY] = getDrawDataDis(graphItem);

    if (graphItem.type === DrawType.text) {
      if (isInRange(x, minX, maxX) && isInRange(y, minY, maxY)) {
        return graphItem;
      }
    }

    if (graphItem.type === DrawType.rectangle) {
      if (
        ((isInRange(x, minX) || isInRange(x, maxX)) &&
          isInRange(y, minY, maxY)) ||
        ((isInRange(y, minY) || isInRange(y, maxY)) && isInRange(x, minX, maxX))
      ) {
        return graphItem;
      }
    }

    if (graphItem.type === DrawType.circle) {
      const halfWidth = graphItem.width / 2;
      const halfHeight = graphItem.height / 2;
      const value =
        Math.pow(x - (graphItem.x + halfWidth), 2) / Math.pow(halfWidth, 2) +
        Math.pow(y - (graphItem.y + halfHeight), 2) / Math.pow(halfHeight, 2);

      if (value <= 1.2 && value >= 0.9) {
        return graphItem;
      }
    }

    if (graphItem.type === DrawType.diamond) {
      const targetArea = graphItem.width * graphItem.height;
      const disX = Math.abs(x - (graphItem.x + graphItem.width / 2));
      const disY = Math.abs(y - (graphItem.y + graphItem.height / 2));
      const maxArea =
        (getValueWithGap(disX) * graphItem.height +
          getValueWithGap(disY) * graphItem.width) *
        2;
      const minArea =
        (getValueWithoutGap(disX) * graphItem.height +
          getValueWithoutGap(disY) * graphItem.width) *
        2;

      if (maxArea >= targetArea && minArea <= targetArea) {
        return graphItem;
      }
    }

    if (graphItem.type === DrawType.arrow) {
      const target = Math.round(getDistance(minX, maxX, minY, maxY));
      const active = Math.round(
        getDistance(x, graphItem.x, y, graphItem.y) +
          getDistance(
            x,
            graphItem.x + graphItem.width,
            y,
            graphItem.y + graphItem.height
          )
      );

      if (
        active >= target - CALCULATE_SELECTION_GAP / 2 &&
        active <= target + CALCULATE_SELECTION_GAP / 2
      ) {
        return graphItem;
      }
    }
  }

  return null;
};

export const getTextContainer = (
  { x, y }: Coordinate,
  drawData: DrawData[]
): DrawData | null => {
  let result: DrawData | null = null;
  drawData.forEach((item) => {
    if (!HAS_BOUNDING_ELEMENTS_LIST.includes(item.type)) {
      return;
    }

    const [middleX, middleY] = [
      item.x + item.width / 2,
      item.y + item.height / 2,
    ];

    if (
      x <= middleX + TEXT_BOUND_GAP &&
      x >= middleX - TEXT_BOUND_GAP &&
      y <= middleY + TEXT_BOUND_GAP &&
      y >= middleY - TEXT_BOUND_GAP
    ) {
      if (result) {
        if (item.width < result.width) {
          result = item;
        }
      } else {
        result = item;
      }
    }
  });
  return result;
};

export const getExistTextElement = (
  { x, y }: Coordinate,
  drawData: DrawData[]
) =>
  drawData.find(
    (item) =>
      item.type === DrawType.text &&
      x >= item.x &&
      y >= item.y &&
      x <= item.x + item.width &&
      y <= item.y + item.height
  );
