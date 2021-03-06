const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
// const imagemin = require('gulp-imagemin');
const sourcemaps = require('gulp-sourcemaps');
// const rename = require("gulp-rename");
const responsive = require('gulp-responsive');
const htmlmin = require('gulp-htmlmin');

var browserSync = require('browser-sync').create();

/*
  -- TOP LEVEL FUNCTIONS --
  gulp.task - Define task
  gulp.src - Point to file to use
  gulp.dest - Points to folder to output
  gulp.watch - Watch files and folders for changes
*/

// Compile SASS for prodaction server
gulp.task('sass', () => {
  gulp.src('./src/sass/styles.scss')
    // .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    // .pipe(sourcemaps.write())
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./dist/css'));
});

// Compile SASS for developer server
gulp.task('sass-dev', () => {
  gulp.src('./src/sass/styles.scss')
    // .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    // .pipe(sourcemaps.write())
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('./dev/css'));
});

// Compile JS for prodaction server
gulp.task('scripts-dist', function() {
  gulp.src(['./src/js/app.js', './src/js/main.js', './src/js/dbhelper.js', './src/js/idb.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'));

  gulp.src(['./src/js/app.js', './src/js/restaurant_info.js', './src/js/dbhelper.js', './src/js/idb.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant-info.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'));
});

// Compile JS for developer server
gulp.task('scripts-dev', function() {
  gulp.src(['./src/js/app.js', './src/js/main.js', './src/js/dbhelper.js', './src/js/idb.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dev/js'));

  gulp.src(['./src/js/app.js', './src/js/restaurant_info.js', './src/js/dbhelper.js', './src/js/idb.js'])
    .pipe(sourcemaps.init())
    .pipe(concat('restaurant-info.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dev/js'));
});

// Copy files from root to prodaction server
gulp.task('copy-dist', function() {
  gulp.src('./src/*.*')
    .pipe(gulp.dest('./dist'));
});

// Create images for different resolution
gulp.task('responsive-img', function() {
  return gulp.src('./src/img/*.jpg')
    .pipe(responsive({
      '*.jpg': [{
        width: 390,
        rename: { suffix: '-390' },
      }, {
        width: 680,
        rename: { suffix: '-680' },
      }, {
        width: 15,
        rename: { suffix: '-15' },
      },{
        rename: { suffix: '-original' },
      }, {
        width: 390,
        rename: { suffix: '-390', extname:'.webp' },
      }, {
        width: 680,
        rename: { suffix: '-680', extname:'.webp' },
      }, {
        rename: { suffix: '-original', extname:'.webp' },
      }]
    }, {
      quality: 80,
      progressive: true,
      // Delete metadata
      withMetadata: false,
    }))
    .pipe(gulp.dest('./dist/img'))
    .pipe(gulp.dest('./dev/img'));;
});

// Copy files from root to developer server
gulp.task('copy-dev', function() {
  gulp.src('./src/*.*')
    .pipe(gulp.dest('./dev'));
});

// Resize and copy images to prodaction server
gulp.task('png-dist', function() {
  gulp.src('./src/img/*.png')
    .pipe(gulp.dest('./dist/img'));
});

// Resize and copy images to developer server
gulp.task('png-dev', function() {
  gulp.src('./src/img/*.png')
    .pipe(gulp.dest('./dev/img'));
});

// Copy html files to prodaction server
gulp.task('html-dev', function() {
  gulp.src('./src/html/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./dev'));
});

// Copy html files to prodaction server
gulp.task('html-dist', function() {
  gulp.src('./src/html/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('./dist'));
});


gulp.task('default', ['sass', 'scripts-dist', 'copy-dist', 'png-dist', 'responsive-img', 'html-dist']);

gulp.task('dev', ['sass-dev', 'scripts-dev', 'copy-dev', 'png-dev', 'responsive-img', 'html-dev']);

gulp.task('watch', function() {
    gulp.watch('./src/sass/**/*.scss', ['sass-dev']);
    gulp.watch('./src/js/**/*.js', ['scripts-dev']);
    gulp.watch('./src/*.*', ['copy-dev']);
    gulp.watch('./src/img/*.*', ['png-dev', 'responsive-img']);
    gulp.watch('./src/html/*.html', ['html-dev']);

    browserSync.init({
      server: "./"
    });
});