import { ARROW_DEG, ARROW_LENGTH } from "@/config";
import { DrawData, DrawType } from "@/types";

type DrawDetailTypeFn = (
  ctx: CanvasRenderingContext2D,
  drawData: DrawData
) => void;

const drawRect: DrawDetailTypeFn = (ctx, { x, y, width, height }) => {
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.closePath();
};

const drawCircle: DrawDetailTypeFn = (ctx, { x, y, width, height }) => {
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

const drawDiamond: DrawDetailTypeFn = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }
) => {
  ctx.moveTo(x + width / 2, y + height);
  ctx.lineTo(x + width, y + height / 2);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x, y + height / 2);
  ctx.closePath();
};

const drawSelection: DrawDetailTypeFn = (
  ctx: CanvasRenderingContext2D,
  { x, y, width, height }
) => {
  ctx.save();
  ctx.fillStyle = "rgba(255,165,0,0.5)";
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

const drawArrow: DrawDetailTypeFn = (
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
  }
};

export const drawCanvas = (ctx: CanvasRenderingContext2D, data: DrawData[]) => {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.beginPath();
  data.forEach((item) => {
    drawGraph(ctx, item);
  });
  ctx.stroke();
};
