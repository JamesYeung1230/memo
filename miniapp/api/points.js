/**
 * 积分模块 API
 *
 * 对接 Core Service (:8000)
 * 涵盖积分查询、积分明细、积分规则、广告激励、成就徽章、解锁配置
 */

var request = require('../utils/request')

/**
 * 查询积分余额
 * GET /points/balance
 */
function getBalance() {
  return request.get('/points/balance')
}

/**
 * 获取积分明细列表（分页）
 * GET /points/records
 *
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页条数
 * @param {string} params.action_type - 筛选操作类型
 */
function getRecords(params) {
  return request.get('/points/records', { data: params })
}

/**
 * 获取当前积分规则
 * GET /points/rules
 */
function getRules() {
  return request.get('/points/rules')
}

/**
 * 观看激励广告获得积分
 * POST /points/ad-watch
 */
function adWatch() {
  return request.post('/points/ad-watch')
}

/**
 * 获取成就徽章列表
 * GET /admin/badges
 */
function getAchievements() {
  return request.get('/admin/badges')
}

/**
 * 获取解锁消耗配置
 * GET /admin/unlock-config
 */
function getConfig() {
  return request.get('/admin/unlock-config')
}

module.exports = {
  getBalance: getBalance,
  getRecords: getRecords,
  getRules: getRules,
  adWatch: adWatch,
  getAchievements: getAchievements,
  getConfig: getConfig
}
