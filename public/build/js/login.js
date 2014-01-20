(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
 
// Login controller
// ----------------
 
// Responsible for authenticating a user from
// a form. Two stage validation and 
// authentication. Displays errors and uses
// $http to make auth request then redirects
// on success.

module.exports = function($scope, $http) {
  // two-way bindings
  $scope.username = '';
  $scope.password = '';
  // error object (name, message)
  $scope.error = null;
  
  // ## validate
  // Validates both username and password, returns
  // boolean based on whether they passed or failed
  // and sets $scope.error to reflect why
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

  // ## change
  // Called every time the user types in
  // either input, then resets any errors.
  $scope.change = function() {
    $scope.error = null;
  };

  // ## login
  // Validates the form, and if the validation
  // succeeds, makes a HTTP request to the 
  // auth REST api. Redirects if the request
  // succeeds, show appropriate error if not. 
  $scope.login = function() {
    
    if($scope.validate()) {
      
      $http.post('/auth/login', {
        name: $scope.username,
        password: $scope.password
      }).

      success(function(res, status) {
        if(status === 200) {
          // res.data.auth holds boolean of success
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

// after-typing
// ------------

// Provides two attributes that can be used 
// to fire events after a given duration of
// time after a user has stopped typing.
//
// @after-typing    
// The code to be evaluated when the event is fired.
//
// @typing-duration 
// The duration after which to fire the event.
// Defaults to 1000ms.

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
// Login 
// -----
// The handler for the login screen that the
// user sees when authenticating themselves
// as an administrator. 
//

angular.module('login', []).

// Controllers
// -----------

// Handles validation and login requests
controller('LoginController', require('./controllers/LoginController')).

// Directives
// ----------

// Fires event when the user stops typing
directive('afterTyping', require('./directives/afterTyping'));

},{"./controllers/LoginController":1,"./directives/afterTyping":2}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvTG9naW5Db250cm9sbGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2FmdGVyVHlwaW5nLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9sb2dpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIFxuLy8gTG9naW4gY29udHJvbGxlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuIFxuLy8gUmVzcG9uc2libGUgZm9yIGF1dGhlbnRpY2F0aW5nIGEgdXNlciBmcm9tXG4vLyBhIGZvcm0uIFR3byBzdGFnZSB2YWxpZGF0aW9uIGFuZCBcbi8vIGF1dGhlbnRpY2F0aW9uLiBEaXNwbGF5cyBlcnJvcnMgYW5kIHVzZXNcbi8vICRodHRwIHRvIG1ha2UgYXV0aCByZXF1ZXN0IHRoZW4gcmVkaXJlY3RzXG4vLyBvbiBzdWNjZXNzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcbiAgLy8gdHdvLXdheSBiaW5kaW5nc1xuICAkc2NvcGUudXNlcm5hbWUgPSAnJztcbiAgJHNjb3BlLnBhc3N3b3JkID0gJyc7XG4gIC8vIGVycm9yIG9iamVjdCAobmFtZSwgbWVzc2FnZSlcbiAgJHNjb3BlLmVycm9yID0gbnVsbDtcbiAgXG4gIC8vICMjIHZhbGlkYXRlXG4gIC8vIFZhbGlkYXRlcyBib3RoIHVzZXJuYW1lIGFuZCBwYXNzd29yZCwgcmV0dXJuc1xuICAvLyBib29sZWFuIGJhc2VkIG9uIHdoZXRoZXIgdGhleSBwYXNzZWQgb3IgZmFpbGVkXG4gIC8vIGFuZCBzZXRzICRzY29wZS5lcnJvciB0byByZWZsZWN0IHdoeVxuICAkc2NvcGUudmFsaWRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZigkc2NvcGUudXNlcm5hbWUubGVuZ3RoIDwgMyB8fCAkc2NvcGUudXNlcm5hbWUubGVuZ3RoID4gMTIpIHtcbiAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgbmFtZTogJ1RoaXMgdXNlcm5hbWUgaXMgdG9vIGxvbmcnLFxuICAgICAgICBtZXNzYWdlOiAnVXNlcm5hbWUgc2hvdWxkIGJlIGJldHdlZW4gMyBhbmQgMTIgY2hhcmFjdGVycyBsb25nLidcbiAgICAgIH07XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmKCRzY29wZS5wYXNzd29yZC5sZW5ndGggPiAyNCkge1xuICAgICAgJHNjb3BlLmVycm9yID0ge1xuICAgICAgICBuYW1lOiAnVGhpcyBwYXNzd29yZCBpcyB0b28gbG9uZycsXG4gICAgICAgIG1lc3NhZ2U6ICdQYXNzd29yZHMgc2hvdWxkIGJlIGxlc3MgdGhhbiAyNSBjaGFyYWN0ZXJzIGxvbmcuJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYoISgkc2NvcGUucGFzc3dvcmQgJiYgJHNjb3BlLnVzZXJuYW1lKSkge1xuICAgICAgJHNjb3BlLmVycm9yID0ge1xuICAgICAgICBuYW1lOiAnV2hhdCBhcmUgeW91IGRvaW5nPycsXG4gICAgICAgIG1lc3NhZ2U6ICdZb3UgbXVzdCBzdXBwbHkgYSB1c2VybmFtZSBhbmQgcGFzc3dvcmQnXG4gICAgICB9O1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyAjIyBjaGFuZ2VcbiAgLy8gQ2FsbGVkIGV2ZXJ5IHRpbWUgdGhlIHVzZXIgdHlwZXMgaW5cbiAgLy8gZWl0aGVyIGlucHV0LCB0aGVuIHJlc2V0cyBhbnkgZXJyb3JzLlxuICAkc2NvcGUuY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcbiAgfTtcblxuICAvLyAjIyBsb2dpblxuICAvLyBWYWxpZGF0ZXMgdGhlIGZvcm0sIGFuZCBpZiB0aGUgdmFsaWRhdGlvblxuICAvLyBzdWNjZWVkcywgbWFrZXMgYSBIVFRQIHJlcXVlc3QgdG8gdGhlIFxuICAvLyBhdXRoIFJFU1QgYXBpLiBSZWRpcmVjdHMgaWYgdGhlIHJlcXVlc3RcbiAgLy8gc3VjY2VlZHMsIHNob3cgYXBwcm9wcmlhdGUgZXJyb3IgaWYgbm90LiBcbiAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgaWYoJHNjb3BlLnZhbGlkYXRlKCkpIHtcbiAgICAgIFxuICAgICAgJGh0dHAucG9zdCgnL2F1dGgvbG9naW4nLCB7XG4gICAgICAgIG5hbWU6ICRzY29wZS51c2VybmFtZSxcbiAgICAgICAgcGFzc3dvcmQ6ICRzY29wZS5wYXNzd29yZFxuICAgICAgfSkuXG5cbiAgICAgIHN1Y2Nlc3MoZnVuY3Rpb24ocmVzLCBzdGF0dXMpIHtcbiAgICAgICAgaWYoc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAvLyByZXMuZGF0YS5hdXRoIGhvbGRzIGJvb2xlYW4gb2Ygc3VjY2Vzc1xuICAgICAgICAgIGlmKHJlcy5kYXRhLmF1dGgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9ICcvYWRtaW4nO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSByZXMuZGF0YS5lcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHNjb3BlLmVycm9yID0ge1xuICAgICAgICAgICAgbmFtZTogJ1NlcnZlciBlcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiAnVGhlcmUgd2FzIGEgcHJvYmxlbSB3aXRoIHRoZSBzZXJ2ZXIuJ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkuXG5cbiAgICAgIGVycm9yKGZ1bmN0aW9uKGRhdGEsIHN0YXR1cykge1xuICAgICAgICAkc2NvcGUuZXJyb3IgPSB7XG4gICAgICAgICAgbmFtZTogJ1NlcnZlciBlcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogJ09oIGRlYXIsIHNvbWV0aGluZyB3ZW50IHZlcnkgd3JvbmcuJ1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTsgXG4gIH1cbn07XG4iLCJcbi8vIGFmdGVyLXR5cGluZ1xuLy8gLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIHR3byBhdHRyaWJ1dGVzIHRoYXQgY2FuIGJlIHVzZWQgXG4vLyB0byBmaXJlIGV2ZW50cyBhZnRlciBhIGdpdmVuIGR1cmF0aW9uIG9mXG4vLyB0aW1lIGFmdGVyIGEgdXNlciBoYXMgc3RvcHBlZCB0eXBpbmcuXG4vL1xuLy8gQGFmdGVyLXR5cGluZyAgICBcbi8vIFRoZSBjb2RlIHRvIGJlIGV2YWx1YXRlZCB3aGVuIHRoZSBldmVudCBpcyBmaXJlZC5cbi8vXG4vLyBAdHlwaW5nLWR1cmF0aW9uIFxuLy8gVGhlIGR1cmF0aW9uIGFmdGVyIHdoaWNoIHRvIGZpcmUgdGhlIGV2ZW50LlxuLy8gRGVmYXVsdHMgdG8gMTAwMG1zLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRwYXJzZSwgJHRpbWVvdXQpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIGxpbms6IGZ1bmN0aW9uICAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICB2YXIgdGltZW91dDtcbiAgICAgIFxuICAgICAgZWxlbWVudC5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGVsYXk7XG4gICAgICAgXG4gICAgICAgICR0aW1lb3V0LmNhbmNlbCh0aW1lb3V0KTtcbiAgICAgICAgZGVsYXkgPSBhdHRycy50eXBpbmdEdXJhdGlvbiB8fCAxMDAwO1xuICAgICAgICB0aW1lb3V0ID0gJHRpbWVvdXQoZnVuY3Rpb24oKSB7ICBcbiAgICAgICAgICBzY29wZS4kZXZhbChhdHRycy5hZnRlclR5cGluZyk7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIi8vIExvZ2luIFxuLy8gLS0tLS1cbi8vIFRoZSBoYW5kbGVyIGZvciB0aGUgbG9naW4gc2NyZWVuIHRoYXQgdGhlXG4vLyB1c2VyIHNlZXMgd2hlbiBhdXRoZW50aWNhdGluZyB0aGVtc2VsdmVzXG4vLyBhcyBhbiBhZG1pbmlzdHJhdG9yLiBcbi8vXG5cbmFuZ3VsYXIubW9kdWxlKCdsb2dpbicsIFtdKS5cblxuLy8gQ29udHJvbGxlcnNcbi8vIC0tLS0tLS0tLS0tXG5cbi8vIEhhbmRsZXMgdmFsaWRhdGlvbiBhbmQgbG9naW4gcmVxdWVzdHNcbmNvbnRyb2xsZXIoJ0xvZ2luQ29udHJvbGxlcicsIHJlcXVpcmUoJy4vY29udHJvbGxlcnMvTG9naW5Db250cm9sbGVyJykpLlxuXG4vLyBEaXJlY3RpdmVzXG4vLyAtLS0tLS0tLS0tXG5cbi8vIEZpcmVzIGV2ZW50IHdoZW4gdGhlIHVzZXIgc3RvcHMgdHlwaW5nXG5kaXJlY3RpdmUoJ2FmdGVyVHlwaW5nJywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2FmdGVyVHlwaW5nJykpO1xuIl19
