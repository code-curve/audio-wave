var mongo = require('../mongo')
  , api = require('./api')
  , _ = require('../util');

module.exports = function(name) {
  var db = mongo(name);
  
  var actions = {
  
    create: function(item, done) {
      db.insert(item, function() {
        // callback with item so
        // clients know what to add
        done(item);
      });
    },
  
    get: function(done) {
      console.log('callback', done);
      db.find(done);
    }, 
  
    update: function(where, values, done) {
      db.update(where, { $set: values }, function() {
        // callback with ...
        done(where, values);
      });
    },
  
    remove: function(item, done) {
      db.remove(item, function() {
        // callback with item so
        // clients know what to remove
        done(item);
      });
    }
  
  };

  return function(socket) {
    api(name, actions, socket);
  }  
};
