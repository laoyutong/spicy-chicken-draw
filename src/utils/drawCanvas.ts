import {
  SELECTION_AREA_BG_COLOR,
  DRAW_SELECTION_GAP,
  TEXT_FONT_FAMILY,
  SELECTION_LINE_DASH,
  SELECTION_BORDER_COLOR,
  ARROW_DEG,
  ARROW_LENGTH,
  DEFAULT_STROKE_STYLE,
} from '@/config';
import {
  GraphItem,
  DrawType,
  DrawGraphFn,
  DrawTextFn,
  TextAlign,
  RoughCanvas,
  BasicGraphData,
} from '@/types';
import { getContentArea, getResizeRectData, getTextLines } from '.';

const drawResizeRects = (
  ctx: CanvasRenderingContext2D,
  drawData: Pick<GraphItem, 'x' | 'y' | 'width' | 'height' | 'type'>,
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
  drawData: Pick<GraphItem, 'x' | 'y' | 'width' | 'height' | 'type'>,
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

const drawRect: DrawGraphFn = (roughCanvas, { x, y, width, height, seed }) => {
  roughCanvas.rectangle(x, y, width, height, {
    seed,
  });
};

const drawCircle: DrawGraphFn = (
  roughCanvas,
  { x, y, width, height, seed },
) => {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  roughCanvas.ellipse(centerX, centerY, width, height, {
    seed,
  });
};

const drawDiamond: DrawGraphFn = (
  roughCanvas,
  { x, y, width, height, seed },
) => {
  roughCanvas.polygon(
    [
      [x + width / 2, y],
      [x + width, y + height / 2],
      [x + width / 2, y + height],
      [x, y + height / 2],
    ],
    {
      seed,
    },
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

const drawArrow: DrawGraphFn = (roughCanvas, { x, y, width, height, seed }) => {
  const arrowLength = Math.min(
    Math.pow(width * width + height * height, 1 / 2) / 2,
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

  const roughOptions = { seed };
  roughCanvas.line(x, y, targetX, targetY, roughOptions);
  roughCanvas.line(targetX, targetY, x1, y1, roughOptions);
  roughCanvas.line(targetX, targetY, x2, y2, roughOptions);
};

const drawText: DrawTextFn = (
  ctx,
  { x, y, content, width, fontSize, textAlign },
) => {
  if (!content?.trim()) {
    return;
  }

  ctx.textBaseline = 'bottom';
  ctx.font = `${fontSize}px  ${TEXT_FONT_FAMILY}`;

  const lines = getTextLines(content);
  lines.forEach((line, index) => {
    let xCoordinate = 0;

    if (textAlign === TextAlign.left) {
      xCoordinate = x;
    }

    if (textAlign === TextAlign.center) {
      const { width: textWidth } = ctx.measureText(line);
      xCoordinate = x + (width - textWidth) / 2;
    }

    ctx.fillText(line, xCoordinate, y + fontSize * (index + 1));
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

const drawSelectedBorder = (
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
      { isDashLine: true },
    );
  }

  selectedList.forEach((item) => {
    drawSelectedArea(ctx, item, {
      withoutResizeRect: hasMultiSelectedELements,
    });
  });
};

export const drawCanvas = (
  ctx: CanvasRenderingContext2D,
  roughCanvas: RoughCanvas,
  data: GraphItem[],
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  drawSelectedBorder(ctx, data);

  ctx.beginPath();
  data.forEach((item) => drawGraph(ctx, roughCanvas, item));
  ctx.stroke();
};
