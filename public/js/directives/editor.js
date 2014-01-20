
// Editor
// ------
 
// Provides an interface for updating and 
// modifying items from a collection service.
//

module.exports = function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      console.log('Editor');  
    },
    controller: function($scope, $element, collection) {
      var collection;
      $scope.name = $element.attr('collection-name');
      // Overwrite collection to prevent it 
      // from being used again
      collection = collection($scope.name);
      $scope.collection = collection;
    }
  }  
};

