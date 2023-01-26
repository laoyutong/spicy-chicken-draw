import { TEXT_FONT_SIZE, TEXT_FONT_FAMILY } from "@/config";
import { Coordinate } from "@/types";

export type TextOnChangeEvent = (value: string) => void;

const createTextAreaElement = () => {
  const oldTextarea = document.querySelector("textarea");
  if (oldTextarea) {
    return null;
  }

  return document.createElement("textarea");
};

const addTextAreaEvent = (
  textarea: HTMLTextAreaElement,
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
    onChange((e.target as HTMLInputElement).value);
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

export const createText = (
  { x, y }: Coordinate,
  onChange: TextOnChangeEvent
) => {
  const textAreaElement = createTextAreaElement();
  if (!textAreaElement) {
    return;
  }

  setTextAreaStyle(textAreaElement, {
    top: y + "px",
    left: x + "px",
    width: `${window.innerWidth - x}px`,
    whiteSpace: "nowrap",
  });

  addTextAreaEvent(textAreaElement, {
    onChange,
  });

  document.body.appendChild(textAreaElement);
};
