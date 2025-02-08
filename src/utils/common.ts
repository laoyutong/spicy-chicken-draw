import {
  CALCULATE_SELECTION_GAP,
  DRAW_SELECTION_GAP,
  SELECTION_RECT_WIDTH,
} from '@/config';
import { GraphItem, DrawType, BasicGraphData } from '@/types';

const splitContent = (content: string): string[] =>
  content.replace(/\r\n?/g, '\n').split('\n');

export const getTextLines = (content: string) => {
  const textList = splitContent(content);
  return textList.filter(
    (item, index) => !!item.trim() || index !== textList.length - 1,
  );
};

export const getMaxDis = (position: number, value: number) =>
  Math.max(position, position + value);

export const getMinDis = (position: number, value: number) =>
  Math.min(position, position + value);

export const getDrawDataDis = (
  drawData: GraphItem,
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
  data: GraphItem[],
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

export const getResizeRectData = ({ x, y, width, height }: BasicGraphData) => {
  const gapX = width > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const gapY = height > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const x1 = x - gapX;
  const x2 = x + width + gapX;
  const y1 = y - gapY;
  const y2 = y + height + gapY;

  const rectWidth = width > 0 ? SELECTION_RECT_WIDTH : -SELECTION_RECT_WIDTH;
  const rectHeight = height > 0 ? SELECTION_RECT_WIDTH : -SELECTION_RECT_WIDTH;

  const getDrawRectParams = (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => ({ x, y, width, height });

  return [
    getDrawRectParams(x1, y1, -rectWidth, -rectHeight),
    getDrawRectParams(x2, y2, rectWidth, rectHeight),
    getDrawRectParams(x2, y1, rectWidth, -rectHeight),
    getDrawRectParams(x1, y2, -rectWidth, rectHeight),
  ];
};

// 将width和height处理为整数，便于缩放计算
export const handleDrawItem = (drawData: GraphItem) => {
  if (
    (drawData.width > 0 && drawData.height > 0) ||
    drawData.type === DrawType.arrow
  ) {
    return drawData;
  }

  return {
    ...drawData,
    x: drawData.width > 0 ? drawData.x : drawData.x + drawData.width,
    y: drawData.height > 0 ? drawData.y : drawData.y + drawData.height,
    width: drawData.width > 0 ? drawData.width : -drawData.width,
    height: drawData.height > 0 ? drawData.height : -drawData.height,
  };
};

export const getSelectedItems = (drawData: GraphItem[]) => {
  const result: GraphItem[] = [];
  drawData.forEach((drawItem) => {
    if (drawItem.selected) {
      result.push(drawItem);

      if ('boundingElements' in drawItem) {
        drawItem.boundingElements?.forEach((boundingElement) => {
          const activeItem = drawData.find((i) => boundingElement.id === i.id);
          if (activeItem) {
            result.push(activeItem);
          }
        });
      }
    }
  });
  return result;
};
