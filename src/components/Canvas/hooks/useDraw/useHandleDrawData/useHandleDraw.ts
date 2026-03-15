import { useAtom, useAtomValue } from "jotai";
import { nanoid } from "nanoid";
import { useRef, useCallback } from "react";
import { MIN_DRAW_DIS } from "@/config";
import {
  defaultFillColorAtom,
  defaultStrokeColorAtom,
  defaultStrokeWidthAtom,
  drawTypeAtom,
} from "@/store";
import {
  type Coordinate,
  DrawType,
  type GraphItem,
  type HistoryUpdatedRecordData,
  type ImageGraphItem,
  type SetDrawData,
  type TextGraphItem,
} from "@/types";
import { getMaxDis, getMinDis, handleDrawItem, history } from "@/utils";

interface UseHandleDrawParams {
  startCoordinate: Coordinate | null;
  moveCoordinate: Coordinate;
  staticDrawData: GraphItem[];
  setStaticDrawData: SetDrawData;
  setActiveDrawData: SetDrawData;
}
/**
 * 绘制图形的处理
 */
export const useHandleDraw = ({
  startCoordinate,
  moveCoordinate,
  staticDrawData,
  setStaticDrawData,
  setActiveDrawData,
}: UseHandleDrawParams) => {
  const workingDrawData = useRef<Exclude<GraphItem, TextGraphItem> | null>(
    null
  );

  const [drawType, setDrawType] = useAtom(drawTypeAtom);
  const defaultStrokeColor = useAtomValue(defaultStrokeColorAtom);
  const defaultFillColor = useAtomValue(defaultFillColorAtom);
  const defaultStrokeWidth = useAtomValue(defaultStrokeWidthAtom);

  // 创建图片元素
  const createImageElement = useCallback((coordinate: Coordinate, src: string) => {
    const img = new Image();
    img.onload = () => {
      // 保持图片比例，默认宽度为 300
      const defaultWidth = 300;
      const scale = defaultWidth / img.width;
      const height = img.height * scale;

      const newImageItem: ImageGraphItem = {
        id: nanoid(),
        type: DrawType.image,
        x: coordinate.x - defaultWidth / 2,
        y: coordinate.y - height / 2,
        width: defaultWidth,
        height: height,
        src,
        selected: true,
      };

      history.collectAddedRecord([newImageItem]);
      setStaticDrawData((pre) => [...pre, newImageItem]);
      setDrawType(DrawType.selection);
    };
    img.src = src;
  }, [setDrawType, setStaticDrawData]);

  // 处理图片文件选择
  const handleImageSelect = useCallback((coordinate: Coordinate) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          if (src) {
            createImageElement(coordinate, src);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // 用户取消选择，切换回选择模式
        setDrawType(DrawType.selection);
      }
    };
    input.click();
  }, [createImageElement, setDrawType]);

  const handleDrawElement = () => {
    // 图片类型特殊处理：点击即弹出文件选择
    if (drawType === DrawType.image && startCoordinate && !workingDrawData.current) {
      handleImageSelect(startCoordinate);
      // 阻止继续处理，因为图片创建是异步的
      workingDrawData.current = { type: DrawType.image } as Exclude<GraphItem, TextGraphItem>;
      return true;
    }

    if (!startCoordinate) {
      // 处理绘制结果
      if (workingDrawData.current) {
        // 图片类型已经处理过了，这里直接清理
        if (workingDrawData.current.type === DrawType.image) {
          workingDrawData.current = null;
          return false;
        }

        // selection不需要绘制、text在createTextOnChange里绘制
        if (
          ![DrawType.selection, DrawType.text].includes(
            workingDrawData.current.type
          ) &&
          (Math.abs(workingDrawData.current.width) >= MIN_DRAW_DIS ||
            Math.abs(workingDrawData.current.height) >= MIN_DRAW_DIS)
        ) {
          // 缓存下 不然 setState 的时候已经是 null 了
          const copyWorkingDrawData: GraphItem = {
            ...workingDrawData.current,
            selected: true,
          };

          const handledDrawItem = handleDrawItem(copyWorkingDrawData);
          history.collectAddedRecord([handledDrawItem]);

          setStaticDrawData((pre) => [...pre, handledDrawItem]);
        }

        if (workingDrawData.current.type === DrawType.selection) {
          const selectedList = staticDrawData.filter((item) => item.selected);
          if (selectedList.length) {
            const historyUpdatedRecordData: HistoryUpdatedRecordData = [];
            selectedList.forEach((selectedItem) => {
              historyUpdatedRecordData.push({
                id: selectedItem.id,
                value: {
                  payload: { selected: true },
                  deleted: { selected: false },
                },
              });
            });
            history.collectUpdatedRecord(historyUpdatedRecordData);
          }
        }

        setActiveDrawData([]);
        workingDrawData.current = null;
        setDrawType(DrawType.selection);
      }
      return false;
    }

    // 初始化 workingDrawData（图片类型在上面已经处理）
    if (!workingDrawData.current) {
      const base = {
        id: nanoid(),
        type: drawType,
        width: 0,
        height: 0,
        selected: false,
        seed: Math.ceil(Math.random() * 100000),
        ...startCoordinate,
      };
      const withStyle =
        drawType !== DrawType.selection && drawType !== DrawType.text
          ? {
              ...base,
              strokeColor: defaultStrokeColor,
              strokeWidth: defaultStrokeWidth,
              fillColor: defaultFillColor,
            }
          : base;
      workingDrawData.current = withStyle as Exclude<GraphItem, TextGraphItem>;
      return true;
    }

    // 移动过程中实时更改 workingDrawData 的 width 和 height
    workingDrawData.current.width = moveCoordinate.x - startCoordinate.x;
    workingDrawData.current.height = moveCoordinate.y - startCoordinate.y;
    setActiveDrawData([workingDrawData.current]);

    // 对selection范围内的图形设置selected
    if (drawType === DrawType.selection) {
      const copyWorkingDrawData = workingDrawData.current;
      setStaticDrawData((pre) =>
        pre.map((item) => {
          // 绑定的元素不需要selected状态，在具体操作的时候处理
          if ("containerId" in item && item.containerId) {
            return item;
          }

          const isInSelectionArea =
            getMinDis(item.x, item.width) >=
              getMinDis(copyWorkingDrawData.x, copyWorkingDrawData.width) &&
            getMaxDis(item.x, item.width) <=
              getMaxDis(copyWorkingDrawData.x, copyWorkingDrawData.width) &&
            getMinDis(item.y, item.height) >=
              getMinDis(copyWorkingDrawData.y, copyWorkingDrawData.height) &&
            getMaxDis(item.y, item.height) <=
              getMaxDis(copyWorkingDrawData.y, copyWorkingDrawData.height);

          return {
            ...item,
            selected: isInSelectionArea,
          };
        })
      );
    }

    return true;
  };

  return {
    handleDrawElement,
  };
};
