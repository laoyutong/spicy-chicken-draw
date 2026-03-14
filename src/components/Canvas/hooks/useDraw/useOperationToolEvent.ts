import { useMemoizedFn, useMount } from "ahooks";
import { message } from "antd";
import roughjs from "roughjs";
import {
  APP_KEY,
  EXPORT_IMAGE_BACKGROUND_COLOR,
  EXPORT_IMAGE_GAP,
  OPERATION_TOOL_KEY,
} from "@/config";
import { DrawType, type GraphItem, type SetDrawData } from "@/types";
import {
  clearAllImages,
  clearImageCache,
  deleteImage,
  downLoad,
  drawCanvas,
  getContentArea,
  getDownloadUri,
  history,
  mitt,
  saveImage,
} from "@/utils";

interface useOperationToolParams {
  staticDrawData: GraphItem[];
  setStaticDrawData: SetDrawData;
}

/**
 * 处理 OperationTool 的点击操作
 */
export const useOperationToolEvent = ({
  staticDrawData,
  setStaticDrawData,
}: useOperationToolParams) => {
  const clearCanvasContent = useMemoizedFn(() => {
    // 清空画布时清理 IndexedDB 中的所有图片数据
    const imageItems = staticDrawData.filter(
      (item) => item.type === DrawType.image
    );
    if (imageItems.length > 0) {
      clearAllImages().catch(console.error);
    }

    history.collectRemovedRecord(staticDrawData);
    setStaticDrawData([]);
  });

  const importCanvasContent = useMemoizedFn(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    document.body.appendChild(input);
    input.click();
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = (target.files as FileList)[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const result = JSON.parse(
            (event.target as FileReader).result as string
          ) as GraphItem[];

          // 如果导入的数据包含图片，保存到 IndexedDB
          for (const item of result) {
            if (
              item.type === DrawType.image &&
              (item as { src?: string }).src
            ) {
              await saveImage(
                item.id,
                (item as { src: string }).src
              );
            }
          }

          history.collectAddedRecord(result);
          setStaticDrawData(result);
        } catch (_) {}
      };
      reader.readAsText(file);
      document.body.removeChild(input);
    };
  });

  const exportCanvasContent = useMemoizedFn(() => {
    if (!staticDrawData.length) {
      message.info("暂无内容");
      return;
    }
    downLoad(getDownloadUri(JSON.stringify(staticDrawData)), APP_KEY);
  });

  const exportCanvasContentAsImage = useMemoizedFn(async () => {
    if (!staticDrawData.length) {
      message.info("暂无内容");
      return;
    }

    // 检查是否有图片元素
    const hasImageElements = staticDrawData.some(
      (item) => item.type === DrawType.image
    );

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const roughCanvas = roughjs.canvas(canvas);
    if (!context) {
      return;
    }

    const [minX, maxX, minY, maxY] = getContentArea(staticDrawData);
    const exportWidth = maxX - minX + EXPORT_IMAGE_GAP;
    const exportHeight = maxY - minY + EXPORT_IMAGE_GAP;
    canvas.width = exportWidth;
    canvas.height = exportHeight;

    context.save();
    context.fillStyle = EXPORT_IMAGE_BACKGROUND_COLOR;
    context.fillRect(0, 0, exportWidth, exportHeight);
    context.restore();

    const exportData = staticDrawData.map((d) => ({
      ...d,
      x: d.x - minX + EXPORT_IMAGE_GAP / 2,
      y: d.y - minY + EXPORT_IMAGE_GAP / 2,
    }));

    // 如果有图片元素，先预加载所有图片
    if (hasImageElements) {
      const imagePromises = exportData
        .filter((item) => item.type === DrawType.image)
        .map((item) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = (item as { src: string }).src;
          });
        });

      try {
        await Promise.all(imagePromises);
      } catch {
        message.warning("部分图片加载失败，导出的图片可能不完整");
      }
    }

    drawCanvas(context, roughCanvas, exportData);
    const img = canvas.toDataURL();
    downLoad(img, APP_KEY);
  });

  useMount(() => {
    mitt.on(OPERATION_TOOL_KEY.clear, clearCanvasContent);
    mitt.on(OPERATION_TOOL_KEY.export, exportCanvasContent);
    mitt.on(OPERATION_TOOL_KEY.exportImage, exportCanvasContentAsImage);
    mitt.on(OPERATION_TOOL_KEY.import, importCanvasContent);
  });
};
