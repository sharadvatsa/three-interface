var _           = require('lodash');
var gulp        = require('gulp');
var gulpif      = require('gulp-if');
var connect     = require('gulp-connect');
var uglify      = require('gulp-uglify');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var del         = require('del');
var runSequence = require('run-sequence');

var conf = {
    buildPath: './build',
    main: ['./src/index.js']
};

var MINIFY = _.includes(process.argv, '--minify');

gulp.task('build', function (done) {
    runSequence('clean', ['scripts'], done);
});

gulp.task('clean', function () {
    // return del([conf.buildPath]);
});

gulp.task('scripts', function () {
    var b = browserify(conf.main)
        // .external('world')
        .bundle();
    b.on('error', function (err) {
        console.error(err);
    });
    return b.pipe(source(MINIFY ? 'three-interface.min.js' : 'three-interface.js'))
        .pipe(buffer())
        .pipe(gulpif(MINIFY, uglify()))
        .pipe(gulp.dest(conf.buildPath));
});

gulp.task('copy', function () {
    return gulp.src(conf.copy)
        .pipe(gulp.dest(conf.buildPath));
});

gulp.task('connect', function () {
    return connect.server();
});

gulp.task('watch', function () {
    gulp.watch(['./src/**/*.js'], ['scripts']);
});

gulp.task('default', ['build', 'connect', 'watch']);
