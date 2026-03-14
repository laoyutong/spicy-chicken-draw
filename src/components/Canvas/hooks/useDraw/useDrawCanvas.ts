import { useEventListener } from "ahooks";
import { useAtomValue } from "jotai";
import { useLayoutEffect } from "react";
import { APP_KEY } from "@/config";
import { canvasZoomAtom } from "@/store";
import { CanvasCtxRef, DrawType, GraphItem, RoughCanvasRef } from "@/types";
import {
  drawCanvas,
  saveImage,
  deleteImage,
  setImageRedrawCallback,
} from "@/utils";

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
  const zoom = useAtomValue(canvasZoomAtom);

  const drawStaticContent = (isResize?: boolean) => {
    if (!staticCanvasCtx.current || !staticRoughCanvas.current) {
      return;
    }
    drawCanvas(
      staticCanvasCtx.current,
      staticRoughCanvas.current,
      staticDrawData,
      zoom
    );

    // 存储到 localStorage 和 IndexedDB
    if (!isResize) {
      // 将图片数据保存到 IndexedDB
      const imageItems = staticDrawData.filter(
        (item) => item.type === DrawType.image
      );
      imageItems.forEach((item) => {
        if ((item as { src?: string }).src) {
          saveImage(item.id, (item as { src: string }).src).catch(console.error);
        }
      });

      // 删除不再存在的图片
      const currentIds = new Set(
        staticDrawData.filter((item) => item.type === DrawType.image).map((item) => item.id)
      );
      // 这里我们暂时不主动删除，避免误删

      // 图片元素只存储元数据（不含 src）到 localStorage，避免超出配额
      const dataToStore = staticDrawData.map((item) => {
        if (item.type === DrawType.image) {
          const { src: _, ...rest } = item as { src: string } & GraphItem;
          return rest as GraphItem;
        }
        return item;
      });

      try {
        localStorage.setItem(APP_KEY, JSON.stringify(dataToStore));
      } catch (e) {
        console.warn("Failed to save to localStorage:", e);
      }
    }
  };

  const drawActiveContent = () => {
    if (!activeCanvasCtx.current || !activeRoughCanvas.current) {
      return;
    }
    drawCanvas(
      activeCanvasCtx.current,
      activeRoughCanvas.current,
      activeDrawData,
      zoom
    );
  };

  // 设置图片加载完成后的重绘回调
  useLayoutEffect(() => {
    setImageRedrawCallback(() => {
      if (canvasReady) {
        drawStaticContent();
        drawActiveContent();
      }
    });

    return () => {
      setImageRedrawCallback(null);
    };
  }, [canvasReady, staticDrawData, activeDrawData, zoom]);

  useLayoutEffect(() => {
    if (canvasReady) {
      drawActiveContent();
    }
  }, [activeDrawData, canvasReady, zoom]);

  useLayoutEffect(() => {
    if (canvasReady) {
      drawStaticContent();
    }
  }, [staticDrawData, canvasReady, zoom]);

  useEventListener(
    "resize",
    () => {
      drawStaticContent(true);
      drawActiveContent();
    },
    { target: window }
  );
};
