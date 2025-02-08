import { DrawType } from '@/types';

export const ARROW_DEG = 30;

export const ARROW_LENGTH = 30;

export const DEFAULT_STROKE_STYLE = '#000';

export const SELECTION_AREA_BG_COLOR = 'rgb(224, 223, 255)';

export const SELECTION_BORDER_COLOR = 'rgb(105, 101, 219)';

export const DEFAULT_TEXT_FONT_SIZE = 15;

export const TEXT_FONT_FAMILY = 'Segoe UI Emoji';

export const APP_KEY = 'SPICY_CHICKEN_DRAW';

export const CALCULATE_SELECTION_GAP = 5;

export const DRAW_SELECTION_GAP = 3;

export const MIN_DRAW_DIS = 3;

export const SELECTION_RECT_WIDTH = 8;

export const SELECTION_LINE_DASH = [3, 2];

export const TEXT_BOUND_GAP = 10;

export const EXPORT_IMAGE_GAP = 30;

export const EXPORT_IMAGE_BACKGROUND_COLOR = '#fff';

export const HAS_BOUNDING_ELEMENTS_LIST = [
  DrawType.circle,
  DrawType.diamond,
  DrawType.rectangle,
];

export const OPERATION_TOOL_KEY = {
  clear: 'CLEAR',
  import: 'IMPORT',
  export: 'EXPORT',
  exportImage: 'EXPORT_IMAGE',
};

export const ICON_PROPS = {
  theme: 'outline',
  size: '20',
  fill: '#333',
} as const;
