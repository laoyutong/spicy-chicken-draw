import { useEffect } from 'react';
import { useEventListener, useUpdateEffect } from 'ahooks';
import { APP_KEY } from '@/config';
import { CanvasCtxRef, GraphItem, RoughCanvasRef } from '@/types';
import { drawCanvas } from '@/utils';

interface UseDrawCanvasParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  activeCanvasCtx: CanvasCtxRef;
  staticCanvasCtx: CanvasCtxRef;
  staticRoughCanvas: RoughCanvasRef;
  activeRoughCanvas: RoughCanvasRef;
}

/**
 * 绘制画布内容
 */
export const useDrawCanvas = ({
  staticDrawData,
  activeDrawData,
  staticCanvasCtx,
  activeCanvasCtx,
  staticRoughCanvas,
  activeRoughCanvas,
}: UseDrawCanvasParams) => {
  const drawStaticContent = (isResize?: boolean) => {
    if (!staticCanvasCtx.current || !staticRoughCanvas.current) {
      return;
    }

    drawCanvas(
      staticCanvasCtx.current,
      staticRoughCanvas.current,
      staticDrawData,
    );
    !isResize && localStorage.setItem(APP_KEY, JSON.stringify(staticDrawData));
  };

  const drawActiveContent = () => {
    if (!activeCanvasCtx.current || !activeRoughCanvas.current) {
      return;
    }

    drawCanvas(
      activeCanvasCtx.current,
      activeRoughCanvas.current,
      activeDrawData,
    );
  };

  useUpdateEffect(() => {
    drawActiveContent();
  }, [activeDrawData]);

  useEffect(() => {
    drawStaticContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticDrawData]);

  useEventListener(
    'resize',
    () => {
      drawStaticContent(true);
      drawActiveContent();
    },
    { target: window },
  );
};
