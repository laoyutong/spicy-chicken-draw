import {
  TEXT_FONT_SIZE,
  TEXT_FONT_FAMILY,
  TEXTAREA_PER_HEIGHT,
} from "@/config";
import { Coordinate, DrawData } from "@/types";

export type TextOnChangeEvent = (
  value: string,
  container: DrawData | null
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
    onChange((e.target as HTMLInputElement).value, container);
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
  container: DrawData | null,
  onChange: TextOnChangeEvent
) => {
  const textAreaElement = createTextAreaElement();
  if (!textAreaElement) {
    return;
  }

  setTextAreaStyle(
    textAreaElement,
    container
      ? {
          top:
            container.y + container.height / 2 - TEXTAREA_PER_HEIGHT / 2 + "px",
          left:
            container.x - (container.width < 0 ? container.width : 0) + "px",
          width: container.width + "px",
          height: TEXTAREA_PER_HEIGHT + "px",
          textAlign: "center",
        }
      : {
          top: y + "px",
          left: x + "px",
          width: `${window.innerWidth - x}px`,
          whiteSpace: "nowrap",
        }
  );

  addTextAreaEvent(textAreaElement, container, {
    onChange,
  });

  document.body.appendChild(textAreaElement);
};
