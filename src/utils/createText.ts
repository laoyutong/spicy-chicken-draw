import { DEFAULT_TEXT_FONT_SIZE, TEXT_FONT_FAMILY } from '@/config';
import {
  Coordinate,
  NormalGraphItem,
  TextGraphItem,
  TextOnChangeEvent,
} from '@/types';
import { getTextLines } from './common';

const createTextAreaElement = () => {
  const oldTextarea = document.querySelector('textarea');
  if (oldTextarea) {
    return null;
  }

  return document.createElement('textarea');
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
  existElement?: TextGraphItem,
) => {
  textarea.onkeydown = (e) => {
    e.stopPropagation();
  };

  textarea.oninput = (e: Event) => {
    textarea.style.height = textarea.scrollHeight + 'px';
    onInput?.((e.target as HTMLInputElement).value);
  };

  textarea.onblur = (e: Event) => {
    onChange(
      (e.target as HTMLInputElement).value,
      coordinate,
      container,
      existElement,
    );
    document.body.removeChild(textarea);
  };

  setTimeout(() => {
    textarea.focus();
  });
};

const setTextAreaStyle = (
  textArea: HTMLTextAreaElement,
  style: Record<string, unknown>,
) =>
  Object.assign(textArea.style, {
    position: 'absolute',
    margin: 0,
    padding: 0,
    border: 0,
    outline: 0,
    background: 'transparent',
    resize: 'none',
    lineHeight: '1em',
    fontFamily: TEXT_FONT_FAMILY,
    overflow: 'hidden',
    ...style,
  });

const getTextStyle = (
  { x, y }: Coordinate,
  container: NormalGraphItem | null,
  existElement?: TextGraphItem,
) => {
  const finalFontSize = existElement?.fontSize || DEFAULT_TEXT_FONT_SIZE;

  if (!container) {
    return {
      top: (existElement?.y ?? y) + 'px',
      left: (existElement?.x ?? x) + 'px',
      width: `${window.innerWidth - x}px`,
      whiteSpace: 'nowrap',
      fontSize: finalFontSize + 'px',
    };
  }

  const textLines = existElement
    ? getTextLines(existElement.content).length
    : 1;

  const textElementHeight = textLines * finalFontSize;

  return {
    top: container.y + container.height / 2 - textElementHeight / 2 + 'px',
    left: container.x - (container.width < 0 ? container.width : 0) + 'px',
    width: container.width + 'px',
    height: textElementHeight + 'px',
    textAlign: 'center',
    fontSize: finalFontSize + 'px',
  };
};

export const createText = (
  coordinate: Coordinate,
  onChange: TextOnChangeEvent,
  container: NormalGraphItem | null,
  onInput?: (value: string) => void,
  existElement?: TextGraphItem,
) => {
  const textAreaElement = createTextAreaElement();
  if (!textAreaElement) {
    return;
  }

  if (existElement?.content) {
    textAreaElement.value = existElement.content;
    textAreaElement.setSelectionRange(0, existElement.content.length);
  }

  setTextAreaStyle(
    textAreaElement,
    getTextStyle(coordinate, container, existElement),
  );

  addTextAreaEvent(
    textAreaElement,
    coordinate,
    container,
    {
      onChange,
      onInput,
    },
    existElement,
  );

  document.body.appendChild(textAreaElement);
};
