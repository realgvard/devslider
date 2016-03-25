'use strict';

var gulp         = require('gulp');
var sass         = require('gulp-sass');
var notify       = require('gulp-notify');
var plumber      = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps   = require('gulp-sourcemaps');

var app = {
    pub: ''
};

gulp.task('sass', function () {
    gulp.src('assets/sass/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass.sync().on('error', notify.onError("Error: <%= error.message %>")))
        .pipe(plumber.stop())

        // dist result
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('dev', ['sass'], function () {
    gulp.watch('assets/sass/**/*.scss', ['sass']);
});