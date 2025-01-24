import { useMemoizedFn, useMount } from "ahooks";
import { message } from "antd";
import {
  EXPORT_IMAGE_BACKGROUND_COLOR,
  EXPORT_IMAGE_GAP,
  APP_KEY,
  OPERATION_TOOL_KEY,
} from "@/config";
import { DrawData, SetDrawData } from "@/types";
import {
  downLoad,
  drawCanvas,
  getContentArea,
  getDownloadUri,
  history,
  mitt,
} from "@/utils";

interface useOperationToolParams {
  staticDrawData: DrawData[];
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
    history.collectRemoveRecord(staticDrawData);
    setStaticDrawData([]);
  });

  const importCanvasContent = useMemoizedFn(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    document.body.appendChild(input);
    input.click();
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = (target.files as FileList)[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = JSON.parse(
            (event.target as FileReader).result as string
          );
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

  const exportCanvasContentAsImage = useMemoizedFn(() => {
    if (!staticDrawData.length) {
      message.info("暂无内容");
      return;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
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

    drawCanvas(
      context,
      staticDrawData.map((d) => ({
        ...d,
        x: d.x - minX + EXPORT_IMAGE_GAP / 2,
        y: d.y - minY + EXPORT_IMAGE_GAP / 2,
      }))
    );
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
