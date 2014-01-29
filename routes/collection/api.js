// Websocket API Generator
// -----------------------

// Creates a websocket api on this socket, which
// provides interfaces for each action in actions
// and prefixes it with name.

var api = require('../api');

module.exports = function(name, actions, socket) {
  var action, bind, bindToAll;
  
  bind = _bind(false);
  bindToAll = _bind(true);

  for(action in actions) {
    // `get` should only propagate to
    // the initiator, whereas the
    // the other options should
    if(action === 'get') {
      bind(action);
    } else {
      bindToAll(action);
    }
  }

  function _bind(all) {
    return function(action) {
      var eventName, args;
      eventName = name + '/' + action;
      
      socket.on(eventName, function() {
         
        // The first two arguments are socket io things, wait...
        args = Array.prototype.slice.call(arguments, 0);
         
        // Pass on arguments from socket event
        actions[action].apply(this, args).then(function(docs) {
          var data = api.success(docs);
          if(all) {
            emitToAll(eventName, data);
          } else {
            emit(eventName, data);
          }
        }).fail(function(err) {
          emit(eventName, api.error(err));
        });

      });
    };
  }
  
  function emit(eventName, data) {
    socket.emit(eventName, data);
  }

  function emitToAll(eventName, data) {
    var id, sockets;
    sockets = socket.namespace.sockets;
    for(id in sockets) {
      sockets[id].emit(eventName, data);
    } 
  }

  return actions;
};
