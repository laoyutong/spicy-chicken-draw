import { useState } from "react";
import { CanvasCtxRef, DrawData } from "@/types";
import { APP_KEY } from "@/config";

import { useOperationCoordinate } from "./useOperationCoordinate";
import { useOperationToolEvent } from "./useOperationToolEvent";
import { useHandleKeyPress } from "./useHandleKeyPress";
import { useDrawCanvas } from "./useDrawCanvas";
import { useHandleDrawData } from "./useHandleDrawData";

export const useDraw = (
  activeCanvasCtx: CanvasCtxRef,
  staticCanvasCtx: CanvasCtxRef
) => {
  const [activeDrawData, setActiveDrawData] = useState<DrawData[]>([]);

  const [staticDrawData, setStaticDrawData] = useState<DrawData[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(APP_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const { startCoordinate, moveCoordinate } = useOperationCoordinate();

  useHandleDrawData({
    startCoordinate,
    moveCoordinate,
    staticDrawData,
    activeDrawData,
    staticCanvasCtx,
    setStaticDrawData,
    setActiveDrawData,
  });

  useOperationToolEvent({
    staticDrawData,
    setStaticDrawData,
  });

  useHandleKeyPress({ staticDrawData, setStaticDrawData });

  useDrawCanvas({
    staticDrawData,
    activeDrawData,
    staticCanvasCtx,
    activeCanvasCtx,
  });
};
