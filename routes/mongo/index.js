// Mongo
// -----

// Quick wrapper around mongojs for
// ease of usage. Exports a function
// which takes one argument `collection`
// calling this function will return a
// mongo collection with this name,
// ready for use.

var mongojs = require('mongojs'),
  ObjectId = mongojs.ObjectId;

module.exports = mongo = function(collection) {
  var db = mongojs('audio-drop', [collection]);
  
  return db[collection];
}

mongo.idify = function(object) {
  object._id = ObjectId(object._id);
  return object;
}
