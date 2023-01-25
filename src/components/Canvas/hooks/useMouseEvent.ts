import { Coordinate } from "@/types";
import { useEventListener } from "ahooks";
import { useState } from "react";

export const useMouseEvent = () => {
  const [isMoving, setIsMoving] = useState(false);

  const [startCoordinate, setStartCoordinate] = useState<Coordinate | null>(
    null
  );

  const [moveCoordinate, setMoveCoordinate] = useState<Coordinate | null>(null);

  useEventListener(
    "mousedown",
    ({ pageX, pageY }) => {
      setIsMoving(true);
      setStartCoordinate({ x: pageX, y: pageY });
    },
    { target: document }
  );
  useEventListener(
    "mousemove",
    ({ pageX, pageY }) => {
      isMoving && setMoveCoordinate({ x: pageX, y: pageY });
    },
    { target: document }
  );
  useEventListener(
    "mouseup",
    () => {
      setIsMoving(false);
    },
    { target: document }
  );

  return {
    isMoving,
    startCoordinate,
    moveCoordinate,
  };
};
