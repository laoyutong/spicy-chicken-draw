import {
  ARROW_DEG,
  ARROW_LENGTH,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_STYLE,
  DRAW_SELECTION_GAP,
  SELECTION_AREA_BG_COLOR,
  SELECTION_BORDER_COLOR,
  SELECTION_LINE_DASH,
  TEXT_FONT_FAMILY,
  TEXT_LINE_HEIGHT_RATIO,
} from "@/config";
import {
  type BasicGraphData,
  type DrawGraphFn,
  type DrawTextFn,
  DrawType,
  type GraphItem,
  type RoughCanvas,
  TextAlign,
} from "@/types";
import {
  getContentArea,
  getResizeRectData,
  getTextLines,
  getWrappedTextLines,
} from ".";

const drawResizeRects = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<GraphItem, "x" | "y" | "width" | "height" | "type">,
) => {
  const [startRect, endRect, xRect, yRect] = getResizeRectData(drawData);

  drawNormalRect(ctx, startRect);
  drawNormalRect(ctx, endRect);
  if (drawData.type !== DrawType.arrow) {
    drawNormalRect(ctx, xRect);
    drawNormalRect(ctx, yRect);
  }
};

/** 绘制selected的选择框 */
const drawSelectedArea: (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<GraphItem, "x" | "y" | "width" | "height" | "type">,
  options?: {
    withoutResizeRect?: boolean;
    isDashLine?: boolean;
  },
) => void = (ctx, { x, y, width, height, type }, options) => {
  const gapX = width > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const gapY = height > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const x1 = x - gapX;
  const x2 = x + width + gapX;
  const y1 = y - gapY;
  const y2 = y + height + gapY;

  ctx.strokeStyle = SELECTION_BORDER_COLOR;

  ctx.beginPath();
  options?.isDashLine && ctx.setLineDash(SELECTION_LINE_DASH);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x1, y2);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  !options?.withoutResizeRect &&
    drawResizeRects(ctx, { x, y, width, height, type });
  ctx.stroke();

  ctx.strokeStyle = DEFAULT_STROKE_STYLE;
};

const drawNormalRect = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }: BasicGraphData,
) => {
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
};

const getRoughOptions = (
  seed: number,
  strokeColor?: string,
  fillColor?: string,
) => ({
  seed,
  stroke: strokeColor ?? DEFAULT_STROKE_STYLE,
  fill: fillColor === "transparent" || !fillColor ? "none" : fillColor,
});

const drawRect: DrawGraphFn = (
  roughCanvas,
  { x, y, width, height, seed, strokeColor, fillColor },
) => {
  roughCanvas.rectangle(
    x,
    y,
    width,
    height,
    getRoughOptions(seed, strokeColor, fillColor),
  );
};

const drawCircle: DrawGraphFn = (
  roughCanvas,
  { x, y, width, height, seed, strokeColor, fillColor },
) => {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  roughCanvas.ellipse(
    centerX,
    centerY,
    width,
    height,
    getRoughOptions(seed, strokeColor, fillColor),
  );
};

const drawDiamond: DrawGraphFn = (
  roughCanvas,
  { x, y, width, height, seed, strokeColor, fillColor },
) => {
  roughCanvas.polygon(
    [
      [x + width / 2, y],
      [x + width, y + height / 2],
      [x + width / 2, y + height],
      [x, y + height / 2],
    ],
    getRoughOptions(seed, strokeColor, fillColor),
  );
};

const drawSelection = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }: BasicGraphData,
) => {
  ctx.save();
  ctx.fillStyle = SELECTION_AREA_BG_COLOR;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

const drawArrow: DrawGraphFn = (
  roughCanvas,
  { x, y, width, height, seed, strokeColor },
) => {
  const arrowLength = Math.min(
    (width * width + height * height) ** (1 / 2) / 2,
    ARROW_LENGTH,
  );
  const directionLength = height < 0 ? -arrowLength : arrowLength;
  const angle = Math.floor(180 / (Math.PI / Math.atan(width / height)));
  const angleA = angle + ARROW_DEG;
  const angleB = angle - ARROW_DEG;
  const targetX = x + width;
  const targetY = y + height;
  const x1 = targetX - directionLength * Math.sin((Math.PI * angleA) / 180);
  const y1 = targetY - directionLength * Math.cos((Math.PI * angleA) / 180);
  const x2 = targetX - directionLength * Math.sin((Math.PI * angleB) / 180);
  const y2 = targetY - directionLength * Math.cos((Math.PI * angleB) / 180);

  const roughOptions = {
    seed,
    stroke: strokeColor ?? DEFAULT_STROKE_STYLE,
  };
  roughCanvas.line(x, y, targetX, targetY, roughOptions);
  roughCanvas.line(targetX, targetY, x1, y1, roughOptions);
  roughCanvas.line(targetX, targetY, x2, y2, roughOptions);
};

const drawText: DrawTextFn = (
  ctx,
  { x, y, content, width, height, fontSize, textAlign, color },
) => {
  if (!content?.trim()) {
    return;
  }

  const absFontSize = Math.abs(fontSize);
  const lineHeight = absFontSize * TEXT_LINE_HEIGHT_RATIO;
  ctx.textBaseline = "middle";
  ctx.font = `${absFontSize}px  ${TEXT_FONT_FAMILY}`;
  ctx.fillStyle = color ?? DEFAULT_STROKE_COLOR;

  const wrapWidth = Math.abs(width);
  const lines =
    wrapWidth > 0
      ? getWrappedTextLines(content, wrapWidth, (s) => ctx.measureText(s).width)
      : getTextLines(content);
  const isFlippedY = height < 0;
  const isFlippedX = width < 0;

  // 使用 textBaseline="middle"，使文字中线对齐行中心
  // 行中心位置：y + lineHeight * (index + 0.5)
  lines.forEach((line, index) => {
    let xCoordinate = 0;

    if (textAlign === TextAlign.left) {
      xCoordinate = isFlippedX ? x + width : x;
    }

    if (textAlign === TextAlign.center) {
      const { width: textWidth } = ctx.measureText(line);
      xCoordinate = x + width / 2 - textWidth / 2;
    }

    const lineCenterY = isFlippedY
      ? y + height + lineHeight * (index + 0.5)
      : y + lineHeight * (index + 0.5);

    ctx.fillText(line, xCoordinate, lineCenterY);
  });
};

const drawGraph = (
  ctx: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas,
  drawData: GraphItem,
) => {
  switch (drawData.type) {
    case DrawType.selection:
      drawSelection(ctx, drawData);
      return;
    case DrawType.rectangle:
      drawRect(roughCanvas, drawData);
      return;
    case DrawType.circle:
      drawCircle(roughCanvas, drawData);
      return;
    case DrawType.diamond:
      drawDiamond(roughCanvas, drawData);
      return;
    case DrawType.arrow:
      drawArrow(roughCanvas, drawData);
      return;
    case DrawType.text:
      drawText(ctx, drawData);
      return;
  }
};

/** 仅绘制选区边框（不含缩放手柄） */
const drawSelectedOutlines = (
  ctx: CanvasRenderingContext2D,
  data: GraphItem[],
) => {
  const selectedList = data.filter((item) => item.selected);
  const hasMultiSelectedELements = selectedList.length > 1;

  if (hasMultiSelectedELements) {
    const [minX, maxX, minY, maxY] = getContentArea(selectedList);
    drawSelectedArea(
      ctx,
      {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        type: DrawType.selection,
      },
      { isDashLine: true, withoutResizeRect: true },
    );
  }

  selectedList.forEach((item) => {
    drawSelectedArea(ctx, item, {
      withoutResizeRect: true,
    });
  });
};

/** 仅绘制选区缩放手柄 */
const drawSelectedResizeHandles = (
  ctx: CanvasRenderingContext2D,
  data: GraphItem[],
) => {
  const selectedList = data.filter((item) => item.selected);
  const hasMultiSelectedELements = selectedList.length > 1;

  if (hasMultiSelectedELements) return;

  ctx.strokeStyle = SELECTION_BORDER_COLOR;
  selectedList.forEach((item) => {
    const { x, y, width, height, type } = item;
    ctx.beginPath();
    drawResizeRects(ctx, { x, y, width, height, type });
    ctx.stroke();
  });
  ctx.strokeStyle = DEFAULT_STROKE_STYLE;
};

export const drawCanvas = (
  ctx: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas,
  data: GraphItem[],
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const selectionItems = data.filter((i) => i.type === DrawType.selection);
  const shapeItems = data.filter((i) => i.type !== DrawType.selection);
  // 1. 框选矩形（底层，拖拽选区时）
  selectionItems.forEach((item) => drawGraph(ctx, roughCanvas, item));
  // 2. 选区边框（底层）
  ctx.save();
  drawSelectedOutlines(ctx, data);
  ctx.restore();
  // 3. 图形（中层，不被选区遮挡）
  shapeItems.forEach((item) => drawGraph(ctx, roughCanvas, item));
  // 4. 缩放手柄（顶层，便于点击）
  ctx.save();
  drawSelectedResizeHandles(ctx, data);
  ctx.restore();
};
