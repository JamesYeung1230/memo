/** 广告配置 */
export interface AdConfig {
  /** 开屏广告开关 */
  splashEnabled: boolean
  /** 开屏广告图片 URL */
  splashImageUrl: string
  /** 开屏广告跳转链接 */
  splashLink: string
  /** 激励广告积分奖励 */
  incentivePoints: number
  /** 最后更新时间 */
  updatedAt: string
}
