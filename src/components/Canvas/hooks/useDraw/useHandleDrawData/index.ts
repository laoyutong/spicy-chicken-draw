import { useEventListener, useTrackedEffect } from "ahooks";
import { useAtomValue } from "jotai";
import { useRef } from "react";

import { drawTypeAtom } from "@/store";
import {
  type Coordinate,
  DrawType,
  type GraphItem,
  type ResizePosition,
  type SetDrawData,
  type TimeoutValue,
} from "@/types";
import { useHandleCursorPoint } from "./useHandleCursorPoint";
import { useHandleDraw } from "./useHandleDraw";
import { useHandleMoveAndResize } from "./useHandleMoveAndResize";
import { useHandleText } from "./useHandleText";

interface UseHandleDrawDataParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
}

/**
 * 处理绘制、缩放、移动的画布数据
 */
export const useHandleDrawData = ({
  startCoordinate,
  moveCoordinate,
  activeDrawData,
  staticDrawData,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleDrawDataParams) => {
  const drawType = useAtomValue(drawTypeAtom);

  const resizePosition = useRef<ResizePosition | null>(null);

  const setResizePosition = (value: ResizePosition) => {
    resizePosition.current = value;
  };

  const { handleCursorPoint } = useHandleCursorPoint({
    staticDrawData,
    moveCoordinate,
    setResizePosition,
  });

  const { handleText } = useHandleText({
    staticDrawData,
    activeDrawData,
    setStaticDrawData,
  });

  const { handleDrawElement } = useHandleDraw({
    startCoordinate,
    moveCoordinate,
    staticDrawData,
    setStaticDrawData,
    setActiveDrawData,
  });

  const resetSelectedHistoryRecordTimer = useRef<TimeoutValue>();

  const { handleMoveElement, handleResizeElement } = useHandleMoveAndResize({
    resetSelectedHistoryRecordTimer,
    startCoordinate,
    moveCoordinate,
    staticDrawData,
    activeDrawData,
    setStaticDrawData,
    setActiveDrawData,
    resizePosition,
  });

  useEventListener("dblclick", (e: MouseEvent) => {
    if (drawType !== DrawType.selection) {
      return;
    }

    const { pageX, pageY } = e;
    handleText({ x: pageX, y: pageY });
  });

  useTrackedEffect(
    (changes) => {
      const isStartCoordinateChange = changes?.includes(0);
      if (drawType === DrawType.text && isStartCoordinateChange) {
        handleText(startCoordinate);
        return;
      }

      if (handleMoveElement(isStartCoordinateChange)) {
        clearTimeout(resetSelectedHistoryRecordTimer.current);
        return;
      }

      if (handleResizeElement()) {
        clearTimeout(resetSelectedHistoryRecordTimer.current);
        return;
      }

      if (handleDrawElement()) {
        return;
      }

      handleCursorPoint();
    },
    [startCoordinate, moveCoordinate]
  );
};
