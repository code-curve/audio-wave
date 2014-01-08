module.exports = function(adminSocket) {
  var collections = {};  

  function find(collection, model) {
    for(var i = 0; i < collection[i].length; i++) {
      if(collection[i]._id === model._id) {
        return model;
      }
    }
    return null;
  }

  function events(name) {
    return {
      get: name + '/get',
      create: name + '/create',
      remove: name + '/remove',
      update: name + '/update'
    }
  }

  /**
   * In serious need of error handling 
   */
  function model(name) {
    var collection, socket, event;
    
    // if it exists, return it
    if(collections[name]) {
      return collections[name];
    }
     
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
