var mongo = require('../mongo')
  , api = require('./api')
  , _ = require('../util');

module.exports = function(name) {
  var db = mongo(name);
  
  var actions = {
  
    create: function(item, done) {
      db.insert(item, done);
    },
  
    get: function(done) {
      db.find(done);
    }, 
  
    update: function(where, values, done) {
      db.update(where, { $set: values }, done);
    },
  
    remove: function(item, done) {
      db.remove(item, done);
    }
  
  };

  return function(socket) {
    api(name, actions, socket);
  }  
};
