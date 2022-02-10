import logger from './logger.js';
import config from '../config';

const wxLoginAPI = `${config.baseUrl}/api/wx/login`;

const token = {
  count: 0,
  maxCount: 3,
  async get() {
    const _token = wx.getStorageSync('token');

    if (_token) {
      return _token;
    }
    // 刷token
    const refreshRsult = await this.refresh() || {};
    const retoken = refreshRsult.data && refreshRsult.data.data.token;
    console.log('刷新token>>>', retoken);
    return retoken || '';
  },
  async refresh() {
    if (this.count > this.maxCount) {
      throw new Error('Token 获取次数太多');
    } else if (this.count === 0) {
      setTimeout(() => {
        this.count = 0;
      }, 10000);
    }
    // 累计次数
    this.count += 1;
    let reToken = '';
    let result = {};
    try {
      const { code } = await wx.login();
      console.log('code', code);
      if (code) {
        result = new Promise((resolve, reject) => {
          wx.request({
            url: `${wxLoginAPI}?code=${code}`,
            data: { code },
            method: 'GET',
            header: {
              token: ''
            }, // 设置请求的 header
            success: function(res) {
              // success
              if (res.data.code == '00' && res.data.data) {
                const {token} = res.data.data
                reToken = token;
                resolve(res);
                wx.setStorageSync('token', token);
                logger.info(`获取token成功: ${token}`);
              } else {
                logger.error(`获取token失败: ${res.data.code}`);
                reject(res)
              }
            },
            fail: function(err) {
              // fail
              logger.error(`获取token失败: ${err}`);
              reject(err)
            },
            complete: function() {
              // complete
            }
          })
        })
      }
    } catch (e) {
      console.log('e', e);
    }
    console.log(reToken, 'reToken---');
    return result;
  },
  async clear() {
    await wx.removeStorageSync('token');
  }
}

export default token;
