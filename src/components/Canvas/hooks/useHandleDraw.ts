import { Coordinate, CursorConfig, DrawData, DrawType } from "@/types";
import { useEventListener, useTrackedEffect, useUpdateEffect } from "ahooks";
import { RefObject, useEffect, useRef, useState } from "react";
import { useMouseEvent } from ".";
import { nanoid } from "nanoid";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cursorPointAtom, drawTypeAtom } from "@/store";
import {
  createText,
  drawCanvas,
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

      // 鼠标按下的绘制过程
      if (startCoordinate) {
        // 是否需要移动图形
        const shouldMoveElement =
          [...staticDrawData, ...activeDrawData].find(
            (item) => item.selected
          ) && cursorPoint === CursorConfig.move;

        if (shouldMoveElement) {
          if (!movingDrawData.current.length) {
            movingDrawData.current = staticDrawData.filter(
              (item) => item.selected
            )!;
            setActiveDrawData(movingDrawData.current);
            setStaticDrawData((pre) => pre.filter((item) => !item.selected));
            return;
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
                x:
                  activeMovingDrawItem.x + moveCoordinate.x - startCoordinate.x,
                y:
                  activeMovingDrawItem.y + moveCoordinate.y - startCoordinate.y,
              };
            })
          );
          return;
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
          return;
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
                  getMinDis(
                    copyWorkingDrawData.y,
                    copyWorkingDrawData.height
                  ) &&
                getMaxDis(item.y, item.height) <=
                  getMaxDis(copyWorkingDrawData.y, copyWorkingDrawData.height);

              return {
                ...item,
                selected: isInSelectionArea,
              };
            })
          );
        }
        return;
      }

      // setStaticDrawData((pre) =>
      //   pre.map((item) => ({ ...item, selected: false }))
      // );

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
          )
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const copyWorkingDrawData: DrawData = workingDrawData.current;
          setStaticDrawData((pre) => [...pre, copyWorkingDrawData]);
        }
        setActiveDrawData([]);
        workingDrawData.current = null;
      }

      if (drawType === DrawType.selection) {
        // 是否hover在selected图形内
        if (
          staticDrawData.find(
            (item) =>
              item.selected &&
              moveCoordinate.x >= getMinDis(item.x, item.width) &&
              moveCoordinate.x <= getMaxDis(item.x, item.width) &&
              moveCoordinate.y >= getMinDis(item.y, item.height) &&
              moveCoordinate.y <= getMaxDis(item.y, item.height)
          )
        ) {
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
