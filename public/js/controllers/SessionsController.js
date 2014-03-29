module.exports = function($scope, adminSocket) {
  $scope.clients = [];
  
  adminSocket.on('client', function(client) {
    $scope.clients.push(client);
    console.log(client);
  });
};
