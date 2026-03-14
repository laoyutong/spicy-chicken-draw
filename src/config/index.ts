import { DrawType } from "@/types";

export const ARROW_DEG = 30;

export const ARROW_LENGTH = 30;

export const DEFAULT_STROKE_STYLE = "#000";

/** 图形默认边框颜色 */
export const DEFAULT_STROKE_COLOR = "#000";

/** 图形默认填充颜色（纯色） */
export const DEFAULT_FILL_COLOR = "#ffffff";

/** 边框/线条/文本统一可选预设颜色（6 个） */
export const PRESET_COLORS = [
  "#000000",
  "#64748b",
  "#e53e3e",
  "#3182ce",
  "#38a169",
  "#d69e2e",
] as const;

/** 填充可选预设颜色（6 个纯色） */
export const PRESET_FILL_COLORS = [
  "#ffffff",
  "#e2e8f0",
  "#feb2b2",
  "#90cdf4",
  "#9ae6b4",
  "#fbd38d",
] as const;

/** 框选区域背景色（半透明，不遮挡底层图形） */
export const SELECTION_AREA_BG_COLOR = "rgba(224, 223, 255, 0.35)";

export const SELECTION_BORDER_COLOR = "rgb(105, 101, 219)";

export const DEFAULT_TEXT_FONT_SIZE = 15;

export const TEXT_FONT_FAMILY = "Segoe UI Emoji";

export const APP_KEY = "SPICY_CHICKEN_DRAW";

export const CALCULATE_SELECTION_GAP = 5;

export const DRAW_SELECTION_GAP = 3;

export const MIN_DRAW_DIS = 3;

/** 含文本图形缩放时，低于此尺寸（宽或高）允许翻转（宽高可为负） */
export const MIN_TEXT_FLIP_SIZE = 20;

/** 文本翻转后字体大小下限，避免过小不可读 */
export const MIN_TEXT_FONT_SIZE = 12;

export const SELECTION_RECT_WIDTH = 8;

export const SELECTION_LINE_DASH = [3, 2];

export const TEXT_BOUND_GAP = 10;

/** 文本行高相对字号的倍数，避免换行时行间重叠或被裁切 */
export const TEXT_LINE_HEIGHT_RATIO = 1.2;

export const EXPORT_IMAGE_GAP = 30;

export const EXPORT_IMAGE_BACKGROUND_COLOR = "#fff";

/** 画布背景纯色 */
export const CANVAS_BACKGROUND_COLOR = "#ffffff";

export const HAS_BOUNDING_ELEMENTS_LIST = [
  DrawType.circle,
  DrawType.diamond,
  DrawType.rectangle,
];

export const OPERATION_TOOL_KEY = {
  clear: "CLEAR",
  import: "IMPORT",
  export: "EXPORT",
  exportImage: "EXPORT_IMAGE",
};

export const ICON_PROPS = {
  theme: "outline",
  size: "20",
  fill: "#333",
} as const;
