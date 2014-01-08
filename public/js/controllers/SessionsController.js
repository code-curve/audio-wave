module.exports = function($scope, socket) {
  var socket = socket('admin');
  
  socket.on('ready', function() {
    socket.emit('admins/get');
    window.socket = socket;
  });

  socket.on('admins/get', function(admins) {
    console.table(admins.data);
  });
};
