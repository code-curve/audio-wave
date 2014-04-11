module.exports = function($scope, adminSocket) {
  $scope.clients = [];
  $scope.sessions = [];
  $scope.sessionId = 0;
 
  adminSocket.on('client', function(client) {
    $scope.clients.push(client);
  });

  adminSocket.on('clients', function(clients) {
    $scope.clients = clients;
  });

  adminSocket.on('sessions', function(sessions) {
    $scope.sessions = sessions;
  });

  adminSocket.on('session', function(session) {
    $scope.sessions.push(session);
  });

  $scope.switchSession = function() {
    adminSocket.emit('clients', $scope.sessionId);
  };

  $scope.deleteSession = function() {
    //todo VERIFICATION POPUP NEEDED
    adminSocket.emit('deleteSession', $scope.sessionId);
  };

  $scope.init = function() {
    adminSocket.emit('sessions');
  };

  $scope.init();
};
