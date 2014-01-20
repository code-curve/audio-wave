var mongo = require('../mongo')
  , api = require('./api')
  , _ = require('../util');

module.exports = function(name) {
  var db = mongo(name);
  
  var actions = {
  
    create: function(item, done) {
      if(!done) throw new Error('Get method requires a callback')
      db.insert(item, function() {
        console.log('insert', item, 'into', name);
        // callback with item so clients know what was added
        if(done) done(item);
      });
    },
  
    get: function(done) {
      if(!done) throw new Error('Get method requires a callback')
      console.log('callback', done);
      db.find(done);
    }, 
  
    update: function(where, values, done) {
      if(!done) throw new Error('Get method requires a callback')
      db.update(where, { $set: values }, function() {
        // callback with ...
        done(where, values);
      });
    },
  
    remove: function(item, done) {
      if(!done) throw new Error('Get method requires a callback')
      db.remove(item, function() {
        // callback with item so
        // clients know which to remove
        done(item);
      });
    }
  
  };

  return function(socket) {
    api(name, actions, socket);
  }  
};
