import { useEventListener } from "ahooks";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { canvasZoomAtom } from "@/store";
import type { Coordinate } from "@/types";

/**
 * 获取操作时的初始和移动位置
 */
export const useOperationCoordinate = () => {
  const zoom = useAtomValue(canvasZoomAtom);

  const [startCoordinate, setStartCoordinate] = useState<Coordinate | null>(
    null
  );

  const [moveCoordinate, setMoveCoordinate] = useState<Coordinate>({
    x: 0,
    y: 0,
  });

  const toCanvasCoordinate = (pageX: number, pageY: number): Coordinate => {
    const scale = zoom / 100;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    return {
      x: (pageX - cx) / scale + cx,
      y: (pageY - cy) / scale + cy,
    };
  };

  useEventListener(
    "mousedown",
    (e: MouseEvent) => {
      if ((e.target as Element).closest?.("[data-ignore-draw]")) {
        return;
      }
      setStartCoordinate(toCanvasCoordinate(e.pageX, e.pageY));
    },
    { target: document }
  );
  useEventListener(
    "mousemove",
    ({ pageX, pageY }) => {
      setMoveCoordinate(toCanvasCoordinate(pageX, pageY));
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
