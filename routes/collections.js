// Collections
// -----------

// Add collections to this file.

var collection = require('./collection')
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
  var name;
    
  for(name in collections) {
    console.log('Creating socket api for', name);
    collections[name](socket);
  }
  
  socket.emit('ready'); 
};
