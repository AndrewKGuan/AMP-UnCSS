const gulp = require('gulp');
const ampUnCss = require('./index');

gulp.task('default', function(){
  return gulp.src('tests/test_files/*.html')
      .pipe(ampUnCss('dest'))
      .pipe(gulp.dest('output/'));
});
