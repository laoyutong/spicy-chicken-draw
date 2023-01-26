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

    canvasRefList.forEach((item, index) => {
      if (!item.current) {
        return;
      }

      const { innerWidth, innerHeight, devicePixelRatio } = window;
      item.current.width = innerWidth;
      item.current.height = innerHeight;
      item.current.style.width = innerWidth + "px";
      item.current.style.height = innerHeight + "px";
      // 高清屏上物理像素和设备独立像素不一致 解决文本绘制模糊的问题
      item.current.width = devicePixelRatio * innerWidth;
      item.current.height = devicePixelRatio * innerHeight;
      canvasCtxList[index]?.current?.scale?.(
        devicePixelRatio,
        devicePixelRatio
      );
    });
  };

  useMount(resizeCanvas);

  useEventListener("resize", resizeCanvas, { target: window });
};
