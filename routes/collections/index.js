var setup = require('./setup');

module.exports = collections = function(socket) {
  var _collections, key;
  _collections = setup(socket);

  for(key in _collections) {
    this[key] = _collections[key];
  }
} 
