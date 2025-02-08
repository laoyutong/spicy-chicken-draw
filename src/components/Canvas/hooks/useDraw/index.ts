import { useState } from 'react';
import { CanvasCtxRef, GraphItem, RoughCanvasRef } from '@/types';
import { APP_KEY } from '@/config';

import { useOperationCoordinate } from './useOperationCoordinate';
import { useOperationToolEvent } from './useOperationToolEvent';
import { useHandleKeyPress } from './useHandleKeyPress';
import { useDrawCanvas } from './useDrawCanvas';
import { useHandleDrawData } from './useHandleDrawData';

export const useDraw = (
  staticCanvasCtx: CanvasCtxRef,
  activeCanvasCtx: CanvasCtxRef,
  staticRoughCanvas: RoughCanvasRef,
  activeRoughCanvas: RoughCanvasRef,
) => {
  const [activeDrawData, setActiveDrawData] = useState<GraphItem[]>([]);

  const [staticDrawData, setStaticDrawData] = useState<GraphItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(APP_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const { startCoordinate, moveCoordinate } = useOperationCoordinate();

  useHandleDrawData({
    startCoordinate,
    moveCoordinate,
    staticDrawData,
    activeDrawData,
    setStaticDrawData,
    setActiveDrawData,
  });

  useOperationToolEvent({
    staticDrawData,
    setStaticDrawData,
  });

  useHandleKeyPress({ staticDrawData, setStaticDrawData, moveCoordinate });

  useDrawCanvas({
    staticDrawData,
    activeDrawData,
    staticCanvasCtx,
    activeCanvasCtx,
    staticRoughCanvas,
    activeRoughCanvas,
  });
};
