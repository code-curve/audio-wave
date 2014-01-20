// Collections
// -----------

// Add collections to this file.

var collection = require('./collection');

var collections = {
  // # Admin
  admins: collection('admins'),
  // # Audio
  audio: collection('audio'),
  // # Tracks
  tracks: collection('tracks')
};

// Attach collection apis to the socket
// that is passed in. Probably an adminSocket.
module.exports = function(socket) {
  var name;
  
  console.log('Creating socket api for', name);
  for(name in collections) {
    collections[name](socket);
  }
  
  socket.emit('ready'); 
};
