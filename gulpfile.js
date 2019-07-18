const gulp = require('gulp');
const ampUnCss = require('./index_test');

gulp.task('default', function() {
  return gulp.src('built_docs/**/*.html')
      .pipe(ampUnCss({reportDirectory: 'output', optimizationLevel: 1}))
      .pipe(gulp.dest('output/'));
});
