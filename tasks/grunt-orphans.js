'use strict';

var _ = require('lodash');
var assert = require('assert');
var path = require('path');
var madge = require('madge');

module.exports = function (grunt) {
	var description = 'Quickly identify JS files that are no longer consumed by your build.';
	grunt.registerMultiTask('orphans', description, _.partial(orphansTaskMethod, grunt));
};

function orphansTaskMethod(grunt) {
	/* eslint no-invalid-this: 0 */
	var done = this.async();
	var options = this.options({
		entryFileGlob: null,
		baseDir: null,
		webpackConfig: null,
		fileExtensions: null,
		whitelist: []
	});

	assert(
		_.isArray(options.entryFileGlob) || _.isString(options.entryFileGlob),
		'options.entryFileGlob must be a string or an array'
	);
	assert(_.isArray(options.whitelist), 'options.whitelist must be an array');

	// Generate the whitelist as a list of files matching globs in
	// options.whitelist relative to options.baseDir
	var whitelist = _.chain(grunt.file.expand(options.whitelist))
	.map(f=>f.replace(options.baseDir, '').substr(1))
	.value();

	// Convert this.files to a flat array of filenames relative to
	// options.baseDir
	var allFilesInTree = getAllFilesInTree(this.files, options.baseDir);

	// Generate a fileName => boolean mapping for all of the files in the tree
	// we assume they are not used until we see them in the dependency tree
	// returned from madge
	var filesByModuleName = {};
	_.each(allFilesInTree, fileName=>{
		var moduleName = fileName.substr(1);

		// treat as unused until we discover something using it
		filesByModuleName[moduleName] = false;
	});

	// generate a list of all files to treat as entrypoints. This will serve as
	// the starting point for madge to generate the dependency tree.
	var allEntryFiles = grunt.file.expand(options.entryFileGlob);

	var madgeOpts = getMadgeOpts(grunt, options);

	// Call to madge to generate the dependency tree for allEntryFiles
	madge(allEntryFiles, madgeOpts)
	.then(res=>{
		var tree = res.obj();
		_.each(tree, (deps, key)=>{
			_.each(deps, d=>{
				filesByModuleName[d] = true;
			});
		});
	})
	.then(function identifyAndLogOrphans() {
		var allEntries = Object.keys(filesByModuleName);
		var orphanedFiles = _.chain(allEntries)
		.filter(e=>{
			return filesByModuleName[e] === false &&
				!_.some(whitelist, allowed=>e === allowed);
		})
		.value();
		_.each(orphanedFiles, f=>{
			grunt.log.warn(
				'Oprhaned file:',
				path.join(options.baseDir, f)
			);
		});
		if (orphanedFiles.length) {
			grunt.fail.warn(
				'Found ' + orphanedFiles.length + ' orphaned files.'
			);
		}
		done();
	})
	.catch(grunt.log.error);
}

/**
 * Generates a flat list of files from the grunt task's this.files property.
 * The list of files will be relative to `baseDir`.
 * @param  {Array} files   Files from the grunt task's this.files property.
 *   http://gruntjs.com/api/inside-tasks#this.files
 * @param  {String} baseDir Base directory for this.files. The value of this
 *   argument will be stripped from the beginning of the files named in
 *   this.files.
 * @return {String[]} Flattened array of fileNames named by files relative to
 *   baseDir.
 */
function getAllFilesInTree(files, baseDir) {
	return _.chain(files)
	.map(f=>f.src)
	.flatten()
	.map(f=>f.replace(baseDir, ''))
	.value();
}

/**
 * Generates options suitable for passing to madge.
 * @param  {Object} grunt   the grunt instance that was passed to the task.
 * @param  {Object} options options that were passed to the task.
 * @param  {String} [options.baseDir] The baseDir to pass to madge.
 * @param  {String} [options.webpackConfig] The path to the webpack.config.js
 *   to assist madge in its alias resolution.
 * @param {String[]} [options.fileExtensions] List of file extensions to be
 *   included in the dependency tree.
 * @return {Object} Options to be passed to madge.
 */
function getMadgeOpts(grunt, options) {
	var madgeOpts = {
		baseDir: options.baseDir,
		webpackConfig: options.webpackConfig,
		showFileExtension: true
	};

	if (options.fileExtensions) {
		madgeOpts.fileExtensions = grunt.config(options.fileExtensions);
	}
	return madgeOpts;
}
