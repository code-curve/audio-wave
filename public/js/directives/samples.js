
// Samples directive
// --------------------
//
// Displays samples for audio tracks
// in a grid like manner.


module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/samples',
    controller: function($scope, $element, collection) { 

      $scope.samples = collection('audio');
      $scope.search = '';
 
      $scope.focus = function(id) {
        // Insert the sample into the track
      };

    }
  }  
};

