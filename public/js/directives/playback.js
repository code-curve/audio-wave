module.exports = function() {
  return {
    restrict:'A',
    templateUrl: 'partials/audio/play',
    controller: function($scope, collection) {
      var audioCollection = collection('audio');
      
      $scope.audio = null;
      $scope.playing = false;
      $scope.progress = 0;
      
      audioCollection.on('focus', function(audio) {
        console.log(audio);
        $scope.audio = new Audio('audio/play/' + audio._id);
        $scope.audio.addEventListener('ended', $scope.stop);
        $scope.audio.addEventListener('progress', $scope.progression);
      });

      $scope.play = function() {
        $scope.playing = true;
        $scope.audio.play();
      };

      $scope.pause = function() {
        $scope.playing = false;
        $scope.audio.pause();
      };

      $scope.stop = function() {
        $scope.playing = false;
        $scope.audio.pause();
        $scope.audio.currentTime = 0;
      };

      $scope.progression = function(e) {
        var progress = $scope.audio.currentTime / $scope.audio.duration;
        progress *= 100;
        $scope.progress = progress;
      };

    }
  }
}
