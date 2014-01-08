var collection = require('./index');

module.exports = function(name, actions, socket) {
  var action;
  
  function bind(action) {
    var eventName, args;
    eventName = name + '/' + action;
    console.log('WS.on', eventName);
    
    socket.on(eventName, function() {
      console.log('WS.do', eventName);
      
      // the first two arguments are socket io
      args = Array.prototype.slice.call(arguments, 2);

      // hacky callbacking
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
      
      console.log(args);
      // pass on arguments from socket event
      actions[action].apply(this, args);
    });
  };

  for(action in actions) {
    bind(action);    
  }
};
