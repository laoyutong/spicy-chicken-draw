import { useState } from "react";
import { APP_KEY } from "@/config";
import type { CanvasCtxRef, GraphItem, RoughCanvasRef } from "@/types";
import { useDrawCanvas } from "./useDrawCanvas";
import { useHandleDrawData } from "./useHandleDrawData";
import { useHandleKeyPress } from "./useHandleKeyPress";
import { useOperationCoordinate } from "./useOperationCoordinate";
import { useOperationToolEvent } from "./useOperationToolEvent";

export const useDraw = (
  staticCanvasCtx: CanvasCtxRef,
  activeCanvasCtx: CanvasCtxRef,
  staticRoughCanvas: RoughCanvasRef,
  activeRoughCanvas: RoughCanvasRef
) => {
  const [activeDrawData, setActiveDrawData] = useState<GraphItem[]>([]);

  const [staticDrawData, setStaticDrawData] = useState<GraphItem[]>(() => {
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
    setStaticDrawData,
    setActiveDrawData,
  });

  useOperationToolEvent({
    staticDrawData,
    setStaticDrawData,
  });

  useHandleKeyPress({ staticDrawData, setStaticDrawData, moveCoordinate });

  useDrawCanvas({
    staticDrawData,
    activeDrawData,
    staticCanvasCtx,
    activeCanvasCtx,
    staticRoughCanvas,
    activeRoughCanvas,
  });
};
