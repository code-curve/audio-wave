var mongojs = require('monogojs');

module.exports = function(collection) {
  var db = mongojs('audio-wave', [collection]);
  
  return db[collection];
}
