/**
 * Admin
 *
 * The admin application is responsible for keeping
 * track of all sessions, devices, audio files and
 * composed songs.
 * 
 * It also provides a console for talking to the
 * server and the compose interface for creating
 * song files from the available audio files.
 */

angular.module('admin', ['ngRoute', 'btford.socket-io']).

config(function($routeProvider) {
  $routeProvider.
  when('/sessions', {
    templateUrl: '/partials/sessions',
    controller: require('./controllers/SessionsController.js')
  }).
  when('/audio', {
    templateUrl: '/partials/audio',
    controller: require('./controllers/AudioController.js')
  }).
  when('/users', {
    templateUrl: '/partials/users',
    controller: require('./controllers/UsersController.js')
  }).
  when('/compose', {
    templateUrl: '/partials/compose',
    controller: require('./controllers/ComposeController.js')
  }).
  otherwise({
    redirectTo: '/sessions'
  });
}).

/**
 * Directives
 */

// interface for editing collections
directive('editor', require('./directives/editor')).
// console for server communication
directive('console', require('./directives/console')).
// searchable collection interface 
directive('collection', require('./directives/collection')).

/**
 * Services
 */

// web socket wrapper
factory('socket', require('./services/socket')).
// socket connect to admin channel
factory('adminSocket', require('./services/adminSocket')).
// collection maintainer
factory('collection', require('./services/collection'));
