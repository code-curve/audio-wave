
// Websocket API Generator
// -----------------------

// Creates a websocket api on this socket, which
// provides interfaces for each action in actions
// and prefixes it with name.

module.exports = function(name, actions, socket) {
  var action;
  
  function bind(action) {
    var eventName, args;
    eventName = name + '/' + action;
    console.log('WS.on', eventName);
    
    socket.on(eventName, function() {
      console.log('WS.do', eventName);
      
      // The first two arguments are socket io things
      args = Array.prototype.slice.call(arguments, 2);

      // Put the callback at the end of the array
      // so that when we call apply, it gets used 
      // as the last argument.
      args.push(function(err, docs) {
        if(err) {
          socket.emit(eventName, {
            error: err
          });
        } else {
          socket.emit(eventName, {
            data: docs
          });
        }
      });
      
      // Pass on arguments from socket event
      actions[action].apply(this, args);
    });
  };

  for(action in actions) {
    bind(action);
  }
};
