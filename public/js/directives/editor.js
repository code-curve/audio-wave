
// Editor
// ------
 
// Provides an interface for updating and 
// modifying items from a collection service.
//

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/editor',
    link: function(scope, element, attrs) {
      console.log('Editor');
    },
    controller: function($scope, $element, collection) {
      var collection;
      
      // Get the name of the collection for this editor
      $scope.name = $element.attr('collection-name');
            
      // Get the collection for this name from
      // the collection factory and bind it to
      // the scope. 
      $scope.collection = collection($scope.name);
      
      $scope.saving = false;
    
      $scope.selection = function() {
        var models = $scope.collection;
        for(var i = 0; i < models.length; i++) {
          if(models.focus === models[i]._id) {
            return models[i]
          }
        }
        return {};
      };

      $scope.save = function() {
        var focus = $scope.selection();
        $scope.collection.update(focus, focus);
        $scope.saving = true; 
      };

    }
  }  
};

