// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDownloadUri = (data: any) => {
  const _utf = '\uFEFF';
  const blob = new Blob([_utf + data], {
    type: 'text/json',
  });
  return URL.createObjectURL(blob);
};

export const downLoad = (url: string, name: string) => {
  const a = document.createElement('a');
  a.download = name;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
