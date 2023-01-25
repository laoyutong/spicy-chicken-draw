import { useCanvasInit, useHandleDraw, useResizeCanvas } from "./hooks";

export const Canvas = (): JSX.Element => {
  const { activeCanvasCtx, activeCanvasRef, staticCanvasCtx, staticCanvasRef } =
    useCanvasInit();

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx]
  );

  useHandleDraw(activeCanvasCtx, staticCanvasCtx);

  return (
    <>
      <canvas ref={staticCanvasRef} />
      <canvas ref={activeCanvasRef} />
    </>
  );
};
