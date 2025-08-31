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
    ({ pageX, pageY }) => {
      setStartCoordinate({ x: pageX, y: pageY });
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
