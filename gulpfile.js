require('./gulp.server.js');
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    argv = require('yargs').argv,
    sassVariables = require('gulp-sass-variables'),
    concat = require('gulp-concat'),
    uglifyjs = require('gulp-uglifyjs'),
    runSequence = require('run-sequence'),
    angularTemplatecache = require('gulp-angular-templatecache'),
    rev = require('gulp-rev'),
    del = require('del'),
    ngConfig = require('gulp-ng-config'),
    browserify = require('gulp-browserify'),
    fs = require('fs'),
    config = require('./config.js'),
    revReplace = require("gulp-rev-replace"),
    sourcemaps = require("gulp-sourcemaps"),
    rename = require('gulp-rename'),
    template = require('gulp-template'),
    babel = require('gulp-babel'),
    babelify = require('babelify');

var envify = require( 'envify/custom' );

var output = 'app';
var input = 'dist';
var isProduction;

var folders = {
    'ts': 'ts',
    'js': 'js',
    'scss': 'scss',
    'fonts': 'fonts',
    'favicon': 'favicon',
    'css': 'css',
    'npm': './node_modules',
    'templates': 'templates',
    'media': 'media',
    'images': 'images',
    'static': 'static',
    'bower': 'bower_components',
    'i18n': 'i18n'
};



let currentBlockChainMode;
let checkModeMethod = function() {
    let modes = ['eos', 'tron', 'default'];
    currentBlockChainMode = modes.filter((mode) => {
        return argv[mode];
    })[0] || 'default';
};
checkModeMethod();

/* Favicon */
gulp.task('app:favicon', function() {
    return gulp.src(path.join(output, folders['favicon'], '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['favicon'])));
});

/* Styles images collection */
gulp.task('app:images', function() {
    return gulp.src(path.join(output, folders['images'], '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['images'])));
});

/* Fonts collection */
gulp.task('app:fonts', function() {
    return gulp.src(path.join(output, folders['scss'], 'fonts', '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['css'], folders['fonts'])));
});

gulp.task('app:templates-clean', function () {
    return del([path.join(input, 'static', 'tpl', 'templates*')]);
});

gulp.task('app:templates', ['app:templates-clean'], function () {
    return gulp
        .src([path.join(output, folders['templates'], '*.html'), path.join(output, folders['templates'], '**/*.html')])
        .pipe(angularTemplatecache('templates.tpl.js', {
            standalone: true,
            root: "/templates/"
        }))
        //.pipe(uglifyjs({mangle: false}))
        .pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', 'tpl')))
        .pipe(rev.manifest('templates.json'))
        .pipe(gulp.dest(path.join(input, 'static', 'tpl')));
});

gulp.task('app:css-clean', function () {
    return del([path.join(input, 'static', folders['css'], '**/*.css')]);
});
/* Styles collection */
gulp.task('app:css', ['app:css-clean'], function() {
    return gulp.src(path.join(output, folders['scss'], '*.scss'))
        .pipe(sassVariables({
            $env: currentBlockChainMode
        }))
        .pipe(sass())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])))
        .pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])))
        .pipe(rev.manifest())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])));
});

gulp.task('app:vendors-clean', function () {
    return del([path.join(input, 'static', 'vendors', '**/*')]);
});
/* Vendors scripts collection */
gulp.task('app:vendors', ['app:vendors-clean', 'app:web3', 'app:eos-lynx', 'app:polyfills'], function() {
    var js = gulp.src(
        [
            path.join(input, 'static', 'polyfills', 'polyfills.js'),
            path.join(folders['npm'], 'jquery', 'dist', 'jquery.min.js'),
            path.join(folders['npm'], 'papaparse', 'papaparse.min.js'),
            path.join(folders['npm'], 'ua-parser-js', 'dist', 'ua-parser.min.js'),
            path.join(folders['npm'], 'qrious', 'dist', 'qrious.min.js'),
            path.join(folders['npm'], 'jssocials', 'dist', 'jssocials.min.js'),
            // path.join(folders['npm'], 'eosjs', 'dist', 'index.js'),
            path.join(folders['npm'], 'angular', 'angular.min.js'),
            path.join(folders['npm'], 'angular-resource', 'angular-resource.min.js'),
            path.join(folders['npm'], 'angular-cookies', 'angular-cookies.min.js'),
            path.join(folders['npm'], 'angular-ui-router', 'release', 'angular-ui-router.min.js'),
            path.join(folders['npm'], 'angular-clipboard', 'angular-clipboard.js'),
            path.join(folders['npm'], 'angular-file-saver', 'dist', 'angular-file-saver.bundle.min.js'),
            path.join(folders['npm'], 'angular-touch', 'angular-touch.min.js'),
            path.join(folders['npm'], 'ng-webworker', 'src', 'ng-webworker.min.js'),
            path.join(folders['npm'], 'angular-translate', 'dist', 'angular-translate.min.js'),
            path.join(folders['npm'], 'angular-translate', 'dist', 'angular-translate-loader-static-files', 'angular-translate-loader-static-files.min.js'),
            path.join(folders['npm'], 'moment', 'min', 'moment.min.js'),
            path.join(folders['npm'], 'moment-timezone', 'builds', 'moment-timezone-with-data.min.js'),
            path.join(folders['npm'], 'amcharts3', 'amcharts', 'amcharts.js'),
            path.join(folders['npm'], 'amcharts3', 'amcharts', 'pie.js'),
            path.join(folders['npm'], 'amcharts3', 'amcharts', 'themes', 'light.js'),
            path.join(folders['npm'], 'bignumber.js', 'bignumber.js'),
            path.join(input, 'static', 'web3', 'web3.js'),
            // path.join(input, 'static', 'babeled', 'babeled.js'),
            path.join(output, 'vendors', '**/*')
        ])
        .pipe(concat('vendors.js'))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(sourcemaps.write());

    if (argv.production) {
        js = js.pipe(uglifyjs({mangle: false}));
    }

    return js.pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', 'vendors')))
        .pipe(rev.manifest())
        .pipe(gulp.dest(path.join(input, 'static', 'vendors')));
});


gulp.task('all:js-start', ['app:js', 'login:js'], function() {
    return gulp.start('app:revision');
});

gulp.task('all:templates-start', ['app:templates'], function() {
    return gulp.start('app:revision');
});


gulp.task('app:ws', function() {
    return gulp.src(path.join(output, 'ws', 'socket-client.js'))
        .pipe(browserify())
        .pipe(gulp.dest(path.join(input, 'static', 'ws')));
});


gulp.task('app:eos-lynx', function() {
    return gulp.src(path.join(output, 'eos-lynx.js'))
        .pipe(browserify())
        .pipe(gulp.dest(path.join(input, 'static', 'eos-lynx')));
});

gulp.task('app:web3', function() {
    return gulp.src(path.join(output, 'web3.js'))
        .pipe(browserify({
            insertGlobals : true,
            transform: [
                envify( {
                    MODE: process.env.MODE
                } )
            ]
        }))
        .pipe(gulp.dest(path.join(input, 'static', 'web3')));
});

gulp.task('app:babeled', function () {
    return gulp.src(path.join(output, 'babeled.js'))
        .pipe(browserify({
            insertGlobals: true,
            transform: [
                babelify.configure({
                    presets: ["@babel/preset-env"]
                }),
                envify({
                    MODE: process.env.MODE
                })
            ]
        }))
        .pipe(gulp.dest(path.join(input, 'static', 'babeled')));
});

gulp.task('app:polyfills', function() {
    return gulp.src(path.join(output, 'polyfills', 'polyfills.js'))
        .pipe(browserify())
        .pipe(gulp.dest(path.join(input, 'static', 'polyfills')));
});


gulp.task('app:js-clean', function () {
    return del([path.join(input, 'static', 'js', 'main*')]);
});
/* Scripts collection */
gulp.task('app:js', ['app:js-clean', 'ng-config'], function() {
    var js = gulp.src([
        path.join(output, folders['js'], '**/*'),
        path.join(input, 'config.js'),
        '!' + path.join(output, folders['js'], 'login.js')])
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write());
    if (argv.production) {
        js = js.pipe(uglifyjs({mangle: false}));
    }
    return js.pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
        .pipe(rev.manifest('main.json'))
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])));
});

gulp.task('login:js-clean', function () {
    return del([path.join(input, 'static', 'js', 'login*')]);
});

/* Scripts collection */
gulp.task('login:js', ['login:js-clean'], function() {
    var js = gulp.src(
        [
            path.join(folders['npm'], 'angular', 'angular.min.js'),
            path.join(folders['npm'], 'angular-resource', 'angular-resource.min.js'),
            path.join(folders['npm'], 'angular-cookies', 'angular-cookies.min.js'),
            path.join(output, folders['js'], 'login.js'),
            path.join(output, folders['js'], 'services', 'request.js'),
            path.join(output, folders['js'], 'services', 'auth.js'),
            path.join(output, folders['js'], 'services', 'socialAuth.js'),
            path.join(output, folders['js'], 'services', 'socket.js'),
            path.join(output, folders['js'], 'constants', 'app.js'),
            path.join(output, folders['js'], 'constants', 'githubIssuer.js'),
            path.join(output, folders['js'], 'controllers', 'auth.js'),
            path.join(output, folders['js'], 'directives', 'ngMatch.js'),
            path.join(output, folders['js'], 'constants', 'api.js')
        ])
        .pipe(concat('login.js'))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(sourcemaps.write());

    if (argv.production) {
        js = js.pipe(uglifyjs({mangle: false}));
    }

    return js.pipe(rev())
    .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
    .pipe(rev.manifest('login.json'))
    .pipe(gulp.dest(path.join(input, 'static', folders['js'])));
});


/* Styles images collection */
gulp.task('app:css-images', function() {
    return gulp.src(path.join(output, folders['scss'], 'images', '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['css'], 'images')));
});


/* Languages */
gulp.task('app:i18n', function() {
    return gulp.src(path.join(output, folders['i18n'], '**/*'))
        .pipe(gulp.dest(path.join(input, folders['static'], folders['i18n'])));
});

gulp.task('app:revision', function() {
    var manifestCSS = gulp.src(path.join(input, 'static', folders['css'], 'rev-manifest.json'));
    var manifestJS = gulp.src(path.join(input, 'static', folders['js'], 'main.json'));
    var manifestLoginJS = gulp.src(path.join(input, 'static', folders['js'], 'login.json'));
    var manifestVendors = gulp.src(path.join(input, 'static', 'vendors', 'rev-manifest.json'));
    var manifestTemplates = gulp.src(path.join(input, 'static', 'tpl', 'templates.json'));
    var endBodyScripts = fs.readFileSync("app/endBody.htm", "utf8");

    var bestrateScript;

    switch(currentBlockChainMode) {
        case 'eos':
            bestrateScript = fs.readFileSync("app/bestRateWidget.htm", "utf8");
            break;
        case 'default':
        case 'tron':
            bestrateScript = fs.readFileSync("app/ethBestRateWidget.htm", "utf8");
            break;
        default:
            bestrateScript = '';
            break;
    }

    return gulp.src([path.join(output, '*.html')])
        .pipe(template({
            socialScripts: fs.readFileSync("app/social.htm", "utf8"),
            endBodyScripts: endBodyScripts,
            bestRateWidget: bestrateScript
        }))
        .pipe(revReplace({manifest: manifestCSS}))
        .pipe(revReplace({manifest: manifestJS}))
        .pipe(revReplace({manifest: manifestLoginJS}))
        .pipe(revReplace({manifest: manifestVendors}))
        .pipe(revReplace({manifest: manifestTemplates}))
        .pipe(gulp.dest(input))
});


gulp.task('app:zh-revision', function() {
    var manifestCSS = gulp.src(path.join(input, 'static', folders['css'], 'rev-manifest.json'));
    var manifestJS = gulp.src(path.join(input, 'static', folders['js'], 'main.json'));
    var manifestLoginJS = gulp.src(path.join(input, 'static', folders['js'], 'login.json'));
    var manifestVendors = gulp.src(path.join(input, 'static', 'vendors', 'rev-manifest.json'));
    var manifestTemplates = gulp.src(path.join(input, 'static', 'tpl', 'templates.json'));


    var bestrateScript;

    switch(currentBlockChainMode) {
        case 'eos':
            bestrateScript = fs.readFileSync("app/bestRateWidget.htm", "utf8");
            break;
        case 'default':
            bestrateScript = fs.readFileSync("app/ethBestRateWidget.htm", "utf8");
            break;
        default:
            bestrateScript = '';
            break;
    }

    return gulp.src([path.join(output, '*.html')])
        .pipe(template({
            socialScripts: '',
            endBodyScripts: '',
            bestRateWidget: bestrateScript
        }))
        .pipe(revReplace({manifest: manifestCSS}))
        .pipe(revReplace({manifest: manifestJS}))
        .pipe(revReplace({manifest: manifestLoginJS}))
        .pipe(revReplace({manifest: manifestVendors}))
        .pipe(revReplace({manifest: manifestTemplates}))
        .pipe(rename(function (path) {
            path.basename+= '.zh';
        }))
        .pipe(gulp.dest(input))
});



let modes = ['eos', 'tron', 'default'];
var currentMode = modes.filter((mode) => {
    return argv[mode];
})[0] || 'default';

process.env.MODE = currentMode;

gulp.task('ng-config', function() {
    if (!fs.existsSync(input)) {
        fs.mkdirSync(input);
    }
    fs.writeFileSync(path.join(input, 'config.js'),
        JSON.stringify(config[process.env.MODE]));


    return gulp.src(path.join(input, 'config.js'))
        .pipe(
            ngConfig('app', {
                createModule: false
            })
        )
        .pipe(gulp.dest(input))
});


gulp.task('app:rev', ['app:css', 'app:vendors', 'all:js-start', 'app:templates'], function() {
    return gulp.start('app:revision', 'app:zh-revision');
});
gulp.task('css:watcher', ['app:css'], function() {
    return gulp.start('app:revision');
});
gulp.task('i18n:watcher', ['app:i18n'], function() {
    return gulp.start('app:revision');
});

gulp.task('watcher',function() {
    gulp.watch(path.join(output, folders['i18n'], '**/*'), function() {
        gulp.start('i18n:watcher');
    });
    gulp.watch(path.join(output, folders['scss'], '**/*'), function() {
        gulp.start('css:watcher');
    });
    gulp.watch(path.join(output, folders['js'], '**/*'), function() {
        runSequence('all:js-start');
    });
    gulp.watch(path.join(output, folders['templates'], '**/*'), function() {
        runSequence('all:templates-start');
    });
});


gulp.task('default', ['app:i18n', 'app:images', 'app:favicon', 'app:fonts', 'app:css-images', 'watcher', 'app:rev', 'app:ws'],
    function() {
        if (!isProduction) {
            return gulp.start('serve');
        }
    }
);

gulp.task('production', function(cb) {
    isProduction = true;
    runSequence('default', cb);
});
