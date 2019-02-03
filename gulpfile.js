// connect.js尾式调用控制异步流程
const connect = require('connect')
// Delete files and folders using globs
const del = require('del')
const gulp = require('gulp')
const cssnext = require('gulp-cssnext')
const eslint = require('gulp-eslint')
const htmlmin = require('gulp-htmlmin')
const gulpIf = require('gulp-if')
const plumber = require('gulp-plumber')
const rename = require('gulp-rename')
const gutil = require('gulp-util')
const he = require('he')
const hljs  = require('highlight.js')
const nunjucks = require('nunjucks')
const assign = require('object-assign')
// 模块用于处理文件与目录的路径
const path = require('path')
// markdown parser done right
const remarkable = require('remarkable')
// middleware function to serve files from within a given root directory
const serverStatic = require('serve-static')
// portable (Windows/Linux/OS X) implementation of Unix shell commands on top of the Node.js API
const sh = require('shelljs')
// wrapper around Node.js streams.Transform (Streams2/3)
const through = require('through2')
// a module bundler, bundle JavaScript files for usage in a browser
const webpack = require('webpack')
// interactive command line tools
const {argv} = require('yargs')

// 输出路径
const DEST = './build'

const REPO = 'solved-by-flexbox'

// 公共路径
const PUBLIC_PATH = path.join('/', (isProd() ?　REPO : '.'), '/')

function isProd() {
  return process.env.NODE_ENV === 'production'
}

nunjucks.configure('templates', { autoescape: false })

function streamError(err) {
  gutil.beep()
  gutil.log(err instanceof gutil.PluginError ?　err.toString() : err.stack)
}

function extrackFrontMatter(options) {
  let files = []
  let site = assign({ demos: [] }, options)
  return through.obj(
    function transform(file, enc, done) {
      let contents = file.contents.toString()
      let yaml = frontmatter(contents)
      if (yaml.attributes) {
        let slug = path.basename(file.path, path.extname(file.path))
        let permalink = site.baseUrl + (slug === 'index' ? '' : 'demos/' + slug + '/')
        file.contents = new Buffer(yaml.body)
        file.data = {
          site: site,
          page: assign({ slug: slug, permalink: permalink }, yaml.attributes)
        }
        if (file.path.indexOf('demos') > -1) {
          site.demos.push(file.data.page)
        }
      }

      files.push(file)
      done()
    },
    function flush(done) {
      files.forEach(function(file) { this.push(file) }.bind(this))
      done()
    }
  )
}

function renderMarkdown() {
  let markdown = new Remarkable({
    html: true,
    typographer: true,
    highlight: function (code, lang) {
      // Unescape to avoid double escaping.
      code = he.unescape(code)
      return lang ? hljs.highlight(lang, code).value : he.escape(code)
    }
  })
  return through.obj(function (file, enc, cb) {
    try {
      if (path.extname(file.path) === '.md') {
        file.contents = new Buffer(markdown.render(file.contents.toString()))
      }
      this.push(file)
    } catch (e) {
      this.emit('error', new gutil.PluginError('renderMarkdown', e, {
        fileName: file.path
      }))
    }
    cb()
  })
}

function renderTemplate() {
  return through.obj(function (file, enc, cb) {
    try {
      // Render the file's
    } catch (e) {

    }
  })
}