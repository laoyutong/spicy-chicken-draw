import {
  HistoryStack,
  HistoryRecord,
  DrawData,
  HistoryOperationMap,
  HistoryUpdatedRecordData,
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

    let result = drawData.map((item) => ({ ...item, selected: false }));

    // 处理新增的情况
    const addedIds = [...(added?.keys?.() || [])];
    result = result.filter((item) =>
      addedIds.length ? !addedIds.includes(item.id) : true
    );

    // 处理删除的情况
    removed?.forEach((removedRecord) => {
      result.push({
        ...removedRecord.deleted,
        selected: !removedRecord.deleted?.containerId,
      } as DrawData);
    });

    // 处理更新的情况
    if (updated?.size) {
      result = result.map((item) => {
        const updatedContent = updated.get(item.id);
        if (!updatedContent) {
          return item;
        }
        const finalItem = {
          ...item,
          ...updatedContent.deleted,
        };
        return {
          ...finalItem,
          selected: !finalItem.containerId,
        };
      });
    }

    return result;
  }
  collectRemovedRecord(drawData: DrawData[]) {
    const map: HistoryOperationMap = new Map();
    drawData.forEach((item) => {
      map.set(item.id, { deleted: item });
    });
    this.#record({ removed: map });
  }
  transformUpdatedRecordData(
    value: HistoryUpdatedRecordData
  ): HistoryOperationMap {
    const map: HistoryOperationMap = new Map();
    value.forEach((item) => {
      map.set(item.id, item.value);
    });
    return map;
  }
  collectAddedRecord(
    drawData: DrawData[],
    updatedValue?: HistoryUpdatedRecordData
  ) {
    const map: HistoryOperationMap = new Map();
    drawData.forEach((item) => {
      map.set(item.id, { payload: item });
    });
    this.#record({
      added: map,
      updated: updatedValue
        ? this.transformUpdatedRecordData(updatedValue)
        : undefined,
    });
  }

  collectUpdatedRecord(value: HistoryUpdatedRecordData) {
    this.#record({ updated: this.transformUpdatedRecordData(value) });
  }
}

export const history = new History();
