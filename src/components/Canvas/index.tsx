import { cursorPointAtom } from "@/store";
import { useAtomValue } from "jotai";
import { useCanvasInit, useHandleDraw, useResizeCanvas } from "./hooks";
import styles from "./style.module.less";

export const Canvas = (): JSX.Element => {
  const cursorPoint = useAtomValue(cursorPointAtom);

  const { activeCanvasCtx, activeCanvasRef, staticCanvasCtx, staticCanvasRef } =
    useCanvasInit();

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx]
  );

  useHandleDraw(activeCanvasCtx, staticCanvasCtx);

  return (
    <div className={styles.canvas_container} style={{ cursor: cursorPoint }}>
      <canvas ref={activeCanvasRef} />
      <canvas ref={staticCanvasRef} />
    </div>
  );
};
