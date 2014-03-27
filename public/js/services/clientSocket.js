
// clientSocket Factory
// -------------------

// Provides a socket that's connected
// to the user channel.

module.exports = function(socket) {
  var clientSocket = socket('client');
  clientSocket.ready = false;
  
  clientSocket.on('ready', function() {
    clientSocket.ready = true;
  });
  
  return clientSocket;
};
