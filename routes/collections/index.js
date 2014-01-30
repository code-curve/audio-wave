var setup = require('./setup');

module.exports = collections = function(socket) {
  var key, _collections;
  _collections = setup(socket);
 
  for(key in _collections) {
    collections[key] = _collections[key];
  }
} 
