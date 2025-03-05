import { cursorPointAtom } from '@/store';
import {
  CollectSelectedElementsFn,
  CollectUpdatedHistoryRecord,
  Coordinate,
  CursorConfig,
  DrawType,
  GraphItem,
  ResizePosition,
  SetDrawData,
} from '@/types';
import { getContentArea, getTextLines, handleDrawItem } from '@/utils';
import { produce } from 'immer';
import { useAtomValue } from 'jotai';
import { MutableRefObject, useRef } from 'react';

interface UseHandleResizeParams {
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
  activeDrawData: GraphItem[];
  collectSelectedElements: CollectSelectedElementsFn;
  collectUpdatedHistoryRecord: CollectUpdatedHistoryRecord;
  recordBatchUpdatedHistoryRecord: () => void;
  resizePosition: MutableRefObject<ResizePosition | null>;
}

/**
 * 缩放图形的处理
 */
export const useHandleResize = ({
  startCoordinate,
  moveCoordinate,
  setStaticDrawData,
  setActiveDrawData,
  activeDrawData,
  collectSelectedElements,
  collectUpdatedHistoryRecord,
  recordBatchUpdatedHistoryRecord,
  resizePosition,
}: UseHandleResizeParams) => {
  const cursorPoint = useAtomValue(cursorPointAtom);
  const resizeDataCache = useRef<GraphItem[]>([]);

  // 缓存selected框的初始坐标，用于resize的尺寸计算
  const startResizeContentAreaCache = useRef<
    [number, number, number, number] | null
  >(null);

  const handleResizeElement = () => {
    if (!startCoordinate) {
      let result = false;
      // 结束缩放
      if (resizeDataCache.current.length) {
        const getFilterFields = (drawItem: GraphItem) => ({
          x: drawItem.x,
          y: drawItem.y,
          width: drawItem.width,
          height: drawItem.height,
        });

        collectUpdatedHistoryRecord(resizeDataCache, getFilterFields);

        setStaticDrawData((pre) => [
          ...pre,
          ...activeDrawData.map(handleDrawItem),
        ]);
        setActiveDrawData([]);
        resizeDataCache.current = [];
        startResizeContentAreaCache.current = null;
        result = true;
      }
      recordBatchUpdatedHistoryRecord();
      return result;
    }

    if (
      ![CursorConfig.neswResize, CursorConfig.nwseResize].includes(cursorPoint)
    ) {
      return false;
    }

    if (collectSelectedElements(resizeDataCache)) {
      return true;
    }

    if (resizeDataCache.current.length) {
      const moveDisX = moveCoordinate.x - startCoordinate.x;
      const moveDixY = moveCoordinate.y - startCoordinate.y;

      if (!startResizeContentAreaCache.current) {
        startResizeContentAreaCache.current = getContentArea(activeDrawData);
      }

      const [minX, maxX, minY, maxY] = startResizeContentAreaCache.current;

      const [contentAreaWidth, contentAreaHeight] = [maxX - minX, maxY - minY];

      const hasTextGraphItem = resizeDataCache.current.some(
        (item) => item.type === DrawType.text,
      );

      setActiveDrawData((pre) =>
        produce(pre, (draft) => {
          resizeDataCache.current.forEach((resizeCacheItem) => {
            const activeDraftItem = draft.find(
              (item) => item.id === resizeCacheItem.id,
            );
            if (!activeDraftItem) {
              return;
            }

            const handleResize = (disX: number, disY: number) => {
              let xDis = 0,
                yDis = 0,
                widthDis = 0,
                heightDis = 0;

              const baseWidthDis =
                (resizeCacheItem.width / contentAreaWidth) * disX;
              const baseHeightDis =
                (resizeCacheItem.height / contentAreaHeight) * disY;

              if (cursorPoint === CursorConfig.neswResize) {
                if (resizePosition.current === ResizePosition.top) {
                  // 右上角
                  xDis = resizeCacheItem.x - minX;
                  yDis = maxY - resizeCacheItem.y;
                  widthDis = baseWidthDis;
                  heightDis = -baseHeightDis;
                } else {
                  // 左下角
                  xDis = maxX - resizeCacheItem.x;
                  yDis = resizeCacheItem.y - minY;
                  widthDis = -baseWidthDis;
                  heightDis = baseHeightDis;
                }
              } else if (cursorPoint === CursorConfig.nwseResize) {
                if (resizePosition.current === ResizePosition.top) {
                  // 左上角
                  xDis = maxX - resizeCacheItem.x;
                  yDis = maxY - resizeCacheItem.y;
                  widthDis = -baseWidthDis;
                  heightDis = -baseHeightDis;
                } else {
                  // 右下角
                  xDis = resizeCacheItem.x - minX;
                  yDis = resizeCacheItem.y - minY;
                  widthDis = baseWidthDis;
                  heightDis = baseHeightDis;
                }
              }

              activeDraftItem.x =
                resizeCacheItem.x + (xDis / contentAreaWidth) * disX;
              activeDraftItem.y =
                resizeCacheItem.y + (yDis / contentAreaHeight) * disY;

              activeDraftItem.width = resizeCacheItem.width + widthDis;

              const activeItemHeight = resizeCacheItem.height + heightDis;
              activeDraftItem.height = activeItemHeight;

              // 文本类型需要同步更改字体大小
              if (activeDraftItem.type === DrawType.text) {
                const lines = getTextLines(activeDraftItem.content);
                activeDraftItem.fontSize = activeItemHeight / lines.length;
              }
            };

            // 存在文本类型时，只支持等比缩放
            // TODO: 待支持反转能力
            if (hasTextGraphItem) {
              const resizeRate = contentAreaWidth / contentAreaHeight;

              const handleZoomOut = (isXLarger: boolean) => {
                const smallDisX = (() => {
                  if (!isXLarger) {
                    return moveDisX;
                  }
                  const value = Math.abs(moveDixY * resizeRate);
                  return moveDisX > 0 ? value : -value;
                })();

                const smallDisY = (() => {
                  if (isXLarger) {
                    return moveDixY;
                  }
                  const value = Math.abs(moveDisX / resizeRate);
                  return moveDixY > 0 ? value : -value;
                })();

                handleResize(smallDisX, smallDisY);
              };

              const handleZoomIn = (
                isXLarger: boolean,
                xUnit: 1 | -1,
                yUnit: 1 | -1,
              ) => {
                const largeDisX = (() => {
                  if (isXLarger) {
                    return moveDisX;
                  }
                  const value = Math.abs(moveDixY * resizeRate);
                  return moveDisX > 0 ? value : -value;
                })();

                const largeDisY = (() => {
                  if (!isXLarger) {
                    return moveDixY;
                  }
                  const value = Math.abs(moveDisX / resizeRate);
                  return moveDixY > 0 ? value : -value;
                })();

                handleResize(
                  xUnit * Math.abs(largeDisX),
                  yUnit * Math.abs(largeDisY),
                );
              };

              if (cursorPoint === CursorConfig.neswResize) {
                if (resizePosition.current === ResizePosition.top) {
                  // 右上角
                  if (moveDisX <= 0 && moveDixY >= 0) {
                    const isXLarger = moveDisX / resizeRate < -moveDixY;
                    handleZoomOut(isXLarger);
                  } else {
                    const isXLarger = moveDisX / resizeRate > -moveDixY;
                    handleZoomIn(isXLarger, 1, -1);
                  }
                } else {
                  // 左下角
                  if (moveDisX >= 0 && moveDixY <= 0) {
                    const isXLarger = moveDisX / resizeRate > -moveDixY;
                    handleZoomOut(isXLarger);
                  } else {
                    const isXLarger = moveDisX / resizeRate < -moveDixY;
                    handleZoomIn(isXLarger, -1, 1);
                  }
                }
              } else if (cursorPoint === CursorConfig.nwseResize) {
                if (resizePosition.current === ResizePosition.top) {
                  // 左上角
                  if (moveDisX >= 0 && moveDixY >= 0) {
                    const isXLarger = moveDisX / resizeRate > moveDixY;
                    handleZoomOut(isXLarger);
                  } else {
                    const isXLarger = moveDisX / resizeRate < moveDixY;
                    handleZoomIn(isXLarger, -1, -1);
                  }
                } else {
                  // 右下角
                  if (moveDisX <= 0 && moveDixY <= 0) {
                    const isXLarger = moveDisX / resizeRate < moveDixY;
                    handleZoomOut(isXLarger);
                  } else {
                    const isXLarger = moveDisX / resizeRate > moveDixY;
                    handleZoomIn(isXLarger, 1, 1);
                  }
                }
              }
            } else {
              handleResize(moveDisX, moveDixY);
            }
          });
        }),
      );
    }

    return true;
  };
  return { handleResizeElement };
};
