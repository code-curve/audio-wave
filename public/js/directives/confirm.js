module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/confirm',
    link: function(scope, element, attrs) { 
      
    },
    controller: function($scope, notificationCenter) {
      $scope.showConfirmation = false;
      
      // Takes a function, returns a function that
      // calls the fn arg and then closes the confirm.
      function andClose(fn) {
        return function() {
          fn();
          $scope.showConfirmation = false;
        }
      }

      $scope.ok = function() {
        console.warning('Default OK');
      };

      $scope.cancel = function() {
        console.warning('Default cancel');
      };
      
      notificationCenter.on('confirmation', function(settings) {
        $scope.title = settings.title;
        $scope.description = settings.description;
        $scope.ok = andClose(settings.ok);
        $scope.cancel = andClose(settings.cancel);
        $scope.showConfirmation = true;
      });

    }
  };
};

  
