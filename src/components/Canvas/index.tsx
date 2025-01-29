import type { JSX } from 'react';
import { useAtomValue } from 'jotai';
import { cursorPointAtom } from '@/store';
import { useInitCanvas, useDraw, useResizeCanvas } from './hooks';
import styles from './style.module.less';

export const Canvas = (): JSX.Element => {
  const cursorPoint = useAtomValue(cursorPointAtom);

  const { activeCanvasCtx, activeCanvasRef, staticCanvasCtx, staticCanvasRef } =
    useInitCanvas();

  useResizeCanvas(
    [staticCanvasRef, activeCanvasRef],
    [staticCanvasCtx, activeCanvasCtx],
  );

  useDraw(activeCanvasCtx, staticCanvasCtx);

  return (
    <div className={styles.canvas_container} style={{ cursor: cursorPoint }}>
      <canvas ref={activeCanvasRef} />
      <canvas ref={staticCanvasRef} />
    </div>
  );
};
