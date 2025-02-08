import { useMount } from 'ahooks';
import { useRef } from 'react';
import roughjs from 'roughjs';

import { RoughCanvas } from '@/types';

export const useInitCanvas = () => {
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);

  const staticCanvasCtx = useRef<CanvasRenderingContext2D | null>(null);
  const activeCanvasCtx = useRef<CanvasRenderingContext2D | null>(null);

  const staticRoughCanvas = useRef<RoughCanvas | null>(null);
  const activeRoughCanvas = useRef<RoughCanvas | null>(null);

  useMount(() => {
    if (staticCanvasRef.current && activeCanvasRef.current) {
      staticCanvasCtx.current = staticCanvasRef.current.getContext('2d');
      activeCanvasCtx.current = activeCanvasRef.current.getContext('2d');

      staticRoughCanvas.current = roughjs.canvas(staticCanvasRef.current);
      activeRoughCanvas.current = roughjs.canvas(activeCanvasRef.current);
    }
  });

  return {
    staticCanvasRef,
    activeCanvasRef,
    staticCanvasCtx,
    activeCanvasCtx,
    staticRoughCanvas,
    activeRoughCanvas,
  };
};
