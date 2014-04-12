module.exports = function($scope, adminSocket, notificationCenter) {
  $scope.clients = [];
  $scope.sessions = [];
  $scope.sessionId;
  
  notificationCenter.confirm({
    name: 'YOLO',
    ok: function() {
      alert('win');
    },
    cancel: function() {
      alert('lose');
    }
  });

  adminSocket.on('client', function(client) {
    $scope.clients.push(client);
  });

  adminSocket.on('clients', function(clients) {
    $scope.clients = clients;
  });

  adminSocket.on('sessions', function(sessions) {
    $scope.sessions = sessions;
    console.warn($scope.sessions);
  });

  adminSocket.on('session', function(session) {
    $scope.sessions.push(session);
    notificationCenter.notify({
      icon: 'sitemap', 
      name: 'New Session',
      message: 'Session ' + session + ' created' 
    });
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
