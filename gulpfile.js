var gulp = require('gulp'); 

var jshint     = require('gulp-jshint');
var concat     = require('gulp-concat');
var uglify     = require('gulp-uglify');
var rename     = require('gulp-rename');
var header     = require('gulp-header');

var pkg = 'package.json';
var scripts = 'src/*.js';
var filename = 'knockout-paged-list.js';

var banner = '/* Knockout Paged List <%= pkg.version %> */\n';
banner += '/* <%= pkg.homepage %> */\n';
banner += '/* by <%= pkg.author %> */\n';

gulp.task('build-script', function () {
  return gulp.src(scripts)
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest(''))
    .pipe(rename({ extname: '.min.js' }))
    .pipe(uglify())
    .pipe(gulp.dest(''));
});

gulp.task('lint', function () {
  return gulp.src(scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('watch', function() {
    gulp.watch(scripts, ['lint', 'build-script']);
});

gulp.task('default', ['lint', 'build-script', 'watch']);
