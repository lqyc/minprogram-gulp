/*eslint-disable*/
const gulp = require('gulp')
const path = require('path')
const shell = require('shelljs')
const runSequence = require('run-sequence')
const through = require('through2')
const plugins = require('gulp-load-plugins')()
const jeditor = require('gulp-json-editor')
const utils = require('./utils')
const env = `${process.env.NODE_ENV || 'dev'}`
const config = require('../config/index')

const {
  getPlatform,
  getWin32Path,
  getOsPath
} = utils



// 是否进行压缩编译
const isProd = () => process.env.npm_config_argv.indexOf('--build') >= 0

// 输入路径
const entry = '../src'
//`输出路径
const output = '../dist/app'

// 清空输出
gulp.task('clean', () => {
  shell.rm('-rf', `${output}/`)
})

// 处理小程序配置文件
gulp.task('compile:project', () => {
  gulp.src('../project.config.json')
    .pipe(jeditor(function (json) {
      const scripts = json.scripts
      for (let k in scripts) {
        if (getPlatform() === 'win32') {
          scripts[k] = getWin32Path(scripts[k])
        }
      }
      json.appid = config.appid
      json.scripts = scripts
      return json
    }))
    .pipe(gulp.dest('../dist'))
})

const importVariable = () => through.obj(function (file, encode, cb) {
  let fileContent = file.contents.toString()
  fileContent = fileContent.replace(/@{cdnUrl}/g, config.cdnUrl)
  file.contents = new Buffer(`${fileContent}`)
  this.push(file)
  cb()
})

// 编译WXML
const compileTemplete = src => src
  .pipe(plugins.plumber())
  .pipe(importVariable())
  .pipe(plugins.changed(output))
  .pipe(plugins.pug({
    pretty: !isProd()
  }))
  .pipe(plugins.rename({
    extname: '.wxml'
  }))
  .pipe(gulp.dest(output))

// 编译WXSS
const compileStyle = src => src
  .pipe(plugins.plumber())
  .pipe(importVariable())
  .pipe(plugins.changed(output))
  .pipe(plugins.sass())
  .pipe(plugins.rename({
    extname: '.wxss'
  }))
  .pipe(plugins.if(file => file.contents, plugins.base64({
    extensions: ['svg', 'png', /\.jpg#datauri$/i],
    exclude: [/http/, '--live.jpg'],
    maxImageSize: 15 * 1024,
    deleteAfterEncoding: false,
    debug: isProd(),
  })))
  .pipe(plugins.if(isProd(), plugins.cleanCss()))
  .pipe(gulp.dest(output))

// 编译WXS
const getRelativePath = (filePath) => {
  const source = path.dirname(filePath)
  const target = path.resolve(__dirname, '../src/vendor/runtime.js')
  return path.relative(source, target)
}
const importRuntime = () => through.obj(function (file, encode, cb) {
  const relPath = getRelativePath(file.path)
  let fileVendor = `import regeneratorRuntime from '${getOsPath(relPath)}'\n`
  if (relPath === 'runtime.js') {
    fileVendor = ''
  }
  const fileContent = file.contents.toString()
  file.contents = new Buffer(`${fileVendor}${fileContent}`)
  this.push(file)
  cb()
})
const compileScript = src => src
  .pipe(plugins.plumber())
  .pipe(importRuntime())
  .pipe(plugins.changed(output))
  .pipe(plugins.replace('process.env.NODE_ENV', `'${env}'`))
  .pipe(plugins.if(isProd(), plugins.babel({
    presets: ['@babel/env'],
  })))
  .pipe(plugins.if(isProd(), plugins.uglifyEs.default()))
  .pipe(gulp.dest(output))

// 编译JSON
const compileConfig = src => src
  .pipe(plugins.plumber())
  .pipe(plugins.changed(output))
  .pipe(gulp.dest(output))

// handle jade,pug,scss,js,json
// gulp.task('compile:jade', () => {
//   const src = gulp.src(`${entry}/**/*.jade`)
//   return compileTemplete(src)
// })
gulp.task('compile:pug', () => {
  const src = gulp.src(`${entry}/**/*.pug`)
  return compileTemplete(src)
})
gulp.task('compile:scss', () => {
  const src = gulp.src(`${entry}/**/*.scss`)
  return compileStyle(src)
})
gulp.task('compile:js', () => {
  const src = gulp.src([
    `${entry}/**/*.js`
  ])
  return compileScript(src)
})
gulp.task('compile:json', () => {
  const src = gulp.src(`${entry}/**/*.json`)
  return compileConfig(src)
})

// handle vue
gulp.task('compile:mina:wxss', () => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.minaVue.style())
  return compileStyle(src)
})
gulp.task('compile:mina:wxs', () => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.plumber())
    .pipe(plugins.minaVue.script())
  return compileScript(src)
})
gulp.task('compile:mina:json', () => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.minaVue.config())
  return compileConfig(src)
})
gulp.task('compile:mina:wxml', () => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.minaVue.template())
  return compileTemplete(src)
})

// img
gulp.task('compress:img', () => gulp.src([`${entry}/**/*.{jpg,jpeg,png,gif,svg}`])
  .pipe(plugins.plumber())
  .pipe(plugins.imagemin({
    verbose: true,
    optimizationLevel: 5, // 类型：Number  默认：3  取值范围：0-7（优化等级）
    progressive: true, // 类型：Boolean 默认：false 无损压缩jpg图片
    interlaced: true, // 类型：Boolean 默认：false 隔行扫描gif进行渲染
    multipass: true // 类型：Boolean 默认：false 多次优化svg直到完全优化
  }))
  .pipe(gulp.dest(output)))


gulp.task('compile:mina', next => {
  runSequence([
    'compile:mina:wxml',
    'compile:mina:wxss',
    'compile:mina:wxs',
    'compile:mina:json'
  ], next)
})

// 监听文件变动
const workerEventer = (worker) => {
  worker.on('change', function (event) {
    const relPath = path.relative(path.resolve(__dirname, '../'), event.path)
    shell.exec(`eslint ../${relPath} --fix-dry-run  --color`)
  })
}
gulp.task('watch', () => {
  gulp.watch(['../project.config.json'], ['compile:project'])
  gulp.watch([`${entry}/**/*.jade`], ['compile:jade'])
  gulp.watch([`${entry}/**/*.pug`], ['compile:pug'])
  gulp.watch([`${entry}/**/*.scss`], ['compile:scss'])
  gulp.watch([`${entry}/**/*.json`], ['compile:json'])
  gulp.watch([`${entry}/**/*.{jpg,jpeg,png,gif,svg}`], ['compress:img'])
  workerEventer(gulp.watch([`${entry}/**/*.vue`], ['compile:mina']))
  workerEventer(gulp.watch([`${entry}/**/*.js`], ['compile:js']))
})

gulp.task('compile:copy', [], () => gulp.src([
    `${entry}/**/*.wxml`,
    `${entry}/**/*.wxss`,
    `${entry}/**/*.wxs`,
    `${entry}/**/*.{eot,otf,ttf,woff,svg}`
  ])
  .pipe(gulp.dest(output)))

// 编译入口
gulp.task('build', ['clean', 'compile:project'], () => {
  runSequence([
    'compile:copy',
    'compile:jade',
    'compile:pug',
    'compile:scss',
    'compile:js',
    'compile:mina',
    'compile:json',
    'compress:img'
  ], [
    'watch'
  ])
})
// gulp.task('build', gulp.series('clean', 'compile:project'), () => {
//   runSequence([
//     'compile:copy',
//     'compile:jade',
//     'compile:pug',
//     'compile:scss',
//     'compile:js',
//     'compile:mina',
//     'compile:json',
//     'compress:img'
//   ], [
//     'watch'
//   ])
// })
