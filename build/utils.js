const os = require('os')

const getPlatform = () => os.platform()

const getWin32Path = str => str.replace(/\//g, '\\')

const getOsPath = str => str.replace(/\\/g, '/')

module.exports = {
  getPlatform,
  getWin32Path,
  getOsPath
}