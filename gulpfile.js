var gulp = require('gulp');
var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');
 
var imgSrc = 'assets/images/**/*.{png,jpg,jpeg}';
var imgDest = '_site/assets/images';
 
// Minify any new images
gulp.task('images', function() {
 
  // Add the newer pipe to pass through newer images only
  return gulp.src(imgSrc, {encoding: false})
      .pipe(newer(imgDest))
      .pipe(imagemin())
      .pipe(gulp.dest(imgDest));
 
});
 
gulp.task('go', gulp.series('images'));
