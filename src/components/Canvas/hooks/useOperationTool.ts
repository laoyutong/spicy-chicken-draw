import { Dispatch, SetStateAction } from "react";
import {
  EXPORT_IMAGE_BACKGROUND_COLOR,
  EXPORT_IMAGE_GAP,
  FILE_KEY,
  OPERATION_TOOL_KEY,
} from "@/config";
import { DrawData } from "@/types";
import {
  downLoad,
  drawCanvas,
  getContentArea,
  getDownloadUri,
  mitt,
} from "@/utils";
import { useMount } from "ahooks";
import { message } from "antd";

interface useOperationToolParams {
  staticDrawData: DrawData[];
  setStaticDrawData: Dispatch<SetStateAction<DrawData[]>>;
}

export const useOperationTool = ({
  staticDrawData,
  setStaticDrawData,
}: useOperationToolParams) => {
  const clearCanvasContent = () => {
    setStaticDrawData([]);
  };

  const importCanvasContent = () => {
    const input = document.createElement("input")!;
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
  };

  const exportCanvasContent = () => {
    if (!staticDrawData.length) {
      message.info("暂无内容");
      return;
    }
    const uri = getDownloadUri(JSON.stringify(staticDrawData));
    downLoad(uri, FILE_KEY);
  };

  const exportCanvasContentAsImage = () => {
    if (!staticDrawData.length) {
      message.info("暂无内容");
      return;
    }
    const canvas = document.createElement("canvas");
    const [minX, maxX, minY, maxY] = getContentArea(staticDrawData);
    const exportWidth = maxX - minX + EXPORT_IMAGE_GAP;
    const exportHeight = maxY - minY + EXPORT_IMAGE_GAP;
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

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
    downLoad(img, FILE_KEY);
  };

  useMount(() => {
    mitt.on(OPERATION_TOOL_KEY.clear, clearCanvasContent);
    mitt.on(OPERATION_TOOL_KEY.export, exportCanvasContent);
    mitt.on(OPERATION_TOOL_KEY.exportImage, exportCanvasContentAsImage);
    mitt.on(OPERATION_TOOL_KEY.import, importCanvasContent);
  });
};
