module.exports = function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      console.log('Editor');  
    },
    controller: function($scope, $element, collection) {
      $scope.name = $element.attr('collection-name');
      var collection = collection($scope.name);
      
    }
  }  
};

