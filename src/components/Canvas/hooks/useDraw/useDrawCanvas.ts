import { useEventListener } from "ahooks";
import { useLayoutEffect } from "react";
import { APP_KEY } from "@/config";
import type { CanvasCtxRef, GraphItem, RoughCanvasRef } from "@/types";
import { drawCanvas } from "@/utils";

interface UseDrawCanvasParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  activeCanvasCtx: CanvasCtxRef;
  staticCanvasCtx: CanvasCtxRef;
  staticRoughCanvas: RoughCanvasRef;
  activeRoughCanvas: RoughCanvasRef;
  canvasReady: boolean;
}

/**
 * 绘制画布内容
 */
export const useDrawCanvas = ({
  staticDrawData,
  activeDrawData,
  staticCanvasCtx,
  activeCanvasCtx,
  staticRoughCanvas,
  activeRoughCanvas,
  canvasReady,
}: UseDrawCanvasParams) => {
  const drawStaticContent = (isResize?: boolean) => {
    if (!staticCanvasCtx.current || !staticRoughCanvas.current) {
      return;
    }
    drawCanvas(
      staticCanvasCtx.current,
      staticRoughCanvas.current,
      staticDrawData
    );
    !isResize && localStorage.setItem(APP_KEY, JSON.stringify(staticDrawData));
  };

  const drawActiveContent = () => {
    if (!activeCanvasCtx.current || !activeRoughCanvas.current) {
      return;
    }
    drawCanvas(
      activeCanvasCtx.current,
      activeRoughCanvas.current,
      activeDrawData
    );
  };

  useLayoutEffect(() => {
    if (canvasReady) {
      drawActiveContent();
    }
  }, [activeDrawData, canvasReady]);

  useLayoutEffect(() => {
    if (canvasReady) {
      drawStaticContent();
    }
  }, [staticDrawData, canvasReady]);

  useEventListener(
    "resize",
    () => {
      drawStaticContent(true);
      drawActiveContent();
    },
    { target: window }
  );
};
