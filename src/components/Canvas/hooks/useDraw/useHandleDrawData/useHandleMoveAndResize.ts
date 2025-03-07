import { MutableRefObject, useRef } from 'react';
import { produce } from 'immer';
import { useAtomValue } from 'jotai';
import { cursorPointAtom } from '@/store';
import {
  Coordinate,
  CursorConfig,
  DrawType,
  GraphItem,
  HistoryUpdatedRecordData,
  ResizePosition,
  SetDrawData,
  TimeoutValue,
} from '@/types';
import {
  getHoverElement,
  getSelectedItems,
  history,
  handleDrawItem,
  getContentArea,
  getTextLines,
} from '@/utils';

interface UseHandleMoveAndResizeParams {
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  resetSelectedHistoryRecordTimer: MutableRefObject<TimeoutValue | undefined>;
  resizePosition: MutableRefObject<ResizePosition | null>;
}

export const useHandleMoveAndResize = ({
  startCoordinate,
  moveCoordinate,
  setStaticDrawData,
  setActiveDrawData,
  staticDrawData,
  activeDrawData,
  resetSelectedHistoryRecordTimer,
  resizePosition,
}: UseHandleMoveAndResizeParams) => {
  const cursorPoint = useAtomValue(cursorPointAtom);
  const resizeDataCache = useRef<GraphItem[]>([]);

  // 缓存selected框的初始坐标，用于resize的尺寸计算
  const startResizeContentAreaCache = useRef<
    [number, number, number, number] | null
  >(null);

  // 收集selected及其绑定的内容
  const collectSelectedElements = (
    drawDataList: MutableRefObject<GraphItem[]>,
  ) => {
    if (!drawDataList.current.length) {
      console.log('execute collectSelectedElements');
      drawDataList.current = getSelectedItems(staticDrawData);

      if (drawDataList.current.length) {
        setActiveDrawData(drawDataList.current);
        setStaticDrawData((pre) =>
          pre.filter(
            (item) => !drawDataList.current.some((i) => i.id === item.id),
          ),
        );
        return true;
      }
    }
    return false;
  };

  const collectUpdatedHistoryRecord = (
    dataCache: MutableRefObject<GraphItem[]>,
    handleDrawItem: (drawItem: GraphItem) => Partial<GraphItem>,
  ) => {
    dataCache.current.forEach((dataItem) => {
      const activeDrawItem = activeDrawData.find(
        (item) => dataItem.id === item.id,
      );

      if (!activeDrawItem) {
        return;
      }

      batchUpdatedHistoryRecord.current.push({
        id: dataItem.id,
        value: {
          payload: handleDrawItem(activeDrawItem),
          deleted: handleDrawItem(dataItem),
        },
      });
    });
  };

  const batchUpdatedHistoryRecord = useRef<HistoryUpdatedRecordData>([]);

  // 在结束move or resize操作的时候统一记录
  const recordBatchUpdatedHistoryRecord = () => {
    if (batchUpdatedHistoryRecord.current.length) {
      history.collectUpdatedRecord(batchUpdatedHistoryRecord.current);
      batchUpdatedHistoryRecord.current = [];
    }
  };

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

  const moveDataCache = useRef<GraphItem[]>([]);

  const handleMoveElement = (isStartCoordinateChange?: boolean) => {
    if (!startCoordinate) {
      let result = false;
      // 结束移动
      if (moveDataCache.current.length) {
        const getFilterFields = (drawItem: GraphItem) => ({
          x: drawItem.x,
          y: drawItem.y,
        });

        collectUpdatedHistoryRecord(moveDataCache, getFilterFields);

        setStaticDrawData((pre) => [...pre, ...activeDrawData]);
        setActiveDrawData([]);
        moveDataCache.current = [];
        result = true;
      }
      recordBatchUpdatedHistoryRecord();
      return result;
    }

    const activeHoverElement = getHoverElement(startCoordinate, [
      ...staticDrawData,
      ...activeDrawData,
    ]);

    // 存在startCoordinate变更且有值，说明是点击的情况，则重置select的状态
    if (
      isStartCoordinateChange &&
      staticDrawData.find((item) => item.selected)
    ) {
      const historyUpdatedRecord: HistoryUpdatedRecordData = [];

      setStaticDrawData((pre) =>
        pre.map((item) => {
          if (!item.selected) {
            return item;
          }

          historyUpdatedRecord.push({
            id: item.id,
            value: {
              payload: { selected: false },
              deleted: { selected: true },
            },
          });

          return { ...item, selected: false };
        }),
      );
      // 异步执行，如果后续存在move or resize则不记录
      resetSelectedHistoryRecordTimer.current = setTimeout(() => {
        history.collectUpdatedRecord(historyUpdatedRecord);
      });
    }

    if (cursorPoint !== CursorConfig.move) {
      return false;
    }

    // 如果activeHoverElement为数组，肯定是批量selected的状态，所以仅需要判断单个的情况
    // 当前点击到了没有selected的图形，需要设置selected状态
    if (
      !Array.isArray(activeHoverElement) &&
      activeHoverElement?.selected === false
    ) {
      // 如果hover的图形有containerId，则hover其container
      const activeId =
        ('containerId' in activeHoverElement
          ? activeHoverElement.containerId
          : activeHoverElement.id) || activeHoverElement.id;

      setStaticDrawData((pre) =>
        pre.map((item) => {
          if (item.id === activeId) {
            batchUpdatedHistoryRecord.current.push({
              id: item.id,
              value: {
                payload: { selected: true },
                deleted: { selected: false },
              },
            });

            return {
              ...item,
              selected: true,
            };
          }
          return item;
        }),
      );
      return true;
    }

    if (collectSelectedElements(moveDataCache)) {
      return true;
    }

    // 移动图形
    moveDataCache.current.length &&
      setActiveDrawData((pre) =>
        pre.map((item) => {
          const activeMovingDrawItem = moveDataCache.current.find(
            (i) => i.id === item.id,
          );

          if (!activeMovingDrawItem) {
            return item;
          }

          return {
            ...activeMovingDrawItem,
            x: activeMovingDrawItem.x + moveCoordinate.x - startCoordinate.x,
            y: activeMovingDrawItem.y + moveCoordinate.y - startCoordinate.y,
          };
        }),
      );

    return true;
  };

  return {
    handleResizeElement,
    handleMoveElement,
  };
};
