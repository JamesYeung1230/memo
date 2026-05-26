/**
 * 统一请求工具
 *
 * 职责：
 *   1. 封装 wx.request，提供 Promise 接口
 *   2. 自动携带 Authorization 头
 *   3. Token 过期时自动刷新并重试
 *   4. 统一业务错误码处理（code !== 0 视为失败）
 *   5. 防止并发刷新 token
 */

var env = require('../config/env')
var API_BASE = env.API_BASE

// ==================== Storage Key ====================

var TOKEN_KEY = 'token'
var REFRESH_TOKEN_KEY = 'refreshToken'

// ==================== 并发刷新控制 ====================

var isRefreshing = false
var refreshPromise = null
var hasRedirected = false

// ==================== Token 工具函数 ====================

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || null
}

function getRefreshToken() {
  return wx.getStorageSync(REFRESH_TOKEN_KEY) || null
}

function saveToken(accessToken, refreshToken) {
  if (accessToken) wx.setStorageSync(TOKEN_KEY, accessToken)
  if (refreshToken) wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken)
}

function clearToken() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(REFRESH_TOKEN_KEY)
}

// ==================== Token 刷新 ====================

function refreshAccessToken() {
  if (hasRedirected) {
    return Promise.reject({ code: 'REFRESH_FAILED', message: '已跳转登录' })
  }

  if (isRefreshing) {
    return refreshPromise
  }

  var rt = getRefreshToken()
  if (!rt) {
    clearToken()
    redirectToLogin()
    return Promise.reject({ code: 'NO_REFRESH_TOKEN', message: '无 refresh token' })
  }

  isRefreshing = true

  refreshPromise = new Promise(function (resolve, reject) {
    wx.request({
      url: API_BASE.auth + '/wechat/refresh',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { refresh_token: rt },
      success: function (res) {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          var accessToken = res.data.data.access_token
          saveToken(accessToken)
          resolve(accessToken)
        } else {
          clearToken()
          reject(res.data || { code: 'REFRESH_FAILED', message: '刷新 token 失败' })
        }
      },
      fail: function (err) {
        clearToken()
        reject({ code: 'NETWORK_ERROR', message: '网络错误', detail: err })
      },
      complete: function () {
        isRefreshing = false
      }
    })
  })

  // 刷新失败 → 跳转登录
  refreshPromise.catch(function () {
    redirectToLogin()
  })

  return refreshPromise
}

function redirectToLogin() {
  if (hasRedirected) return
  hasRedirected = true
  clearToken()
  wx.reLaunch({ url: '/pages/home/home' })
}

// ==================== 核心请求方法 ====================

/**
 * 发起 HTTP 请求
 *
 * @param {Object}  options
 * @param {string}  options.url      - 接口路径（如 '/wechat/login'），或完整 URL
 * @param {string}  options.method   - HTTP 方法，默认 'GET'
 * @param {Object}  options.data     - 请求体
 * @param {boolean} options.needAuth - 是否需要认证头，默认 true
 * @param {string}  options.base     - 服务选择：'auth'(8001) 或 'core'(8000)，默认 'core'
 *
 * @returns {Promise<{code, message, data}>}  - resolve 返回完整响应体
 */
function request(options) {
  var url = options.url
  var method = options.method || 'GET'
  var data = options.data
  var needAuth = options.needAuth !== false
  var base = options.base || 'core'

  var baseUrl = API_BASE[base] || API_BASE.core
  var fullUrl = url.indexOf('http') === 0 ? url : baseUrl + url

  var header = { 'Content-Type': 'application/json' }

  if (needAuth) {
    var token = getToken()
    if (token) {
      header['Authorization'] = 'Bearer ' + token
    }
  }

  return new Promise(function (resolve, reject) {
    wx.request({
      url: fullUrl,
      method: method,
      data: data,
      header: header,
      success: function (res) {
        var body = res.data

        // 业务成功
        if (body && body.code === 0) {
          resolve(body)
          return
        }

        // Token 过期 → 自动刷新后重试
        if (body && body.code === 'UNAUTHORIZED' && needAuth) {
          refreshAccessToken().then(function () {
            // 重试原请求
            request(options).then(resolve).catch(reject)
          }).catch(function (e) {
            reject(body)
          })
          return
        }

        // 其他业务错误
        reject(body || { code: 'UNKNOWN', message: '未知错误' })
      },
      fail: function (err) {
        reject({ code: 'NETWORK_ERROR', message: '网络请求失败，请检查网络连接', detail: err })
      }
    })
  })
}

// ==================== 便捷方法 ====================

function get(url, options) {
  options = options || {}
  options.url = url
  options.method = 'GET'
  return request(options)
}

function post(url, data, options) {
  options = options || {}
  options.url = url
  options.method = 'POST'
  options.data = data
  return request(options)
}

function put(url, data, options) {
  options = options || {}
  options.url = url
  options.method = 'PUT'
  options.data = data
  return request(options)
}

function del(url, options) {
  options = options || {}
  options.url = url
  options.method = 'DELETE'
  return request(options)
}

module.exports = {
  request: request,
  get: get,
  post: post,
  put: put,
  del: del,
  getToken: getToken,
  saveToken: saveToken,
  clearToken: clearToken
}
