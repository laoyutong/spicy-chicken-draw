import { useState, useEffect, useRef } from "react";
import { APP_KEY } from "@/config";
import { CanvasCtxRef, DrawType, GraphItem, RoughCanvasRef } from "@/types";
import { getImage } from "@/utils";
import { useDrawCanvas } from "./useDrawCanvas";
import { useHandleDrawData } from "./useHandleDrawData";
import { useHandleKeyPress } from "./useHandleKeyPress";
import { useOperationCoordinate } from "./useOperationCoordinate";
import { useOperationToolEvent } from "./useOperationToolEvent";

export const useDraw = (
  staticCanvasCtx: CanvasCtxRef,
  activeCanvasCtx: CanvasCtxRef,
  staticRoughCanvas: RoughCanvasRef,
  activeRoughCanvas: RoughCanvasRef,
  canvasReady: boolean
) => {
  const [activeDrawData, setActiveDrawData] = useState<GraphItem[]>([]);
  const [staticDrawData, setStaticDrawData] = useState<GraphItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const textFlushRef = useRef<(() => void) | null>(null);
  const savedFromMousedownRef = useRef(false);

  // 从 localStorage 和 IndexedDB 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = JSON.parse(
          localStorage.getItem(APP_KEY) || "[]"
        ) as GraphItem[];

        // 对于图片元素，从 IndexedDB 获取 src
        const dataWithImages = await Promise.all(
          data.map(async (item) => {
            if (item.type === DrawType.image) {
              const src = await getImage(item.id);
              // 即使 IndexedDB 中没有图片数据，也保留图片元素
              // 显示兜底图而不是完全移除
              return { ...item, src: src || "" } as GraphItem;
            }
            return item;
          })
        );

        setStaticDrawData(dataWithImages);
      } catch {
        setStaticDrawData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const { startCoordinate, moveCoordinate } = useOperationCoordinate({
    textFlushRef,
  });

  useHandleDrawData({
    startCoordinate,
    moveCoordinate,
    staticDrawData,
    activeDrawData,
    setStaticDrawData,
    setActiveDrawData,
    textFlushRef,
    savedFromMousedownRef,
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
    canvasReady,
  });

  return {
    staticDrawData,
    setStaticDrawData,
    activeDrawData,
    setActiveDrawData,
  };
};
