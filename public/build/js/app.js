(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
angular.module('app', ['ngRoute', 'btford.socket-io']).

config(function($routeProvider) {
  $routeProvider.
  when('/:id', {
    templateUrl: '/partials/client',
    controller: 'ClientController'
  }).
  otherwise({
    redirectTo: '/0'
  });
}).

factory({
  'socket': require('./services/socket'),
  'clientSocket': require('./services/clientSocket.js')  
}).

controller({
  'ClientController': require('./controllers/ClientController.js')
});

},{"./controllers/ClientController.js":2,"./services/clientSocket.js":3,"./services/socket":4}],2:[function(require,module,exports){
module.exports = function($scope, $routeParams, clientSocket) {
  var sessionId = $routeParams.id; 
  
  clientSocket.on('welcome', function() {

    clientSocket.emit('register', {
      session: sessionId
    });

  });
}

},{}],3:[function(require,module,exports){

// clientSocket Factory
// -------------------

// Provides a socket that's connected
// to the user channel.

module.exports = function(socket) {
  var clientSocket = socket('client');
  clientSocket.ready = false;
  
  clientSocket.on('ready', function() {
    clientSocket.ready = true;
  });
  
  return clientSocket;
};

},{}],4:[function(require,module,exports){

// Socket Wrapper
// --------------

// Acts as a wrapper around socketFactory
// and exposes a function that will create
// namespaced sockets, based on a parameter.

module.exports = function(socketFactory) {
  return function(namespace) {
    var connectUrl = 'http://localhost:3000/' + namespace;
    return socketFactory({
      ioSocket: io.connect(connectUrl)
    });
  }
};

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYXBwLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9jb250cm9sbGVycy9DbGllbnRDb250cm9sbGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9jbGllbnRTb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3NvY2tldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nXSkuXG5cbmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlci5cbiAgd2hlbignLzppZCcsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jbGllbnQnLFxuICAgIGNvbnRyb2xsZXI6ICdDbGllbnRDb250cm9sbGVyJ1xuICB9KS5cbiAgb3RoZXJ3aXNlKHtcbiAgICByZWRpcmVjdFRvOiAnLzAnXG4gIH0pO1xufSkuXG5cbmZhY3Rvcnkoe1xuICAnc29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9zb2NrZXQnKSxcbiAgJ2NsaWVudFNvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvY2xpZW50U29ja2V0LmpzJykgIFxufSkuXG5cbmNvbnRyb2xsZXIoe1xuICAnQ2xpZW50Q29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQ2xpZW50Q29udHJvbGxlci5qcycpXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkcm91dGVQYXJhbXMsIGNsaWVudFNvY2tldCkge1xuICB2YXIgc2Vzc2lvbklkID0gJHJvdXRlUGFyYW1zLmlkOyBcbiAgXG4gIGNsaWVudFNvY2tldC5vbignd2VsY29tZScsIGZ1bmN0aW9uKCkge1xuXG4gICAgY2xpZW50U29ja2V0LmVtaXQoJ3JlZ2lzdGVyJywge1xuICAgICAgc2Vzc2lvbjogc2Vzc2lvbklkXG4gICAgfSk7XG5cbiAgfSk7XG59XG4iLCJcbi8vIGNsaWVudFNvY2tldCBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGEgc29ja2V0IHRoYXQncyBjb25uZWN0ZWRcbi8vIHRvIHRoZSB1c2VyIGNoYW5uZWwuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0KSB7XG4gIHZhciBjbGllbnRTb2NrZXQgPSBzb2NrZXQoJ2NsaWVudCcpO1xuICBjbGllbnRTb2NrZXQucmVhZHkgPSBmYWxzZTtcbiAgXG4gIGNsaWVudFNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICBjbGllbnRTb2NrZXQucmVhZHkgPSB0cnVlO1xuICB9KTtcbiAgXG4gIHJldHVybiBjbGllbnRTb2NrZXQ7XG59O1xuIiwiXG4vLyBTb2NrZXQgV3JhcHBlclxuLy8gLS0tLS0tLS0tLS0tLS1cblxuLy8gQWN0cyBhcyBhIHdyYXBwZXIgYXJvdW5kIHNvY2tldEZhY3Rvcnlcbi8vIGFuZCBleHBvc2VzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZVxuLy8gbmFtZXNwYWNlZCBzb2NrZXRzLCBiYXNlZCBvbiBhIHBhcmFtZXRlci5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXRGYWN0b3J5KSB7XG4gIHJldHVybiBmdW5jdGlvbihuYW1lc3BhY2UpIHtcbiAgICB2YXIgY29ubmVjdFVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyArIG5hbWVzcGFjZTtcbiAgICByZXR1cm4gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogaW8uY29ubmVjdChjb25uZWN0VXJsKVxuICAgIH0pO1xuICB9XG59O1xuIl19
