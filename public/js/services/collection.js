var _ = require('../util');

// collection Factory
// ------------------ 

// The collection factory is responsible for maintaing
// the state and a modification interface for collections
// defined at the server side. See `/routes/collection/`
// for more details.

// After the returned function is called with a name
// parameter, the adminSocket waits for the server's
// ready event, and then proceeds to listen to the events
// (__create__, __get__, __update__, __remove__) 
// for that name and creates a set of methods to manipulate 
// the data over the socket connection.

// Finally, a dynamic array containing the models
// from the collection is returned, with create, update
// and remove methods tacked on to it. This can be used
// bound straight to the DOM from controllers.

module.exports = function(adminSocket) {

  // Store all available collections in here.
  var collections = {};


  // Find and return a model from a collection
  // based on the _id property of the query 
  // object. _(Query object normally comes from
  // the database)_
  function find(collection, query) {
    var i;
    for(i = 0; i < collection.length; i++) {
      if(collection[i]._id === query._id) {
        return collection[i];
      }
    }
    return null;
  }
  
  // ## remove
  // `(collection, query)`
  // Removes any items from `collection` that
  // match the `_id` supplied from `query`.
  function remove(collection, query) {
    var i, index;
    for(i = 0; i < collection.length; i++) {
      if(collection[i]._id === query._id) {
        index = i;
      }
    }

    if(typeof index !== 'undefined') {
      collection.splice(index, 1);
    }
  }

  // Helper method to provide clean looking
  // names for socket events
  function events(name) {
    return {
      get: name + '/get',
      create: name + '/create',
      remove: name + '/remove',
      update: name + '/update'
    }
  }
  
  // Removes all angular properties from
  // an object, so that it may be used for
  // querying at mongo
  function sanitize(object) {
    var key, sanitized;
    sanitized = {};
    for(key in object) {
      if(key[0] !== '$') {
        sanitized[key] = object[key];
      }
    }
    return sanitized;
  }

  // # model
  // `(name)`
  // Creates interface for collection with this name
  // and returns dynamic collection array along
  // with collection manipulation methods. See
  // module doc comment for more details. 
  function model(name) {
    var collection, socket, event, listeners;

    // if we have already loaded this collection
    if(collections[name]) {
      //return it straight away
      console.log('load', name);
      return collections[name];
    }
    
    // event listeners
    listeners = {};

    // aliasing
    socket = adminSocket;
    collection = collections[name] = [];
    event = events(name);

    if(socket.ready) {
      socket.emit(event.get);
    } else {
      socket.on('ready', function() {
        socket.emit(event.get);
      });
    }
    
    // Socket Events
    // -------------
    
    // # get
    // `(models)`
    // When the socket receives a get event,
    // reset the collection and populate it with
    // the new models. Finally trigger a get event
    // for any listeners.
    socket.on(event.get, function(models) {
      // Remove all items (but don't overwrite the reference)
      collection.length = 0;
      // Hacky way not that won't reset reference
      collection.push.apply(collection, models.data);
      collection.focus(collection[0]._id);
      collection.trigger('get', models);
    });

    // # create
    // `(models)`
    // Is called whenever the socket receives
    // a create event (a new model is created).
    // Add to the collection and trigger create.
    socket.on(event.create, function(model) {
      collection.push(model.data);
      collection.trigger('create', model);
    });

    // # remove
    // `(model)`
    // Is called whenever the socket receives
    // a remove event. Removes the model from
    // the collection and triggers remove.
    socket.on(event.remove, function(model) {
      model = model.data;
      remove(collection, model);  
      collection.trigger('remove', model);
    });

    // # update
    // `(updated)`
    // Is called whenever the socket receives
    // an update event, passing the updated model
    // as an argument. Updates the model in the 
    // collection and then triggers an update event. 
    socket.on(event.update, function(updated) {
      var key, model;
      updated = updated.data;

      // __Important__ to read!
      // We need to update the values of the model
      // the collection, we can access it using find
      model = find(collection, updated);
      if(model) { 
        // We can't set the value of model to 
        // updated as that will overwrite the reference.
        // We need to loop through and update the
        // properties of the object one by one.
        for(key in updated) {
          model[key] = updated[key];
        }
        // And we're done!
        collection.trigger('update', model);
      }
    });

    // Exposed methods
    // ---------------
    // These methods are available on the collection
    // object, for other methods to use the collection
    // functionality to update the collections at the 
    // server side.
  
    // # create
    // `(model)`
    // Adds a model to the collection
    collection.create = function(model) {
      socket.emit(event.create, model);
    };
    
    // # remove
    // `(model)`
    // Removes `model` from the collection
    collection.remove = function(model) {
      model = sanitize(model);
      socket.emit(event.remove, model);
    };

    // # update
    collection.update = function(model, updated) {
      var key, values;
      values = {}

      // if the same object was passed twice
      if(model === updated) {
        model = _.copy(updated);
      }
      
      // only need the id to make the update
      model = {
        _id: model._id
      }

      // strip mongo/angular properties
      for(key in updated) {
        if(!(key[0] === '$' || key[0] === '_')) {
          values[key] = updated[key];
        }
      }
      socket.emit(event.update, model, values);
    }; 

    // # on
    // `(eventName, fn)`
    // Registers a callback function to be triggered
    // on the event specified by `eventName`.
    collection.on = function(eventName, fn) {
      if(!(listeners[eventName] instanceof Array)) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(fn);
    };

    // # trigger
    // `(eventName, data...)`
    // Triggers all events with the name specified
    // and passes all the other arguments to those
    // event listeners.
    collection.trigger = function(eventName, data) {
      data = [].slice.call(arguments, 1);
      if(listeners[eventName] instanceof Array) {
        for(var i = 0; i < listeners[eventName].length; i++) {
          listeners[eventName][i].apply(this, data);
        }
      }
    };
    
    // # focus
    // `(_id)`
    // Multi purpose focus method which applies a focus
    // to the model with this id. Creates a copy of the 
    // focused model (that can be updated) and triggers
    // a focus event.
    collection.focus = function(_id) {
      console.log('focus on', _id);
      for(var i = 0; i < collection.length; i++) {
        if(collection[i]._id === _id) {
          collection.focused = _.copy(collection[i]);
        }
      }
      collection.trigger('focus', collection.focused);
    }
    
    // the item that currently has focus
    collection.focused = {};
  
    // Reveal the name of this collection
    collection.name = name;
    
    return collection;
  }

  return model;
};
