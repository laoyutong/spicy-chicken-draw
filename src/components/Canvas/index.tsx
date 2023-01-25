import { useMount } from "ahooks";
import { useRef } from "react";
import { useResizeCanvas } from "./config";

export const Canvas = (): JSX.Element => {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);

  const staticCanvasCtx = useRef<CanvasRenderingContext2D | null>(null);
  const activeCanvasCtx = useRef<CanvasRenderingContext2D | null>(null);

  useMount(() => {
    if (staticCanvasRef.current && activeCanvasRef.current) {
      staticCanvasCtx.current = staticCanvasRef.current.getContext("2d");
      activeCanvasCtx.current = activeCanvasRef.current.getContext("2d");
    }
  });

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx]
  );

  return (
    <>
      <canvas ref={staticCanvasRef} />
      <canvas ref={activeCanvasRef} />
    </>
  );
};
