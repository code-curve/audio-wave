var collection = require('./index');

module.exports = function(name, actions, socket) {
  var eventName, action;
  for(action in actions) {
    eventName = name + '/' + action;
    console.log('WS', eventName);
    
    socket.on(eventName, function() {
      // pass on arguments from socket event
      socket.emit(action, actions[action].apply(arguments));
    });
  }
};
