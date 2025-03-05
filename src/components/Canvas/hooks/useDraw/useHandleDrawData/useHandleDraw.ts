import { MIN_DRAW_DIS } from '@/config';
import { drawTypeAtom } from '@/store';
import {
  Coordinate,
  DrawType,
  GraphItem,
  HistoryUpdatedRecordData,
  NormalGraphType,
  SetDrawData,
  TextGraphItem,
} from '@/types';
import { getMaxDis, getMinDis, handleDrawItem, history } from '@/utils';
import { useAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { useRef } from 'react';

interface UseHandleDrawParams {
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  staticDrawData: GraphItem[];
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
}
/**
 * 绘制图形的处理
 */
export const useHandleDraw = ({
  startCoordinate,
  moveCoordinate,
  staticDrawData,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleDrawParams) => {
  const workingDrawData = useRef<Exclude<GraphItem, TextGraphItem> | null>(
    null,
  );

  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  const handleDrawElement = () => {
    if (!startCoordinate) {
      // 处理绘制结果
      if (workingDrawData.current) {
        // selection不需要绘制、text在createTextOnChange里绘制
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type,
          ) &&
          (Math.abs(workingDrawData.current.width) >= MIN_DRAW_DIS ||
            Math.abs(workingDrawData.current.height) >= MIN_DRAW_DIS)
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const copyWorkingDrawData: GraphItem = {
            ...workingDrawData.current,
            selected: true,
          };

          const handledDrawItem = handleDrawItem(copyWorkingDrawData);
          history.collectAddedRecord([handledDrawItem]);

          setStaticDrawData((pre) => [...pre, handledDrawItem]);
        }

        if (workingDrawData.current.type === DrawType.selection) {
          const selectedList = staticDrawData.filter((item) => item.selected);
          if (selectedList.length) {
            const historyUpdatedRecordData: HistoryUpdatedRecordData = [];
            selectedList.forEach((selectedItem) => {
              historyUpdatedRecordData.push({
                id: selectedItem.id,
                value: {
                  payload: { selected: true },
                  deleted: { selected: false },
                },
              });
            });
            history.collectUpdatedRecord(historyUpdatedRecordData);
          }
        }

        setActiveDrawData([]);
        workingDrawData.current = null;
        setDrawType(DrawType.selection);
      }
      return false;
    }

    // 初始化 workingDrawData
    if (!workingDrawData.current) {
      workingDrawData.current = {
        id: nanoid(),
        type: drawType as NormalGraphType,
        width: 0,
        height: 0,
        selected: false,
        seed: Math.ceil(Math.random() * 100000),
        ...startCoordinate,
      };
      return true;
    }

    // 移动过程中实时更改 workingDrawData 的 width 和 height
    workingDrawData.current.width = moveCoordinate.x - startCoordinate.x;
    workingDrawData.current.height = moveCoordinate.y - startCoordinate.y;
    setActiveDrawData([workingDrawData.current]);

    // 对selection范围内的图形设置selected
    if (drawType === DrawType.selection) {
      const copyWorkingDrawData = workingDrawData.current;
      setStaticDrawData((pre) =>
        pre.map((item) => {
          // 绑定的元素不需要selected状态，在具体操作的时候处理
          if ('containerId' in item && item.containerId) {
            return item;
          }

          const isInSelectionArea =
            getMinDis(item.x, item.width) >=
              getMinDis(copyWorkingDrawData.x, copyWorkingDrawData.width) &&
            getMaxDis(item.x, item.width) <=
              getMaxDis(copyWorkingDrawData.x, copyWorkingDrawData.width) &&
            getMinDis(item.y, item.height) >=
              getMinDis(copyWorkingDrawData.y, copyWorkingDrawData.height) &&
            getMaxDis(item.y, item.height) <=
              getMaxDis(copyWorkingDrawData.y, copyWorkingDrawData.height);

          return {
            ...item,
            selected: isInSelectionArea,
          };
        }),
      );
    }

    return true;
  };

  return {
    handleDrawElement,
  };
};
