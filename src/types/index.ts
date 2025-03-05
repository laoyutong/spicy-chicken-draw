import { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import type { RoughCanvas } from 'roughjs/bin/canvas';

export type { RoughCanvas };

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

export interface RoughGraphItem {
  seed: number;
}

export interface NormalGraphItem extends BaseGraphItem, RoughGraphItem {
  type: NormalGraphType;
  boundingElements?: BoundingElement[];
}

// TODO: 目前仅支持单纯的绘制能力
export interface ArrowGraphItem extends BaseGraphItem, RoughGraphItem {
  type: DrawType.arrow;
}

export interface TextGraphItem extends BaseGraphItem {
  type: DrawType.text;
  content: string;
  fontSize: number;
  textAlign: TextAlign;
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
  existElement?: TextGraphItem,
) => void;

export type SetDrawData = Dispatch<SetStateAction<GraphItem[]>>;

export type BaseDrawFn<T extends GraphItem, K extends keyof T = keyof T> = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<T, K>,
) => void;

type BasicGraphFields = 'x' | 'y' | 'width' | 'height';

export type BasicGraphData = Pick<GraphItem, BasicGraphFields>;

export type DrawGraphFn = (
  roughCanvas: RoughCanvas,
  drawData: Pick<NormalGraphItem, BasicGraphFields | 'seed'>,
) => void;

export type DrawTextFn = (
  ctx: CanvasRenderingContext2D,
  drawData: TextGraphItem,
) => void;

export const enum ResizePosition {
  top = 'TOP',
  bottom = 'BOTTOM',
}

export const enum TextAlign {
  left = 'left',
  center = 'center',
}

export type CanvasCtxRef = RefObject<CanvasRenderingContext2D | null>;

export type RoughCanvasRef = RefObject<RoughCanvas | null>;

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

export type CollectSelectedElementsFn = (
  drawDataList: MutableRefObject<GraphItem[]>,
) => boolean;

export type CollectUpdatedHistoryRecord = (
  dataCache: MutableRefObject<GraphItem[]>,
  handleDrawItem: (drawItem: GraphItem) => Partial<GraphItem>,
) => void;

export type TimeoutValue = ReturnType<typeof setTimeout>;
