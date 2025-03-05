import { cursorPointAtom, drawTypeAtom } from '@/store';
import {
  Coordinate,
  CursorConfig,
  DrawType,
  GraphItem,
  ResizePosition,
} from '@/types';
import { getHoverElement, getResizeCursor } from '@/utils';
import { useAtomValue, useSetAtom } from 'jotai';

interface UseHandleCursorPointParams {
  moveCoordinate: Coordinate;
  staticDrawData: GraphItem[];
  setResizePosition: (v: ResizePosition) => void;
}

/**
 * 处理cursorPoint状态
 */
export const useHandleCursorPoint = ({
  moveCoordinate,
  staticDrawData,
  setResizePosition,
}: UseHandleCursorPointParams) => {
  const drawType = useAtomValue(drawTypeAtom);
  const setCursorPoint = useSetAtom(cursorPointAtom);

  const handleCursorPoint = () => {
    if (drawType === DrawType.selection) {
      const resizeCursorContent = getResizeCursor(
        moveCoordinate,
        staticDrawData,
      );

      if (resizeCursorContent) {
        setCursorPoint(resizeCursorContent.cursorConfig);
        setResizePosition(resizeCursorContent.position);
        return;
      }

      // 是否hover在图形内
      if (getHoverElement(moveCoordinate, staticDrawData)) {
        setCursorPoint(CursorConfig.move);
        return;
      }

      setCursorPoint(CursorConfig.default);
    } else {
      setCursorPoint(CursorConfig.crosshair);
    }
  };

  return { handleCursorPoint };
};
