import { MutableRefObject, useRef } from "react";
import { useTrackedEffect } from "ahooks";
import { produce } from "immer";
import { useAtom } from "jotai";
import { nanoid } from "nanoid";

import { cursorPointAtom, drawTypeAtom } from "@/store";
import { MIN_DRAW_DIS, TEXT_FONT_SIZE } from "@/config";
import {
  BoundingElement,
  CanvasCtxRef,
  Coordinate,
  CursorConfig,
  DrawData,
  DrawType,
  ResizePosition,
  SetDrawData,
  TextOnChangeEvent,
} from "@/types";
import {
  createText,
  getContentArea,
  getExistTextElement,
  getHoverElement,
  getMaxDis,
  getMinDis,
  getResizeCursor,
  getTextContainer,
  handleDrawItem,
  splitContent,
} from "@/utils";

interface UseHandleDrawDataParams {
  staticDrawData: DrawData[];
  activeDrawData: DrawData[];
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  staticCanvasCtx: CanvasCtxRef;
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
  staticCanvasCtx,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleDrawDataParams) => {
  const [cursorPoint, setCursorPoint] = useAtom(cursorPointAtom);

  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  const workingDrawData = useRef<DrawData | null>(null);

  const resizePosition = useRef<ResizePosition | null>(null);

  const createTextOnChange: TextOnChangeEvent = (
    textValue,
    container,
    existElement
  ) => {
    if (textValue.trim() && (startCoordinate || existElement)) {
      const textList = splitContent(textValue);
      const lines = textList.filter(
        (item, index) => !!item.trim() || index !== textList.length - 1
      );
      let maxWidth = 0;
      lines.forEach((line) => {
        if (staticCanvasCtx.current) {
          const { width } = staticCanvasCtx.current.measureText(line);
          if (width > maxWidth) {
            maxWidth = width;
          }
        }
      });

      const textareaHeight = TEXT_FONT_SIZE * lines.length;

      const textProperty = container
        ? {
            x: container.x + (container.width - maxWidth) / 2,
            y: container.y + container.height / 2 - textareaHeight / 2,
          }
        : existElement
        ? { x: existElement.x, y: existElement.y }
        : startCoordinate!;

      const newTextId = nanoid();

      setStaticDrawData((pre) => [
        ...pre.filter((item) => item.id !== container?.id),
        ...(container
          ? [
              {
                ...container,
                boundingElements: [
                  ...(container?.boundingElements ?? []),
                  {
                    type: DrawType.text,
                    id: newTextId,
                  } as BoundingElement,
                ],
              },
            ]
          : []),
        {
          id: newTextId,
          type: DrawType.text,
          content: textValue,
          width: maxWidth,
          selected: false,
          height: textareaHeight,
          ...textProperty,
          ...(container ? { containerId: container.id } : {}),
        },
      ]);
    }
  };

  // 收集selected及其绑定的内容
  const collectSelectedElements = (
    drawDataList: MutableRefObject<DrawData[]>
  ) => {
    if (!drawDataList.current.length) {
      const selectedList = staticDrawData.filter((item) => item.selected);
      if (selectedList.length) {
        const boundingElementIdList: string[] = [];
        drawDataList.current = selectedList;
        selectedList.forEach((item) => {
          item.boundingElements?.forEach((boundingElement) => {
            boundingElementIdList.push(boundingElement.id);
          });
        })!;

        drawDataList.current.push(
          ...(boundingElementIdList
            .map((item) => staticDrawData.find((i) => item === i.id))
            .filter(Boolean) as DrawData[])
        );

        setActiveDrawData(drawDataList.current);
        setStaticDrawData((pre) =>
          pre.filter(
            (item) => !drawDataList.current.some((i) => i.id === item.id)
          )
        );
        return true;
      }
    }
    return false;
  };

  const moveDataCache = useRef<DrawData[]>([]);

  /**
   * 移动图形的处理
   */
  const handleMoveElement = (isStartCoordinateChange?: boolean) => {
    if (!startCoordinate) {
      // 结束移动
      if (moveDataCache.current.length) {
        setStaticDrawData((pre) => [...pre, ...activeDrawData]);
        setActiveDrawData([]);
        moveDataCache.current = [];
        return true;
      }
      return false;
    }

    const activeHoverElement = getHoverElement(startCoordinate, [
      ...staticDrawData,
      ...activeDrawData,
    ]);

    // 存在startCoordinate变更且有值，说明是点击的情况，则重置select的状态
    if (isStartCoordinateChange) {
      staticDrawData.find((item) => item.selected) &&
        setStaticDrawData((pre) =>
          pre.map((item) => ({ ...item, selected: false }))
        );
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
      setStaticDrawData((pre) =>
        produce(pre, (draft) => {
          const activeDrawItem = draft.find(
            (item) =>
              // 如果hover的图形有containerId，则hover其container
              item.id ===
              (activeHoverElement.containerId || activeHoverElement.id)
          );
          if (activeDrawItem) {
            activeDrawItem.selected = true;
          }
        })
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
            (i) => i.id === item.id
          );

          if (!activeMovingDrawItem) {
            return item;
          }

          return {
            ...activeMovingDrawItem,
            x: activeMovingDrawItem.x + moveCoordinate.x - startCoordinate.x,
            y: activeMovingDrawItem.y + moveCoordinate.y - startCoordinate.y,
          };
        })
      );

    return true;
  };

  const resizeDataCache = useRef<DrawData[]>([]);

  // 缓存selected框的初始坐标，用于resize的尺寸计算
  const startResizeContentAreaCache = useRef<
    [number, number, number, number] | null
  >(null);

  /**
   * 缩放图形的处理
   */
  const handleResizeElement = () => {
    if (!startCoordinate) {
      // 结束缩放
      if (resizeDataCache.current.length) {
        setStaticDrawData((pre) => [
          ...pre,
          ...activeDrawData.map(handleDrawItem),
        ]);
        setActiveDrawData([]);
        resizeDataCache.current = [];
        startResizeContentAreaCache.current = null;
        return true;
      }
      return false;
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

      setActiveDrawData((pre) =>
        produce(pre, (draft) => {
          resizeDataCache.current.forEach((resizeCacheItem) => {
            const activeDraftItem = draft.find(
              (item) => item.id === resizeCacheItem.id
            );
            if (!activeDraftItem) {
              return;
            }

            let xDis = 0,
              yDis = 0,
              widthDis = 0,
              heightDis = 0;

            const baseWidthDis =
              (resizeCacheItem.width / (maxX - minX)) * moveDisX;
            const baseHeightDis =
              (resizeCacheItem.height / (maxY - minY)) * moveDixY;

            if (cursorPoint === CursorConfig.neswResize) {
              if (resizePosition.current === "top") {
                // 右上角拖动
                xDis = resizeCacheItem.x - minX;
                yDis = maxY - resizeCacheItem.y;
                widthDis = baseWidthDis;
                heightDis = -baseHeightDis;
              } else {
                // 右下角拖动
                xDis = maxX - resizeCacheItem.x;
                yDis = resizeCacheItem.y - minY;
                widthDis = -baseWidthDis;
                heightDis = baseHeightDis;
              }
            } else if (cursorPoint === CursorConfig.nwseResize) {
              if (resizePosition.current === "top") {
                // 左上角拖动
                xDis = maxX - resizeCacheItem.x;
                yDis = maxY - resizeCacheItem.y;
                widthDis = -baseWidthDis;
                heightDis = -baseHeightDis;
              } else {
                // 左下角拖动
                xDis = resizeCacheItem.x - minX;
                yDis = resizeCacheItem.y - minY;
                widthDis = baseWidthDis;
                heightDis = baseHeightDis;
              }
            }

            activeDraftItem.x =
              resizeCacheItem.x + (xDis / (maxX - minX)) * moveDisX;
            activeDraftItem.y =
              resizeCacheItem.y + (yDis / (maxY - minY)) * moveDixY;

            // 文本类型仅修改坐标
            if (activeDraftItem.type !== DrawType.text) {
              activeDraftItem.width = resizeCacheItem.width + widthDis;
              activeDraftItem.height = resizeCacheItem.height + heightDis;
            }
          });
        })
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
        // selection不需要绘制
        // text在createTextOnChange里绘制
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type
          ) &&
          (Math.abs(workingDrawData.current.width) >= MIN_DRAW_DIS ||
            Math.abs(workingDrawData.current.height) >= MIN_DRAW_DIS)
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const copyWorkingDrawData: DrawData = {
            ...workingDrawData.current,
            selected: true,
          };
          setStaticDrawData((pre) => [
            ...pre,
            handleDrawItem(copyWorkingDrawData),
          ]);
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
        type: drawType,
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
          if (item.containerId) {
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
        })
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
        staticDrawData
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

  const handleText = () => {
    if (!startCoordinate) {
      return;
    }

    const existTextElement = getExistTextElement(
      startCoordinate,
      staticDrawData
    );

    if (existTextElement) {
      createText(
        startCoordinate,
        createTextOnChange,
        staticDrawData.find(
          (item) => item.id === existTextElement?.containerId
        ) ?? null,
        existTextElement
      );

      setStaticDrawData((pre) =>
        pre.filter((item) => item.id !== existTextElement.id)
      );
    } else {
      const textContainer = getTextContainer(startCoordinate, staticDrawData);
      createText(startCoordinate, createTextOnChange, textContainer);
    }
    setCursorPoint(CursorConfig.default);
    setDrawType(DrawType.selection);
  };

  useTrackedEffect(
    (changes) => {
      const isStartCoordinateChange = changes?.includes(0);
      if (drawType === DrawType.text && isStartCoordinateChange) {
        handleText();
        return;
      }

      if (handleMoveElement(isStartCoordinateChange)) {
        return;
      }

      if (handleResizeElement()) {
        return;
      }

      if (handleDrawElement()) {
        return;
      }

      handleCursorPoint();
    },
    [startCoordinate, moveCoordinate]
  );
};
