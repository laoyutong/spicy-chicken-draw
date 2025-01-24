import { useRef } from "react";
import { message } from "antd";
import { nanoid } from "nanoid";
import { useKeyPress } from "ahooks";
import { Coordinate, DrawData, SetDrawData } from "@/types";
import { getContentArea, getSelectedItems, history } from "@/utils";

interface UseHandleKeyPressParams {
  staticDrawData: DrawData[];
  setStaticDrawData: SetDrawData;
  moveCoordinate: Coordinate;
}

/**
 * 处理画布的快捷键操作
 */
export const useHandleKeyPress = ({
  staticDrawData,
  setStaticDrawData,
  moveCoordinate,
}: UseHandleKeyPressParams) => {
  // 全选
  useKeyPress(["meta.a"], () =>
    setStaticDrawData((pre) =>
      pre.map((item) => ({ ...item, selected: !item.containerId }))
    )
  );

  // 删除
  useKeyPress(["Backspace"], () => {
    const selectedItems = getSelectedItems(staticDrawData);

    history.collectRemovedRecord(selectedItems);

    setStaticDrawData((pre) =>
      pre.filter((item) => !selectedItems.some((i) => i.id === item.id))
    );
  });

  const copyData = useRef<DrawData[]>([]);
  // 复制
  useKeyPress(["meta.c"], () => {
    const selectedItems = getSelectedItems(staticDrawData);
    copyData.current = selectedItems;
    if (selectedItems.length) {
      message.success("复制成功");
    }
  });

  // 粘贴
  useKeyPress(["meta.v"], () => {
    if (!copyData.current.length) {
      return;
    }

    const [minX, maxX, minY, maxY] = getContentArea(copyData.current);
    const offsetX = moveCoordinate.x - (minX + maxX) / 2;
    const offsetY = moveCoordinate.y - (minY + maxY) / 2;

    // 记录复制和粘贴的id映射
    const idsMap: Record<string, string> = {};

    const pasteData = copyData.current
      // 坐标的计算、记录id的映射
      .map((item) => {
        const newId = nanoid();
        idsMap[item.id] = newId;
        return {
          ...item,
          id: newId,
          x: item.x + offsetX,
          y: item.y + offsetY,
          selected: !item.containerId,
        };
      })
      // 替换容器和绑定元素的id
      .map((item) => ({
        ...item,
        containerId: item.containerId ? idsMap[item.containerId] : undefined,
        boundingElements: item.boundingElements?.map((item) => ({
          ...item,
          id: idsMap[item.id],
        })),
      }));

    history.collectAddedRecord(pasteData);

    setStaticDrawData((pre) => [
      ...pre.map((item) => ({ ...item, selected: false })),
      ...pasteData,
    ]);
  });

  // 撤回
  useKeyPress(["meta.z"], () => {
    const result = history.undo(staticDrawData);
    result && setStaticDrawData(result);
  });

  // 重做
  useKeyPress(["meta.shift.z"], () => {
    // TODO
  });
};
