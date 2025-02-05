import { useEffect } from 'react';
import { APP_KEY } from '@/config';
import { CanvasCtxRef, GraphItem } from '@/types';
import { drawCanvas } from '@/utils';
import { useEventListener, useUpdateEffect } from 'ahooks';

interface UseDrawCanvasParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  activeCanvasCtx: CanvasCtxRef;
  staticCanvasCtx: CanvasCtxRef;
}

/**
 * 绘制画布内容
 */
export const useDrawCanvas = ({
  staticDrawData,
  activeDrawData,
  staticCanvasCtx,
  activeCanvasCtx,
}: UseDrawCanvasParams) => {
  useUpdateEffect(() => {
    activeCanvasCtx.current &&
      drawCanvas(activeCanvasCtx.current, activeDrawData);
  }, [activeDrawData]);

  useEffect(() => {
    if (!staticCanvasCtx.current) {
      return;
    }

    drawCanvas(staticCanvasCtx.current, staticDrawData);
    localStorage.setItem(APP_KEY, JSON.stringify(staticDrawData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticDrawData]);

  useEventListener(
    'resize',
    () => {
      activeCanvasCtx.current &&
        drawCanvas(activeCanvasCtx.current, activeDrawData);
      staticCanvasCtx.current &&
        drawCanvas(staticCanvasCtx.current, staticDrawData);
    },
    { target: window },
  );
};
