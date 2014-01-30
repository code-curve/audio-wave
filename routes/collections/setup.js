// Collections
// -----------

// Add collections to this file.

var collection = require('../collection')
  , _ = require('../util')
  , bcrypt = require('bcrypt');

var collections = {
  
  // # Admin
  admins: collection({
    name: 'admins'
  }),
  
  // # Audio
  audio: collection({
    name: 'audio'
  }),

  // # Tracks
  tracks: collection({
    name: 'tracks' 
  })
};

// Attach collection apis to the socket
// that is passed in. Probably an adminSocket.
module.exports = function(socket) {
  var name, external; 
  
  external = {};

  // If there is no socket return the collections
  if(_.undef(socket)) {
    return collections;
  }
  
  // Copy the collections for external use
  for(name in collections) {
    external[name] = collections[name](socket);
  }
  
  socket.emit('ready');
  
  // Return collections for use at the server
  return external;
};
