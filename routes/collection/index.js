// Collections
// -----------

// Super mega awesome interface for handling collections.
// This module exposes a method which takes a name. The
// name is used to create a new collection within mongo.

// Once the collection has been created, __create__, 
// __get__, __update__ and __remove__ action methods are
// created for operation on the collection.

// A closure is returned with the actions in scope, it takes
// a socket and binds the appropriate set of events onto
// the socket. See [collection/api](api.html) for more details.

var mongo = require('../mongo')
  , api = require('./api')
  , _ = require('../util');

module.exports = function(name) {
  var db, actions;

  db = mongo(name);
  actions = {
  
    // # create 
    // `(item, done)`
    // Takes a schemaless item and a done callback function. 
    // Calls callback when the insert method finishes.
    create: function(item, done) {
      if(!done) throw new Error('Get method requires a callback')
      db.insert(item, function(err) {
        console.log('insert', item, 'into', name);
        // Callback must include item, so that users
        // know which item was added
        if(done) done(err, item);
      });
    },
    
    // # get
    // `(done)`
    // Takes one callback function, to be called
    // with the docs/errors returned from the find
    // method. Returns the entire collection,  __not__ 
    // just one object. Object selection should be
    // done client side.
    get: function(done) {
      if(!done) throw new Error('Get method requires a callback')
      console.log('callback', done);
      db.find(done);
    }, 
  
    // # update
    // `(where, values, done)`
    // Takes a query object (where), an updated values
    // object (values) and a callback function. Very
    // much modeled on the MongoDb api.
    update: function(where, values, done) {
      if(!done) throw new Error('Get method requires a callback')
      db.update(where, { $set: values }, function(err) {
        // callback with ...
        done(err, where, values);
      });
    },
    
    // # remove 
    // `(item, done)`
    // Takes a query object (item) and a done callback function. 
    // The callback is called when the remove method has finished. 
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
