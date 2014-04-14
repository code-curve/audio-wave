//
//
//
module.exports = function(socket, hub, name) { 
  var sessionId = 0;


  // Message
  hub.events.on('registration', function(err, user) {
    // Let admins know a client connected
  });
  
  // Whenever a new session is created
  hub.events.on('session', function(err, session) {
    console.log('Session created'.yellow, session);
    socket.emit('session', session);
  });

  socket.on('select', function(id) {
    sessionId = id;
  });
  
  // Whenever sessions are requested
  socket.on('sessions', function() {
    console.log('REQUEST SESSIONS'.rainbow, hub.sessions);
    socket.emit('sessions', Object.keys(hub.sessions));
  });

  // Request of all clients from some sesison
  socket.on('clients', function(session) {
    console.log('Request clients', session);
  });
  
 
  // When the user disconnects, broadcast
  // the event.
  socket.on('disconnect', function() {
    socket.broadcast.emit('message', {
      name: name,
      body: 'has disconnected',
      type: 'info' 
    }); 
  });

  // Finally, broadcast a connection
  // message from this socket.
  socket.broadcast.emit('message', {
    name: name,
    body: 'has connected',
    type: 'info' 
  });

};
