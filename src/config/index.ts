import { DrawType } from "@/types";

export const ARROW_DEG = 30;

export const ARROW_LENGTH = 30;

export const SELECTION_AREA_BG_COLOR = "rgba(255,165,0,0.5)";

export const TEXT_FONT_SIZE = 15;

export const TEXTAREA_PER_HEIGHT = TEXT_FONT_SIZE + 3;

export const TEXT_FONT_FAMILY = "Segoe UI Emoji";

export const LOCAL_STORAGE_KEY = "SPICY_CHICKEN_DRAW";

export const CALCULATE_SELECTION_GAP = 5;

export const DRAW_SELECTION_GAP = 3;

export const MIN_DRAW_DIS = 3;

export const SELECTION_RECT_WIDTH = 8;

export const SELECTION_LINE_DASH = [15, 10];

export const TEXT_BOUND_GAP = 10;

export const HAS_BOUNDING_ELEMENTS_LIST = [
  DrawType.circle,
  DrawType.diamond,
  DrawType.rectangle,
];
