const gulp = require('gulp');
const ampUnCss = require('./index_test');

gulp.task('default', function(){
  return gulp.src('tests/test_files/*.html')
      .pipe(ampUnCss({reportDir:'output'}))
      .pipe(gulp.dest('output/'));
});
