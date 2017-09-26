require('./gulp.server.js');
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    concat = require('gulp-concat'),
    uglifyjs = require('gulp-uglifyjs'),
    runSequence = require('run-sequence'),
    angularTemplatecache = require('gulp-angular-templatecache'),
    uglifycss = require('gulp-uglifycss'),
    rev = require('gulp-rev'),
    del = require('del'),
    browserify = require('gulp-browserify'),
    // autoprefixer = require('gulp-autoprefixer'),
    revReplace = require("gulp-rev-replace");


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


/* Landing */
gulp.task('app:landing', function() {
    return gulp.src(path.join(output, 'landing', '**/*'))
        .pipe(gulp.dest(path.join(input, 'landing')));
});

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


gulp.task('app:templates', function () {
    del([path.join(input, 'static', 'tpl', 'templates*')]);
    return gulp
        .src(path.join(output, folders['templates'], '**/*.html'))
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

/* Styles collection */
gulp.task('app:css', function() {
    del([path.join(input, 'static', folders['css'], '**/*.css')]);
    return gulp.src(path.join(output, folders['scss'], '*.scss'))
        .pipe(sass())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])))
        //.pipe(uglifycss())
        .pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])))
        .pipe(rev.manifest())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])));
});

/* Vendors scripts collection */
gulp.task('app:vendors', function() {
    del([path.join(input, 'static', 'vendors', '**/*')]);
    return gulp.src(
        [
            path.join(folders['npm'], 'jquery', 'dist', 'jquery.min.js'),
            path.join(folders['npm'], 'angular', 'angular.min.js'),
            path.join(folders['npm'], 'angular-resource', 'angular-resource.min.js'),
            path.join(folders['npm'], 'angular-cookies', 'angular-cookies.min.js'),
            path.join(folders['npm'], 'angular-ui-router', 'release', 'angular-ui-router.min.js'),
            path.join(folders['npm'], 'angular-clipboard', 'angular-clipboard.js'),
            path.join(folders['npm'], 'moment', 'min', 'moment.min.js'),
            path.join(folders['npm'], 'moment-timezone', 'builds', 'moment-timezone-with-data.min.js'),
            path.join(output, 'vendors', '**/*')
        ])
        .pipe(concat('vendors.js'))
        //.pipe(uglifyjs({mangle: false})).pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', 'vendors')))
        .pipe(rev.manifest())
        .pipe(gulp.dest(path.join(input, 'static', 'vendors')));
});

gulp.task('all:tpl-clean', function() {
    del([path.join(input, 'static', 'tpl', '**/*')]);
});

gulp.task('all:js-start', ['app:js', 'login:js'], function() {
    return gulp.start('app:revision');
});

gulp.task('all:templates-start', ['app:templates'], function() {
    return gulp.start('app:revision');
});


gulp.task('app:web3', function() {
    return gulp.src(path.join(output, 'web3.js'))
        .pipe(browserify())
        .pipe(gulp.dest(path.join(input, 'static', 'web3')));
});

/* Scripts collection */
gulp.task('app:js'/*, ['app:ws']*/, function() {
    del([path.join(input, 'static', 'js', 'main*')]);
    return gulp.src([
        path.join(output, folders['js'], '**/*'),
        '!' + path.join(output, folders['js'], 'login.js')])
        .pipe(concat('main.js'))
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
        //.pipe(uglifyjs({mangle: false}))
        .pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
        .pipe(rev.manifest('main.json'))
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])));
});

/* Scripts collection */
gulp.task('login:js', function() {
    del([path.join(input, 'static', 'js', 'login*')]);
    return gulp.src(
        [
            path.join(folders['npm'], 'angular', 'angular.min.js'),
            path.join(folders['npm'], 'angular-resource', 'angular-resource.min.js'),
            path.join(folders['npm'], 'angular-cookies', 'angular-cookies.min.js'),
            path.join(output, folders['js'], 'login.js'),
            path.join(output, folders['js'], 'services', 'request.js'),
            path.join(output, folders['js'], 'services', 'auth.js'),
            path.join(output, folders['js'], 'constants', 'app.js'),
            path.join(output, folders['js'], 'constants', 'api.js')
        ])
        .pipe(concat('login.js'))
        //.pipe(uglifyjs({mangle: false}))
        .pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
        .pipe(rev.manifest('login.json'))
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])));
});


/* Styles images collection */
gulp.task('app:css-images', function() {
    return gulp.src(path.join(output, folders['scss'], 'images', '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['css'], 'images')));
});


// /* Languages */
// gulp.task('app:i18n', function() {
//     return gulp.src(path.join(output, folders['i18n'], '**/*'))
//         .pipe(gulp.dest(path.join(input, folders['static'], folders['i18n'])));
// });

gulp.task('app:revision', function() {
    var manifestCSS = gulp.src(path.join(input, 'static', folders['css'], 'rev-manifest.json'));
    var manifestJS = gulp.src(path.join(input, 'static', folders['js'], 'main.json'));
    var manifestLoginJS = gulp.src(path.join(input, 'static', folders['js'], 'login.json'));
    var manifestVendors = gulp.src(path.join(input, 'static', 'vendors', 'rev-manifest.json'));
    var manifestTemplates = gulp.src(path.join(input, 'static', 'tpl', 'templates.json'));

    return gulp.src(path.join(output, '*.html'))
        .pipe(revReplace({manifest: manifestCSS, replaceInExtensions: ['.css']}))
        .pipe(revReplace({manifest: manifestJS, replaceInExtensions: ['.js']}))
        .pipe(revReplace({manifest: manifestLoginJS}))
        .pipe(revReplace({manifest: manifestVendors}))
        .pipe(revReplace({manifest: manifestTemplates}))
        .pipe(gulp.dest(input))
});



gulp.task('app:rev', ['app:css', 'app:vendors', 'all:js-start', 'app:templates'], function() {
    return gulp.start('app:revision');
});
gulp.task('css:watcher', ['app:css'], function() {
    return gulp.start('app:revision');
});

gulp.task('watcher',function() {
    gulp.watch(path.join(output, folders['scss'], '**/*'), function() {
        gulp.start('css:watcher');
    });
    gulp.watch(path.join(output, folders['js'], '**/*'), function() {
        runSequence('all:js-start');
    });
    gulp.watch(path.join(output, folders['templates'], '**/*'), function() {
        runSequence('all:templates-start');
    });
    // gulp.watch(path.join(output, '*.html'), function() {
    //     runSequence('app:revision');
    // });
});





gulp.task('default', ['app:images', 'app:favicon', 'app:fonts', 'app:css-images', 'watcher', 'app:rev', 'app:landing', 'app:web3'],
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
