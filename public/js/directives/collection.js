
// Collection directive
// --------------------

// Add the attribute collection to an element and 
// specify the name of the collection in a 'collection-name' 
// attribute, and this directive will create a searchable, 
// synchronized data view of that collection.

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/collection',
    link: function(scope, element, attrs) {
             
    },
    controller: function($scope, $element, collection) { 
      $scope.name = $element.attr('collection-name');
      $scope.models = collection($scope.name);
      $scope.search = '';
      $scope.cursorIndex = 0;

      $scope.focus = function(id) {
        console.log(id);
        $scope.cursorIndex = id;
      };
              
      console.log($scope.name, 'directive controller');
    }
  }  
};

