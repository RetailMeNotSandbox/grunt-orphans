# @retailmenot/grunt-orphans

Grunt multi-task for discovering orphaned files in a JS directory.

This task is designed to help you identify unused files that exist in a project's JS directories; files that are no longer referenced as dependencies by your entrypoints, but remain in the filesystem.

## Installation

```bash
npm install --save-dev grunt @retailmenot/grunt-orphans
```

## Configuration

In your Gruntfile:

```javascript
orphans: {
	options: {
		// List of file extensions you want to consider
		// when discovering orphans
		fileExtensions: ['.js', '.hbs'],
		// List of files, that, even if detected as orphans
		// will not result in the task failing. Useful if you
		// reference or use some files in your app that are
		// not dependencies of your greater JS build.
		whitelist: [
			// do not complain if
			'scripts/third-party/**/*.js'
		]
	},
	main: {
		options: {
		  // Path to your webpack.config.js (optional).
		  // This will help madge with path resolution
		  // and module aliasing as it walks your dependencies
		  webpackConfig: 'path/to/webpack.config.js',
		  // The directory from which module references
		  // in your codebase are relative.
		  baseDir: 'scripts/',
		  // Glob for all of the files that should be
		  // treated as entrypoints and serve as the
		  // starting point for madge to discover your
		  // codebase's dependencies.
		  entryFileGlob: 'scripts/pages/*.js'
		},
		// Tells the task the list of files to look at. It will
		// complain about any files specified in this array that
		// are not in the dependency tree for any files matching
		// options.entryFileGlob.
		files: {
			expand: true,
			cwd: 'scripts',
			src: ['**/*.js', '**/*.hbs']
		}
	}
}
```

## Sample Run

```bash
# create an orphaned file in your scripts directory
$ touch scripts/orphan.js
$ grunt orphans
Running "orphans:main" (orphans) task
>> Oprhaned file: scripts/orphan.js
Warning: Found 1 orphaned files. Use --force to continue.

Aborted due to warnings.
# Remove the script
$ rm scripts/orphan.js
$ grunt orphans
Running "orphans:main" (orphans) task

Done.
```
