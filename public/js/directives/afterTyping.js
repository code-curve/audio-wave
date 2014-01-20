
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

  
