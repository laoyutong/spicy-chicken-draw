import {
  HistoryStack,
  HistoryRecord,
  DrawData,
  HistoryOperationMap,
  HistoryUpdatedRecordData,
  HistoryOperationMapValue,
} from '@/types';

interface HistoryHandleValue {
  value: DrawData[];
}

class History {
  #redoStack: HistoryStack = [];
  #undoStack: HistoryStack = [];

  #record(data: HistoryRecord) {
    console.log('history record data:::', data);
    this.#undoStack.push(data);
    this.#redoStack = [];
  }

  // 处理删除的情况
  #handleRemoved(handledValue: HistoryHandleValue, map?: HistoryOperationMap) {
    const removedIds = [...(map?.keys?.() || [])];
    if (removedIds.length) {
      handledValue.value = handledValue.value.filter(
        (item) => !removedIds.includes(item.id),
      );
    }
  }

  // 处理删除的情况
  #handleAdded(
    handledValue: HistoryHandleValue,
    field: keyof HistoryOperationMapValue,
    map?: HistoryOperationMap,
  ) {
    map?.forEach((addedRecord) => {
      handledValue.value.push({
        ...addedRecord[field],
        selected: !addedRecord[field]?.containerId,
      } as DrawData);
    });
  }

  // 处理更新的情况
  #handleUpdated(
    handledValue: HistoryHandleValue,
    field: keyof HistoryOperationMapValue,
    map?: HistoryOperationMap,
  ) {
    if (map?.size) {
      handledValue.value = handledValue.value.map((item) => {
        const updatedContent = map.get(item.id);
        if (!updatedContent) {
          return item;
        }

        const updatedFieldItem = updatedContent[field];
        return {
          ...item,
          ...updatedFieldItem,
          selected: updatedFieldItem?.selected ?? !item.containerId,
        };
      });
    }
  }

  // 恢复
  redo(drawData: DrawData[]): DrawData[] | null {
    const redoRecord = this.#redoStack.pop();
    if (!redoRecord) {
      return null;
    }
    console.log('redoRecord:::', redoRecord);

    this.#undoStack.push(redoRecord);

    const { added, removed, updated } = redoRecord;

    const result = {
      value: drawData.map((item) => ({ ...item, selected: false })),
    };

    this.#handleAdded(result, 'payload', added);

    this.#handleRemoved(result, removed);

    this.#handleUpdated(result, 'payload', updated);

    return result.value;
  }

  // 撤回
  undo(drawData: DrawData[]): DrawData[] | null {
    const undoRecord = this.#undoStack.pop();
    if (!undoRecord) {
      return null;
    }
    console.log('undoRecord:::', undoRecord);

    this.#redoStack.push(undoRecord);

    const { added, removed, updated } = undoRecord;

    const result = {
      value: drawData.map((item) => ({ ...item, selected: false })),
    };

    this.#handleAdded(result, 'deleted', removed);

    this.#handleRemoved(result, added);

    this.#handleUpdated(result, 'deleted', updated);

    return result.value;
  }

  collectRemovedRecord(drawData: DrawData[]) {
    const map: HistoryOperationMap = new Map();
    drawData.forEach((item) => {
      map.set(item.id, { deleted: item });
    });
    this.#record({ removed: map });
  }

  transformUpdatedRecordData(
    value: HistoryUpdatedRecordData,
  ): HistoryOperationMap {
    const map: HistoryOperationMap = new Map();
    value.forEach((item) => {
      const oldContent = map.get(item.id);
      if (oldContent) {
        map.set(item.id, {
          payload: {
            ...oldContent.payload,
            ...item.value.payload,
          },
          deleted: {
            ...oldContent.deleted,
            ...item.value.deleted,
          },
        });
      } else {
        map.set(item.id, item.value);
      }
    });
    return map;
  }

  collectAddedRecord(
    drawData: DrawData[],
    updatedValue?: HistoryUpdatedRecordData,
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
