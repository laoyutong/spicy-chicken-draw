import { useMount } from "ahooks";

export const useKeydown = (
  callback: (key: string, metaKey: boolean) => void
) => {
  useMount(() => {
    const keydownFn = (e: KeyboardEvent) => {
      const { key, metaKey } = e;
      callback(key, metaKey);
    };
    document.addEventListener("keydown", keydownFn);
    return () => document.removeEventListener("keydown", keydownFn);
  });
};
