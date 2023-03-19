import {
  TEXT_FONT_SIZE,
  TEXT_FONT_FAMILY,
  TEXTAREA_PER_HEIGHT,
} from "@/config";
import { Coordinate, DrawData } from "@/types";

export type TextOnChangeEvent = (
  value: string,
  container: DrawData | null,
  existElement: DrawData | null
) => void;

const createTextAreaElement = () => {
  const oldTextarea = document.querySelector("textarea");
  if (oldTextarea) {
    return null;
  }

  return document.createElement("textarea");
};

const addTextAreaEvent = (
  textarea: HTMLTextAreaElement,
  container: DrawData | null,
  existElement: DrawData | null,
  {
    oninput,
    onChange,
  }: {
    oninput?: () => void;
    onChange: TextOnChangeEvent;
  }
) => {
  textarea.onkeydown = (e) => {
    e.stopPropagation();
  };

  textarea.oninput = () => {
    textarea.style.height = textarea.scrollHeight + "px";
    oninput?.();
  };

  textarea.onblur = (e: Event) => {
    onChange((e.target as HTMLInputElement).value, container, existElement);
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
    fontSize: TEXT_FONT_SIZE + "px",
    lineHeight: "1em",
    fontFamily: TEXT_FONT_FAMILY,
    overflow: "hidden",
    ...style,
  });

const getTextStyle = (
  { x, y }: Coordinate,
  container: DrawData | null,
  existElement?: DrawData
) => {
  if (!container) {
    return {
      top: (existElement?.y ?? y) + "px",
      left: (existElement?.x ?? x) + "px",
      width: `${window.innerWidth - x}px`,
      whiteSpace: "nowrap",
    };
  }

  return {
    top: container.y + container.height / 2 - TEXTAREA_PER_HEIGHT / 2 + "px",
    left: container.x - (container.width < 0 ? container.width : 0) + "px",
    width: container.width + "px",
    height: TEXTAREA_PER_HEIGHT + "px",
    textAlign: "center",
  };
};

export const createText = (
  { x, y }: Coordinate,
  onChange: TextOnChangeEvent,
  container: DrawData | null,
  existElement?: DrawData
) => {
  const textAreaElement = createTextAreaElement();
  if (!textAreaElement) {
    return;
  }

  if (existElement && existElement.content) {
    textAreaElement.value = existElement.content;
    textAreaElement.setSelectionRange(0, existElement.content.length);
  }

  setTextAreaStyle(
    textAreaElement,
    getTextStyle({ x, y }, container, existElement)
  );

  addTextAreaEvent(textAreaElement, container, existElement ?? null, {
    onChange,
  });

  document.body.appendChild(textAreaElement);
};
