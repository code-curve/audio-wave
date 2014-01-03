var mongojs = require('mongojs');

module.exports = function(collection) {
  var db = mongojs('audio-wave', [collection]);
  
  return db[collection];
}
