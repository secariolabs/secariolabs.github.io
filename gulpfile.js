var gulp = require('gulp');
var newer = require('gulp-newer');
var imagemin = require('gulp-imagemin');
 
var imgSrc = 'assets/images/**/*.{png,jpg,jpeg}';
var tmp_opt = 'opt_images'
var imgDest = 'dist/img';
 
// Minify any new images
gulp.task('images', function() {
 
  // Add the newer pipe to pass through newer images only
  return gulp.src(imgSrc)
      .pipe(newer(imgDest))
      .pipe(imagemin())
      .pipe(gulp.dest(imgDest));
 
});
 
gulp.task('default', function() {
  gulp.watch(imgSrc, ['images']);
});