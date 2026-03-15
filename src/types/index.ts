import type { Dispatch, RefObject, SetStateAction } from "react";
import type { RoughCanvas } from "roughjs/bin/canvas";

export type { RoughCanvas };

export enum DrawType {
  selection = "selection",
  rectangle = "rectangle",
  circle = "circle",
  arrow = "arrow",
  text = "text",
  diamond = "diamond",
  image = "image",
}

export enum CursorConfig {
  default = "default",
  crosshair = "crosshair",
  move = "move",
  grab = "grab",
  neswResize = "nesw-resize",
  nwseResize = "nwse-resize",
}

export type Coordinate = Record<"x" | "y", number>;

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

/** 支持边框和填充颜色的图形（矩形、圆、菱形、箭头） */
export interface ShapeStyle {
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框粗细 */
  strokeWidth?: number;
  /** 背景/填充颜色 */
  fillColor?: string;
}

export interface NormalGraphItem extends BaseGraphItem, RoughGraphItem, ShapeStyle {
  type: NormalGraphType;
  boundingElements?: BoundingElement[];
}

// TODO: 目前仅支持单纯的绘制能力
export interface ArrowGraphItem extends BaseGraphItem, RoughGraphItem, ShapeStyle {
  type: DrawType.arrow;
}

export interface TextGraphItem extends BaseGraphItem {
  type: DrawType.text;
  content: string;
  fontSize: number;
  textAlign: TextAlign;
  containerId?: string;
  /** 文本颜色 */
  color?: string;
}

export interface ImageGraphItem extends BaseGraphItem {
  type: DrawType.image;
  /** 图片的 base64 数据或 URL */
  src: string;
}

export type GraphItem =
  | TextGraphItem
  | NormalGraphItem
  | SelectionGraphItem
  | ArrowGraphItem
  | ImageGraphItem;

export type TextOnChangeEvent = (
  value: string,
  coordinate: Coordinate | null,
  container: NormalGraphItem | null,
  existElement?: TextGraphItem
) => void;

export type SetDrawData = Dispatch<SetStateAction<GraphItem[]>>;

export type BaseDrawFn<T extends GraphItem, K extends keyof T = keyof T> = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<T, K>
) => void;

type BasicGraphFields = "x" | "y" | "width" | "height";

export type BasicGraphData = Pick<GraphItem, BasicGraphFields>;

export type DrawGraphFn = (
  roughCanvas: RoughCanvas,
  drawData: Pick<
    NormalGraphItem,
    BasicGraphFields | "seed" | "strokeColor" | "strokeWidth" | "fillColor"
  >
) => void;

export type DrawTextFn = (
  ctx: CanvasRenderingContext2D,
  drawData: TextGraphItem,
  /** 有容器时用容器宽度做换行，避免缩放后仍按文本自身 width 换行导致多余换行 */
  wrapWidthOverride?: number
) => void;

export enum ResizePosition {
  top = "TOP",
  bottom = "BOTTOM",
}

export enum TextAlign {
  left = "left",
  center = "center",
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

export type TimeoutValue = ReturnType<typeof setTimeout>;
