const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports = function generatePage(options) {
  if (typeof options !== 'object') throw new Error('options must be a object.')

  options = Object.assign({
    name: 'index',
    json: false,
    less: false,
    scss: false,
    css: false,
    jade: false,
    html: false,
    wxml: false,
    preJs: false
  }, options)

  if (!options.root) throw new Error('You must specify a root directory.')

  const pageRoot = path.resolve(options.root, options.name)

  if (fs.existsSync(pageRoot)) return false

  mkdirp.sync(pageRoot)

  const results = []

  // js
  const jsTemplate = options.preJs ? require('./templates/preJs') : require('./templates/js')
  const jsPath = path.resolve(pageRoot, options.name + '.js')
  fs.writeFileSync(jsPath, jsTemplate(options))
  results.push(jsPath)
  // html
  if (options.html) {
    const htmlTemplate = require('./templates/html')
    const htmlPath = path.resolve(pageRoot, options.name + '.html')
    fs.writeFileSync(htmlPath, htmlTemplate(options))
    results.push(htmlPath)
  }
  // jade
  if (options.jade) {
    const jadeTemplate = require('./templates/jade')
    const jadePath = path.resolve(pageRoot, options.name + '.jade')
    fs.writeFileSync(jadePath, jadeTemplate(options))
    results.push(jadePath)
  }
  // wxml
  if (options.wxml) {
    const wxmlTemplate = require('./templates/wxml')
    const wxmlPath = path.resolve(pageRoot, options.name + '.wxml')
    fs.writeFileSync(wxmlPath, wxmlTemplate(options))
    results.push(wxmlPath)
  }
  // less
  if (options.less) {
    const lessTemplate = require('./templates/less')
    const lessPath = path.resolve(pageRoot, options.name + '.less')
    fs.writeFileSync(lessPath, lessTemplate(options))
    results.push(lessPath)
  }
  // scss
  if (options.scss) {
    const scssTemplate = require('./templates/scss')
    const scssPath = path.resolve(pageRoot, options.name + '.scss')
    fs.writeFileSync(scssPath, scssTemplate(options))
    results.push(scssPath)
  }
  // wxss
  if (options.wxss) {
    const wxssTemplate = require('./templates/wxss')
    const wxssPath = path.resolve(pageRoot, options.name + '.wxss')
    fs.writeFileSync(wxssPath, wxssTemplate(options))
    results.push(wxssPath)
  }
  // json
  if (options.json) {
    const jsonTemplate = require('./templates/json')
    const jsonPath = path.resolve(pageRoot, options.name + '.json')
    fs.writeFileSync(jsonPath, jsonTemplate(options))
    results.push(jsonPath)
  }

  return results
}
