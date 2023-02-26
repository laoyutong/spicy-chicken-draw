import { CursorConfig } from "@/types";
import { atom } from "jotai";

export const cursorPointAtom = atom(CursorConfig.default);
