const gulp = require('gulp')
const rollup = require('gulp-better-rollup')
const terser = require('gulp-terser')
const brotli = require('gulp-brotli')
const rename = require('gulp-rename')

/*
	- Rollup
	- Terser
	- Brotli
*/

gulp.task('rollup', () => {
	return gulp.src('js/getAudioInfo.js')
		.pipe(rollup({ plugins: [] }, 'es'))
		.pipe(terser({
			ecma: 6,
			keep_fnames: false,
			mangle: {
				toplevel: true,
			},
		}))
		.pipe(rename('getAudioInfo.min.js'))
		.pipe(gulp.dest('.'))
})

gulp.task('brotli', () => {
	return gulp.src(['getAudioInfo.min.js'])
	.pipe(brotli.compress({
		quality: 11,
	}))
	.pipe(gulp.dest('.'))
})

gulp.task('default', gulp.series('rollup','brotli'))
