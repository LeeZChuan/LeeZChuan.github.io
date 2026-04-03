export function formatDateShort(isoDate: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(isoDate))
    .replace(/\//g, '-');
}
