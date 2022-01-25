const fs = require('fs')
const shell = require('shelljs')
const config = require('../config/index.js')
const prefix = 'export default'
const filePath = 'config.js'
const env = `${process.env.NODE_ENV || 'dev'}`

// 开启./bin执行权限
shell.exec('chmod 777 ./bin/*')


fs.writeFile(filePath, `${prefix}${JSON.stringify(config)}`, (err) => {
  if (err) {
    return console.error(err)
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return console.error(err)
    }
    shell.cp('-r', './config.js', './src')
    shell.exec(`cross-env NODE_ENV=${env} npm run lint && gulp build --gulpfile ./build/build.js`)
  })
})