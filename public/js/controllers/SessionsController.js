module.exports = function($scope, socket) {
  var socket = socket('admin');
  socket.emit('hello');
};
