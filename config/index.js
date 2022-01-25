const env = `${process.env.NODE_ENV || 'dev'}`

const config = require(`./${env}.env.js`)

const version = '0.0.1'

const miniProgramVersion = '0.0.1'

module.exports = {
  ...config,
  env,
  version,
  miniProgramVersion
}
