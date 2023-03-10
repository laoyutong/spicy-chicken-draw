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
   * ?????????????????????
   */
  const handleMoveElement = () => {
    if (!startCoordinate) {
      // ????????????
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

    // ?????????????????? ???select???????????????
    if (!activeHoverElement) {
      staticDrawData.find((item) => item.selected) &&
        setStaticDrawData((pre) =>
          pre.map((item) => ({ ...item, selected: false }))
        );
    }

    if (cursorPoint === CursorConfig.move) {
      // ?????????false???????????????selected?????????
      if (activeHoverElement?.selected === false) {
        // ??????hover????????????containerId??????hover???container
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
            ...(activeHoverElement.boundingElements
              ?.map((item) => staticDrawData.find((i) => i.id === item.id))
              .filter((item) => item) as DrawData[]),
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

      // ????????????selected?????????
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

      // ????????????
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
   * ?????????????????????
   */
  const handleDrawElement = () => {
    if (!startCoordinate) {
      // ??????????????????
      if (workingDrawData.current) {
        // selection???????????????
        // text???createTextOnChange?????????
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type
          ) &&
          (Math.abs(workingDrawData.current.width) >= MIN_DRAW_DIS ||
            Math.abs(workingDrawData.current.height) >= MIN_DRAW_DIS)
        ) {
          // ????????? ?????? setState ?????????????????? null ???
          const copyWorkingDrawData: DrawData = workingDrawData.current;
          setStaticDrawData((pre) => [...pre, copyWorkingDrawData]);
        }
        setActiveDrawData([]);
        workingDrawData.current = null;
      }
      return false;
    }

    // ????????? workingDrawData
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

    // ??????????????????????????? workingDrawData ??? width ??? height
    workingDrawData.current.width = moveCoordinate.x - startCoordinate.x;
    workingDrawData.current.height = moveCoordinate.y - startCoordinate.y;
    setActiveDrawData([workingDrawData.current]);

    // ???selection????????????????????????selected
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
   * ???selection????????????cursorPoint??????
   */
  const handleCursorPoint = () => {
    if (drawType === DrawType.selection) {
      // ??????hover????????????
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
