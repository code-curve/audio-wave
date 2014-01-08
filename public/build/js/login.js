(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** 
 * Login controller
 * 
 * Responsible for authenticating a user from
 * a form. Two stage validation and 
 * authentication. Displays errors and uses
 * $http to make auth request then redirects
 * on success.
 */

module.exports = function($scope, $http) {
  // two-way bindings
  $scope.username = '';
  $scope.password = '';
  // error object (name, message)
  $scope.error = null;
  
  /**
   * Validates both username and password, returns
   * boolean based on whether they passed or failed
   * and sets $scope.error to reflect why
   */
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

  /**
   * Called every time the user types in
   * either input, then resets any errors.
   */
  $scope.change = function() {
    $scope.error = null;
  };

  /**
   * Validates the form, and if the validation
   * succeeds, makes a HTTP request to the 
   * auth REST api. Redirects if the request
   * succeeds, show appropriate error if not. 
   */
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

/**
 * after-typing
 *
 * Provides two attributes that can be used 
 * to fire events after a given duration of
 * time after a user has stopped typing.
 *
 * @after-typing    
 * The code to be evaluated when the event is fired.
 *
 * @typing-duration 
 * The duration after which to fire the event.
 * Defaults to 1000ms.
 */

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
/**
 * Login 
 *
 * The handler for the login screen that the
 * user sees when authenticating themselves
 * as an administrator. 
 */

angular.module('login', []).

/**
 * Controllers
 */

// handles validation and login requests
controller('LoginController', require('./controllers/LoginController')).


/**
 * Directives
 */

// fires event when the user stops typing
directive('afterTyping', require('./directives/afterTyping'));

},{"./controllers/LoginController":1,"./directives/afterTyping":2}]},{},[3])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvTG9naW5Db250cm9sbGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2FmdGVyVHlwaW5nLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9sb2dpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBcbiAqIExvZ2luIGNvbnRyb2xsZXJcbiAqIFxuICogUmVzcG9uc2libGUgZm9yIGF1dGhlbnRpY2F0aW5nIGEgdXNlciBmcm9tXG4gKiBhIGZvcm0uIFR3byBzdGFnZSB2YWxpZGF0aW9uIGFuZCBcbiAqIGF1dGhlbnRpY2F0aW9uLiBEaXNwbGF5cyBlcnJvcnMgYW5kIHVzZXNcbiAqICRodHRwIHRvIG1ha2UgYXV0aCByZXF1ZXN0IHRoZW4gcmVkaXJlY3RzXG4gKiBvbiBzdWNjZXNzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuICAvLyB0d28td2F5IGJpbmRpbmdzXG4gICRzY29wZS51c2VybmFtZSA9ICcnO1xuICAkc2NvcGUucGFzc3dvcmQgPSAnJztcbiAgLy8gZXJyb3Igb2JqZWN0IChuYW1lLCBtZXNzYWdlKVxuICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuICBcbiAgLyoqXG4gICAqIFZhbGlkYXRlcyBib3RoIHVzZXJuYW1lIGFuZCBwYXNzd29yZCwgcmV0dXJuc1xuICAgKiBib29sZWFuIGJhc2VkIG9uIHdoZXRoZXIgdGhleSBwYXNzZWQgb3IgZmFpbGVkXG4gICAqIGFuZCBzZXRzICRzY29wZS5lcnJvciB0byByZWZsZWN0IHdoeVxuICAgKi9cbiAgJHNjb3BlLnZhbGlkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYoJHNjb3BlLnVzZXJuYW1lLmxlbmd0aCA8IDMgfHwgJHNjb3BlLnVzZXJuYW1lLmxlbmd0aCA+IDEyKSB7XG4gICAgICAkc2NvcGUuZXJyb3IgPSB7XG4gICAgICAgIG5hbWU6ICdUaGlzIHVzZXJuYW1lIGlzIHRvbyBsb25nJyxcbiAgICAgICAgbWVzc2FnZTogJ1VzZXJuYW1lIHNob3VsZCBiZSBiZXR3ZWVuIDMgYW5kIDEyIGNoYXJhY3RlcnMgbG9uZy4nXG4gICAgICB9O1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZigkc2NvcGUucGFzc3dvcmQubGVuZ3RoID4gMjQpIHtcbiAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgbmFtZTogJ1RoaXMgcGFzc3dvcmQgaXMgdG9vIGxvbmcnLFxuICAgICAgICBtZXNzYWdlOiAnUGFzc3dvcmRzIHNob3VsZCBiZSBsZXNzIHRoYW4gMjUgY2hhcmFjdGVycyBsb25nLidcbiAgICAgIH07XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmKCEoJHNjb3BlLnBhc3N3b3JkICYmICRzY29wZS51c2VybmFtZSkpIHtcbiAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgbmFtZTogJ1doYXQgYXJlIHlvdSBkb2luZz8nLFxuICAgICAgICBtZXNzYWdlOiAnWW91IG11c3Qgc3VwcGx5IGEgdXNlcm5hbWUgYW5kIHBhc3N3b3JkJ1xuICAgICAgfTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLyoqXG4gICAqIENhbGxlZCBldmVyeSB0aW1lIHRoZSB1c2VyIHR5cGVzIGluXG4gICAqIGVpdGhlciBpbnB1dCwgdGhlbiByZXNldHMgYW55IGVycm9ycy5cbiAgICovXG4gICRzY29wZS5jaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuICB9O1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZXMgdGhlIGZvcm0sIGFuZCBpZiB0aGUgdmFsaWRhdGlvblxuICAgKiBzdWNjZWVkcywgbWFrZXMgYSBIVFRQIHJlcXVlc3QgdG8gdGhlIFxuICAgKiBhdXRoIFJFU1QgYXBpLiBSZWRpcmVjdHMgaWYgdGhlIHJlcXVlc3RcbiAgICogc3VjY2VlZHMsIHNob3cgYXBwcm9wcmlhdGUgZXJyb3IgaWYgbm90LiBcbiAgICovXG4gICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuICAgIFxuICAgIGlmKCRzY29wZS52YWxpZGF0ZSgpKSB7XG4gICAgICBcbiAgICAgICRodHRwLnBvc3QoJy9hdXRoL2xvZ2luJywge1xuICAgICAgICBuYW1lOiAkc2NvcGUudXNlcm5hbWUsXG4gICAgICAgIHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmRcbiAgICAgIH0pLlxuXG4gICAgICBzdWNjZXNzKGZ1bmN0aW9uKHJlcywgc3RhdHVzKSB7XG4gICAgICAgIGlmKHN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgLy8gcmVzLmRhdGEuYXV0aCBob2xkcyBib29sZWFuIG9mIHN1Y2Nlc3NcbiAgICAgICAgICBpZihyZXMuZGF0YS5hdXRoKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSAnL2FkbWluJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gcmVzLmRhdGEuZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRzY29wZS5lcnJvciA9IHtcbiAgICAgICAgICAgIG5hbWU6ICdTZXJ2ZXIgZXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHdhcyBhIHByb2JsZW0gd2l0aCB0aGUgc2VydmVyLidcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLlxuXG4gICAgICBlcnJvcihmdW5jdGlvbihkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgJHNjb3BlLmVycm9yID0ge1xuICAgICAgICAgIG5hbWU6ICdTZXJ2ZXIgZXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6ICdPaCBkZWFyLCBzb21ldGhpbmcgd2VudCB2ZXJ5IHdyb25nLidcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH07IFxuICB9XG59O1xuIiwiXG4vKipcbiAqIGFmdGVyLXR5cGluZ1xuICpcbiAqIFByb3ZpZGVzIHR3byBhdHRyaWJ1dGVzIHRoYXQgY2FuIGJlIHVzZWQgXG4gKiB0byBmaXJlIGV2ZW50cyBhZnRlciBhIGdpdmVuIGR1cmF0aW9uIG9mXG4gKiB0aW1lIGFmdGVyIGEgdXNlciBoYXMgc3RvcHBlZCB0eXBpbmcuXG4gKlxuICogQGFmdGVyLXR5cGluZyAgICBcbiAqIFRoZSBjb2RlIHRvIGJlIGV2YWx1YXRlZCB3aGVuIHRoZSBldmVudCBpcyBmaXJlZC5cbiAqXG4gKiBAdHlwaW5nLWR1cmF0aW9uIFxuICogVGhlIGR1cmF0aW9uIGFmdGVyIHdoaWNoIHRvIGZpcmUgdGhlIGV2ZW50LlxuICogRGVmYXVsdHMgdG8gMTAwMG1zLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHBhcnNlLCAkdGltZW91dCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgbGluazogZnVuY3Rpb24gIChzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIHZhciB0aW1lb3V0O1xuICAgICAgXG4gICAgICBlbGVtZW50LmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkZWxheTtcbiAgICAgICBcbiAgICAgICAgJHRpbWVvdXQuY2FuY2VsKHRpbWVvdXQpO1xuICAgICAgICBkZWxheSA9IGF0dHJzLnR5cGluZ0R1cmF0aW9uIHx8IDEwMDA7XG4gICAgICAgIHRpbWVvdXQgPSAkdGltZW91dChmdW5jdGlvbigpIHsgIFxuICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHJzLmFmdGVyVHlwaW5nKTtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICB9XG4gIH07XG59O1xuXG4gIFxuIiwiLyoqXG4gKiBMb2dpbiBcbiAqXG4gKiBUaGUgaGFuZGxlciBmb3IgdGhlIGxvZ2luIHNjcmVlbiB0aGF0IHRoZVxuICogdXNlciBzZWVzIHdoZW4gYXV0aGVudGljYXRpbmcgdGhlbXNlbHZlc1xuICogYXMgYW4gYWRtaW5pc3RyYXRvci4gXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ2xvZ2luJywgW10pLlxuXG4vKipcbiAqIENvbnRyb2xsZXJzXG4gKi9cblxuLy8gaGFuZGxlcyB2YWxpZGF0aW9uIGFuZCBsb2dpbiByZXF1ZXN0c1xuY29udHJvbGxlcignTG9naW5Db250cm9sbGVyJywgcmVxdWlyZSgnLi9jb250cm9sbGVycy9Mb2dpbkNvbnRyb2xsZXInKSkuXG5cblxuLyoqXG4gKiBEaXJlY3RpdmVzXG4gKi9cblxuLy8gZmlyZXMgZXZlbnQgd2hlbiB0aGUgdXNlciBzdG9wcyB0eXBpbmdcbmRpcmVjdGl2ZSgnYWZ0ZXJUeXBpbmcnLCByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvYWZ0ZXJUeXBpbmcnKSk7XG4iXX0=
