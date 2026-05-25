/**
 * 认证模块 API
 *
 * 对接 Auth Service (:8001)
 */

var request = require('../utils/request')

/**
 * 微信小程序登录
 *
 * @returns {Promise<{access_token, refresh_token, token_type, expires_in, is_new_user}>}
 */
function wechatLogin(code) {
  return request.post('/wechat/login', { code: code }, { base: 'auth', needAuth: false }).then(function (res) {
    // 登录成功后保存 token
    var data = res.data
    request.saveToken(data.access_token, data.refresh_token)
    return data
  })
}

/**
 * 刷新 access_token（微信用户）
 *
 * @returns {Promise<{access_token, token_type, expires_in}>}
 */
function refreshToken(refreshToken) {
  return request.post('/wechat/refresh', { refresh_token: refreshToken }, { base: 'auth', needAuth: false })
}

module.exports = {
  wechatLogin: wechatLogin,
  refreshToken: refreshToken
}
