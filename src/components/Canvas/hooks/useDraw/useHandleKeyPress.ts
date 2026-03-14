import { useKeyPress } from "ahooks";
import { message } from "antd";
import { nanoid } from "nanoid";
import { useRef } from "react";
import { DrawType, type Coordinate, type GraphItem, type SetDrawData } from "@/types";
import { deleteImage, getContentArea, getSelectedItems, history, saveImage } from "@/utils";

interface UseHandleKeyPressParams {
  staticDrawData: GraphItem[];
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
      pre.map((item) => ({
        ...item,
        selected: "containerId" in item ? !item.containerId : true,
      }))
    )
  );

  // 删除
  useKeyPress(["Backspace"], () => {
    const selectedItems = getSelectedItems(staticDrawData);

    // 删除图片时同步清理 IndexedDB
    selectedItems.forEach((item) => {
      if (item.type === DrawType.image) {
        deleteImage(item.id).catch(console.error);
      }
    });

    history.collectRemovedRecord(selectedItems);

    setStaticDrawData((pre) =>
      pre.filter((item) => !selectedItems.some((i) => i.id === item.id))
    );
  });

  const copyData = useRef<GraphItem[]>([]);
  // 复制
  useKeyPress(["meta.c"], () => {
    const selectedItems = getSelectedItems(staticDrawData);
    copyData.current = selectedItems;
    if (selectedItems.length) {
      message.success("复制成功");
    }
  });

  // 粘贴
  useKeyPress(["meta.v"], async () => {
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
          selected: "containerId" in item ? !item.containerId : true,
        };
      })
      // 替换容器和绑定元素的id
      .map((item) => ({
        ...item,
        containerId:
          "containerId" in item && item.containerId
            ? idsMap[item.containerId]
            : undefined,
        boundingElements:
          "boundingElements" in item
            ? item.boundingElements?.map((item) => ({
                ...item,
                id: idsMap[item.id],
              }))
            : undefined,
      }));

    // 复制图片数据到 IndexedDB
    for (const item of pasteData) {
      if (item.type === DrawType.image && (item as { src?: string }).src) {
        await saveImage(item.id, (item as { src: string }).src);
      }
    }

    history.collectAddedRecord(pasteData);

    setStaticDrawData((pre) => [
      ...pre.map((item) => ({ ...item, selected: false })),
      ...pasteData,
    ]);
  });

  // 撤回
  useKeyPress(["meta.z"], (e) => {
    e.preventDefault();
    const result = history.undo(staticDrawData);
    result && setStaticDrawData(result);
  });

  // 重做
  useKeyPress(["meta.y"], (e) => {
    e.preventDefault();
    const result = history.redo(staticDrawData);
    result && setStaticDrawData(result);
  });
};
