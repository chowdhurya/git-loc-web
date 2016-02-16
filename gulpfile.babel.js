import babel from 'gulp-babel';
import gulp from 'gulp';
import plumber from 'gulp-plumber'
import watch from 'gulp-watch';
import webpack from 'webpack-stream';

// Compile JSX
gulp.task('scripts', () => {
  return gulp.src('js/entry.jsx')
    .pipe(plumber())
    .pipe(webpack({
      output: {
        filename: 'app.js'
      },
      module: {
        loaders: [
          {
            test: /.jsx?$/,
            loader: 'babel-loader',
            query: {
              presets: ['es2015', 'react']
            }
          }
        ]
      }
    }))
    .pipe(gulp.dest('dist/'));
})

// Copy HTML
gulp.task('html', () => {
  return gulp.src('html/**/*')
    .pipe(gulp.dest('dist/'));
});

gulp.task('watch', () => {
  gulp.watch('js/**/*', ['scripts']);
  gulp.watch('html/**/*', ['html']);
});

gulp.task('default', ['scripts', 'html']);
