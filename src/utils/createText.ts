import {
  TEXT_FONT_SIZE,
  TEXT_FONT_FAMILY,
  TEXTAREA_PER_HEIGHT,
} from '@/config';
import {
  Coordinate,
  GraphItem,
  NormalGraphItem,
  TextGraphItem,
  TextOnChangeEvent,
} from '@/types';

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
  existElement: TextGraphItem | null,
  {
    oninput,
    onChange,
  }: {
    oninput?: () => void;
    onChange: TextOnChangeEvent;
  },
) => {
  textarea.onkeydown = (e) => {
    e.stopPropagation();
  };

  textarea.oninput = () => {
    textarea.style.height = textarea.scrollHeight + 'px';
    oninput?.();
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
    fontSize: TEXT_FONT_SIZE + 'px',
    lineHeight: '1em',
    fontFamily: TEXT_FONT_FAMILY,
    overflow: 'hidden',
    ...style,
  });

const getTextStyle = (
  { x, y }: Coordinate,
  container: GraphItem | null,
  existElement?: GraphItem,
) => {
  if (!container) {
    return {
      top: (existElement?.y ?? y) + 'px',
      left: (existElement?.x ?? x) + 'px',
      width: `${window.innerWidth - x}px`,
      whiteSpace: 'nowrap',
    };
  }

  return {
    top: container.y + container.height / 2 - TEXTAREA_PER_HEIGHT / 2 + 'px',
    left: container.x - (container.width < 0 ? container.width : 0) + 'px',
    width: container.width + 'px',
    height: TEXTAREA_PER_HEIGHT + 'px',
    textAlign: 'center',
  };
};

export const createText = (
  coordinate: Coordinate,
  onChange: TextOnChangeEvent,
  container: NormalGraphItem | null,
  existElement?: TextGraphItem,
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
    getTextStyle(coordinate, container, existElement),
  );

  addTextAreaEvent(
    textAreaElement,
    coordinate,
    container,
    existElement ?? null,
    {
      onChange,
    },
  );

  document.body.appendChild(textAreaElement);
};
