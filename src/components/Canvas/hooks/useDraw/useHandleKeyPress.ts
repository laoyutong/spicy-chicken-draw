import { DrawData } from "@/types";
import { useKeyPress } from "ahooks";
import { Dispatch, SetStateAction } from "react";

/**
 * 处理画布的快捷键操作
 */
export const useHandleKeyPress = (
  setDrawData: Dispatch<SetStateAction<DrawData[]>>
) => {
  useKeyPress(["meta.a"], () =>
    setDrawData((pre) => pre.map((item) => ({ ...item, selected: true })))
  );

  useKeyPress(["Backspace"], () => {
    const boundingElements: string[] = [];
    setDrawData((pre) =>
      pre.filter((item) => {
        if (item.selected) {
          boundingElements.push(
            ...(item.boundingElements?.map((i) => i.id) ?? [])
          );
          return false;
        }
        return true;
      })
    );
    setDrawData((pre) =>
      pre.filter((item) => !boundingElements.some((i) => i === item.id))
    );
  });
};
