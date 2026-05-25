/** Banner 跳转类型 */
export type JumpType = 'h5' | 'miniapp' | 'none'

/** 首页运营 Banner 数据 */
export interface BannerData {
  id: string
  imageUrl: string
  title: string
  jumpType: JumpType
  jumpPath: string
  sortOrder: number
  enabled: boolean
  startTime: string
  endTime: string
  pv: number
  clickPv: number
  clickRate: number
}
