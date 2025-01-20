import { Dispatch, RefObject, SetStateAction } from "react";

export const enum DrawType {
  selection = "selection",
  rectangle = "rectangle",
  circle = "circle",
  arrow = "arrow",
  text = "text",
  diamond = "diamond",
}

export const enum CursorConfig {
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
  type: DrawType.text | DrawType.arrow;
}

export interface DrawData {
  id: string;
  type: DrawType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  selected: boolean;
  containerId?: string;
  boundingElements?: BoundingElement[];
}

export type TextOnChangeEvent = (
  value: string,
  container: DrawData | null,
  existElement: DrawData | null
) => void;

export type SetDrawData = Dispatch<SetStateAction<DrawData[]>>;

export type BaseDrawFn<T extends keyof DrawData> = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<DrawData, T>
) => void;

export type BasicGraphFields = "x" | "y" | "width" | "height";

export type DrawGraphFn = BaseDrawFn<BasicGraphFields>;

export type DrawTextFn = BaseDrawFn<BasicGraphFields | "content">;

export type ResizePosition = "top" | "bottom";

export type CanvasCtxRef = RefObject<CanvasRenderingContext2D>;

export interface ResizeCursorResult {
  cursorConfig: CursorConfig;
  position: ResizePosition;
}
