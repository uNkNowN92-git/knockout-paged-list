var gulp = require('gulp'); 

var jshint     = require('gulp-jshint');
var concat     = require('gulp-concat');
var uglify     = require('gulp-uglify');
var rename     = require('gulp-rename');
// var minifyCss  = require('gulp-minify-css');
// var ngAnnotate = require('gulp-ng-annotate');

// var styles = [
//   "src/style/jquery.datetimepicker.css",
//   "src/style/angular-flash.min.css",
//   "src/style/normalize.css",
//   "src/style/fonts.css",
//   "src/style/base.css",
// ];

var scripts = 'src/*.js';
var filename = 'knockout-paged-list.js';

gulp.task('build-script', function () {
  return gulp.src(scripts)
    // .pipe(concat(filename))
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