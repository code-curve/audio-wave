'use strict';

var request = require('request');

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt);
  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  var reloadPort = 35729, files;

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    develop: {
      server: {
        file: 'app.js'
      }
    },
    docco: {
      server: {
        src: ['app.js', 'routes/**/*.js'],
        options: {
          output: 'docs/server/'
        }
      },
      client: {
        src: ['public/js/**/*.js'],
        options: {
          output: 'docs/client/'
        }
      }
    },
    browserify: {
      dist: {
        files: {
          'public/build/js/admin.js': ['public/js/admin.js'],
          'public/build/js/app.js': ['public/js/app.js'],
          'public/build/js/login.js': ['public/js/login.js']
        }
      },
      options: {
        debug: true
      }
    },
    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      browserify: {
        files: ['public/js/**'],
        tasks: ['browserify']
      },
      server: {
        files: [
          'app.js',
          'routes/*.js'
        ],
        tasks: ['develop', 'delayed-livereload']
      },
      js: {
        files: ['public/js/*.js'],
        options: {
          livereload: reloadPort
        }
      },
      css: {
        files: ['public/css/*.css'],
        options: {
          livereload: reloadPort
        }
      },
      ejs: {
        files: ['views/*.ejs'],
        options: {
          livereload: reloadPort
        }
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-docco');

  grunt.config.requires('watch.server.files');
  files = grunt.config('watch.server.files');
  files = grunt.file.expand(files);

  grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
    var done = this.async();
    setTimeout(function () {
      request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','),  function (err, res) {
          var reloaded = !err && res.statusCode === 200;
          if (reloaded) {
            grunt.log.ok('Delayed live reload successful.');
          } else {
            grunt.log.error('Unable to make a delayed live reload.');
          }
          done(reloaded);
        });
    }, 500);
  });

  grunt.registerTask('default', ['develop', 'watch']);
  grunt.registerTask('doc', ['docco']);
};
