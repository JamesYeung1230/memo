import dayjs from 'dayjs'

export function formatDate(date: string | Date | undefined | null, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '-'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

export function formatPercent(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null) return '-'
  return (value * 100).toFixed(decimals) + '%'
}
