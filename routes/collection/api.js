
// Websocket API Generator
// -----------------------

// Creates a websocket api on this socket, which
// provides interfaces for each action in actions
// and prefixes it with name.

module.exports = function(name, actions, socket, sockets) {
  var action;
  function _bind(all) {
    return function(action) {
      var eventName, args;
      eventName = name + '/' + action;
      
      socket.on(eventName, function() {
         
        // The first two arguments are socket io things, wait...
        args = Array.prototype.slice.call(arguments, 0);
        
        // Put the callback at the end of the array
        // so that when we call apply, it gets used 
        // as the last argument.
        args.push(function(err, docs) {
          if(err) {
            socket.emit(eventName, {
              error: err
            });
          } else {
            if(all) {
              sockets.emit(eventName, {
                data: docs
              });
            } else {
              socket.emit(eventName, {
                data: docs
              });
            }
          }
        });
           
        // Pass on arguments from socket event
        actions[action].apply(this, args);
      });
    };
  }
  
  var bind = _bind(false);
  var bindToAll = _bind(true);

  for(action in actions) {
    // `get` should only propagate to
    // the initiator, whereas the
    // the other options should
    //if(action === 'get') {
    //  bindToAll(action);
    //} else {
      bind(action);
    //}
  }

  return actions;
};
