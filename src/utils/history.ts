import {
  HistoryStack,
  HistoryRecord,
  DrawData,
  HistoryOperationMap,
} from "@/types";

class History {
  #redoStack: HistoryStack = [];
  #undoStack: HistoryStack = [];

  #record(data: HistoryRecord) {
    this.#undoStack.push(data);
  }

  // 恢复
  redo() {
    const redoRecord = this.#redoStack.pop();
    if (!redoRecord) {
      return;
    }
    // TODO
  }

  // 撤回
  undo(drawData: DrawData[]): DrawData[] | null {
    const undoRecord = this.#undoStack.pop();
    if (!undoRecord) {
      return null;
    }

    const { added, removed, updated } = undoRecord;

    const finalDrawData = {
      value: drawData.map((item) => ({ ...item, selected: false })),
    };

    removed?.forEach((removeRecord) => {
      finalDrawData.value.push({
        ...removeRecord.deleted,
        selected: true,
      } as DrawData);
    });

    added?.forEach(() => {
      // TODO
    });

    updated?.forEach(() => {
      // TODO
    });

    return finalDrawData.value;
  }
  collectRemoveRecord(drawData: DrawData[]) {
    const map: HistoryOperationMap = new Map();
    drawData.forEach((item) => {
      map.set(item.id, { deleted: item });
    });
    this.#record({ removed: map });
  }
}

export const history = new History();
