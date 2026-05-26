/**
 * 环境配置
 * 切换环境只需修改 currentEnv 的值
 */

const ENV = {
  DEV: 'dev',
  PROD: 'prod'
}

// 当前环境：开发时使用 DEV，上线前改为 PROD
const currentEnv = ENV.DEV

const API_BASE = {
  [ENV.DEV]: {
    auth: 'http://192.168.234.128:8001/api/v1',
    core: 'http://192.168.234.128:8000/api/v1'
  },
  [ENV.PROD]: {
    auth: 'https://api.codesail.cn/auth/api/v1',
    core: 'https://api.codesail.cn/core/api/v1'
  }
}

module.exports = {
  ENV,
  currentEnv,
  API_BASE: API_BASE[currentEnv]
}
