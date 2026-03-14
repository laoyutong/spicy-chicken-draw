import { useAtomValue } from "jotai";
import type { JSX } from "react";
import { ShapeColorPanel } from "@/components/ShapeColorPanel";
import { cursorPointAtom } from "@/store";
import { DrawDataProvider } from "./context/DrawDataContext";
import { useDraw, useInitCanvas, useResizeCanvas } from "./hooks";
import styles from "./style.module.less";

export const Canvas = (): JSX.Element => {
  const cursorPoint = useAtomValue(cursorPointAtom);

  const {
    activeCanvasCtx,
    activeCanvasRef,
    staticCanvasCtx,
    staticCanvasRef,
    staticRoughCanvas,
    activeRoughCanvas,
    canvasReady,
  } = useInitCanvas();

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx]
  );

  const { staticDrawData, setStaticDrawData, activeDrawData, setActiveDrawData } =
    useDraw(
      staticCanvasCtx,
      activeCanvasCtx,
      staticRoughCanvas,
      activeRoughCanvas,
      canvasReady
    );

  return (
    <DrawDataProvider
      staticDrawData={staticDrawData}
      setStaticDrawData={setStaticDrawData}
      activeDrawData={activeDrawData}
      setActiveDrawData={setActiveDrawData}
    >
      <div
        className={styles.canvas_container}
        style={{
          cursor: cursorPoint,
          position: "fixed",
          inset: 0,
          overflow: "hidden",
        }}
      >
        <canvas ref={staticCanvasRef} />
        <canvas ref={activeCanvasRef} />
      </div>
      <ShapeColorPanel />
    </DrawDataProvider>
  );
};
