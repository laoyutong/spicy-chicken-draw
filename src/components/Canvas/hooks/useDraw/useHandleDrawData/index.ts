import { useRef } from 'react';
import { useEventListener, useTrackedEffect } from 'ahooks';
import { useAtomValue } from 'jotai';

import { drawTypeAtom } from '@/store';
import {
  Coordinate,
  GraphItem,
  DrawType,
  HistoryUpdatedRecordData,
  ResizePosition,
  SetDrawData,
  CollectSelectedElementsFn,
  CollectUpdatedHistoryRecord,
  TimeoutValue,
} from '@/types';
import { getSelectedItems, history } from '@/utils';
import { useHandleCursorPoint } from './useHandleCursorPoint';
import { useHandleText } from './useHandleText';
import { useHandleMove } from './useHandleMove';
import { useHandleResize } from './useHandleResize';
import { useHandleDraw } from './useHandleDraw';

interface UseHandleDrawDataParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
}

/**
 * 处理绘制、缩放、移动的画布数据
 */
export const useHandleDrawData = ({
  startCoordinate,
  moveCoordinate,
  activeDrawData,
  staticDrawData,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleDrawDataParams) => {
  const drawType = useAtomValue(drawTypeAtom);

  const resizePosition = useRef<ResizePosition | null>(null);

  const setResizePosition = (value: ResizePosition) => {
    resizePosition.current = value;
  };

  const { handleCursorPoint } = useHandleCursorPoint({
    staticDrawData,
    moveCoordinate,
    setResizePosition,
  });

  const { handleText } = useHandleText({
    staticDrawData,
    activeDrawData,
    setStaticDrawData,
  });

  const { handleDrawElement } = useHandleDraw({
    startCoordinate,
    moveCoordinate,
    staticDrawData,
    setStaticDrawData,
    setActiveDrawData,
  });

  const resetSelectedHistoryRecordTimer = useRef<TimeoutValue>();

  // 收集selected及其绑定的内容
  const collectSelectedElements: CollectSelectedElementsFn = (drawDataList) => {
    if (!drawDataList.current.length) {
      console.log('execute collectSelectedElements');
      drawDataList.current = getSelectedItems(staticDrawData);

      if (drawDataList.current.length) {
        setActiveDrawData(drawDataList.current);
        setStaticDrawData((pre) =>
          pre.filter(
            (item) => !drawDataList.current.some((i) => i.id === item.id),
          ),
        );
        return true;
      }
    }
    return false;
  };

  const batchUpdatedHistoryRecord = useRef<HistoryUpdatedRecordData>([]);

  const addBatchUpdatedHistoryRecord = (
    v: HistoryUpdatedRecordData[number],
  ) => {
    batchUpdatedHistoryRecord.current.push(v);
  };

  // 在结束move or resize操作的时候统一记录
  const recordBatchUpdatedHistoryRecord = () => {
    if (batchUpdatedHistoryRecord.current.length) {
      history.collectUpdatedRecord(batchUpdatedHistoryRecord.current);
      batchUpdatedHistoryRecord.current = [];
    }
  };

  const collectUpdatedHistoryRecord: CollectUpdatedHistoryRecord = (
    dataCache,
    handleDrawItem,
  ) => {
    dataCache.current.forEach((dataItem) => {
      const activeDrawItem = activeDrawData.find(
        (item) => dataItem.id === item.id,
      );

      if (!activeDrawItem) {
        return;
      }

      batchUpdatedHistoryRecord.current.push({
        id: dataItem.id,
        value: {
          payload: handleDrawItem(activeDrawItem),
          deleted: handleDrawItem(dataItem),
        },
      });
    });
  };

  const { handleMoveElement } = useHandleMove({
    staticDrawData,
    activeDrawData,
    startCoordinate,
    moveCoordinate,
    setStaticDrawData,
    setActiveDrawData,
    collectSelectedElements,
    collectUpdatedHistoryRecord,
    resetSelectedHistoryRecordTimer,
    recordBatchUpdatedHistoryRecord,
    addBatchUpdatedHistoryRecord,
  });

  const { handleResizeElement } = useHandleResize({
    activeDrawData,
    startCoordinate,
    moveCoordinate,
    setStaticDrawData,
    setActiveDrawData,
    collectSelectedElements,
    collectUpdatedHistoryRecord,
    recordBatchUpdatedHistoryRecord,
    resizePosition,
  });

  useEventListener('dblclick', (e: MouseEvent) => {
    if (drawType !== DrawType.selection) {
      return;
    }

    const { pageX, pageY } = e;
    handleText({ x: pageX, y: pageY });
  });

  useTrackedEffect(
    (changes) => {
      const isStartCoordinateChange = changes?.includes(0);
      if (drawType === DrawType.text && isStartCoordinateChange) {
        handleText(startCoordinate);
        return;
      }

      if (handleMoveElement(isStartCoordinateChange)) {
        clearTimeout(resetSelectedHistoryRecordTimer.current);
        return;
      }

      if (handleResizeElement()) {
        clearTimeout(resetSelectedHistoryRecordTimer.current);
        return;
      }

      if (handleDrawElement()) {
        return;
      }

      handleCursorPoint();
    },
    [startCoordinate, moveCoordinate],
  );
};
