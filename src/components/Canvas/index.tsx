import { useAtomValue } from "jotai";
import type { JSX } from "react";
import { cursorPointAtom } from "@/store";
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
  } = useInitCanvas();

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx]
  );

  useDraw(
    staticCanvasCtx,
    activeCanvasCtx,
    staticRoughCanvas,
    activeRoughCanvas
  );

  return (
    <div className={styles.canvas_container} style={{ cursor: cursorPoint }}>
      <canvas ref={activeCanvasRef} />
      <canvas ref={staticCanvasRef} />
    </div>
  );
};
