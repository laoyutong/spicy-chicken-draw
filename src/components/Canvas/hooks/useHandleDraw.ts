import { DrawData, DrawType } from "@/types";
import { useMount, useTrackedEffect, useUpdateEffect } from "ahooks";
import { RefObject, useRef, useState } from "react";
import { useMouseEvent } from ".";
import { nanoid } from "nanoid";
import { useAtomValue } from "jotai";
import { drawTypeAtom } from "@/store";
import {
  createText,
  drawCanvas,
  splitContent,
  TextOnChangeEvent,
} from "@/utils";
import { LOCAL_STORAGE_KEY, TEXT_FONT_SIZE } from "@/config";

export const useHandleDraw = (
  activeCanvasCtx: RefObject<CanvasRenderingContext2D>,
  statisCanvasCtx: RefObject<CanvasRenderingContext2D>
) => {
  const { isMoving, startCoordinate, moveCoordinate } = useMouseEvent();

  const drawType = useAtomValue(drawTypeAtom);

  const [activeDrawData, setActiveDrawData] = useState<DrawData[]>([]);

  const [staticDrawData, setStaticDrawData] = useState<DrawData[]>([]);

  useMount(() => {
    let result = [];
    try {
      result = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    } catch {}
    result.length && setStaticDrawData(result);
  });

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
          ...startCoordinate!,
        },
      ]);
    }
  };

  useTrackedEffect(
    (changes) => {
      if (drawType === DrawType.text) {
        if (changes?.includes(1) && startCoordinate) {
          createText(startCoordinate, createTextOnChange);
        }
        return;
      }

      // 鼠标按下正在移动过程中
      if (isMoving) {
        // 初始化 workingDrawData
        if (!workingDrawData.current) {
          if (startCoordinate) {
            workingDrawData.current = {
              id: nanoid(),
              type: drawType,
              width: 0,
              height: 0,
              ...startCoordinate,
            };
          }
        } else {
          // 移动过程中实时更改 workingDrawData 的 width 和 height
          if (startCoordinate && moveCoordinate) {
            workingDrawData.current.width =
              moveCoordinate.x - startCoordinate.x;
            workingDrawData.current.height =
              moveCoordinate.y - startCoordinate.y;
            setActiveDrawData([workingDrawData.current]);
          }
        }
      } else {
        if (
          workingDrawData.current?.width &&
          workingDrawData.current?.height &&
          // selection 不需要静态绘制
          workingDrawData.current?.type !== DrawType.selection
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const workingDrawDataCache = workingDrawData.current!;
          setStaticDrawData((pre) => [...pre, workingDrawDataCache]);
        }
        activeDrawData.length && setActiveDrawData([]);
        workingDrawData.current = null;
      }
    },
    [isMoving, startCoordinate, moveCoordinate]
  );

  useTrackedEffect(
    (changes) => {
      if (changes?.includes(0) && activeCanvasCtx.current) {
        drawCanvas(activeCanvasCtx.current, activeDrawData);
      }

      if (changes?.includes(1) && statisCanvasCtx.current) {
        drawCanvas(statisCanvasCtx.current, staticDrawData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(staticDrawData));
      }
    },
    [activeDrawData, staticDrawData]
  );
};
