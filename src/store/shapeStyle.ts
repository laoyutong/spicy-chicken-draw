import { atom } from "jotai";
import { DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR } from "@/config";

/** 新绘制图形的默认边框/文本颜色 */
export const defaultStrokeColorAtom = atom(DEFAULT_STROKE_COLOR);

/** 新绘制图形的默认填充颜色 */
export const defaultFillColorAtom = atom(DEFAULT_FILL_COLOR);
