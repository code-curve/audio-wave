module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/console',
    link: function(scope, element, attrs) { 
      
    },
    controller: function($scope, notificationCenter) {
      $scope.showing = false;

      $scope.ok = function() {
        console.warning('Default OK');
      };

      $scope.cancel = function() {
        console.warning('Default cancel');
      };
      
      notificationCenter.on('confirmation', function(settings) {
        $scope.title = settings.title;
        $scope.description = settings.description;
        $scope.ok = settings.ok;
        $scope.cancel = settings.cancel;
        $scope.showing = true;
      });

    }
  };
};

  
