import { cursorPointAtom } from '@/store';
import {
  CollectSelectedElementsFn,
  CollectUpdatedHistoryRecord,
  Coordinate,
  CursorConfig,
  GraphItem,
  HistoryUpdatedRecordData,
  SetDrawData,
  TimeoutValue,
} from '@/types';
import { getHoverElement, history } from '@/utils';
import { useAtomValue } from 'jotai';
import { MutableRefObject, useRef } from 'react';

interface UseHandleMoveParams {
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  collectSelectedElements: CollectSelectedElementsFn;
  collectUpdatedHistoryRecord: CollectUpdatedHistoryRecord;
  addBatchUpdatedHistoryRecord: (v: HistoryUpdatedRecordData[number]) => void;
  resetSelectedHistoryRecordTimer: MutableRefObject<TimeoutValue | undefined>;
  recordBatchUpdatedHistoryRecord: () => void;
}

/**
 * 移动图形的处理
 */
export const useHandleMove = ({
  startCoordinate,
  moveCoordinate,
  setStaticDrawData,
  setActiveDrawData,
  staticDrawData,
  activeDrawData,
  collectSelectedElements,
  collectUpdatedHistoryRecord,
  addBatchUpdatedHistoryRecord,
  recordBatchUpdatedHistoryRecord,
  resetSelectedHistoryRecordTimer,
}: UseHandleMoveParams) => {
  const cursorPoint = useAtomValue(cursorPointAtom);
  const moveDataCache = useRef<GraphItem[]>([]);

  const handleMoveElement = (isStartCoordinateChange?: boolean) => {
    if (!startCoordinate) {
      let result = false;
      // 结束移动
      if (moveDataCache.current.length) {
        const getFilterFields = (drawItem: GraphItem) => ({
          x: drawItem.x,
          y: drawItem.y,
        });

        collectUpdatedHistoryRecord(moveDataCache, getFilterFields);

        setStaticDrawData((pre) => [...pre, ...activeDrawData]);
        setActiveDrawData([]);
        moveDataCache.current = [];
        result = true;
      }
      recordBatchUpdatedHistoryRecord();
      return result;
    }

    const activeHoverElement = getHoverElement(startCoordinate, [
      ...staticDrawData,
      ...activeDrawData,
    ]);

    // 存在startCoordinate变更且有值，说明是点击的情况，则重置select的状态
    if (
      isStartCoordinateChange &&
      staticDrawData.find((item) => item.selected)
    ) {
      const historyUpdatedRecord: HistoryUpdatedRecordData = [];

      setStaticDrawData((pre) =>
        pre.map((item) => {
          if (!item.selected) {
            return item;
          }

          historyUpdatedRecord.push({
            id: item.id,
            value: {
              payload: { selected: false },
              deleted: { selected: true },
            },
          });

          return { ...item, selected: false };
        }),
      );
      // 异步执行，如果后续存在move or resize则不记录
      resetSelectedHistoryRecordTimer.current = setTimeout(() => {
        history.collectUpdatedRecord(historyUpdatedRecord);
      });
    }

    if (cursorPoint !== CursorConfig.move) {
      return false;
    }

    // 如果activeHoverElement为数组，肯定是批量selected的状态，所以仅需要判断单个的情况
    // 当前点击到了没有selected的图形，需要设置selected状态
    if (
      !Array.isArray(activeHoverElement) &&
      activeHoverElement?.selected === false
    ) {
      // 如果hover的图形有containerId，则hover其container
      const activeId =
        ('containerId' in activeHoverElement
          ? activeHoverElement.containerId
          : activeHoverElement.id) || activeHoverElement.id;

      setStaticDrawData((pre) =>
        pre.map((item) => {
          if (item.id === activeId) {
            addBatchUpdatedHistoryRecord({
              id: item.id,
              value: {
                payload: { selected: true },
                deleted: { selected: false },
              },
            });

            return {
              ...item,
              selected: true,
            };
          }
          return item;
        }),
      );
      return true;
    }

    if (collectSelectedElements(moveDataCache)) {
      return true;
    }

    // 移动图形
    moveDataCache.current.length &&
      setActiveDrawData((pre) =>
        pre.map((item) => {
          const activeMovingDrawItem = moveDataCache.current.find(
            (i) => i.id === item.id,
          );

          if (!activeMovingDrawItem) {
            return item;
          }

          return {
            ...activeMovingDrawItem,
            x: activeMovingDrawItem.x + moveCoordinate.x - startCoordinate.x,
            y: activeMovingDrawItem.y + moveCoordinate.y - startCoordinate.y,
          };
        }),
      );

    return true;
  };

  return { handleMoveElement };
};
