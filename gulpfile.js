// connect.js尾式调用控制异步流程
const connect = require('connect')

// Delete files and folders using globs
const del = require('del')

// Front-matter 是文件最上方以 --- 分隔的区域，用于指定个别文件的变量
const frontMatter = require('front-matter')

// 用自动化构建工具增强你的工作流程
const gulp = require('gulp')

// CSS预处理器简单写法
const cssnext = require('gulp-cssnext')

// gulp plugin for ESLint
const eslint = require('gulp-eslint')

// 使用gulp-htmlmin压缩html，可以压缩页面javascript、css，去除页面空格、注释，删除多余属性等
const htmlmin = require('gulp-htmlmin')

// conditionally control the flow of vinyl objects
const gulpIf = require('gulp-if')

// prevent pipe breaking caused by errors from gulp plugins
const plumber = require('gulp-plumber')

// gulp plugin to rename files easily
const rename = require('gulp-rename')

// utility functions for gulp plugins
const gutil = require('gulp-util')

// html entity encoder/decoder written in JavaScript
const he = require('he')

// highlight
const hljs  = require('highlight.js')

// a full featured templating engine for javascript
const nunjucks = require('nunjucks')

//ES2015 Object.assign() ponyfill
const assign = require('object-assign')

// 模块用于处理文件与目录的路径
const path = require('path')

// markdown parser done right
const Remarkable = require('remarkable')

// middleware function to serve files from within a given root directory
const serverStatic = require('serve-static')

// through2经常被用于处理node的stream
// A tiny wrapper around Node.js streams.Transform (Streams2/3) to avoid explicit subclassing noise
const through = require('through2')

// a module bundler, bundle JavaScript files for usage in a browser
const webpack = require('webpack')

// interactive command line tools
const {argv} = require('yargs')

// 实时重载
// let browserSync = require('browser-sync')
// let reload = browserSync.reload

// 输出路径
const DEST = './build'

const REPO = 'solved-by-flexbox'

// 公共路径
const PUBLIC_PATH = path.join('/', (isProd() ?　REPO : '.'), '/')

function isProd() {
  /**
   * 在node中，有全局变量process表示的是当前的node进程。process.env包含着关于系统环境的信息。
   * 但是process.env中并不存在NODE_ENV这个东西。NODE_ENV是用户一个自定义的变量，在webpack中
   * 它的用途是判断生产环境或开发环境的依据的
   **/
  return process.env.NODE_ENV === 'production'
}

nunjucks.configure('templates', { autoescape: false })

function streamError(err) {
  // 控制台发声,错误时beep一下
  gutil.beep()
  gutil.log(err instanceof gutil.PluginError ?　err.toString() : err.stack)
}

function extrackFrontMatter(options) {
  let files = []
  let site = assign({ demos: [] }, options)
  return through.obj(
    function transform(file, enc, done) {
      let contents = file.contents.toString()
      let yaml = frontMatter(contents)

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
      // Render the file's content to the page.content template property.
      let content = file.contents.toString()
      file.data.page.content = nunjucks.renderString(content, file.data)

      // then render the page in its template
      let template = file.data.page.template
      file.contents = new Buffer(nunjucks.render(template, file.data))

      this.push(file)
    } catch (e) {
      this.emit('error', new gutil.PluginError('renderTemplate', e, { fileName: file.path }))
    }
    cb()
  })
}

gulp.task('pages', function () {
  let baseData = require('./config')
  let overrides = {
    baseUrl: PUBLIC_PATH,
    env: process.env.NODE_ENV || 'development'
  }
  let siteData = assign(baseData, overrides)

  /*
  * 输出（Emits）符合所提供的匹配模式（glob）或者匹配模式的数组（array of globs）的文件
  * */
  return gulp.src(['*.html', './demos/**/*'], { base: process.cwd() })
    .pipe(plumber({errorHandler: streamError}))
    .pipe(extrackFrontMatter(siteData))
    .pipe(renderMarkdown())
    .pipe(renderTemplate())
    .pipe(rename(function (path) {
      if (path.basename !== 'index' && path.basename !== '404') {
        path.dirname += '/' + path.basename
        path.basename = 'index'
        path.extname = '.html'
      }
    }))
    .pipe(gulpIf(isProd(), htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      useShortDocType: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true
    })))
    .pipe(gulp.dest(DEST))
})

gulp.task('images', function () {
  return gulp.src('./assets/images/**/*')
    .pipe(gulp.dest(path.join(DEST, 'images')))
})

gulp.task('css', function () {
  return gulp.src('./assets/css/main.css')
    .pipe(plumber({errorHandler: streamError}))
    .pipe(cssnext({
      browsers: '> 1%, last 2 versions, Safari > 5, ie > 9, Firefox ESR',
      compress: true,
      url: false
    }))
    .pipe(gulp.dest(DEST))
})

gulp.task('lint', function () {
  return gulp.src(['gulpfile.js', 'assets/javascript/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
})

gulp.task('javascript:main', ((compiler) => {
  const createCompiler = () => {
    const entry = './assets/javascript/main.js'
    const plugins = [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.SBF_PUBLIC_PATH': JSON.stringify(PUBLIC_PATH)
      })
    ]
    if (isProd()) {
      plugins.push(new webpack.optimize.UglifyJsPlugin({sourceMap: true}))
    }
    return webpack({
      entry: entry,
      output: {
        path: path.resolve(__dirname, DEST),
        publicPath: PUBLIC_PATH,
        filename: path.basename(entry)
      },
      devtool: "#source-map",
      plugins,
      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            babelrc: false,
            cacheDirectory: false,
            presets: [['es2015', { 'modules': false }]]
          }
        }]
      },
      performance: { hints: false },
      cache: {}
    })
  }
  return (done) => {
    (compiler || (compiler = createCompiler())).run(function (err, stats) {
      if (err) return done(err)
      gutil.log('[webpack]', stats.toString('minimal'))
      done()
    })
  }
})())

gulp.task('javascript:polyfills', ((compiler) => {
  const createCompiler = () => {
    const entry = './assets/javascript/polyfills.js'
    return webpack({
      entry: entry,
      output: {
        path: path.resolve(__dirname, DEST),
        publicPath: PUBLIC_PATH,
        filename: path.basename(entry)
      },
      devtool: '#source-map',
      plugins: [new webpack.optimize.UglifyJsPlugin({sourceMap: true})],
      performance: {hints: false},
      cache: {}
    })
  }
  return (done) => {
    (compiler || (compiler = createCompiler())).run(function (err, stats) {
      if (err) return done(err)
      gutil.log('[webpack]', stats.toString('minimal'))
      done()
    })
  }
})())

gulp.task('javascript', ['javascript:main', 'javascript:polyfills'])

gulp.task('clean', function (done) {
  del(DEST, done)
})

gulp.task('default', ['css', 'images', 'javascript', 'pages'])

gulp.task('serve', ['default'], function () {
  let port = argv.port || argv.p || 4000
  connect().use(serverStatic(DEST)).listen(port)
  gulp.watch('./assets/css/**/*.css', ['css'])
  gulp.watch('./assets/images/*', ['images'])
  gulp.watch('./assets/javascript/*', ['javascript'])
  gulp.watch(['*.html', './demos/*', './templates/*'], ['pages'])
})

// gulp.task('deploy', ['default', 'lint'], function () {
//   if (process.env.NODE_ENV !== 'production') {
//     throw new Error('Deploying requires NODE_ENV to be set to production')
//   }
//
//   // create a tempory directory and checkout the existing gh-pages branch
//   sh.rm('-rf', '_tmp')
//   sh.mkdir('_tmp')
//   sh.cd('_tmp')
//   sh.exec('git init')
//   sh.exec('git remote add origin git@github.com:philipwalton/' + REPO + '.git')
//   sh.exec('git pull origin gh-pages')
//
//   // Delete all the exiting files and add the new ones from the build directory.
//   sh.rm('-rf', './*')
//   sh.cp('-rf', path.join('..', DEST, '/*'), './')
//   sh.exec('git add -A')
//
//   // Commit and push the changes to the gh-pages branch
//   sh.exec('git commit -m "Deploy site"');
//   sh.exec('git branch -m gh-pages');
//   sh.exec('git push origin gh-pages');
//
//   // Clean up.
//   sh.cd('..');
//   sh.rm('-rf', '_tmp');
//   sh.rm('-rf', DEST);
// })