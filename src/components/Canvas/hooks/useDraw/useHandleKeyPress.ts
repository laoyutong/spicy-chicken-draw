import { useKeyPress } from "ahooks";
import { DrawData, SetDrawData } from "@/types";
import { getSelectedItems } from "@/utils";

interface UseHandleKeyPressParams {
  staticDrawData: DrawData[];
  setStaticDrawData: SetDrawData;
}

/**
 * 处理画布的快捷键操作
 */
export const useHandleKeyPress = ({
  staticDrawData,
  setStaticDrawData,
}: UseHandleKeyPressParams) => {
  useKeyPress(["meta.a"], () =>
    setStaticDrawData((pre) => pre.map((item) => ({ ...item, selected: true })))
  );

  useKeyPress(["Backspace"], () => {
    const selectedItems = getSelectedItems(staticDrawData);
    setStaticDrawData((pre) =>
      pre.filter((item) => !selectedItems.some((i) => i.id === item.id))
    );
  });
};
