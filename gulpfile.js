var gulp = require('gulp');

var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var header = require('gulp-header');

// using data from package.json 
var pkg = require('./package.json');
var banner = ['/*',
  ' * <%= pkg.name %> v<%= pkg.version %>',
  ' * <%= pkg.description %>',
  ' * @repository <%= pkg.repository.url %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');
  
var scripts = 'src/*.js';
var filename = 'knockout-paged-list' + pkg.version;
var buildDestination = 'build/' + pkg.version;

gulp.task('build', function () {
    return gulp.src(scripts)
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(rename({ extname: '-' + pkg.version + '.js' }))
        .pipe(gulp.dest(buildDestination))
        .pipe(gulp.dest(''))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(uglify())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest(buildDestination))
        .pipe(gulp.dest(''));
});

gulp.task('lint', function () {
    return gulp.src(scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('watch', function () {
    gulp.watch(scripts, ['lint']);
});

gulp.task('default', ['lint', 'watch']);