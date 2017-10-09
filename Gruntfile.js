'use strict';

module.exports = function (grunt) {
	require('shared-grunt-config')(grunt)
		.addJs(['tasks/**/*.js']);
};
