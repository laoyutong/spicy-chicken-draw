import { useCanvasInit, useHandleDraw, useResizeCanvas } from "./hooks";
import styles from "./style.module.less";

export const Canvas = (): JSX.Element => {
  const { activeCanvasCtx, activeCanvasRef, staticCanvasCtx, staticCanvasRef } =
    useCanvasInit();

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx]
  );

  useHandleDraw(activeCanvasCtx, staticCanvasCtx);

  return (
    <div className={styles.canvas_container}>
      <canvas ref={activeCanvasRef} />
      <canvas ref={staticCanvasRef} />
    </div>
  );
};
