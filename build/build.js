/*eslint-disable*/
const gulp = require('gulp')
const path = require('path')
const shell = require('shelljs')
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
gulp.task('clean', (done) => {
  shell.rm('-rf', `${output}/`)
  done()
})

// 处理小程序配置文件
gulp.task('compile:project', (done) => {
  gulp.src('../project.config.json',{allowEmpty: true})
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
    done()
})

const importVariable = () => through.obj(function (file, encode, cb) {
  let fileContent = file.contents.toString()
  fileContent = fileContent.replace(/@{cdnUrl}/g, config.cdnUrl)
  file.contents = Buffer.from(`${fileContent}`)
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
  // .pipe(plugins.sass())
  .pipe(plugins.less())
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
  file.contents = Buffer.from(`${fileVendor}${fileContent}`)
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
gulp.task('compile:jade', () => {
  const src = gulp.src(`${entry}/**/*.jade`)
  return compileTemplete(src)
})
gulp.task('compile:wxml', (done) => {
  const src = gulp.src(`${entry}/**/*.wxml`)
  done()
  return compileTemplete(src)
})
gulp.task('compile:pug', (done) => {
  const src = gulp.src(`${entry}/**/*.pug`)
  done()
  return compileTemplete(src)
})
gulp.task('compile:scss', () => {
  const src = gulp.src(`${entry}/**/*.scss`)
  return compileStyle(src)
})
gulp.task('compile:less', (done) => {
  done()
  const src = gulp.src(`${entry}/**/*.less`)
  return compileStyle(src)
})
gulp.task('compile:js', (done) => {
  const src = gulp.src([
    `${entry}/**/*.js`
  ])
  done()
  return compileScript(src)
})
gulp.task('compile:json', (done) => {
  const src = gulp.src(`${entry}/**/*.json`)
  done()
  return compileConfig(src)
})

// handle vue
gulp.task('compile:mina:wxss', (done) => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.minaVue.style())
    done()
  return compileStyle(src)
})
gulp.task('compile:mina:wxs', (done) => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.plumber())
    .pipe(plugins.minaVue.script())
    done()
  return compileScript(src)
})
gulp.task('compile:mina:json', (done) => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.minaVue.config())
    done()
  return compileConfig(src)
})
gulp.task('compile:mina:wxml', (done) => {
  const src = gulp.src(`${entry}/**/*.vue`)
    .pipe(plugins.minaVue.template())
    done()
  return compileTemplete(src)
})

// img
gulp.task('compress:img', ((done) => {
  gulp.src([`${entry}/**/*.{jpg,jpeg,png,gif,svg}`], {allowEmpty: true})
  .pipe(plugins.plumber())
  // .pipe(plugins.imagemin({
  //   verbose: true,
  //   optimizationLevel: 5, // 类型：Number  默认：3  取值范围：0-7（优化等级）
  //   progressive: true, // 类型：Boolean 默认：false 无损压缩jpg图片
  //   interlaced: true, // 类型：Boolean 默认：false 隔行扫描gif进行渲染
  //   multipass: true // 类型：Boolean 默认：false 多次优化svg直到完全优化
  // }))
  .pipe(gulp.dest(output))
  done()
}))

gulp.task('compile:mina', gulp.series(
   'compile:mina:wxml',
    'compile:mina:wxss',
    'compile:mina:wxs',
    'compile:mina:json',
    function (done) {
     done();
    })
)

// 监听文件变动
const workerEventer = (worker) => {
  worker.on('change', function (event) {
    const relPath = path.relative(path.resolve(__dirname, '../'), event.path)
    shell.exec(`eslint ../${relPath} --fix-dry-run  --color`)
  })
}

gulp.task('watch',async()=>{
  gulp.watch("../project.config.json",gulp.series('compile:project'),(done)=>{done()});
  gulp.watch(`${entry}/**/*.wxml`,gulp.series('compile:wxml'),(done)=>{done()});
  gulp.watch(`${entry}/**/*.pug`,gulp.series('compile:pug'),(done)=>{done()});
  gulp.watch(`${entry}/**/*.less`,gulp.series('compile:less'),(done)=>{done()});
  gulp.watch(`${entry}/**/*.json`,gulp.series('compile:json'),(done)=>{done()});
  gulp.watch(`${entry}/**/*.{jpg,jpeg,png,gif,svg}`,gulp.series('compress:img'),(done)=>{done()});
  gulp.watch(`${entry}/**/*.js`,gulp.series('compile:js'),(done)=>{done()})
  workerEventer( gulp.watch(`${entry}/**/*.vue`,gulp.series('compile:mina'),(done)=>{done()}))
  // workerEventer( gulp.watch(`${entry}/**/*.js`,gulp.series('compile:js'),(done)=>{done()}))
})

gulp.task('compile:copy',(done) => {
  gulp.src([
   `${entry}/**/*.wxml`,
   `${entry}/**/*.wxss`,
   `${entry}/**/*.wxs`,
   `${entry}/**/*.{eot,otf,ttf,woff,svg}`
 ])
 .pipe(gulp.dest(output))
 done()
})

// 编译入口
gulp.task('build', gulp.series(
  'clean', 
  'compile:project',
  'compile:copy',
  'compile:wxml',
  'compile:pug',
  'compile:less',
  'compile:js',
  'compile:mina',
  'compile:json',
  'compress:img',
  'watch'
  ), (done) => {
  done()
})
