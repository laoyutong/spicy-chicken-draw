import { DrawType } from "@/types";
import {
  Click,
  RectangleOne,
  Round,
  DiamondThree,
  FontSizeTwo,
  ArrowRight,
} from "@icon-park/react";

export const ICON_LIST = [
  { type: DrawType.selection, Icon: Click },
  { type: DrawType.rectangle, Icon: RectangleOne },
  { type: DrawType.circle, Icon: Round },
  { type: DrawType.diamond, Icon: DiamondThree },
  { type: DrawType.text, Icon: FontSizeTwo },
  { type: DrawType.arrow, Icon: ArrowRight },
];
