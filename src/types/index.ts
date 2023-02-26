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

export interface DrawData {
  id: string;
  type: DrawType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  selected: boolean;
}
