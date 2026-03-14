import { Minus, Plus } from "@icon-park/react";
import { Slider, Tooltip } from "antd";
import { useAtom } from "jotai";
import type { JSX } from "react";
import { canvasZoomAtom } from "@/store";

const MIN_ZOOM = 10;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

export const ZoomTool = (): JSX.Element => {
  const [zoom, setZoom] = useAtom(canvasZoomAtom);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const handleReset = () => {
    setZoom(100);
  };

  return (
    <div
      data-ignore-draw
      className="flex items-center gap-2 fixed bottom-3 right-3 z-10 rounded bg-slate-50 shadow px-3 py-1.5"
    >
      <Tooltip title="缩小">
        <div
          className="flex items-center justify-center w-7 h-7 cursor-pointer rounded hover:bg-slate-200"
          onClick={handleZoomOut}
        >
          <Minus theme="outline" size="16" fill="#333" />
        </div>
      </Tooltip>

      <Slider
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={ZOOM_STEP}
        value={zoom}
        onChange={setZoom}
        tooltip={{ formatter: (val) => `${val}%` }}
        className="w-28 m-0"
      />

      <Tooltip title="放大">
        <div
          className="flex items-center justify-center w-7 h-7 cursor-pointer rounded hover:bg-slate-200"
          onClick={handleZoomIn}
        >
          <Plus theme="outline" size="16" fill="#333" />
        </div>
      </Tooltip>

      <Tooltip title="重置为 100%">
        <div
          className="text-xs text-gray-600 min-w-[36px] text-center cursor-pointer select-none hover:text-gray-900"
          onClick={handleReset}
        >
          {zoom}%
        </div>
      </Tooltip>
    </div>
  );
};
