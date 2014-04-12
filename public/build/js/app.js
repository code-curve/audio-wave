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
}).

directive({
  'visualisation': require('./directives/visualisation')
});

},{"./controllers/ClientController.js":2,"./directives/visualisation":3,"./services/clientSocket.js":4,"./services/socket":5}],2:[function(require,module,exports){
module.exports = function($scope, $routeParams, clientSocket) {
  var sessionId = $routeParams.id; 
  
  clientSocket.on('welcome', function() {

    clientSocket.emit('register', {
      session: sessionId
    });

  });
}

},{}],3:[function(require,module,exports){
module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: '/partials/visualisation',
    compile: function(scope, element, attrs) { 
      
    },
    controller: function($scope, $element) {
      var canvas, context, balls;
      canvas = $element[0].children[0];
      context = canvas.getContext('2d');

      canvas.width = document.body.clientWidth;
      canvas.height = document.body.clientHeight;
      
      balls = [];
 
      function createBall() {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 300,
          i: Math.random() * 5 - 2.5,
          j: Math.random() * 5 - 2.5,
          s: Math.random() * 70 + 30
        }
      }

      function update() {
        setTimeout(update, 20);
        context.fillStyle = '#222';
        context.fillRect(0, 0, canvas.width, canvas.height);

        if(Math.random() > 0.95) {
          balls.push(createBall());
        }

        balls.map(function(ball) {
          context.beginPath();
          ball.x += ball.i;
          ball.y += ball.j;
          context.arc(ball.x, ball.y, ball.r ,0, 2 * Math.PI);
          context.fillStyle = 'hsla(120, ' + ball.s  + '%, 70%, 0.3)';
          context.fill();
          return ball;
        });
      }

      balls.push(createBall());
      balls.push(createBall());
      balls.push(createBall());
      update();
    }
  };
};

  

},{}],4:[function(require,module,exports){

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

},{}],5:[function(require,module,exports){

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYXBwLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9jb250cm9sbGVycy9DbGllbnRDb250cm9sbGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL3Zpc3VhbGlzYXRpb24uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL2NsaWVudFNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvOmlkJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2NsaWVudCcsXG4gICAgY29udHJvbGxlcjogJ0NsaWVudENvbnRyb2xsZXInXG4gIH0pLlxuICBvdGhlcndpc2Uoe1xuICAgIHJlZGlyZWN0VG86ICcvMCdcbiAgfSk7XG59KS5cblxuZmFjdG9yeSh7XG4gICdzb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpLFxuICAnY2xpZW50U29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9jbGllbnRTb2NrZXQuanMnKSAgXG59KS5cblxuY29udHJvbGxlcih7XG4gICdDbGllbnRDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9DbGllbnRDb250cm9sbGVyLmpzJylcbn0pLlxuXG5kaXJlY3RpdmUoe1xuICAndmlzdWFsaXNhdGlvbic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy92aXN1YWxpc2F0aW9uJylcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUsICRyb3V0ZVBhcmFtcywgY2xpZW50U29ja2V0KSB7XG4gIHZhciBzZXNzaW9uSWQgPSAkcm91dGVQYXJhbXMuaWQ7IFxuICBcbiAgY2xpZW50U29ja2V0Lm9uKCd3ZWxjb21lJywgZnVuY3Rpb24oKSB7XG5cbiAgICBjbGllbnRTb2NrZXQuZW1pdCgncmVnaXN0ZXInLCB7XG4gICAgICBzZXNzaW9uOiBzZXNzaW9uSWRcbiAgICB9KTtcblxuICB9KTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy92aXN1YWxpc2F0aW9uJyxcbiAgICBjb21waWxlOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHsgXG4gICAgICBcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQpIHtcbiAgICAgIHZhciBjYW52YXMsIGNvbnRleHQsIGJhbGxzO1xuICAgICAgY2FudmFzID0gJGVsZW1lbnRbMF0uY2hpbGRyZW5bMF07XG4gICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgIGNhbnZhcy53aWR0aCA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGg7XG4gICAgICBjYW52YXMuaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHQ7XG4gICAgICBcbiAgICAgIGJhbGxzID0gW107XG4gXG4gICAgICBmdW5jdGlvbiBjcmVhdGVCYWxsKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHg6IE1hdGgucmFuZG9tKCkgKiBjYW52YXMud2lkdGgsXG4gICAgICAgICAgeTogTWF0aC5yYW5kb20oKSAqIGNhbnZhcy5oZWlnaHQsXG4gICAgICAgICAgcjogTWF0aC5yYW5kb20oKSAqIDMwMCxcbiAgICAgICAgICBpOiBNYXRoLnJhbmRvbSgpICogNSAtIDIuNSxcbiAgICAgICAgICBqOiBNYXRoLnJhbmRvbSgpICogNSAtIDIuNSxcbiAgICAgICAgICBzOiBNYXRoLnJhbmRvbSgpICogNzAgKyAzMFxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgc2V0VGltZW91dCh1cGRhdGUsIDIwKTtcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnIzIyMic7XG4gICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICAgICAgICBpZihNYXRoLnJhbmRvbSgpID4gMC45NSkge1xuICAgICAgICAgIGJhbGxzLnB1c2goY3JlYXRlQmFsbCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJhbGxzLm1hcChmdW5jdGlvbihiYWxsKSB7XG4gICAgICAgICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICBiYWxsLnggKz0gYmFsbC5pO1xuICAgICAgICAgIGJhbGwueSArPSBiYWxsLmo7XG4gICAgICAgICAgY29udGV4dC5hcmMoYmFsbC54LCBiYWxsLnksIGJhbGwuciAsMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ2hzbGEoMTIwLCAnICsgYmFsbC5zICArICclLCA3MCUsIDAuMyknO1xuICAgICAgICAgIGNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgIHJldHVybiBiYWxsO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgYmFsbHMucHVzaChjcmVhdGVCYWxsKCkpO1xuICAgICAgYmFsbHMucHVzaChjcmVhdGVCYWxsKCkpO1xuICAgICAgYmFsbHMucHVzaChjcmVhdGVCYWxsKCkpO1xuICAgICAgdXBkYXRlKCk7XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIlxuLy8gY2xpZW50U29ja2V0IEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgYSBzb2NrZXQgdGhhdCdzIGNvbm5lY3RlZFxuLy8gdG8gdGhlIHVzZXIgY2hhbm5lbC5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgdmFyIGNsaWVudFNvY2tldCA9IHNvY2tldCgnY2xpZW50Jyk7XG4gIGNsaWVudFNvY2tldC5yZWFkeSA9IGZhbHNlO1xuICBcbiAgY2xpZW50U29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgIGNsaWVudFNvY2tldC5yZWFkeSA9IHRydWU7XG4gIH0pO1xuICBcbiAgcmV0dXJuIGNsaWVudFNvY2tldDtcbn07XG4iLCJcbi8vIFNvY2tldCBXcmFwcGVyXG4vLyAtLS0tLS0tLS0tLS0tLVxuXG4vLyBBY3RzIGFzIGEgd3JhcHBlciBhcm91bmQgc29ja2V0RmFjdG9yeVxuLy8gYW5kIGV4cG9zZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgY3JlYXRlXG4vLyBuYW1lc3BhY2VkIHNvY2tldHMsIGJhc2VkIG9uIGEgcGFyYW1ldGVyLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iXX0=
