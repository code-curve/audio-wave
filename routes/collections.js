var collection = require('./collection');

var collections = {
  admins: collection('admins'),
  audio: collection('audio'),
  tracks: collection('tracks')
};

module.exports = function(socket) {
  var name;
  
  console.log('Creating socket api for', name);
  for(name in collections) {
    collections[name](socket);
  }
  
  socket.emit('ready'); 
};
