import { Dispatch, RefObject, SetStateAction } from 'react';

export const enum DrawType {
  selection = 'selection',
  rectangle = 'rectangle',
  circle = 'circle',
  arrow = 'arrow',
  text = 'text',
  diamond = 'diamond',
}

export const enum CursorConfig {
  default = 'default',
  crosshair = 'crosshair',
  move = 'move',
  grab = 'grab',
  neswResize = 'nesw-resize',
  nwseResize = 'nwse-resize',
}

export type Coordinate = Record<'x' | 'y', number>;

export interface BoundingElement {
  id: string;
  // TODO: 待支持 arrow 的绑定能力
  type: DrawType.text;
}

interface BaseGraphItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  selected: boolean;
}

export interface SelectionGraphItem extends BaseGraphItem {
  type: DrawType.selection;
}

export type NormalGraphType =
  | DrawType.circle
  | DrawType.diamond
  | DrawType.rectangle;

export interface NormalGraphItem extends BaseGraphItem {
  type: NormalGraphType;
  boundingElements?: BoundingElement[];
}

// TODO: 目前仅支持单纯的绘制能力
export interface ArrowGraphItem extends BaseGraphItem {
  type: DrawType.arrow;
}

export interface TextGraphItem extends BaseGraphItem {
  type: DrawType.text;
  content: string;
  fontSize: number;
  containerId?: string;
}

export type GraphItem =
  | TextGraphItem
  | NormalGraphItem
  | SelectionGraphItem
  | ArrowGraphItem;

export type TextOnChangeEvent = (
  value: string,
  coordinate: Coordinate | null,
  container: NormalGraphItem | null,
  existElement: TextGraphItem | null,
) => void;

export type SetDrawData = Dispatch<SetStateAction<GraphItem[]>>;

export type BaseDrawFn<T extends GraphItem, K extends keyof T> = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<T, K>,
) => void;

export type BasicGraphFields = 'x' | 'y' | 'width' | 'height';

export type DrawGraphFn = BaseDrawFn<NormalGraphItem, BasicGraphFields>;

export type DrawTextFn = BaseDrawFn<
  TextGraphItem,
  BasicGraphFields | 'content' | 'fontSize'
>;

export type ResizePosition = 'top' | 'bottom';

export type CanvasCtxRef = RefObject<CanvasRenderingContext2D | null>;

export interface ResizeCursorResult {
  cursorConfig: CursorConfig;
  position: ResizePosition;
}

export type HistoryOperationMapValue = {
  payload?: Partial<GraphItem>;
  deleted?: Partial<GraphItem>;
};

export type HistoryOperationMap = Map<string, HistoryOperationMapValue>;

export type HistoryUpdatedRecordData = {
  id: string;
  value: HistoryOperationMapValue;
}[];

export type HistoryRecord = {
  added?: HistoryOperationMap;
  removed?: HistoryOperationMap;
  updated?: HistoryOperationMap;
};

export type HistoryStack = HistoryRecord[];
