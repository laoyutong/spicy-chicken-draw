import { ICON_LIST, ICON_PROPS } from "./config";
import { useAtom } from "jotai";
import { drawTypeAtom } from "@/store";
import cls from "classnames";
import { useKeydown } from "@/hooks";

export const SelectionTool = (): JSX.Element => {
  const [drawType, setDrawType] = useAtom(drawTypeAtom);

  useKeydown((key) => {
    const index = +key - 1;
    if (!isNaN(index) && index !== -1 && index < ICON_LIST.length) {
      setDrawType(ICON_LIST[index].type);
    }
  });

  return (
    <div className="flex absolute top-3 left-1/2 -translate-x-1/2 rounded bg-slate-50 shadow">
      {ICON_LIST.map(({ Icon, type }, index) => (
        <div
          key={type}
          className={cls(
            "w-11 h-10 flex items-center justify-center flex-col cursor-pointer",
            drawType === type && "bg-slate-300",
            // TODO 调整一下写法
            drawType !== type && "hover:bg-slate-200"
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
