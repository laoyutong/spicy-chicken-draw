import { CursorConfig, DrawData, DrawType } from "@/types";
import { useEventListener, useTrackedEffect, useUpdateEffect } from "ahooks";
import { RefObject, useEffect, useRef, useState } from "react";
import { useMouseEvent } from ".";
import { nanoid } from "nanoid";
import { useAtom } from "jotai";
import { cursorPointAtom, drawTypeAtom } from "@/store";
import {
  createText,
  drawCanvas,
  getHoverElementByCoordinate,
  getMaxDis,
  getMinDis,
  splitContent,
  TextOnChangeEvent,
} from "@/utils";
import { LOCAL_STORAGE_KEY, TEXT_FONT_SIZE } from "@/config";

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

  const createTextOnChange: TextOnChangeEvent = (textValue) => {
    if (textValue.trim()) {
      const lines = splitContent(textValue);
      let maxWidth = 0;
      lines.forEach((line) => {
        if (statisCanvasCtx.current) {
          const { width } = statisCanvasCtx.current.measureText(line);
          if (width > maxWidth) {
            maxWidth = width;
          }
        }
      });

      setStaticDrawData((pre) => [
        ...pre,
        {
          id: nanoid(),
          type: DrawType.text,
          content: textValue,
          width: maxWidth,
          height: lines.length * TEXT_FONT_SIZE,
          selected: true,
          ...startCoordinate!,
        },
      ]);
      setDrawType(DrawType.selection);
    }
  };

  const movingDrawData = useRef<DrawData[]>([]);

  const handleMoveElement = () => {
    if (!startCoordinate) {
      return false;
    }

    // 是否需要移动图形
    const hoverElementId = getHoverElementByCoordinate(
      startCoordinate,
      staticDrawData
    );

    const shouldMoveElement =
      cursorPoint === CursorConfig.move &&
      ([...staticDrawData, ...activeDrawData].find((item) => item.selected) ||
        hoverElementId);

    if (shouldMoveElement) {
      // hover在图形上的场景
      const activeHoverElement = staticDrawData.find(
        (item) => item.id === hoverElementId
      );
      if (activeHoverElement?.selected === false) {
        movingDrawData.current = [
          {
            ...activeHoverElement,
            selected: true,
          },
        ];
        setActiveDrawData(movingDrawData.current);
        setStaticDrawData((pre) =>
          pre.filter((item) => item.id !== hoverElementId)
        );
        return true;
      }

      // 对于已经selected的图形
      if (!movingDrawData.current.length) {
        movingDrawData.current = staticDrawData.filter(
          (item) => item.selected
        )!;
        setActiveDrawData(movingDrawData.current);
        setStaticDrawData((pre) => pre.filter((item) => !item.selected));
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

  const handleDrawElement = () => {
    if (!startCoordinate) {
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

  useTrackedEffect(
    (changes) => {
      if (
        drawType === DrawType.text &&
        changes?.includes(0) &&
        startCoordinate
      ) {
        createText(startCoordinate, createTextOnChange);
        setCursorPoint(CursorConfig.default);
        return;
      }

      if (handleMoveElement()) {
        return;
      }

      if (handleDrawElement()) {
        return;
      }

      // 结束移动
      if (movingDrawData.current.length) {
        setStaticDrawData((pre) => [...pre, ...activeDrawData]);
        setActiveDrawData([]);
        movingDrawData.current = [];
        return;
      }

      // 处理绘制结果
      if (workingDrawData.current) {
        // selection不需要绘制
        // text在createTextOnChange里绘制
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type
          ) &&
          (workingDrawData.current.width || workingDrawData.current.height)
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const copyWorkingDrawData: DrawData = workingDrawData.current;
          setStaticDrawData((pre) => [...pre, copyWorkingDrawData]);
        }
        setActiveDrawData([]);
        workingDrawData.current = null;
      }

      if (drawType === DrawType.selection) {
        // 是否hover在图形内
        if (getHoverElementByCoordinate(moveCoordinate, staticDrawData)) {
          setCursorPoint(CursorConfig.move);
          return;
        }
        setCursorPoint(CursorConfig.default);
      }
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
};
