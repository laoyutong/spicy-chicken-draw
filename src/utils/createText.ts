import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_TEXT_FONT_SIZE,
  TEXT_FONT_FAMILY,
  TEXT_LINE_HEIGHT_RATIO,
} from "@/config";
import type {
  Coordinate,
  NormalGraphItem,
  TextGraphItem,
  TextOnChangeEvent,
} from "@/types";
import { getTextLines, getWrappedTextLines } from "./common";

const createTextAreaElement = () => {
  const oldTextarea = document.querySelector("textarea");
  if (oldTextarea) {
    return null;
  }

  return document.createElement("textarea");
};

const addTextAreaEvent = (
  textarea: HTMLTextAreaElement,
  coordinate: Coordinate,
  container: NormalGraphItem | null,
  {
    onInput,
    onChange,
  }: {
    onInput?: (value: string) => void;
    onChange: TextOnChangeEvent;
  },
  existElement?: TextGraphItem
) => {
  textarea.onkeydown = (e) => {
    e.stopPropagation();
  };

  textarea.oninput = (e: Event) => {
    textarea.style.height = `${textarea.scrollHeight}px`;
    onInput?.((e.target as HTMLInputElement).value);
  };

  textarea.onblur = (e: Event) => {
    onChange(
      (e.target as HTMLInputElement).value,
      coordinate,
      container,
      existElement
    );
    document.body.removeChild(textarea);
  };

  setTimeout(() => {
    textarea.focus();
  });
};

const setTextAreaStyle = (
  textArea: HTMLTextAreaElement,
  style: Record<string, unknown>
) =>
  Object.assign(textArea.style, {
    position: "absolute",
    margin: 0,
    padding: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    resize: "none",
    lineHeight: `${TEXT_LINE_HEIGHT_RATIO}em`,
    fontFamily: TEXT_FONT_FAMILY,
    overflow: "auto",
    ...style,
  });

const getTextStyle = (
  { x, y }: Coordinate,
  container: NormalGraphItem | null,
  existElement?: TextGraphItem
) => {
  const finalFontSize = existElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;
  const finalColor = existElement?.color || DEFAULT_STROKE_COLOR;

  if (!container) {
    return {
      top: `${existElement?.y ?? y}px`,
      left: `${existElement?.x ?? x}px`,
      width: `${window.innerWidth - x}px`,
      whiteSpace: "nowrap",
      fontSize: `${finalFontSize}px`,
      color: finalColor,
    };
  }

  let lineCount = 1;
  if (existElement?.content) {
    const wrapWidth = Math.abs(container.width);
    if (wrapWidth > 0) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = `${finalFontSize}px ${TEXT_FONT_FAMILY}`;
        const wrapped = getWrappedTextLines(
          existElement.content,
          wrapWidth,
          (s) => ctx.measureText(s).width
        );
        lineCount = wrapped.length;
      } else {
        lineCount = getTextLines(existElement.content).length;
      }
    } else {
      lineCount = getTextLines(existElement.content).length;
    }
  }

  const textElementHeight =
    lineCount * finalFontSize * TEXT_LINE_HEIGHT_RATIO;

  return {
    top: `${container.y + container.height / 2 - textElementHeight / 2}px`,
    left: `${container.x - (container.width < 0 ? container.width : 0)}px`,
    width: `${Math.abs(container.width)}px`,
    height: `${textElementHeight}px`,
    textAlign: "center",
    fontSize: `${finalFontSize}px`,
    color: finalColor,
  };
};

export const createText = (
  coordinate: Coordinate,
  onChange: TextOnChangeEvent,
  container: NormalGraphItem | null,
  onInput?: (value: string) => void,
  existElement?: TextGraphItem,
  defaultColor?: string
) => {
  const textAreaElement = createTextAreaElement();
  if (!textAreaElement) {
    return;
  }

  if (existElement?.content) {
    textAreaElement.value = existElement.content;
    textAreaElement.setSelectionRange(0, existElement.content.length);
  }

  // 使用传入的默认颜色（新文本）或已有元素的颜色
  const color = existElement?.color ?? defaultColor;

  setTextAreaStyle(
    textAreaElement,
    getTextStyle(coordinate, container, { ...existElement, color } as TextGraphItem | undefined)
  );

  addTextAreaEvent(
    textAreaElement,
    coordinate,
    container,
    {
      onChange,
      onInput,
    },
    existElement
  );

  textAreaElement.className = "spicy-draw-textarea";
  document.body.appendChild(textAreaElement);
};
