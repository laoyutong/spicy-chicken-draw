import {
  ARROW_DEG,
  ARROW_LENGTH,
  SELECTION_AREA_BG_COLOR,
  DRAW_SELECTION_GAP,
  SELECTION_RECT_WIDTH,
  TEXT_FONT_FAMILY,
  TEXT_FONT_SIZE,
  SELECTION_LINE_DASH,
} from "@/config";
import { DrawData, DrawType } from "@/types";
import { getDrawDataDis, splitContent } from ".";

type BaseDrawFn<T extends keyof DrawData> = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<DrawData, T>
) => void;

type DrawGraphFn = BaseDrawFn<"x" | "y" | "width" | "height">;

type DrawTextFn = BaseDrawFn<"x" | "y" | "content">;

const drawResizeRect = (
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    width,
    height,
    type,
  }: Pick<DrawData, "x" | "y" | "width" | "height" | "type">
) => {
  const gapX = width > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const gapY = height > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const x1 = x - gapX;
  const x2 = x + width + gapX;
  const y1 = y - gapY;
  const y2 = y + height + gapY;

  const rectWidth = width > 0 ? SELECTION_RECT_WIDTH : -SELECTION_RECT_WIDTH;
  const rectHeight = height > 0 ? SELECTION_RECT_WIDTH : -SELECTION_RECT_WIDTH;

  const getDrawRectParams = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => ({ x, y, width, height });

  if (type !== DrawType.text) {
    drawRect(ctx, getDrawRectParams(x1, y1, -rectWidth, -rectHeight));
    drawRect(ctx, getDrawRectParams(x2, y2, rectWidth, rectHeight));
    if (type !== DrawType.arrow) {
      drawRect(ctx, getDrawRectParams(x2, y1, rectWidth, -rectHeight));
      drawRect(ctx, getDrawRectParams(x1, y2, -rectWidth, rectHeight));
    }
  }
};

/** 绘制selected的选择框 */
const drawSelectedArea: (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<DrawData, "x" | "y" | "width" | "height" | "type">,
  options?: {
    withoutResizeRect?: boolean;
    isDashLine?: boolean;
  }
) => void = (ctx, { x, y, width, height, type }, options) => {
  const gapX = width > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const gapY = height > 0 ? DRAW_SELECTION_GAP : -DRAW_SELECTION_GAP;
  const x1 = x - gapX;
  const x2 = x + width + gapX;
  const y1 = y - gapY;
  const y2 = y + height + gapY;

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
    drawResizeRect(ctx, { x, y, width, height, type });
  ctx.stroke();
};

const drawRect: DrawGraphFn = (ctx, { x, y, width, height }) => {
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
};

const drawCircle: DrawGraphFn = (ctx, { x, y, width, height }) => {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const halfWidth = Math.abs(width / 2);
  const halfHeight = Math.abs(height / 2);

  const step = halfWidth > halfHeight ? 1 / halfWidth : 1 / halfHeight;
  ctx.moveTo(centerX + halfWidth, centerY);
  for (let i = 0; i < Math.PI * 2; i += step) {
    ctx.lineTo(
      centerX + halfWidth * Math.cos(i),
      centerY + halfHeight * Math.sin(i)
    );
  }
  ctx.closePath();
};

const drawDiamond: DrawGraphFn = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }
) => {
  ctx.moveTo(x + width / 2, y + height);
  ctx.lineTo(x + width, y + height / 2);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x, y + height / 2);
  ctx.closePath();
};

const drawSelection: DrawGraphFn = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }
) => {
  ctx.save();
  ctx.fillStyle = SELECTION_AREA_BG_COLOR;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

const drawArrow: DrawGraphFn = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }
) => {
  const arrowLength = Math.min(
    Math.pow(width * width + height * height, 1 / 2) / 2,
    ARROW_LENGTH
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

  ctx.moveTo(x, y);
  ctx.lineTo(targetX, targetY);
  ctx.lineTo(x1, y1);
  ctx.moveTo(targetX, targetY);
  ctx.lineTo(x2, y2);
};

const drawText: DrawTextFn = (ctx, { x, y, content }) => {
  if (!content?.trim()) {
    return;
  }
  ctx.textBaseline = "bottom";
  ctx.font = `${TEXT_FONT_SIZE}px  ${TEXT_FONT_FAMILY}`;
  const lines = splitContent(content);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + TEXT_FONT_SIZE * (index + 1));
  });
};

const drawGraph = (ctx: CanvasRenderingContext2D, drawData: DrawData) => {
  switch (drawData.type) {
    case DrawType.selection:
      drawSelection(ctx, drawData);
      return;
    case DrawType.rectangle:
      drawRect(ctx, drawData);
      return;
    case DrawType.circle:
      drawCircle(ctx, drawData);
      return;
    case DrawType.diamond:
      drawDiamond(ctx, drawData);
      return;
    case DrawType.arrow:
      drawArrow(ctx, drawData);
      return;
    case DrawType.text:
      drawText(ctx, drawData);
      return;
  }
};

const getContentArea = (data: DrawData[]): [number, number, number, number] => {
  let x1 = -Infinity;
  let y1 = -Infinity;
  let x2 = Infinity;
  let y2 = Infinity;

  data.forEach((d) => {
    const [minX, maxX, minY, maxY] = getDrawDataDis(d);

    if (maxX > x1) {
      x1 = maxX;
    }
    if (maxY > y1) {
      y1 = maxY;
    }
    if (minX < x2) {
      x2 = minX;
    }
    if (minY < y2) {
      y2 = minY;
    }
  });

  return [x1, x2, y1, y2];
};

const drawGraphs = (ctx: CanvasRenderingContext2D, data: DrawData[]) => {
  ctx.beginPath();
  data.forEach((item) => drawGraph(ctx, item));
  ctx.stroke();
};

const drawSelectedBorder = (
  ctx: CanvasRenderingContext2D,
  data: DrawData[]
) => {
  const selectedList = data.filter((item) => item.selected);

  const hasMultiSelectedELements = selectedList.length > 1;

  if (hasMultiSelectedELements) {
    const [maxX, minX, maxY, minY] = getContentArea(selectedList);

    drawSelectedArea(
      ctx,
      {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        type: DrawType.selection,
      },
      { isDashLine: true }
    );
  }

  selectedList.forEach((item) => {
    drawSelectedArea(ctx, item, {
      withoutResizeRect: hasMultiSelectedELements,
    });
  });
};

export const drawCanvas = (ctx: CanvasRenderingContext2D, data: DrawData[]) => {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawSelectedBorder(ctx, data);
  drawGraphs(ctx, data);
};
