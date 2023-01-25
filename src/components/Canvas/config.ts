import { useEventListener, useMount } from "ahooks";
import { RefObject } from "react";

export const useResizeCanvas = (
  canvasRefList: RefObject<HTMLCanvasElement>[],
  canvasCtxList: RefObject<CanvasRenderingContext2D>[]
) => {
  const resizeCanvas = () => {
    if (
      canvasRefList.some((item) => !item.current) ||
      canvasCtxList.some((item) => !item.current)
    ) {
      return;
    }

    canvasRefList.forEach((item) => {
      item.current!.width = window.innerWidth;
      item.current!.height = window.innerHeight;
    });
  };

  useMount(resizeCanvas);

  useEventListener("resize", resizeCanvas, { target: window });
};
