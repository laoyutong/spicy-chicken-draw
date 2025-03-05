import { DEFAULT_TEXT_FONT_SIZE, TEXT_FONT_FAMILY } from '@/config';
import { cursorPointAtom, drawTypeAtom } from '@/store';
import {
  BoundingElement,
  Coordinate,
  CursorConfig,
  DrawType,
  GraphItem,
  HistoryUpdatedRecordData,
  NormalGraphItem,
  SetDrawData,
  TextAlign,
  TextGraphItem,
  TextOnChangeEvent,
} from '@/types';
import {
  createText,
  getExistTextElement,
  getTextContainer,
  getTextLines,
  history,
} from '@/utils';
import { useSetAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { useRef } from 'react';

interface UseHandleTextParams {
  staticDrawData: GraphItem[];
  activeDrawData: GraphItem[];
  setStaticDrawData: SetDrawData;
}

export const useHandleText = ({
  staticDrawData,
  activeDrawData,
  setStaticDrawData,
}: UseHandleTextParams) => {
  const textareaElement = useRef<HTMLTextAreaElement | null>(null);

  const setDrawType = useSetAtom(drawTypeAtom);
  const setCursorPoint = useSetAtom(cursorPointAtom);

  const createTextOnChange: TextOnChangeEvent = (
    textValue,
    coordinate,
    container,
    existElement,
  ) => {
    if (textValue.trim() && (coordinate || existElement)) {
      let maxWidth = 0;
      const canvas = document.createElement('canvas');
      const canvasCtx = canvas.getContext('2d');
      const lines = getTextLines(textValue);

      const finalFontSizeValue =
        existElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;

      if (canvasCtx) {
        canvasCtx.font = `${finalFontSizeValue}px  ${TEXT_FONT_FAMILY}`;
        lines.forEach((line) => {
          const { width } = canvasCtx.measureText(line);
          if (width > maxWidth) {
            maxWidth = width;
          }
        });
      }

      const textareaHeight = finalFontSizeValue * lines.length;

      const textProperty = container
        ? {
            x: container.x + (container.width - maxWidth) / 2,
            y: container.y + container.height / 2 - textareaHeight / 2,
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
          (container ? TextAlign.center : TextAlign.left),
        ...textProperty,
        ...(container ? { containerId: container.id } : {}),
      };

      const updatedHistoryValue: HistoryUpdatedRecordData = [];
      const newContainerBoundingElements = [
        ...(container?.boundingElements || []),
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
        if (container) {
          updatedHistoryValue.push({
            id: container.id,
            value: {
              deleted: {
                boundingElements: container.boundingElements,
              },
              payload: {
                boundingElements: newContainerBoundingElements,
              },
            },
          });
        }
        history.collectAddedRecord([textElement], updatedHistoryValue);
      }

      setStaticDrawData((pre) => {
        const preDrawData = container
          ? [
              ...pre.filter((item) => item.id !== container.id),
              {
                ...container,
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
      findTextElementDataSource,
    );

    const containerElement = existTextElement
      ? (findTextElementDataSource.find(
          (item) => item.id === existTextElement?.containerId,
        ) as NormalGraphItem) || null
      : getTextContainer(coordinate, staticDrawData);

    const onInput = (textContent: string) => {
      // 在container里的textarea，需要实时根据内容修改宽度，以保证居中效果
      if (!containerElement) {
        return;
      }

      if (!textareaElement.current) {
        const textareaSelector = document.querySelector('textarea');
        if (!textareaSelector) {
          return;
        }
        textareaElement.current = textareaSelector;
      }

      const lines = getTextLines(textContent);
      const finalFontSize =
        existTextElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;

      textareaElement.current.style.top =
        containerElement.y +
        containerElement.height / 2 -
        (finalFontSize * lines.length) / 2 +
        'px';
    };

    createText(
      coordinate,
      createTextOnChange,
      containerElement,
      onInput,
      existTextElement,
    );

    existTextElement &&
      setStaticDrawData((pre) =>
        pre.filter((item) => item.id !== existTextElement.id),
      );

    setCursorPoint(CursorConfig.default);
    setDrawType(DrawType.selection);
  };

  return {
    handleText,
  };
};
