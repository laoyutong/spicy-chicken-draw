import {
  BoundingElement,
  Coordinate,
  CursorConfig,
  DrawData,
  DrawType,
} from "@/types";
import { useEventListener, useTrackedEffect, useUpdateEffect } from "ahooks";
import { RefObject, useEffect, useRef, useState } from "react";
import { useHandleKeyPress, useMouseEvent } from ".";
import { nanoid } from "nanoid";
import { useAtom } from "jotai";
import { cursorPointAtom, drawTypeAtom } from "@/store";
import {
  createText,
  drawCanvas,
  getContentArea,
  getExistTextElement,
  getHoverElement,
  getMaxDis,
  getMinDis,
  getResizeRectData,
  getTextContainer,
  isInRange,
  splitContent,
  TextOnChangeEvent,
} from "@/utils";
import { LOCAL_STORAGE_KEY, MIN_DRAW_DIS, TEXT_FONT_SIZE } from "@/config";

const getInitialDrawData = () => {
  let result = [];
  try {
    result = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch {}
  return result;
};

export const useHandleDraw = (
  activeCanvasCtx: RefObject<CanvasRenderingContext2D>,
  staticCanvasCtx: RefObject<CanvasRenderingContext2D>
) => {
  const { startCoordinate, moveCoordinate } = useMouseEvent();

  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  const [cursorPoint, setCursorPoint] = useAtom(cursorPointAtom);

  const [activeDrawData, setActiveDrawData] = useState<DrawData[]>([]);

  const [staticDrawData, setStaticDrawData] =
    useState<DrawData[]>(getInitialDrawData);

  const workingDrawData = useRef<DrawData | null>(null);

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

  const movingDrawData = useRef<DrawData[]>([]);

  /**
   * 移动图形的处理
   */
  const handleMoveElement = (isStartCoordinateChange?: boolean) => {
    if (!startCoordinate) {
      // 结束移动
      if (movingDrawData.current.length) {
        setStaticDrawData((pre) => [...pre, ...activeDrawData]);
        setActiveDrawData([]);
        movingDrawData.current = [];
        return true;
      }
      return false;
    }

    const activeHoverElement = getHoverElement(startCoordinate, [
      ...staticDrawData,
      ...activeDrawData,
    ]);

    // 存在startCoordinate变更且有值，说明是点击的情况
    // 重置select的状态
    if (isStartCoordinateChange && !activeHoverElement) {
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
      // 如果hover的图形有containerId，则hover其container
      if (activeHoverElement.containerId) {
        const hoverElementContainer = staticDrawData.find(
          (item) => item.id === activeHoverElement.containerId
        );
        if (hoverElementContainer) {
          movingDrawData.current = [
            {
              ...hoverElementContainer,
              selected: true,
            },
            activeHoverElement,
          ];
        }
      } else {
        movingDrawData.current = [
          {
            ...activeHoverElement,
            selected: true,
          },
          ...((activeHoverElement.boundingElements
            ?.map((item) => staticDrawData.find((i) => i.id === item.id))
            .filter((item) => item) as DrawData[]) ?? []),
        ];
      }
      setActiveDrawData(movingDrawData.current);
      setStaticDrawData((pre) =>
        pre
          .filter(
            (item) => !movingDrawData.current.some((i) => i.id === item.id)
          )
          .map((item) => ({ ...item, selected: false }))
      );

      return true;
    }

    // 处理移动前绑定元素的selected的信息收集
    if (!movingDrawData.current.length) {
      const selectedList = staticDrawData.filter((item) => item.selected);
      if (selectedList.length) {
        const boundingElementIdList: string[] = [];
        movingDrawData.current = selectedList;
        selectedList.forEach((item) => {
          item.boundingElements?.forEach((boundingElement) => {
            boundingElementIdList.push(boundingElement.id);
          });
        })!;

        movingDrawData.current.push(
          ...(boundingElementIdList
            .map((item) => staticDrawData.find((i) => item === i.id))
            .filter(Boolean) as DrawData[])
        );

        setActiveDrawData(movingDrawData.current);
        setStaticDrawData((pre) =>
          pre.filter(
            (item) => !movingDrawData.current.some((i) => i.id === item.id)
          )
        );
        return true;
      }
    }

    // 移动图形
    movingDrawData.current.length &&
      setActiveDrawData((pre) =>
        pre.map((item) => {
          const activeMovingDrawItem = movingDrawData.current.find(
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
          setStaticDrawData((pre) => [...pre, copyWorkingDrawData]);
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

  const getResizeCursor = (
    coordinate: Coordinate,
    drawData: DrawData[]
  ): CursorConfig | null => {
    const selectedList = drawData.filter((item) => item.selected);
    if (!selectedList.length) {
      return null;
    }

    const getCursorConfig = (
      resizeRectData: ReturnType<typeof getResizeRectData>
    ) => {
      for (const { x, width, y, height } of resizeRectData) {
        if (
          isInRange(coordinate.x, getMinDis(x, width), getMaxDis(x, width)) &&
          isInRange(coordinate.y, getMinDis(y, height), getMaxDis(y, height))
        ) {
          return width * height > 0
            ? CursorConfig.nwseResize
            : CursorConfig.neswResize;
        }
      }
      return null;
    };

    let cursorResult: CursorConfig | null = null;
    if (selectedList.length === 1) {
      const activeDrawItem = selectedList[0];
      const resizeRectData = getResizeRectData(activeDrawItem);
      cursorResult = getCursorConfig(resizeRectData);
    } else {
      const [minX, maxX, minY, maxY] = getContentArea(selectedList);
      const resizeRectData = getResizeRectData({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      });
      cursorResult = getCursorConfig(resizeRectData);
    }

    return cursorResult;
  };

  /**
   * 处理cursorPoint状态
   */
  const handleCursorPoint = () => {
    if (drawType === DrawType.selection) {
      const resizeCursor = getResizeCursor(moveCoordinate, staticDrawData);
      if (resizeCursor) {
        setCursorPoint(resizeCursor);
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

      if (handleDrawElement()) {
        return;
      }

      handleCursorPoint();
    },
    [startCoordinate, moveCoordinate]
  );

  useUpdateEffect(() => {
    activeCanvasCtx.current &&
      drawCanvas(activeCanvasCtx.current, activeDrawData);
  }, [activeDrawData]);

  useEffect(() => {
    if (!staticCanvasCtx.current) {
      return;
    }

    drawCanvas(staticCanvasCtx.current, staticDrawData);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staticDrawData));
  }, [staticDrawData]);

  useEventListener(
    "resize",
    () => {
      activeCanvasCtx.current &&
        drawCanvas(activeCanvasCtx.current, activeDrawData);
      staticCanvasCtx.current &&
        drawCanvas(staticCanvasCtx.current, staticDrawData);
    },
    { target: window }
  );

  useHandleKeyPress(setStaticDrawData);
};
