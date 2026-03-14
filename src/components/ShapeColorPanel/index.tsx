import cls from "classnames";
import { useSetAtom } from "jotai";
import type { JSX } from "react";
import { flushSync } from "react-dom";
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_COLOR,
  PRESET_FILL_COLORS,
  PRESET_STROKE_COLORS,
} from "@/config";
import { defaultFillColorAtom, defaultStrokeColorAtom } from "@/store";
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

export const ShapeColorPanel = (): JSX.Element | null => {
  const {
    staticDrawData,
    setStaticDrawData,
    activeDrawData,
    setActiveDrawData,
  } = useDrawData();
  const setDefaultStroke = useSetAtom(defaultStrokeColorAtom);
  const setDefaultFill = useSetAtom(defaultFillColorAtom);

  const selectedWithStyle = [
    ...staticDrawData.filter((item) => item.selected && hasShapeStyle(item)),
    ...activeDrawData.filter((item) => item.selected && hasShapeStyle(item)),
  ];

  if (selectedWithStyle.length === 0) {
    return null;
  }

  const strokeItems = selectedWithStyle.filter((i) => canHaveStroke(i));
  const fillItems = selectedWithStyle.filter((i) => canHaveFill(i));

  const getStroke = (item: GraphItem) =>
    "strokeColor" in item ? (item.strokeColor ?? DEFAULT_STROKE_COLOR) : DEFAULT_STROKE_COLOR;
  const getFill = (item: GraphItem) =>
    "fillColor" in item ? (item.fillColor ?? DEFAULT_FILL_COLOR) : DEFAULT_FILL_COLOR;

  const strokeColor =
    strokeItems.length > 0 &&
    strokeItems.every((i) => getStroke(i) === getStroke(strokeItems[0]))
      ? getStroke(strokeItems[0])
      : null;
  const fillColor =
    fillItems.length > 0 &&
    fillItems.every((i) => getFill(i) === getFill(fillItems[0]))
      ? getFill(fillItems[0])
      : null;
  const hasFill = fillItems.length > 0;

  const updateStroke = (value: string) => {
    const toUpdate = selectedWithStyle.filter((i) => canHaveStroke(i));
    const updates = toUpdate.map((item) => ({
      id: item.id,
      value: {
        payload: { strokeColor: value },
        deleted: {
          strokeColor: (item as { strokeColor?: string }).strokeColor,
        },
      },
    }));
    if (updates.length) {
      history.collectUpdatedRecord(updates);
    }
    const updateFn = (item: GraphItem) =>
      item.selected && canHaveStroke(item)
        ? { ...item, strokeColor: value }
        : item;
    flushSync(() => {
      setStaticDrawData((prev) => prev.map(updateFn));
      setActiveDrawData((prev) => prev.map(updateFn));
    });
    setDefaultStroke(value);
  };

  const updateFill = (value: string) => {
    const toUpdate = selectedWithStyle.filter((i) => canHaveFill(i));
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

  return (
    <div
      data-ignore-draw
      className="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2 rounded bg-slate-50 shadow px-3 py-2"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 shrink-0 w-8">边框</span>
        <div className="flex items-center gap-1 flex-wrap">
          {PRESET_STROKE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => updateStroke(color)}
              className={cls(
                "w-6 h-6 rounded border-2 cursor-pointer transition-[border-color]",
                strokeColor !== null && strokeColor === color
                  ? "border-slate-800 ring-1 ring-slate-400"
                  : "border-slate-200 hover:border-slate-400",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      {hasFill && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 shrink-0 w-8">填充</span>
          <div className="flex items-center gap-1 flex-wrap">
            {PRESET_FILL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => updateFill(color)}
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
    </div>
  );
};
