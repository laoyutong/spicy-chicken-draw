import { MutableRefObject, useRef } from 'react';
import { useEventListener, useTrackedEffect } from 'ahooks';
import { produce } from 'immer';
import { useAtom } from 'jotai';
import { nanoid } from 'nanoid';

import { cursorPointAtom, drawTypeAtom } from '@/store';
import {
  MIN_DRAW_DIS,
  TEXT_FONT_FAMILY,
  DEFAULT_TEXT_FONT_SIZE,
} from '@/config';
import {
  BoundingElement,
  Coordinate,
  CursorConfig,
  GraphItem,
  DrawType,
  HistoryUpdatedRecordData,
  ResizePosition,
  SetDrawData,
  TextOnChangeEvent,
  NormalGraphItem,
  TextGraphItem,
  NormalGraphType,
} from '@/types';
import {
  createText,
  getContentArea,
  getExistTextElement,
  getHoverElement,
  getMaxDis,
  getMinDis,
  getResizeCursor,
  getSelectedItems,
  getTextContainer,
  getTextLines,
  handleDrawItem,
  history,
} from '@/utils';

interface UseHandleDrawDataParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
}

/**
 * 处理绘制、缩放、移动的画布数据
 */
export const useHandleDrawData = ({
  startCoordinate,
  moveCoordinate,
  activeDrawData,
  staticDrawData,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleDrawDataParams) => {
  const [cursorPoint, setCursorPoint] = useAtom(cursorPointAtom);

  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  const workingDrawData = useRef<Exclude<GraphItem, TextGraphItem> | null>(
    null,
  );

  const resizePosition = useRef<ResizePosition | null>(null);

  const createTextOnChange: TextOnChangeEvent = (
    textValue,
    coordinate,
    container,
    existElement,
  ) => {
    if (textValue.trim() && (coordinate || existElement)) {
      let maxWidth = 0;
      const canvas = document.createElement('canvas');
      const canvasCtx = canvas.getContext('2d');
      const lines = getTextLines(textValue);

      const finalFontSizeValue =
        existElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;

      if (canvasCtx) {
        canvasCtx.font = `${finalFontSizeValue}px  ${TEXT_FONT_FAMILY}`;
        lines.forEach((line) => {
          const { width } = canvasCtx.measureText(line);
          if (width > maxWidth) {
            maxWidth = width;
          }
        });
      }

      const textareaHeight = finalFontSizeValue * lines.length;

      const textProperty = container
        ? {
            x: container.x + (container.width - maxWidth) / 2,
            y: container.y + container.height / 2 - textareaHeight / 2,
          }
        : existElement
          ? { x: existElement.x, y: existElement.y }
          : (coordinate as Coordinate);

      const newTextId = existElement ? existElement.id : nanoid();

      const textElement: TextGraphItem = {
        id: newTextId,
        type: DrawType.text,
        content: textValue,
        width: maxWidth,
        selected: false,
        height: textareaHeight,
        fontSize: finalFontSizeValue,
        ...textProperty,
        ...(container ? { containerId: container.id } : {}),
      };

      const updatedHistoryValue: HistoryUpdatedRecordData = [];
      const newContainerBoundingElements = [
        ...(container?.boundingElements || []),
        {
          id: newTextId,
          type: DrawType.text,
        } as BoundingElement,
      ];

      if (existElement) {
        updatedHistoryValue.push({
          id: newTextId,
          value: {
            deleted: {
              content: existElement.content,
            },
            payload: {
              content: textElement.content,
            },
          },
        });
        history.collectUpdatedRecord(updatedHistoryValue);
      } else {
        if (container) {
          updatedHistoryValue.push({
            id: container.id,
            value: {
              deleted: {
                boundingElements: container.boundingElements,
              },
              payload: {
                boundingElements: newContainerBoundingElements,
              },
            },
          });
        }
        history.collectAddedRecord([textElement], updatedHistoryValue);
      }

      setStaticDrawData((pre) => {
        const preDrawData = container
          ? [
              ...pre.filter((item) => item.id !== container.id),
              {
                ...container,
                boundingElements: newContainerBoundingElements,
              },
            ]
          : pre;

        return [...preDrawData, textElement];
      });
    }
  };

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

  const batchUpdatedHistoryRecord = useRef<HistoryUpdatedRecordData>([]);

  // 在结束move or resize操作的时候统一记录
  const recordBatchUpdatedHistoryRecord = () => {
    if (batchUpdatedHistoryRecord.current.length) {
      history.collectUpdatedRecord(batchUpdatedHistoryRecord.current);
      batchUpdatedHistoryRecord.current = [];
    }
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

  const moveDataCache = useRef<GraphItem[]>([]);

  const resetSelectedHistoryRecordTimer =
    useRef<ReturnType<typeof setTimeout>>();

  /**
   * 移动图形的处理
   */
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

  const resizeDataCache = useRef<GraphItem[]>([]);

  // 缓存selected框的初始坐标，用于resize的尺寸计算
  const startResizeContentAreaCache = useRef<
    [number, number, number, number] | null
  >(null);

  /**
   * 缩放图形的处理
   */
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
                if (resizePosition.current === 'top') {
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
                if (resizePosition.current === 'top') {
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
                if (resizePosition.current === 'top') {
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
                if (resizePosition.current === 'top') {
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

  /**
   * 绘制图形的处理
   */
  const handleDrawElement = () => {
    if (!startCoordinate) {
      // 处理绘制结果
      if (workingDrawData.current) {
        // selection不需要绘制、text在createTextOnChange里绘制
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type,
          ) &&
          (Math.abs(workingDrawData.current.width) >= MIN_DRAW_DIS ||
            Math.abs(workingDrawData.current.height) >= MIN_DRAW_DIS)
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const copyWorkingDrawData: GraphItem = {
            ...workingDrawData.current,
            selected: true,
          };

          const handledDrawItem = handleDrawItem(copyWorkingDrawData);
          history.collectAddedRecord([handledDrawItem]);

          setStaticDrawData((pre) => [...pre, handledDrawItem]);
        }

        if (workingDrawData.current.type === DrawType.selection) {
          const selectedList = staticDrawData.filter((item) => item.selected);
          if (selectedList.length) {
            const historyUpdatedRecordData: HistoryUpdatedRecordData = [];
            selectedList.forEach((selectedItem) => {
              historyUpdatedRecordData.push({
                id: selectedItem.id,
                value: {
                  payload: { selected: true },
                  deleted: { selected: false },
                },
              });
            });
            history.collectUpdatedRecord(historyUpdatedRecordData);
          }
        }

        setActiveDrawData([]);
        workingDrawData.current = null;
        setDrawType(DrawType.selection);
      }
      return false;
    }

    // 初始化 workingDrawData
    if (!workingDrawData.current) {
      workingDrawData.current = {
        id: nanoid(),
        type: drawType as NormalGraphType,
        width: 0,
        height: 0,
        selected: false,
        ...startCoordinate,
      };
      return true;
    }

    // 移动过程中实时更改 workingDrawData 的 width 和 height
    workingDrawData.current.width = moveCoordinate.x - startCoordinate.x;
    workingDrawData.current.height = moveCoordinate.y - startCoordinate.y;
    setActiveDrawData([workingDrawData.current]);

    // 对selection范围内的图形设置selected
    if (drawType === DrawType.selection) {
      const copyWorkingDrawData = workingDrawData.current;
      setStaticDrawData((pre) =>
        pre.map((item) => {
          // 绑定的元素不需要selected状态，在具体操作的时候处理
          if ('containerId' in item && item.containerId) {
            return item;
          }

          const isInSelectionArea =
            getMinDis(item.x, item.width) >=
              getMinDis(copyWorkingDrawData.x, copyWorkingDrawData.width) &&
            getMaxDis(item.x, item.width) <=
              getMaxDis(copyWorkingDrawData.x, copyWorkingDrawData.width) &&
            getMinDis(item.y, item.height) >=
              getMinDis(copyWorkingDrawData.y, copyWorkingDrawData.height) &&
            getMaxDis(item.y, item.height) <=
              getMaxDis(copyWorkingDrawData.y, copyWorkingDrawData.height);

          return {
            ...item,
            selected: isInSelectionArea,
          };
        }),
      );
    }

    return true;
  };

  /**
   * 处理cursorPoint状态
   */
  const handleCursorPoint = () => {
    if (drawType === DrawType.selection) {
      const resizeCursorContent = getResizeCursor(
        moveCoordinate,
        staticDrawData,
      );
      if (resizeCursorContent) {
        setCursorPoint(resizeCursorContent.cursorConfig);
        resizePosition.current = resizeCursorContent.position;
        return;
      }

      // 是否hover在图形内
      if (getHoverElement(moveCoordinate, staticDrawData)) {
        setCursorPoint(CursorConfig.move);
        return;
      }

      setCursorPoint(CursorConfig.default);
    } else {
      setCursorPoint(CursorConfig.crosshair);
    }
  };

  const handleText = (coordinate: Coordinate | null) => {
    if (!coordinate) {
      return;
    }

    // 双击时会触发collectSelectedElements，所以也需要将activeDrawData包含在内
    const existTextElement = getExistTextElement(coordinate, [
      ...staticDrawData,
      ...activeDrawData,
    ]);
    if (existTextElement) {
      createText(
        coordinate,
        createTextOnChange,
        (staticDrawData.find(
          (item) => item.id === existTextElement?.containerId,
        ) as NormalGraphItem) ?? null,
        existTextElement,
      );

      setStaticDrawData((pre) =>
        pre.filter((item) => item.id !== existTextElement.id),
      );
    } else {
      const textContainer = getTextContainer(coordinate, staticDrawData);
      createText(coordinate, createTextOnChange, textContainer);
    }
    setCursorPoint(CursorConfig.default);
    setDrawType(DrawType.selection);
  };

  useEventListener('dblclick', (e: MouseEvent) => {
    if (drawType !== DrawType.selection) {
      return;
    }

    const { pageX, pageY } = e;
    handleText({ x: pageX, y: pageY });
  });

  useTrackedEffect(
    (changes) => {
      const isStartCoordinateChange = changes?.includes(0);
      if (drawType === DrawType.text && isStartCoordinateChange) {
        handleText(startCoordinate);
        return;
      }

      if (handleMoveElement(isStartCoordinateChange)) {
        clearTimeout(resetSelectedHistoryRecordTimer.current);
        return;
      }

      if (handleResizeElement()) {
        clearTimeout(resetSelectedHistoryRecordTimer.current);
        return;
      }

      if (handleDrawElement()) {
        return;
      }

      handleCursorPoint();
    },
    [startCoordinate, moveCoordinate],
  );
};
