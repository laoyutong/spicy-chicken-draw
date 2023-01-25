import { ICON_LIST, ICON_PROPS } from "./config";
import { useAtom } from "jotai";
import { drawTypeAtom } from "@/store";
import cls from "classnames";
import { useKeyPress } from "ahooks";

export const SelectionTool = (): JSX.Element => {
  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  useKeyPress(
    new Array(ICON_LIST.length).fill(null).map((_, index) => String(index + 1)),
    (event) => {
      const activeDrawType = ICON_LIST[Number(event.key) - 1];
      activeDrawType && setDrawType(activeDrawType.type);
    }
  );

  return (
    <div className="flex absolute top-3 left-1/2 -translate-x-1/2 rounded bg-slate-50 shadow">
      {ICON_LIST.map(({ Icon, type }, index) => (
        <div
          key={type}
          className={cls(
            "w-11 h-10 flex items-center justify-center flex-col cursor-pointer",
            drawType === type ? "bg-slate-300" : "hover:bg-slate-200"
          )}
          onClick={() => setDrawType(type)}
        >
          <Icon {...ICON_PROPS} />
          <div className="text-xs">{index + 1}</div>
        </div>
      ))}
    </div>
  );
};
