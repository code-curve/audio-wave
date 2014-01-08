(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function($scope, $http) {
  // user credentials
  $scope.username = '';
  $scope.password = '';
  
  // error object (name, message)
  $scope.error = null;

  $scope.validate = function() {
    if($scope.username.length < 3 || $scope.username.length > 12) {
      $scope.error = {
        name: 'This username is too long',
        message: 'Username should be between 3 and 12 characters long.'
      };
      return false;
    }
    if($scope.password.length > 24) {
      $scope.error = {
        name: 'This password is too long',
        message: 'Passwords should be less than 25 characters long.'
      };
      return false;
    }
    if(!($scope.password && $scope.username)) {
      $scope.error = {
        name: 'What are you doing?',
        message: 'You must supply a username and password'
      };
      return false;
    }
    return true;
  };

  $scope.change = function() {
    $scope.error = null;
  };

  // method to call for authentication
  $scope.login = function() {
    
    if($scope.validate()) {
      
      $http.post('/auth/login', {
        name: $scope.username,
        password: $scope.password
      }).

      success(function(res, status) {
        if(status === 200) {
          if(res.data.auth) {
            window.location = '/admin';
          } else {
            $scope.error = res.data.error;
          }
        } else {
          $scope.error = {
            name: 'Server error',
            message: 'There was a problem with the server.'
          }
        }
      }).

      error(function(data, status) {
        $scope.error = {
          name: 'Server error',
          message: 'Oh dear, something went very wrong.'
        };
      });

    };
    
  }
  
};

},{}],2:[function(require,module,exports){
module.exports = function($parse, $timeout) {
  return {
    restrict: 'A',
    link: function  (scope, element, attrs) {
      var timeout;
      element.bind('keyup', function() {
        var delay;
        $timeout.cancel(timeout);
        delay = attrs.typingDuration || 1000;
        timeout = $timeout(function() {  
          scope.$eval(attrs.afterTyping);
        }, delay);
      });
      
    }
  };
};

  

},{}],3:[function(require,module,exports){
angular.module('login', []).
// Controllers
controller('LoginController', require('./controllers/LoginController')).
// Directive
directive('afterTyping', require('./directives/afterTyping'));

},{"./controllers/LoginController":1,"./directives/afterTyping":2}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvTG9naW5Db250cm9sbGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2FmdGVyVHlwaW5nLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9sb2dpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcbiAgLy8gdXNlciBjcmVkZW50aWFsc1xuICAkc2NvcGUudXNlcm5hbWUgPSAnJztcbiAgJHNjb3BlLnBhc3N3b3JkID0gJyc7XG4gIFxuICAvLyBlcnJvciBvYmplY3QgKG5hbWUsIG1lc3NhZ2UpXG4gICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgJHNjb3BlLnZhbGlkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoJHNjb3BlLnVzZXJuYW1lLmxlbmd0aCA8IDMgfHwgJHNjb3BlLnVzZXJuYW1lLmxlbmd0aCA+IDEyKSB7XG4gICAgICAkc2NvcGUuZXJyb3IgPSB7XG4gICAgICAgIG5hbWU6ICdUaGlzIHVzZXJuYW1lIGlzIHRvbyBsb25nJyxcbiAgICAgICAgbWVzc2FnZTogJ1VzZXJuYW1lIHNob3VsZCBiZSBiZXR3ZWVuIDMgYW5kIDEyIGNoYXJhY3RlcnMgbG9uZy4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZigkc2NvcGUucGFzc3dvcmQubGVuZ3RoID4gMjQpIHtcbiAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgbmFtZTogJ1RoaXMgcGFzc3dvcmQgaXMgdG9vIGxvbmcnLFxuICAgICAgICBtZXNzYWdlOiAnUGFzc3dvcmRzIHNob3VsZCBiZSBsZXNzIHRoYW4gMjUgY2hhcmFjdGVycyBsb25nLidcbiAgICAgIH07XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmKCEoJHNjb3BlLnBhc3N3b3JkICYmICRzY29wZS51c2VybmFtZSkpIHtcbiAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgbmFtZTogJ1doYXQgYXJlIHlvdSBkb2luZz8nLFxuICAgICAgICBtZXNzYWdlOiAnWW91IG11c3Qgc3VwcGx5IGEgdXNlcm5hbWUgYW5kIHBhc3N3b3JkJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgJHNjb3BlLmNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG4gIH07XG5cbiAgLy8gbWV0aG9kIHRvIGNhbGwgZm9yIGF1dGhlbnRpY2F0aW9uXG4gICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuICAgIFxuICAgIGlmKCRzY29wZS52YWxpZGF0ZSgpKSB7XG4gICAgICBcbiAgICAgICRodHRwLnBvc3QoJy9hdXRoL2xvZ2luJywge1xuICAgICAgICBuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgIHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmRcbiAgICAgIH0pLlxuXG4gICAgICBzdWNjZXNzKGZ1bmN0aW9uKHJlcywgc3RhdHVzKSB7XG4gICAgICAgIGlmKHN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgaWYocmVzLmRhdGEuYXV0aCkge1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uID0gJy9hZG1pbic7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9IHJlcy5kYXRhLmVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUuZXJyb3IgPSB7XG4gICAgICAgICAgICBuYW1lOiAnU2VydmVyIGVycm9yJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUaGVyZSB3YXMgYSBwcm9ibGVtIHdpdGggdGhlIHNlcnZlci4nXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KS5cblxuICAgICAgZXJyb3IoZnVuY3Rpb24oZGF0YSwgc3RhdHVzKSB7XG4gICAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgICBuYW1lOiAnU2VydmVyIGVycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiAnT2ggZGVhciwgc29tZXRoaW5nIHdlbnQgdmVyeSB3cm9uZy4nXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgIH07XG4gICAgXG4gIH1cbiAgXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkcGFyc2UsICR0aW1lb3V0KSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBsaW5rOiBmdW5jdGlvbiAgKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgdmFyIHRpbWVvdXQ7XG4gICAgICBlbGVtZW50LmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkZWxheTtcbiAgICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuICAgICAgICBkZWxheSA9IGF0dHJzLnR5cGluZ0R1cmF0aW9uIHx8IDEwMDA7XG4gICAgICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpIHsgIFxuICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHJzLmFmdGVyVHlwaW5nKTtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICB9XG4gIH07XG59O1xuXG4gIFxuIiwiYW5ndWxhci5tb2R1bGUoJ2xvZ2luJywgW10pLlxuLy8gQ29udHJvbGxlcnNcbmNvbnRyb2xsZXIoJ0xvZ2luQ29udHJvbGxlcicsIHJlcXVpcmUoJy4vY29udHJvbGxlcnMvTG9naW5Db250cm9sbGVyJykpLlxuLy8gRGlyZWN0aXZlXG5kaXJlY3RpdmUoJ2FmdGVyVHlwaW5nJywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2FmdGVyVHlwaW5nJykpO1xuIl19
