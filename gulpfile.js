const gulp = require('gulp');
const ampUnCss = require('./index_test');

gulp.task('default', async function(){
  return gulp.src('tests/selectors/**/*.html')
      .pipe(ampUnCss({reportDirectory:'output', optimizationLevel: 1}))
      .pipe(gulp.dest('output/'));
});
