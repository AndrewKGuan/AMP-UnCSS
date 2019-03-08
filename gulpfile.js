const gulp = require('gulp');
const ampUnCss = require('./index_test');

gulp.task('default', async function(){
  return gulp.src('tests/selectors/*.html')
      .pipe(ampUnCss({reportDirectory:'output'}))
      .pipe(gulp.dest('output/'));
});
