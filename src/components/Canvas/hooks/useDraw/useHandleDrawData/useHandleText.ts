import { useSetAtom } from "jotai";
import { nanoid } from "nanoid";
import { useRef } from "react";
import {
  DEFAULT_TEXT_FONT_SIZE,
  TEXT_BOUND_GAP,
  TEXT_FONT_FAMILY,
  TEXT_LINE_HEIGHT_RATIO,
} from "@/config";
import { cursorPointAtom, drawTypeAtom } from "@/store";
import {
  type BoundingElement,
  type Coordinate,
  CursorConfig,
  DrawType,
  type GraphItem,
  type HistoryUpdatedRecordData,
  type NormalGraphItem,
  type SetDrawData,
  TextAlign,
  type TextGraphItem,
  type TextOnChangeEvent,
} from "@/types";
import {
  createText,
  getExistTextElement,
  getTextContainer,
  getTextLines,
  getWrappedTextLines,
  history,
} from "@/utils";

interface UseHandleTextParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
}

export const useHandleText = ({
  staticDrawData,
  activeDrawData,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleTextParams) => {
  const textareaElement = useRef<HTMLTextAreaElement | null>(null);
  /** 输入过程中当前容器（实时调整图形时保持中心不变，用 ref 追踪最新尺寸） */
  const containerRef = useRef<NormalGraphItem | null>(null);

  const setDrawType = useSetAtom(drawTypeAtom);
  const setCursorPoint = useSetAtom(cursorPointAtom);

  const createTextOnChange: TextOnChangeEvent = (
    textValue,
    coordinate,
    container,
    existElement
  ) => {
    if (textValue.trim() && (coordinate || existElement)) {
      let maxWidth = 0;
      const canvas = document.createElement("canvas");
      const canvasCtx = canvas.getContext("2d");
      const finalFontSizeValue =
        existElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;

      const baseContainerForMeasure = container
        ? (containerRef.current ?? container)
        : null;
      const wrapWidth = baseContainerForMeasure
        ? Math.abs(baseContainerForMeasure.width)
        : 0;

      const lines =
        wrapWidth > 0 && canvasCtx
          ? (() => {
              canvasCtx.font = `${finalFontSizeValue}px  ${TEXT_FONT_FAMILY}`;
              return getWrappedTextLines(
                textValue,
                wrapWidth,
                (s) => canvasCtx!.measureText(s).width
              );
            })()
          : getTextLines(textValue);

      if (canvasCtx) {
        canvasCtx.font = `${finalFontSizeValue}px  ${TEXT_FONT_FAMILY}`;
        lines.forEach((line) => {
          const { width } = canvasCtx.measureText(line);
          if (width > maxWidth) {
            maxWidth = width;
          }
        });
      }

      const textareaHeight =
        finalFontSizeValue * lines.length * TEXT_LINE_HEIGHT_RATIO;

      // 优先使用编辑过程中实时更新过的容器，保证创建完成后的图形位置与编辑时一致
      const baseContainer = container
        ? (containerRef.current ?? container)
        : null;
      let finalContainer: NormalGraphItem | null = baseContainer;
      // 仅当未经过 onInput 更新（仍为初始 container）时才做扩大计算，避免重复计算导致位置跳动
      if (baseContainer && baseContainer === container) {
        const needW = maxWidth + TEXT_BOUND_GAP;
        const needH = textareaHeight + TEXT_BOUND_GAP;
        const absW = Math.abs(baseContainer.width);
        const absH = Math.abs(baseContainer.height);
        const expandW = absW < needW;
        const expandH = absH < needH;
        if (expandW || expandH) {
          const newWidth =
            baseContainer.width >= 0
              ? Math.max(baseContainer.width, needW)
              : -Math.max(absW, needW);
          const newHeight =
            baseContainer.height >= 0
              ? Math.max(baseContainer.height, needH)
              : -Math.max(absH, needH);
          finalContainer = {
            ...baseContainer,
            width: newWidth,
            height: newHeight,
          };
        }
      }

      // 与 drawText 一致：首行视觉顶部在 y+lineHeight-fontSize，需与编辑时 textarea top 一致，故 y 多减 (lineHeight - fontSize)
      const lineHeight =
        finalFontSizeValue * TEXT_LINE_HEIGHT_RATIO;
      const textYOffset = lineHeight - finalFontSizeValue;
      const textProperty = finalContainer
        ? {
            x: finalContainer.x + (finalContainer.width - maxWidth) / 2,
            y:
              finalContainer.y +
              finalContainer.height / 2 -
              textareaHeight / 2 -
              textYOffset,
          }
        : existElement
          ? { x: existElement.x, y: existElement.y }
          : (coordinate as Coordinate);

      const newTextId = existElement ? existElement.id : nanoid();

      const textElement: TextGraphItem = {
        id: newTextId,
        type: DrawType.text,
        content: textValue,
        width: maxWidth,
        selected: false,
        height: textareaHeight,
        fontSize: finalFontSizeValue,
        textAlign:
          existElement?.textAlign ||
          (finalContainer ? TextAlign.center : TextAlign.left),
        ...textProperty,
        ...(finalContainer ? { containerId: finalContainer.id } : {}),
      };

      const updatedHistoryValue: HistoryUpdatedRecordData = [];
      const newContainerBoundingElements = [
        ...(finalContainer?.boundingElements || []),
        {
          id: newTextId,
          type: DrawType.text,
        } as BoundingElement,
      ];

      if (existElement) {
        updatedHistoryValue.push({
          id: newTextId,
          value: {
            deleted: {
              content: existElement.content,
            },
            payload: {
              content: textElement.content,
            },
          },
        });
        history.collectUpdatedRecord(updatedHistoryValue);
      } else {
        if (finalContainer && container) {
          updatedHistoryValue.push({
            id: finalContainer.id,
            value: {
              deleted: {
                boundingElements: container.boundingElements,
                ...(finalContainer !== container
                  ? { x: container.x, y: container.y, width: container.width, height: container.height }
                  : {}),
              },
              payload: {
                boundingElements: newContainerBoundingElements,
                ...(finalContainer !== container
                  ? { x: finalContainer.x, y: finalContainer.y, width: finalContainer.width, height: finalContainer.height }
                  : {}),
              },
            },
          });
        }
        history.collectAddedRecord([textElement], updatedHistoryValue);
      }

      setStaticDrawData((pre) => {
        const preDrawData = finalContainer
          ? [
              ...pre.filter((item) => item.id !== finalContainer!.id),
              {
                ...finalContainer,
                boundingElements: newContainerBoundingElements,
              },
            ]
          : pre;

        return [...preDrawData, textElement];
      });
    }

    textareaElement.current = null;
  };

  const handleText = (coordinate: Coordinate | null) => {
    if (!coordinate) {
      return;
    }

    // 双击时会触发collectSelectedElements，所以也需要将activeDrawData包含在内
    const findTextElementDataSource = [...staticDrawData, ...activeDrawData];

    const existTextElement = getExistTextElement(
      coordinate,
      findTextElementDataSource
    );

    const containerElement = existTextElement
      ? (findTextElementDataSource.find(
          (item) => item.id === existTextElement?.containerId
        ) as NormalGraphItem) || null
      : getTextContainer(coordinate, staticDrawData);

    containerRef.current = containerElement;

    const onInput = (textContent: string) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (!textareaElement.current) {
        const textareaSelector = document.querySelector("textarea");
        if (!textareaSelector) {
          return;
        }
        textareaElement.current = textareaSelector;
      }

      const finalFontSize =
        existTextElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;
      const wrapWidth = Math.abs(container.width);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const lines =
        wrapWidth > 0 && ctx
          ? (() => {
              ctx.font = `${finalFontSize}px ${TEXT_FONT_FAMILY}`;
              return getWrappedTextLines(
                textContent,
                wrapWidth,
                (s) => ctx!.measureText(s).width
              );
            })()
          : getTextLines(textContent);

      const textHeight =
        finalFontSize * lines.length * TEXT_LINE_HEIGHT_RATIO;
      let maxWidth = 0;
      if (ctx && (lines.length > 0 && (lines.length > 1 || lines[0] !== ""))) {
        ctx.font = `${finalFontSize}px ${TEXT_FONT_FAMILY}`;
        lines.forEach((line) => {
          const { width } = ctx.measureText(line);
          if (width > maxWidth) maxWidth = width;
        });
      }

      const needW = maxWidth + TEXT_BOUND_GAP;
      const needH = textHeight + TEXT_BOUND_GAP;
      const absW = Math.abs(container.width);
      const absH = Math.abs(container.height);
      const newWidth =
        container.width >= 0
          ? Math.max(container.width, needW)
          : -Math.max(absW, needW);
      const newHeight =
        container.height >= 0
          ? Math.max(container.height, needH)
          : -Math.max(absH, needH);
      const centerX = container.x + container.width / 2;
      const centerY = container.y + container.height / 2;
      const newX = centerX - newWidth / 2;
      const newY = centerY - newHeight / 2;

      const updatedContainer: NormalGraphItem = {
        ...container,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      containerRef.current = updatedContainer;

      const updateContainerInData = (item: GraphItem) =>
        item.id === container.id ? { ...item, ...updatedContainer } : item;
      setStaticDrawData((pre) => pre.map(updateContainerInData));
      setActiveDrawData((pre) => pre.map(updateContainerInData));

      const el = textareaElement.current;
      el.style.top = `${newY + newHeight / 2 - textHeight / 2}px`;
      el.style.left = `${newX + (newWidth < 0 ? newWidth : 0)}px`;
      el.style.width = `${Math.abs(newWidth)}px`;
      el.style.height = `${textHeight}px`;
    };

    createText(
      coordinate,
      createTextOnChange,
      containerElement,
      onInput,
      existTextElement
    );

    existTextElement &&
      setStaticDrawData((pre) =>
        pre.filter((item) => item.id !== existTextElement.id)
      );

    setCursorPoint(CursorConfig.default);
    setDrawType(DrawType.selection);
  };

  return {
    handleText,
  };
};
