module.exports = function($timeout) {
  return {
    restrict: 'A',
    templateUrl: 'partials/notification',
    link: function(scope, element, attrs) { 
      
    },
    controller: function($scope, notificationCenter) {
      $scope.showNotification = false;
        
      notificationCenter.on('notify', function(settings) {
        console.log('Notify');
        $scope.settings = settings;
        $scope.showNotification = true;
        $timeout(function() {
          $scope.showNotification = false;
        }, 2000);
      });

    }
  };
};

  
