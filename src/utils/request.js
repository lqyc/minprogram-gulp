import logger from './logger.js';
import tokenManage from './tokenManage';

/**
 * 封装接口请求
 */
const request = {
  async send(options) {
    let opts = options;
    // 获取token
    const _curToken = await tokenManage.get();
    opts.header = {};
    opts.header.token = _curToken || wx.getStorageSync('token');

    let result = {}
    try {
      // 发起接口请求
      result = new Promise((resolve, reject) => {
        wx.request({
          ...options,
          success(res) {
            result = res;
            resolve(res)
          },
          fail(error) {
            reject(error)
          }
        })
      })
    } catch (err) {
      console.log('网络请求超时', err);
      if (err.errMsg == 'request:fail timeout' || err.errMsg == 'request:fail request unknow host error' || err.errMsg == 'request:fail request connect error') {
        wx.showToast({
          title: '网络请求超时，请稍后再试~',
          icon: 'none'
        });
      }
    }
    return result;
  }
}

// 注册get,post,put,patch,delete请求方法
const methods = ['get', 'post', 'put', 'patch', 'delete'];
methods.forEach((method) => {
  request[method] = async function (options) {
    let _opts = {
      method
    };
    _opts = { ...options, ..._opts};
    const result = await request.send(_opts);
    logger.warn(`${_opts.method.toUpperCase()} ${_opts.url}`, result && result.data);
    return result && result.data;
  };
});

export default request;
