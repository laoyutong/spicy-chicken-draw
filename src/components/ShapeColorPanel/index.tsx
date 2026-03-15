import cls from "classnames";
import { useAtomValue, useSetAtom } from "jotai";
import type { JSX } from "react";
import { flushSync } from "react-dom";
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  PRESET_COLORS,
  PRESET_FILL_COLORS,
  PRESET_STROKE_WIDTHS,
} from "@/config";
import {
  defaultFillColorAtom,
  defaultStrokeColorAtom,
  defaultStrokeWidthAtom,
} from "@/store";
import { DrawType, type GraphItem } from "@/types";
import { history } from "@/utils";
import { useDrawData } from "../Canvas/context/DrawDataContext";

const SHAPE_TYPES_WITH_STYLE = [
  DrawType.rectangle,
  DrawType.circle,
  DrawType.diamond,
  DrawType.arrow,
] as const;

const hasShapeStyle = (item: GraphItem) =>
  SHAPE_TYPES_WITH_STYLE.includes(
    item.type as (typeof SHAPE_TYPES_WITH_STYLE)[number],
  );

const canHaveStroke = (item: GraphItem) => hasShapeStyle(item);
const canHaveFill = (item: GraphItem) =>
  hasShapeStyle(item) && item.type !== DrawType.arrow;
const canHaveColor = (item: GraphItem) =>
  hasShapeStyle(item) || item.type === DrawType.text;

export const ShapeColorPanel = (): JSX.Element | null => {
  const {
    staticDrawData,
    setStaticDrawData,
    activeDrawData,
    setActiveDrawData,
  } = useDrawData();
  const setDefaultStroke = useSetAtom(defaultStrokeColorAtom);
  const setDefaultFill = useSetAtom(defaultFillColorAtom);
  const setDefaultStrokeWidth = useSetAtom(defaultStrokeWidthAtom);
  const defaultStrokeColor = useAtomValue(defaultStrokeColorAtom);

  const selectedItems = [
    ...staticDrawData.filter((item) => item.selected && canHaveColor(item)),
    ...activeDrawData.filter((item) => item.selected && canHaveColor(item)),
  ];

  // 检查是否有正在输入的文本（textarea 存在）
  const isEditingText =
    document.querySelector("textarea.spicy-draw-textarea") !== null;

  if (selectedItems.length === 0 && !isEditingText) {
    return null;
  }

  const strokeItems = selectedItems.filter((i) => canHaveStroke(i));
  const fillItems = selectedItems.filter((i) => canHaveFill(i));
  const textItems = selectedItems.filter((i) => i.type === DrawType.text);

  const getStroke = (item: GraphItem) =>
    "strokeColor" in item
      ? (item.strokeColor ?? DEFAULT_STROKE_COLOR)
      : DEFAULT_STROKE_COLOR;
  const getStrokeWidth = (item: GraphItem) =>
    "strokeWidth" in item
      ? (item.strokeWidth ?? DEFAULT_STROKE_WIDTH)
      : DEFAULT_STROKE_WIDTH;
  const getFill = (item: GraphItem) =>
    "fillColor" in item
      ? (item.fillColor ?? DEFAULT_FILL_COLOR)
      : DEFAULT_FILL_COLOR;
  const getTextColor = (item: GraphItem) =>
    "color" in item
      ? (item.color ?? DEFAULT_STROKE_COLOR)
      : DEFAULT_STROKE_COLOR;

  // 颜色统一：如果有图形用边框色，如果有文本用文本色
  const colorFromStroke =
    strokeItems.length > 0 &&
    strokeItems.every((i) => getStroke(i) === getStroke(strokeItems[0]))
      ? getStroke(strokeItems[0])
      : null;
  const colorFromText =
    textItems.length > 0 &&
    textItems.every((i) => getTextColor(i) === getTextColor(textItems[0]))
      ? getTextColor(textItems[0])
      : null;

  // 统一颜色值：如果图形和文本颜色相同，或只有一种类型被选中
  // 如果正在输入文本但没有选中文本，使用默认颜色
  const unifiedColor =
    colorFromStroke !== null && colorFromText !== null
      ? colorFromStroke === colorFromText
        ? colorFromStroke
        : null
      : (colorFromStroke ??
        colorFromText ??
        (isEditingText ? defaultStrokeColor : null));

  const fillColor =
    fillItems.length > 0 &&
    fillItems.every((i) => getFill(i) === getFill(fillItems[0]))
      ? getFill(fillItems[0])
      : null;
  const strokeWidth =
    strokeItems.length > 0 &&
    strokeItems.every((i) => getStrokeWidth(i) === getStrokeWidth(strokeItems[0]))
      ? getStrokeWidth(strokeItems[0])
      : null;
  const hasFill = fillItems.length > 0;
  const hasStroke = strokeItems.length > 0;

  const updateColor = (value: string) => {
    // 更新图形边框色
    const strokeUpdates = strokeItems.map((item) => ({
      id: item.id,
      value: {
        payload: { strokeColor: value },
        deleted: {
          strokeColor: (item as { strokeColor?: string }).strokeColor,
        },
      },
    }));
    // 更新文本颜色
    const textUpdates = textItems.map((item) => ({
      id: item.id,
      value: {
        payload: { color: value },
        deleted: { color: (item as { color?: string }).color },
      },
    }));
    const allUpdates = [...strokeUpdates, ...textUpdates];
    if (allUpdates.length) {
      history.collectUpdatedRecord(allUpdates);
    }
    const updateFn = (item: GraphItem) => {
      if (!item.selected) return item;
      if (canHaveStroke(item)) {
        return { ...item, strokeColor: value };
      }
      if (item.type === DrawType.text) {
        return { ...item, color: value };
      }
      return item;
    };
    flushSync(() => {
      setStaticDrawData((prev) => prev.map(updateFn));
      setActiveDrawData((prev) => prev.map(updateFn));
    });
    setDefaultStroke(value);
    // 如果有正在输入的 textarea，实时更新其颜色
    const textarea = document.querySelector(
      "textarea.spicy-draw-textarea",
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.style.color = value;
    }
  };

  const updateFill = (value: string) => {
    const toUpdate = selectedItems.filter((i) => canHaveFill(i));
    const updates = toUpdate.map((item) => ({
      id: item.id,
      value: {
        payload: { fillColor: value },
        deleted: { fillColor: (item as { fillColor?: string }).fillColor },
      },
    }));
    if (updates.length) {
      history.collectUpdatedRecord(updates);
    }
    const updateFn = (item: GraphItem) =>
      item.selected && canHaveFill(item) ? { ...item, fillColor: value } : item;
    flushSync(() => {
      setStaticDrawData((prev) => prev.map(updateFn));
      setActiveDrawData((prev) => prev.map(updateFn));
    });
    setDefaultFill(value);
  };

  const updateStrokeWidth = (value: number) => {
    const updates = strokeItems.map((item) => ({
      id: item.id,
      value: {
        payload: { strokeWidth: value },
        deleted: {
          strokeWidth: (item as { strokeWidth?: number }).strokeWidth,
        },
      },
    }));
    if (updates.length) {
      history.collectUpdatedRecord(updates);
    }
    const updateFn = (item: GraphItem) =>
      item.selected && canHaveStroke(item) ? { ...item, strokeWidth: value } : item;
    flushSync(() => {
      setStaticDrawData((prev) => prev.map(updateFn));
      setActiveDrawData((prev) => prev.map(updateFn));
    });
    setDefaultStrokeWidth(value);
  };

  const hasColor =
    strokeItems.length > 0 || textItems.length > 0 || isEditingText;

  return (
    <div
      data-ignore-draw
      className="fixed top-14 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 rounded bg-slate-50 shadow px-3 py-2"
    >
      {hasColor && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 shrink-0 w-8">绘制</span>
          <div className="flex items-center gap-1 flex-wrap">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onMouseDown={(e) => {
                  e.preventDefault(); // 阻止 textarea 失去焦点
                  updateColor(color);
                }}
                className={cls(
                  "w-6 h-6 rounded border-2 cursor-pointer transition-[border-color]",
                  unifiedColor !== null && unifiedColor === color
                    ? "border-slate-800 ring-1 ring-slate-400"
                    : "border-slate-200 hover:border-slate-400",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
      {hasFill && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 shrink-0 w-8">背景</span>
          <div className="flex items-center gap-1 flex-wrap">
            {PRESET_FILL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onMouseDown={(e) => {
                  e.preventDefault(); // 阻止 textarea 失去焦点
                  updateFill(color);
                }}
                className={cls(
                  "w-6 h-6 rounded border-2 cursor-pointer transition-[border-color]",
                  fillColor !== null && fillColor === color
                    ? "border-slate-800 ring-1 ring-slate-400"
                    : "border-slate-200 hover:border-slate-400",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
      {hasStroke && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 shrink-0 w-8">粗细</span>
          <div className="flex items-center gap-1 flex-wrap">
            {PRESET_STROKE_WIDTHS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // 阻止 textarea 失去焦点
                  updateStrokeWidth(value);
                }}
                className={cls(
                  "h-6 px-2 rounded border text-xs cursor-pointer transition-[border-color,color]",
                  strokeWidth !== null && strokeWidth === value
                    ? "border-slate-800 text-slate-900 bg-slate-100"
                    : "border-slate-200 text-slate-600 hover:border-slate-400",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
