import { RefObject, useState } from "react";
import { useMouseEvent } from ".";

export const useHandleDraw = (
  activeCanvasCtx: RefObject<CanvasRenderingContext2D>,
  statisCanvasCtx: RefObject<CanvasRenderingContext2D>
) => {
  const { isMoving, startCoordinate, moveCoordinate } = useMouseEvent();

  const [drawData, setDrawData] = useState([]);
};
