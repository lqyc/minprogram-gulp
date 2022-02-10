import request from '../utils/request';
import config from '../config.js';

/**
 * 广告列表
 */
const getBanner = async(params = {}) => request.get({
  data: params,
  url: `${config.baseUrl}/api/wx/banner/list`
})

export default {
  getBanner
}
