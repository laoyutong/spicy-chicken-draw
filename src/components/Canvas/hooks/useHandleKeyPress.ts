import { DrawData } from "@/types";
import { useKeyPress } from "ahooks";
import { Dispatch, SetStateAction } from "react";

export const useHandleKeyPress = (
  setDrawData: Dispatch<SetStateAction<DrawData[]>>
) => {
  useKeyPress(["meta.a"], () =>
    setDrawData((pre) => pre.map((item) => ({ ...item, selected: true })))
  );

  useKeyPress(["Backspace"], () =>
    setDrawData((pre) => pre.filter((item) => !item.selected))
  );
};
