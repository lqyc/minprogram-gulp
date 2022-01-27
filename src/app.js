/* eslint-disable */
// import Store from './utils/store.js';

// 全局store
// let store = new Store({
//   state: {
//     hotword: ''
//   }
// });
App({
//   store,
  onLaunch(options) {
    console.log('app-options:', options);
  },
  onShow() { },
  onPageNotFound() {
    wx.switchTab({
      url: '/pages/home/home'
    })
  },
  data: {},
  globalData: {}
});
