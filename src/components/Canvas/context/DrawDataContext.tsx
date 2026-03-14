import { createContext, useContext, type ReactNode } from "react";
import type { GraphItem, SetDrawData } from "@/types";

interface DrawDataContextValue {
  staticDrawData: GraphItem[];
  setStaticDrawData: SetDrawData;
  activeDrawData: GraphItem[];
  setActiveDrawData: SetDrawData;
}

const DrawDataContext = createContext<DrawDataContextValue | null>(null);

export const DrawDataProvider = ({
  staticDrawData,
  setStaticDrawData,
  activeDrawData,
  setActiveDrawData,
  children,
}: DrawDataContextValue & { children: ReactNode }) => (
  <DrawDataContext.Provider
    value={{
      staticDrawData,
      setStaticDrawData,
      activeDrawData,
      setActiveDrawData,
    }}
  >
    {children}
  </DrawDataContext.Provider>
);

export const useDrawData = () => {
  const ctx = useContext(DrawDataContext);
  if (!ctx) {
    throw new Error("useDrawData must be used within DrawDataProvider");
  }
  return ctx;
};
