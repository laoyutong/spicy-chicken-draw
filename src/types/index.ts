export const enum DrawType {
  selection = "selection",
  rectangle = "rectangle",
  circle = "circle",
  arrow = "arrow",
  text = "text",
  diamond = "diamond",
}

export type Coordinate = Record<"x" | "y", number>;
