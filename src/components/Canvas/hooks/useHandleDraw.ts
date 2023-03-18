import { BoundingElement, CursorConfig, DrawData, DrawType } from "@/types";
import { useEventListener, useTrackedEffect, useUpdateEffect } from "ahooks";
import { RefObject, useEffect, useRef, useState } from "react";
import { useHandleKeyPress, useMouseEvent } from ".";
import { nanoid } from "nanoid";
import { useAtom } from "jotai";
import { cursorPointAtom, drawTypeAtom } from "@/store";
import {
  createText,
  drawCanvas,
  getHoverElement,
  getMaxDis,
  getMinDis,
  getTextContainer,
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
  statisCanvasCtx: RefObject<CanvasRenderingContext2D>
) => {
  const { startCoordinate, moveCoordinate } = useMouseEvent();

  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  const [cursorPoint, setCursorPoint] = useAtom(cursorPointAtom);

  const [activeDrawData, setActiveDrawData] = useState<DrawData[]>([]);

  const [staticDrawData, setStaticDrawData] =
    useState<DrawData[]>(getInitialDrawData);

  const workingDrawData = useRef<DrawData | null>(null);

  const createTextOnChange: TextOnChangeEvent = (textValue, container) => {
    if (textValue.trim() && startCoordinate) {
      const textList = splitContent(textValue);
      const lines = textList.filter(
        (item, index) => !!item.trim() || index !== textList.length - 1
      );
      let maxWidth = 0;
      lines.forEach((line) => {
        if (statisCanvasCtx.current) {
          const { width } = statisCanvasCtx.current.measureText(line);
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
        : startCoordinate;

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
  const handleMoveElement = () => {
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

    // 在点击的时候 把select的状态重置
    if (!activeHoverElement) {
      staticDrawData.find((item) => item.selected) &&
        setStaticDrawData((pre) =>
          pre.map((item) => ({ ...item, selected: false }))
        );
    }

    if (cursorPoint === CursorConfig.move) {
      // 如果为false说明不存在selected的图形
      if (activeHoverElement?.selected === false) {
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

      // 对于已经selected的图形
      if (!movingDrawData.current.length) {
        const boudingElementIdList: string[] = [];
        movingDrawData.current = staticDrawData.filter((item) => {
          if (item.selected && item.boundingElements?.length) {
            item.boundingElements.forEach((boundingElement) => {
              boudingElementIdList.push(boundingElement.id);
            });
          }
          return item.selected;
        })!;

        movingDrawData.current.push(
          ...(boudingElementIdList
            .map((item) => staticDrawData.find((i) => item === i.id))
            .filter((item) => item) as DrawData[])
        );

        setActiveDrawData(movingDrawData.current);
        setStaticDrawData((pre) =>
          pre.filter(
            (item) => !movingDrawData.current.some((i) => i.id === item.id)
          )
        );
        return true;
      }

      // 移动图形
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
    }
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
          const copyWorkingDrawData: DrawData = workingDrawData.current;
          setStaticDrawData((pre) => [...pre, copyWorkingDrawData]);
        }
        setActiveDrawData([]);
        workingDrawData.current = null;
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

  /**
   * 在selection时，判断cursorPoint状态
   */
  const handleCursorPoint = () => {
    if (drawType === DrawType.selection) {
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

  useTrackedEffect(
    (changes) => {
      if (
        drawType === DrawType.text &&
        changes?.includes(0) &&
        startCoordinate
      ) {
        const textContainer = getTextContainer(startCoordinate, staticDrawData);
        createText(startCoordinate, textContainer, createTextOnChange);
        setCursorPoint(CursorConfig.default);
        return;
      }

      if (handleMoveElement()) {
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
    if (statisCanvasCtx.current) {
      drawCanvas(statisCanvasCtx.current, staticDrawData);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staticDrawData));
    }
  }, [staticDrawData]);

  useEventListener(
    "resize",
    () => {
      activeCanvasCtx.current &&
        drawCanvas(activeCanvasCtx.current, activeDrawData);
      statisCanvasCtx.current &&
        drawCanvas(statisCanvasCtx.current, staticDrawData);
    },
    { target: window }
  );

  useHandleKeyPress(setStaticDrawData);
};
