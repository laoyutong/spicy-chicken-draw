import {
  ArrowRight,
  Click,
  DiamondThree,
  FontSizeTwo,
  RectangleOne,
  Round,
} from "@icon-park/react";
import { DrawType } from "@/types";

export const ICON_LIST = [
  { type: DrawType.selection, Icon: Click },
  { type: DrawType.rectangle, Icon: RectangleOne },
  { type: DrawType.circle, Icon: Round },
  { type: DrawType.diamond, Icon: DiamondThree },
  { type: DrawType.text, Icon: FontSizeTwo },
  { type: DrawType.arrow, Icon: ArrowRight },
];
