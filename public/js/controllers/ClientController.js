module.exports = function($scope, $routeParams, clientSocket) {
  var sessionId = $routeParams.id; 
  
  clientSocket.on('welcome', function() {

    clientSocket.emit('register', {
      session: sessionId
    });

  });
}
