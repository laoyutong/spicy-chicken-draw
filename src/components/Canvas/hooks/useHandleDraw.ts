import { CursorConfig, DrawData, DrawType } from "@/types";
import { useEventListener, useTrackedEffect, useUpdateEffect } from "ahooks";
import { RefObject, useEffect, useRef, useState } from "react";
import { useMouseEvent } from ".";
import { nanoid } from "nanoid";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cursorPointAtom, drawTypeAtom } from "@/store";
import {
  createText,
  drawCanvas,
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

  const setCursorPoint = useSetAtom(cursorPointAtom);

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

      // 鼠标按下正在移动过程中
      if (startCoordinate) {
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
          return;
        }
        // 移动过程中实时更改 workingDrawData 的 width 和 height
        if (moveCoordinate) {
          workingDrawData.current.width = moveCoordinate.x - startCoordinate.x;
          workingDrawData.current.height = moveCoordinate.y - startCoordinate.y;
          setActiveDrawData([workingDrawData.current]);
        }
        return;
      }

      if (workingDrawData.current) {
        // selection不需要绘制
        // text在createTextOnChange里绘制
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type
          )
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const workingDrawDataCache: DrawData = {
            ...workingDrawData.current,
            selected: true,
          };
          setStaticDrawData((pre) => [...pre, workingDrawDataCache]);
          setDrawType(DrawType.selection);
          setCursorPoint(CursorConfig.move);
        }

        workingDrawData.current = null;
        activeDrawData.length && setActiveDrawData([]);
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
