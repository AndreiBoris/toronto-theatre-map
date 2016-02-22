'use strict';

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    del = require('del'),
    htmlmin = require('gulp-htmlmin'),
    imageResize = require('gulp-image-resize'),
    critical = require('critical'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload');

// Styles
gulp.task('styles', function() {
    return sass('src/styles/*.scss', {
            style: 'expanded'
        })
        .pipe(autoprefixer('last 2 version'))
        .pipe(gulp.dest('dist/styles'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/styles'))
        .pipe(livereload())
        .pipe(notify({
            message: 'Styles task complete'
        }));
});

// Scripts
gulp.task('scripts', function() {
    return gulp.src(['src/scripts/mapmanager.js',
            'src/scripts/utilities.js',
            'src/scripts/divs.js',
            'src/scripts/glow.js',
            'src/scripts/markers.js',
            'src/scripts/directions.js',
            'src/scripts/twitter.js',
            'src/scripts/filter.js',
            'src/scripts/sort.js',
            'src/scripts/start.js'
        ])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/scripts'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/scripts'))
        .pipe(notify({
            message: 'Scripts task complete'
        }));
});

// temp task used to concatenate jQuery and Knockout
// Scripts
// gulp.task('perma', function() {
//     return gulp.src(['dist/perm/jquery-1.12.0.min.js',
//         'dist/perm/knockout-3.4.0.js'])
//         .pipe(concat('jquery_and_knockout.js'))
//         .pipe(gulp.dest('dist/perm/production'))
//         .pipe(rename({
//             suffix: '.min'
//         }))
//         .pipe(uglify())
//         .pipe(gulp.dest('dist/perm/production'))
//         .pipe(notify({
//             message: 'Perma task complete'
//         }));
// });
// 
// Temp task used to minify the cssLoading script
// gulp.task('minime', function() {
//     return gulp.src(['dist/perm/production/cssLoading.js'])
//         .pipe(rename({
//             suffix: '.min'
//         }))
//         .pipe(uglify())
//         .pipe(gulp.dest('dist/perm/production'))
//         .pipe(notify({
//             message: 'minature task complete'
//         }));
// });

// Temp task used to minify the jsLoading script
gulp.task('minime', function() {
    return gulp.src(['dist/perm/production/jsLoading.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/perm/production'))
        .pipe(notify({
            message: 'minature task complete'
        }));
});

// Clean images Don't do this unless you're sure you can build the images again
// gulp.task('clean-images', function() {
//     return del(['dist/images']);
// });

// Resize images
gulp.task('images', function() {
    gulp.src('src/images/*curtain.jpeg')
        .pipe(imageResize({
            width: 400
        }))
        .pipe(rename(function(path) { path.basename += '-400'; }))
        .pipe(gulp.dest('dist/images'))
        .pipe(notify({
            message: 'Resize (no minification) task complete'
        }));
});

// Clean
gulp.task('clean', function() {
    return del(['dist/styles', 'dist/scripts', './index.html']);
});


// Default
gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts', 'images', 'minify-html');
});


// Minify HTML
gulp.task('minify-html', function() {
    return gulp.src('src/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('.'));
});

// Lint gulpfile.js
gulp.task('gulpfile-lint', function() {
    return gulp.src('gulpfile.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(notify({
            message: 'Gulpfile-lint task complete'
        }));
});

// Watch
gulp.task('watch', function() {
    livereload.listen();
    // Watch .scss files
    gulp.watch('src/styles/**/*.scss', ['styles']);

    // Watch .js files
    gulp.watch('src/scripts/**/*.js', ['scripts']);

    // Watch image files
    gulp.watch('src/images/**/*', ['images']);

    // Watch src/index.html
    gulp.watch('src/*.html', ['minify-html']);

    // Watch this file
    gulp.watch('gulpfile.js', ['gulpfile-lint']);
});

/*** No longer used due to measured decrease in performance ***/
// // Critical CSS
// gulp.task('critical', ['styles', 'scripts', 'images', 'minify-html'], function () {
//     critical.generate({
//         inline: true,
//         base: '.',
//         src: 'index.html',
//         minify: true,
//         css: ['dist/styles/main.min.css'],
//         width: 1900,
//         height: 1300,
//         dest: 'index.html',
//     });
// });

// // Critical CSS that is used by watch, responds to changes in any scss files,
// // requires that a minified HTML file is already present in root dir.
// gulp.task('critical-styles', ['styles'], function () {
//     critical.generate({
//         inline: true,
//         base: '.',
//         src: 'index.html',
//         minify: true,
//         css: ['dist/styles/main.min.css'],
//         width: 1900,
//         height: 1300,
//         dest: 'index.html',
//     });
// });

// // Critical CSS that is used by watch, responds to changes in the html file,
// gulp.task('critical-html', ['minify-html'], function () {
//     critical.generate({
//         inline: true,
//         base: '.',
//         src: 'index.html',
//         minify: true,
//         css: ['dist/styles/main.min.css'],
//         width: 1900,
//         height: 1300,
//         dest: 'index.html',
//     });
// });
