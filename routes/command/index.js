module.exports = function(socket, name) {
  
  // Process an incoming message
  function handle(message) {
    var parts = message.split(' ');
    
    // If the message is prefixed with
    // a slash, then it's a command
    if(parts[0][0] === '\\') {
      handleCommand(parts[0], parts.slice(1));
    } else {
      notRecognized();
    }
  }

  // Process a command + arguments
  function handleCommand(command, args) {
    switch(command) {
      case '\\chat':
        var message = args.join(' ');

        message = {
          name: name,
          body: message,
          type: 'chat'
        };

        socket.broadcast.emit('message', message);
        socket.emit('message', message);
        break;

      default:
        notRecognized();
    }
  }

  // Message to emit when a command
  // is not recognized
  function notRecognized() { 
    socket.emit('message', {
      name: 'Command not recognized',
      type: 'warning'
    });
  }
  
  socket.on('message', handle);
};
