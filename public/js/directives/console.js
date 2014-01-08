module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/console',
    link: function  (scope, element, attrs) { 
      
    },
    controller: function($scope) {
      $scope.messages = [];
      $scope.input = '';
      
      $scope.send = function() {
        $scope.messages.push({
          body: $scope.input
        });
        $scope.input = '';
      };
    }
  };
};

  
