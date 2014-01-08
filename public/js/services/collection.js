
/**
 * collection Factory
 * 
 * The collection factory is responsible for maintaing
 * the state and a modification interface for collections
 * defined at the server side. See /routes/collection/
 * for more details.
 *
 * After the returned function is called with a name
 * parameter, the adminSocket waits for the servers
 * ready event, and then proceeds to listen to the events
 * (create, get, update, remove) for that name and 
 * creates a set of methods to manipulate the data
 * over the socket connection.
 *
 * Finally, a dynamic array containing the models
 * from the collection is returned with create, update
 * and remove methods tacked on to it. This can be used
 * bound straight to the DOM from controllers.
 */

module.exports = function(adminSocket) {
  /**
   * Store all available collections
   * in here.
   */
  var collections = {};  

  /**
   * Find and return a model from a collection
   * based on the _id property of the query 
   * object. (Query object normally comes from
   * the database)
   */
  function find(collection, query) {
    for(var i = 0; i < collection[i].length; i++) {
      if(collection[i]._id === query._id) {
        return collection[i];
      }
    }
    return null;
  }

  /**
   * Helper method to provide clean looking
   * names for socket events
   */
  function events(name) {
    return {
      get: name + '/get',
      create: name + '/create',
      remove: name + '/remove',
      update: name + '/update'
    }
  }
  
  /**
   * Creates interface for collection with this name
   * and returns dynamic collection array along
   * with collection manipulation methods. See
   * module doc comment for more details.
   */ 
  function model(name) {
    var collection, socket, event;
    
    // if we have already loaded this collection
    if(collections[name]) {
      //return it straight away
      return collections[name];
    }
    
    // aliasing
    socket = adminSocket;
    collection = collections[name] = [];
    event = events(name);

    socket.on('ready', function() {
      socket.emit(event.get);
    });
    
    /**
     * Socket Events
     */
    
    socket.on(event.get, function(models) {
      collection.length = 0;
      // I believe there's some explaing to do here.
      collection.push.apply(collection, models.data);
    });

    socket.on(event.create, function(model) {
      collection.push(model);
    });

    socket.on(event.remove, function(model) {
      delete find(collection, model);
    });

    socket.on(event.update, function(model, updated) {
      // create safeguard with model for find -> null
      (find(collection, model) || model) = updated;
    });

    /**
     * Exposed methods
     */  
  
    collection.create = function(model) {
      socket.emit(event.create, model);
    };
    
    collection.remove = function(model) {
      socket.emit(event.remove, model);
    };

    collection.update = function(model, updated) {
      socket.emit(event.update, model, updated);
    }; 

    return collection;
  }

  return model;
};
