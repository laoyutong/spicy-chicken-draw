import { ICON_PROPS, OPERATION_TOOL_KEY } from "@/config";
import {
  DownloadFour,
  Delete,
  FolderCode,
  AddPic,
  ListBottom,
} from "@icon-park/react";
import { Dropdown } from "antd";
import { mitt } from "@/utils";

const OPERATION_CONFIG = [
  {
    icon: FolderCode,
    label: "打开",
    key: OPERATION_TOOL_KEY.import,
  },
  {
    icon: DownloadFour,
    label: "保存画布数据",
    key: OPERATION_TOOL_KEY.export,
  },
  {
    icon: AddPic,
    label: "导出图片",
    key: OPERATION_TOOL_KEY.exportImage,
  },
  {
    icon: Delete,
    label: "重置画布",
    key: OPERATION_TOOL_KEY.clear,
  },
];

export const OperationTool = (): JSX.Element => {
  const items = OPERATION_CONFIG.map((item) => {
    const Icon = item.icon;
    return {
      label: (
        <div className="flex items-center" onClick={() => mitt.emit(item.key)}>
          {Icon ? <Icon {...ICON_PROPS} size={16} className="mr-2" /> : null}
          <div className="text-sm">{item.label}</div>
        </div>
      ),
      key: item.key,
    };
  });

  return (
    <div className="absolute top-3 left-3 rounded bg-slate-50 shadow p-1">
      <Dropdown menu={{ items }} overlayClassName="mt-8" trigger={["click"]}>
        <ListBottom {...ICON_PROPS} />
      </Dropdown>
    </div>
  );
};
