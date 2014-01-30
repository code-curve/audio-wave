
// Collection directive
// --------------------

// Add the attribute collection to an element and 
// specify the name of the collection in a 'collection-name' 
// attribute, and this directive will create a searchable, 
// synchronized data view of that collection.

var _ = require('../util');

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/collection',
    controller: function($scope, $element, collection) { 
      var schema;

      $scope.name = $element.attr('collection-name');
      $scope.models = collection($scope.name);
      $scope.search = '';
      schema = $element.attr('schema');
      $scope.schema = createSchema(schema);
 
      function createSchema(schemaString) {
        var fields, schema, i;
        if(_.undef(schemaString)) {
          return {};
        }

        schema = {};
        fields = schemaString.split('|');
        for(var i = 0; i < fields.length; i++) {
          schema[fields[i]] = true;
        }

        return schema;
      };

      $scope.focus = function(id) {
        $scope.models.focus = id;
      };
    }
  }  
};

