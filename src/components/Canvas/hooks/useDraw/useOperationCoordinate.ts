import { useEventListener } from "ahooks";
import { useState } from "react";
import type { Coordinate } from "@/types";

/**
 * 获取操作时的初始和移动位置
 */
export const useOperationCoordinate = () => {
  const [startCoordinate, setStartCoordinate] = useState<Coordinate | null>(
    null
  );

  const [moveCoordinate, setMoveCoordinate] = useState<Coordinate>({
    x: 0,
    y: 0,
  });

  useEventListener(
    "mousedown",
    (e: MouseEvent) => {
      // 点击工具栏、颜色面板等 UI 时不触发画布操作，避免拦截颜色选择器等
      if ((e.target as Element).closest?.("[data-ignore-draw]")) {
        return;
      }
      setStartCoordinate({ x: e.pageX, y: e.pageY });
    },
    { target: document }
  );
  useEventListener(
    "mousemove",
    ({ pageX, pageY }) => {
      setMoveCoordinate({ x: pageX, y: pageY });
    },
    { target: document }
  );
  useEventListener(
    "mouseup",
    () => {
      setStartCoordinate(null);
    },
    { target: document }
  );

  return {
    startCoordinate,
    moveCoordinate,
  };
};
