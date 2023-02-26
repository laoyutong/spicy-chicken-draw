export const splitContent = (content: string): string[] =>
  content.replace(/\r\n?/g, "\n").split("\n");

export const getMaxDis = (coor: number, length: number) =>
  Math.max(coor, coor + length);

export const getMinDis = (coor: number, length: number) =>
  Math.min(coor, coor + length);
