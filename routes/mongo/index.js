var mongojs = require('mongojs');

module.exports = function(collection) {
  var db = mongojs('audio-drop', [collection]);
  
  return db[collection];
}
