/**
 * @日志管理器
 * https: //developers.weixin.qq.com/miniprogram/dev/api/debug/LogManager.html
 */
import config from '../config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

let logManager;

if (wx.canIUse('getLogManager')) {
  logManager = wx.getLogManager();
}

class Logger {
  constructor(options) {
    this.level = options.level || 'info';
  }

  debug(msg, ...args) {
    this.log('debug', msg, ...args);
  }

  info(msg, ...args) {
    this.log('info', msg, ...args);
  }

  warn(msg, ...args) {
    this.log('warn', msg, ...args);
  }

  error(msg, ...args) {
    this.log('error', msg, ...args);
  }

  log(level, msg, ...args) {
    if (!(level in levels)) {
      this.warn(`unknow log level: ${level}, message: ${msg}`, ...args);
      return;
    }
    if (levels[this.level] < levels[level]) {
      return;
    }
    const message = `[${level.toUpperCase()}] ${msg}`;
    // 记录打印信息
    console[level](message, ...args);
    if (level === 'error') level = 'warn';

    // 记录到小程序日志
    if (logManager) logManager[level](message, ...args);
  }
}

export default new Logger({
  level: config.env === 'prod' ? 'info' : 'debug'
});
