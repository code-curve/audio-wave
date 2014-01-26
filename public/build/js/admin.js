(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Admin
// -----

// The admin application is responsible for keeping
// track of all sessions, devices, audio files and
// composed songs.
// 
// It also provides a console for talking to the
// server and the compose interface for creating
// song files from the available audio files.
//

angular.module('admin', ['ngRoute', 'btford.socket-io']).

config(function($routeProvider) {
  $routeProvider.
  when('/sessions', {
    templateUrl: '/partials/sessions',
    controller: 'SessionsController'
  }).
  when('/audio', {
    templateUrl: '/partials/audio',
    controller: 'AudioController'
  }).
  when('/users', {
    templateUrl: '/partials/users',
    controller: 'UsersController'
  }).
  when('/compose', {
    templateUrl: '/partials/compose',
    controller: 'ComposeController'
  }).
  otherwise({
    redirectTo: '/sessions'
  });
}).

// Services
// --------

factory({
  // Localstorage + cookie shim
  'storage': require('./services/storage'),
  // Maintain state of ui
  'uiState': require('./services/uiState'),
  // Web socket wrapper
  'socket': require('./services/socket'),
  // Socket connect to admin channel
  'adminSocket': require('./services/adminSocket'),
  // Collection maintainer
  'collection': require('./services/collection')
}).

// Controllers
// -----------

controller({
  // Manage devices in sessions
  'SessionsController': require('./controllers/SessionsController'),
  // Composition of song files
  'ComposeController': require('./controllers/ComposeController'),
  // Manage administrators and registered users
  'UsersController': require('./controllers/UsersController'),
  // Manage uploaded audio tracks
  'AudioController': require('./controllers/AudioController')
}).

// Directives
// ----------

directive({
  // Interface for editing collections
  'editor': require('./directives/editor'),
  // Interface for creating items for collections
  'creator': require('./directives/creator'),
  // Console for server communication
  'console': require('./directives/console'),
  // Searchable collection interface 
  'collection': require('./directives/collection')
});




},{"./controllers/AudioController":2,"./controllers/ComposeController":3,"./controllers/SessionsController":4,"./controllers/UsersController":5,"./directives/collection":6,"./directives/console":7,"./directives/creator":8,"./directives/editor":9,"./services/adminSocket":10,"./services/collection":11,"./services/socket":12,"./services/storage":13,"./services/uiState":14}],2:[function(require,module,exports){
/**
 * 
 */

module.exports = function($scope) {
 
};

},{}],3:[function(require,module,exports){
module.exports = function($scope) {
  
};

},{}],4:[function(require,module,exports){
module.exports = function($scope) {

};

},{}],5:[function(require,module,exports){
module.exports=require(3)
},{}],6:[function(require,module,exports){

// Collection directive
// --------------------

// Add the attribute collection to an element and 
// specify the name of the collection in a 'collection-name' 
// attribute, and this directive will create a searchable, 
// synchronized data view of that collection.

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/collection',
    controller: function($scope, $element, collection) { 
      $scope.name = $element.attr('collection-name');
      $scope.models = collection($scope.name);
      $scope.search = '';
      
      $scope.focus = function(id) {
        $scope.models.focus = id;
      };
              
      console.log($scope.name, 'directive controller');
    }
  }  
};


},{}],7:[function(require,module,exports){
module.exports = function(uiState) {
  return {
    restrict: 'A',
    templateUrl: 'partials/console',
    link: function(scope, element, attrs) { 
      var showing, uiKey;

      uiKey = 'console-state'
      showing = (uiState.load(uiKey) || false);
     
      checkVisibility();
 
      function checkVisibility() {
        if(showing) {
          element.addClass('visible');
          element.find('input')[0].focus();
        } else {
          element.removeClass('visible');
        } 
      }
        
      document.addEventListener('keydown', function(e)   {
        // Toggle on ` key
        if(e.keyCode === 192) {
          showing = !showing;
          uiState.save(uiKey, showing);
        
          checkVisibility();
          // Give focus to input 
          element.find('input')[0].focus();
          // Stop ` being inserted into console
          e.preventDefault();
        }
      });
    },
    controller: function($scope, $element, adminSocket) {
      var socket;

      $scope.messages = [];
      $scope.input = '';
      
      adminSocket.on('message', function(message) {
        $scope.addMessage(message);
      });

      $scope.clear = function() {
        $scope.input = '';
      };

      $scope.addMessage = function(message) {
        $element[0].scrollTop = $element[0].scrollHeight
        $scope.messages.push(message);
      };
       
      $scope.send = function() {
        $scope.addMessage({
          body: $scope.input
        });
        adminSocket.emit('message', $scope.input);
        $scope.clear();
      };
    }
  };
};

  

},{}],8:[function(require,module,exports){

// Creator
// -------
 
// Provides an interface for creating items 
// from a collection service.

var _ = require('../util');

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/creator',
    link: function(scope, element, attrs) {
      console.log('Creator');
    },
    controller: function($scope, $element, collection) {
      var collection;
      
      // Get the name of the collection for this editor
      $scope.name = $element.attr('collection-name');
            
      // Get the collection for this name from
      // the collection factory and bind it to
      // the scope. 
      $scope.collection = collection($scope.name);
       
      // Initial schema for creation
      $scope.schema = {}; 
      // Actual model bound to input
      $scope.instance = {};
      // Saving state
      $scope.creating = false;

      $scope.create = function() {    
        $scope.creating = true;
        $scope.collection.create($scope.instance);
      };
      
      $scope.collection.on('get', function() {
        var key;
        if($scope.collection.length > 0) {
          $scope.schema = _.copy($scope.collection[0]);
          // No need for mongo ids here
          delete $scope.schema._id;
        }

        $scope.instance = $scope.schema;
        for(key in $scope.instance) {
          $scope.instance[key] = '';
        }
      });

      $scope.collection.on('create', function() {
        $scope.creating = false;
      });
 
    }
  }  
};


},{"../util":15}],9:[function(require,module,exports){

// Editor
// ------
 
// Provides an interface for updating and 
// modifying items from a collection service.
//

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/editor',
    link: function(scope, element, attrs) {
      console.log('Editor');
    },
    controller: function($scope, $element, collection) {
      
      // Get the name of the collection for this editor
      $scope.name = $element.attr('collection-name');
             
      // Get the collection for this name from
      // the collection factory and bind it to
      // the scope. 
      $scope.collection = collection($scope.name);
      
      $scope.model = {};
   
      $scope.saving = false;
      
      $scope.remove = function() {
        $scope.collection.remove($scope.model);
      };

      $scope.save = function() {
        var model = $scope.model;
        console.log('edited', $scope.model);
        $scope.collection.update(model, model);
        $scope.saving = true; 
      };
      
      $scope.collection.on('update', function() {
        $scope.saving = false;
      });
  
      $scope.collection.on('focus', function(model) {
        $scope.model = model;
      });

    }
  }  
};


},{}],10:[function(require,module,exports){

// adminSocket Factory
// -------------------

// Provides a socket that's connected
// to the admin channel.

module.exports = function(socket) {
  var adminSocket = socket('admin');
  adminSocket.ready = false;
  
  adminSocket.on('ready', function() {
    adminSocket.ready = true;
  });
  
  return adminSocket;
};

},{}],11:[function(require,module,exports){
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
    
    // ## Socket Events

    socket.on(event.get, function(models) {
      collection.length = 0;
      // I believe there's some explaining to do here.
      collection.push.apply(collection, models.data);
      collection.focus(collection[0]._id);
      collection.trigger('get', models);
    });

    socket.on(event.create, function(model) {
      collection.push(model.data);
      collection.trigger('create', model);
    });

    socket.on(event.remove, function(model) {
      model = model.data;
      remove(collection, model);  
      collection.trigger('remove', model);
    });

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

    // ## Exposed methods  
  
    collection.create = function(model) {
      socket.emit(event.create, model);
    };
    
    collection.remove = function(model) {
      model = sanitize(model);
      socket.emit(event.remove, model);
    };

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

    collection.on = function(eventName, fn) {
      if(!(listeners[eventName] instanceof Array)) {
        listeners[eventName] = [];
      }
      listeners[eventName].push(fn);
    };

    collection.trigger = function(eventName, data) {
      data = [].slice.call(arguments, 1);
      if(listeners[eventName] instanceof Array) {
        for(var i = 0; i < listeners[eventName].length; i++) {
          listeners[eventName][i].apply(this, data);
        }
      }
    };
    
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

},{"../util":15}],12:[function(require,module,exports){

// Socket Wrapper
// --------------

// Acts as a wrapper around socketFactory
// and exposes a function that will create
// namespaced sockets, based on a parameter.

module.exports = function(socketFactory) {
  return function(namespace) {
    var connectUrl = 'http://localhost:3000/' + namespace;
    return socketFactory({
      ioSocket: io.connect(connectUrl)
    });
  }
};

},{}],13:[function(require,module,exports){

// Storage Factory
// ---------------

// Provides localStorage support with a cookie
// based fallback. 

module.exports = function() {
  var cache, storage, id;
  
  id = 'audio-drop-storage';
  storage = which();

  // Determines which type of storage
  // is available and returns a jQuery
  // style getter/setter for it's value.
  function which() {
    if(window.localStorage) {
      return function(data) {
        if(typeof data === 'undefined') {
          return localStorage[id];
        } else {
          localStorage[id] = data;
        }
      }
    } else {
      return function(data) {
        if(typeof data === 'undefined') {
          return document.cookie;
        } else {
          document.cookie = data;
        }
      }
    }
  }

  // Load the contents from whichever
  // storage is avaiable. If JSON parse
  // throws an exception, then the value
  // was undefined, so instead cache an
  // empty object.
  function load() {
    try {
      cache = JSON.parse(storage());
    } catch(e) {
      cache = {};
    }
    return cache;
  }

  // Save the contents of the cache
  // into storage
  function save() {
    storage(JSON.stringify(cache));
  }

  // Set a value within the cache
  // based on a key and then save it.
  function set(key, value) {
    if(!cache) load();
    cache[key] = value;
    save();
  }

  // Get a value from the cache
  function get(key) {
    if(!cache) load();
    return cache[key];
  } 

  // Expose get and set methods
  return {
    get: get,
    set: set
  }
};

},{}],14:[function(require,module,exports){
// uiState Factory
// ---------------

// A tiny factory for maintaining the
// state of the UI at any time. The name
// of the ui in question should be passed
// to the save method to persist it.

// The state can then be reloaded at any
// time in the future.

// __Important__ This does not change
// the DOM __at all__. It just saves
// a JSON object which can then be used
// with angular to optionally show/hide
// or apply classes to ui elements.

module.exports = function(storage) {
  return {
    save: function(ui, state) {
      storage.set(ui, state);  
    },
    load: function(ui) {
      return storage.get(ui);
    }
  }
};

},{}],15:[function(require,module,exports){
module.exports = _ = {
  copy: function(object) {
    var key, duplicate = {};
    for(key in object) {
      duplicate[key] = object[key]
    }
    return duplicate;
  }
}

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvY3JlYXRvci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9lZGl0b3IuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL2FkbWluU29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3N0b3JhZ2UuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3VpU3RhdGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBZG1pblxuLy8gLS0tLS1cblxuLy8gVGhlIGFkbWluIGFwcGxpY2F0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nXG4vLyB0cmFjayBvZiBhbGwgc2Vzc2lvbnMsIGRldmljZXMsIGF1ZGlvIGZpbGVzIGFuZFxuLy8gY29tcG9zZWQgc29uZ3MuXG4vLyBcbi8vIEl0IGFsc28gcHJvdmlkZXMgYSBjb25zb2xlIGZvciB0YWxraW5nIHRvIHRoZVxuLy8gc2VydmVyIGFuZCB0aGUgY29tcG9zZSBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nXG4vLyBzb25nIGZpbGVzIGZyb20gdGhlIGF2YWlsYWJsZSBhdWRpbyBmaWxlcy5cbi8vXG5cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbicsIFsnbmdSb3V0ZScsICdidGZvcmQuc29ja2V0LWlvJ10pLlxuXG5jb25maWcoZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcbiAgJHJvdXRlUHJvdmlkZXIuXG4gIHdoZW4oJy9zZXNzaW9ucycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9zZXNzaW9ucycsXG4gICAgY29udHJvbGxlcjogJ1Nlc3Npb25zQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9hdWRpbycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hdWRpbycsXG4gICAgY29udHJvbGxlcjogJ0F1ZGlvQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy91c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy91c2VycycsXG4gICAgY29udHJvbGxlcjogJ1VzZXJzQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9jb21wb3NlJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2NvbXBvc2UnLFxuICAgIGNvbnRyb2xsZXI6ICdDb21wb3NlQ29udHJvbGxlcidcbiAgfSkuXG4gIG90aGVyd2lzZSh7XG4gICAgcmVkaXJlY3RUbzogJy9zZXNzaW9ucydcbiAgfSk7XG59KS5cblxuLy8gU2VydmljZXNcbi8vIC0tLS0tLS0tXG5cbmZhY3Rvcnkoe1xuICAvLyBMb2NhbHN0b3JhZ2UgKyBjb29raWUgc2hpbVxuICAnc3RvcmFnZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvc3RvcmFnZScpLFxuICAvLyBNYWludGFpbiBzdGF0ZSBvZiB1aVxuICAndWlTdGF0ZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvdWlTdGF0ZScpLFxuICAvLyBXZWIgc29ja2V0IHdyYXBwZXJcbiAgJ3NvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvc29ja2V0JyksXG4gIC8vIFNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbiAgJ2FkbWluU29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpLFxuICAvLyBDb2xsZWN0aW9uIG1haW50YWluZXJcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL3NlcnZpY2VzL2NvbGxlY3Rpb24nKVxufSkuXG5cbi8vIENvbnRyb2xsZXJzXG4vLyAtLS0tLS0tLS0tLVxuXG5jb250cm9sbGVyKHtcbiAgLy8gTWFuYWdlIGRldmljZXMgaW4gc2Vzc2lvbnNcbiAgJ1Nlc3Npb25zQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyJyksXG4gIC8vIENvbXBvc2l0aW9uIG9mIHNvbmcgZmlsZXNcbiAgJ0NvbXBvc2VDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgYWRtaW5pc3RyYXRvcnMgYW5kIHJlZ2lzdGVyZWQgdXNlcnNcbiAgJ1VzZXJzQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvVXNlcnNDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSB1cGxvYWRlZCBhdWRpbyB0cmFja3NcbiAgJ0F1ZGlvQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyJylcbn0pLlxuXG4vLyBEaXJlY3RpdmVzXG4vLyAtLS0tLS0tLS0tXG5cbmRpcmVjdGl2ZSh7XG4gIC8vIEludGVyZmFjZSBmb3IgZWRpdGluZyBjb2xsZWN0aW9uc1xuICAnZWRpdG9yJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2VkaXRvcicpLFxuICAvLyBJbnRlcmZhY2UgZm9yIGNyZWF0aW5nIGl0ZW1zIGZvciBjb2xsZWN0aW9uc1xuICAnY3JlYXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jcmVhdG9yJyksXG4gIC8vIENvbnNvbGUgZm9yIHNlcnZlciBjb21tdW5pY2F0aW9uXG4gICdjb25zb2xlJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbnNvbGUnKSxcbiAgLy8gU2VhcmNoYWJsZSBjb2xsZWN0aW9uIGludGVyZmFjZSBcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29sbGVjdGlvbicpXG59KTtcblxuXG5cbiIsIi8qKlxuICogXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuICBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuXG59O1xuIiwiXG4vLyBDb2xsZWN0aW9uIGRpcmVjdGl2ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gQWRkIHRoZSBhdHRyaWJ1dGUgY29sbGVjdGlvbiB0byBhbiBlbGVtZW50IGFuZCBcbi8vIHNwZWNpZnkgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gaW4gYSAnY29sbGVjdGlvbi1uYW1lJyBcbi8vIGF0dHJpYnV0ZSwgYW5kIHRoaXMgZGlyZWN0aXZlIHdpbGwgY3JlYXRlIGEgc2VhcmNoYWJsZSwgXG4vLyBzeW5jaHJvbml6ZWQgZGF0YSB2aWV3IG9mIHRoYXQgY29sbGVjdGlvbi5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29sbGVjdGlvbicsXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikgeyBcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAkc2NvcGUubW9kZWxzID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAkc2NvcGUuc2VhcmNoID0gJyc7XG4gICAgICBcbiAgICAgICRzY29wZS5mb2N1cyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICRzY29wZS5tb2RlbHMuZm9jdXMgPSBpZDtcbiAgICAgIH07XG4gICAgICAgICAgICAgIFxuICAgICAgY29uc29sZS5sb2coJHNjb3BlLm5hbWUsICdkaXJlY3RpdmUgY29udHJvbGxlcicpO1xuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVpU3RhdGUpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29uc29sZScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7IFxuICAgICAgdmFyIHNob3dpbmcsIHVpS2V5O1xuXG4gICAgICB1aUtleSA9ICdjb25zb2xlLXN0YXRlJ1xuICAgICAgc2hvd2luZyA9ICh1aVN0YXRlLmxvYWQodWlLZXkpIHx8IGZhbHNlKTtcbiAgICAgXG4gICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiBcbiAgICAgIGZ1bmN0aW9uIGNoZWNrVmlzaWJpbGl0eSgpIHtcbiAgICAgICAgaWYoc2hvd2luZykge1xuICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH0gXG4gICAgICB9XG4gICAgICAgIFxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpICAge1xuICAgICAgICAvLyBUb2dnbGUgb24gYCBrZXlcbiAgICAgICAgaWYoZS5rZXlDb2RlID09PSAxOTIpIHtcbiAgICAgICAgICBzaG93aW5nID0gIXNob3dpbmc7XG4gICAgICAgICAgdWlTdGF0ZS5zYXZlKHVpS2V5LCBzaG93aW5nKTtcbiAgICAgICAgXG4gICAgICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgLy8gR2l2ZSBmb2N1cyB0byBpbnB1dCBcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgICAvLyBTdG9wIGAgYmVpbmcgaW5zZXJ0ZWQgaW50byBjb25zb2xlXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGFkbWluU29ja2V0KSB7XG4gICAgICB2YXIgc29ja2V0O1xuXG4gICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgXG4gICAgICBhZG1pblNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJHNjb3BlLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmFkZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICRlbGVtZW50WzBdLnNjcm9sbFRvcCA9ICRlbGVtZW50WzBdLnNjcm9sbEhlaWdodFxuICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICAgIH07XG4gICAgICAgXG4gICAgICAkc2NvcGUuc2VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZSh7XG4gICAgICAgICAgYm9keTogJHNjb3BlLmlucHV0XG4gICAgICAgIH0pO1xuICAgICAgICBhZG1pblNvY2tldC5lbWl0KCdtZXNzYWdlJywgJHNjb3BlLmlucHV0KTtcbiAgICAgICAgJHNjb3BlLmNsZWFyKCk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbiAgXG4iLCJcbi8vIENyZWF0b3Jcbi8vIC0tLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgY3JlYXRpbmcgaXRlbXMgXG4vLyBmcm9tIGEgY29sbGVjdGlvbiBzZXJ2aWNlLlxuXG52YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY3JlYXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnQ3JlYXRvcicpO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGNvbGxlY3Rpb247XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICBcbiAgICAgIC8vIEdldCB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBuYW1lIGZyb21cbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgYW5kIGJpbmQgaXQgdG9cbiAgICAgIC8vIHRoZSBzY29wZS4gXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgIFxuICAgICAgLy8gSW5pdGlhbCBzY2hlbWEgZm9yIGNyZWF0aW9uXG4gICAgICAkc2NvcGUuc2NoZW1hID0ge307IFxuICAgICAgLy8gQWN0dWFsIG1vZGVsIGJvdW5kIHRvIGlucHV0XG4gICAgICAkc2NvcGUuaW5zdGFuY2UgPSB7fTtcbiAgICAgIC8vIFNhdmluZyBzdGF0ZVxuICAgICAgJHNjb3BlLmNyZWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICRzY29wZS5jcmVhdGUgPSBmdW5jdGlvbigpIHsgICAgXG4gICAgICAgICRzY29wZS5jcmVhdGluZyA9IHRydWU7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uLmNyZWF0ZSgkc2NvcGUuaW5zdGFuY2UpO1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ2dldCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBpZigkc2NvcGUuY29sbGVjdGlvbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgJHNjb3BlLnNjaGVtYSA9IF8uY29weSgkc2NvcGUuY29sbGVjdGlvblswXSk7XG4gICAgICAgICAgLy8gTm8gbmVlZCBmb3IgbW9uZ28gaWRzIGhlcmVcbiAgICAgICAgICBkZWxldGUgJHNjb3BlLnNjaGVtYS5faWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkc2NvcGUuaW5zdGFuY2UgPSAkc2NvcGUuc2NoZW1hO1xuICAgICAgICBmb3Ioa2V5IGluICRzY29wZS5pbnN0YW5jZSkge1xuICAgICAgICAgICRzY29wZS5pbnN0YW5jZVtrZXldID0gJyc7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignY3JlYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5jcmVhdGluZyA9IGZhbHNlO1xuICAgICAgfSk7XG4gXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIlxuLy8gRWRpdG9yXG4vLyAtLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgdXBkYXRpbmcgYW5kIFxuLy8gbW9kaWZ5aW5nIGl0ZW1zIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG4vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9lZGl0b3InLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgY29uc29sZS5sb2coJ0VkaXRvcicpO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgXG4gICAgICAvLyBHZXQgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gZm9yIHRoaXMgZWRpdG9yXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgICAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIG5hbWUgZnJvbVxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBhbmQgYmluZCBpdCB0b1xuICAgICAgLy8gdGhlIHNjb3BlLiBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICBcbiAgICAgICRzY29wZS5tb2RlbCA9IHt9O1xuICAgXG4gICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgICBcbiAgICAgICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ucmVtb3ZlKCRzY29wZS5tb2RlbCk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbW9kZWwgPSAkc2NvcGUubW9kZWw7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlZGl0ZWQnLCAkc2NvcGUubW9kZWwpO1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbi51cGRhdGUobW9kZWwsIG1vZGVsKTtcbiAgICAgICAgJHNjb3BlLnNhdmluZyA9IHRydWU7IFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignZm9jdXMnLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgICAkc2NvcGUubW9kZWwgPSBtb2RlbDtcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIlxuLy8gYWRtaW5Tb2NrZXQgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBhIHNvY2tldCB0aGF0J3MgY29ubmVjdGVkXG4vLyB0byB0aGUgYWRtaW4gY2hhbm5lbC5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgdmFyIGFkbWluU29ja2V0ID0gc29ja2V0KCdhZG1pbicpO1xuICBhZG1pblNvY2tldC5yZWFkeSA9IGZhbHNlO1xuICBcbiAgYWRtaW5Tb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgYWRtaW5Tb2NrZXQucmVhZHkgPSB0cnVlO1xuICB9KTtcbiAgXG4gIHJldHVybiBhZG1pblNvY2tldDtcbn07XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy8gY29sbGVjdGlvbiBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0gXG5cbi8vIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuLy8gdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4vLyBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIGAvcm91dGVzL2NvbGxlY3Rpb24vYFxuLy8gZm9yIG1vcmUgZGV0YWlscy5cblxuLy8gQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuLy8gcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXInc1xuLy8gcmVhZHkgZXZlbnQsIGFuZCB0aGVuIHByb2NlZWRzIHRvIGxpc3RlbiB0byB0aGUgZXZlbnRzXG4vLyAoX19jcmVhdGVfXywgX19nZXRfXywgX191cGRhdGVfXywgX19yZW1vdmVfXykgXG4vLyBmb3IgdGhhdCBuYW1lIGFuZCBjcmVhdGVzIGEgc2V0IG9mIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSBcbi8vIHRoZSBkYXRhIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuXG4vLyBGaW5hbGx5LCBhIGR5bmFtaWMgYXJyYXkgY29udGFpbmluZyB0aGUgbW9kZWxzXG4vLyBmcm9tIHRoZSBjb2xsZWN0aW9uIGlzIHJldHVybmVkLCB3aXRoIGNyZWF0ZSwgdXBkYXRlXG4vLyBhbmQgcmVtb3ZlIG1ldGhvZHMgdGFja2VkIG9uIHRvIGl0LiBUaGlzIGNhbiBiZSB1c2VkXG4vLyBib3VuZCBzdHJhaWdodCB0byB0aGUgRE9NIGZyb20gY29udHJvbGxlcnMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcblxuICAvLyBTdG9yZSBhbGwgYXZhaWxhYmxlIGNvbGxlY3Rpb25zIGluIGhlcmUuXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9O1xuXG5cbiAgLy8gRmluZCBhbmQgcmV0dXJuIGEgbW9kZWwgZnJvbSBhIGNvbGxlY3Rpb25cbiAgLy8gYmFzZWQgb24gdGhlIF9pZCBwcm9wZXJ0eSBvZiB0aGUgcXVlcnkgXG4gIC8vIG9iamVjdC4gXyhRdWVyeSBvYmplY3Qgbm9ybWFsbHkgY29tZXMgZnJvbVxuICAvLyB0aGUgZGF0YWJhc2UpX1xuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgdmFyIGk7XG4gICAgZm9yKGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmUoY29sbGVjdGlvbiwgcXVlcnkpIHtcbiAgICB2YXIgaSwgaW5kZXg7XG4gICAgZm9yKGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICBpbmRleCA9IGk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGluZGV4ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29sbGVjdGlvbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2QgdG8gcHJvdmlkZSBjbGVhbiBsb29raW5nXG4gIC8vIG5hbWVzIGZvciBzb2NrZXQgZXZlbnRzXG4gIGZ1bmN0aW9uIGV2ZW50cyhuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogbmFtZSArICcvZ2V0JyxcbiAgICAgIGNyZWF0ZTogbmFtZSArICcvY3JlYXRlJyxcbiAgICAgIHJlbW92ZTogbmFtZSArICcvcmVtb3ZlJyxcbiAgICAgIHVwZGF0ZTogbmFtZSArICcvdXBkYXRlJ1xuICAgIH1cbiAgfVxuICBcbiAgLy8gUmVtb3ZlcyBhbGwgYW5ndWxhciBwcm9wZXJ0aWVzIGZyb21cbiAgLy8gYW4gb2JqZWN0LCBzbyB0aGF0IGl0IG1heSBiZSB1c2VkIGZvclxuICAvLyBxdWVyeWluZyBhdCBtb25nb1xuICBmdW5jdGlvbiBzYW5pdGl6ZShvYmplY3QpIHtcbiAgICB2YXIga2V5LCBzYW5pdGl6ZWQ7XG4gICAgc2FuaXRpemVkID0ge307XG4gICAgZm9yKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGlmKGtleVswXSAhPT0gJyQnKSB7XG4gICAgICAgIHNhbml0aXplZFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzYW5pdGl6ZWQ7XG4gIH1cblxuICAvLyBDcmVhdGVzIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbiB3aXRoIHRoaXMgbmFtZVxuICAvLyBhbmQgcmV0dXJucyBkeW5hbWljIGNvbGxlY3Rpb24gYXJyYXkgYWxvbmdcbiAgLy8gd2l0aCBjb2xsZWN0aW9uIG1hbmlwdWxhdGlvbiBtZXRob2RzLiBTZWVcbiAgLy8gbW9kdWxlIGRvYyBjb21tZW50IGZvciBtb3JlIGRldGFpbHMuIFxuICBmdW5jdGlvbiBtb2RlbChuYW1lKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIHNvY2tldCwgZXZlbnQsIGxpc3RlbmVycztcblxuICAgIC8vIGlmIHdlIGhhdmUgYWxyZWFkeSBsb2FkZWQgdGhpcyBjb2xsZWN0aW9uXG4gICAgaWYoY29sbGVjdGlvbnNbbmFtZV0pIHtcbiAgICAgIC8vcmV0dXJuIGl0IHN0cmFpZ2h0IGF3YXlcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkJywgbmFtZSk7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbnNbbmFtZV07XG4gICAgfVxuICAgIFxuICAgIC8vIGV2ZW50IGxpc3RlbmVyc1xuICAgIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgLy8gYWxpYXNpbmdcbiAgICBzb2NrZXQgPSBhZG1pblNvY2tldDtcbiAgICBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNbbmFtZV0gPSBbXTtcbiAgICBldmVudCA9IGV2ZW50cyhuYW1lKTtcblxuICAgIGlmKHNvY2tldC5yZWFkeSkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vICMjIFNvY2tldCBFdmVudHNcblxuICAgIHNvY2tldC5vbihldmVudC5nZXQsIGZ1bmN0aW9uKG1vZGVscykge1xuICAgICAgY29sbGVjdGlvbi5sZW5ndGggPSAwO1xuICAgICAgLy8gSSBiZWxpZXZlIHRoZXJlJ3Mgc29tZSBleHBsYWluaW5nIHRvIGRvIGhlcmUuXG4gICAgICBjb2xsZWN0aW9uLnB1c2guYXBwbHkoY29sbGVjdGlvbiwgbW9kZWxzLmRhdGEpO1xuICAgICAgY29sbGVjdGlvbi5mb2N1cyhjb2xsZWN0aW9uWzBdLl9pZCk7XG4gICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ2dldCcsIG1vZGVscyk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQuY3JlYXRlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgY29sbGVjdGlvbi5wdXNoKG1vZGVsLmRhdGEpO1xuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdjcmVhdGUnLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQucmVtb3ZlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgbW9kZWwgPSBtb2RlbC5kYXRhO1xuICAgICAgcmVtb3ZlKGNvbGxlY3Rpb24sIG1vZGVsKTsgIFxuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdyZW1vdmUnLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQudXBkYXRlLCBmdW5jdGlvbih1cGRhdGVkKSB7XG4gICAgICB2YXIga2V5LCBtb2RlbDtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVkLmRhdGE7XG5cbiAgICAgIC8vIF9fSW1wb3J0YW50X18gdG8gcmVhZCFcbiAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB2YWx1ZXMgb2YgdGhlIG1vZGVsXG4gICAgICAvLyB0aGUgY29sbGVjdGlvbiwgd2UgY2FuIGFjY2VzcyBpdCB1c2luZyBmaW5kXG4gICAgICBtb2RlbCA9IGZpbmQoY29sbGVjdGlvbiwgdXBkYXRlZCk7XG4gICAgICBpZihtb2RlbCkgeyBcbiAgICAgICAgLy8gV2UgY2FuJ3Qgc2V0IHRoZSB2YWx1ZSBvZiBtb2RlbCB0byBcbiAgICAgICAgLy8gdXBkYXRlZCBhcyB0aGF0IHdpbGwgb3ZlcndyaXRlIHRoZSByZWZlcmVuY2UuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbG9vcCB0aHJvdWdoIGFuZCB1cGRhdGUgdGhlXG4gICAgICAgIC8vIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBvbmUgYnkgb25lLlxuICAgICAgICBmb3Ioa2V5IGluIHVwZGF0ZWQpIHtcbiAgICAgICAgICBtb2RlbFtrZXldID0gdXBkYXRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICAgIC8vIEFuZCB3ZSdyZSBkb25lIVxuICAgICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ3VwZGF0ZScsIG1vZGVsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vICMjIEV4cG9zZWQgbWV0aG9kcyAgXG4gIFxuICAgIGNvbGxlY3Rpb24uY3JlYXRlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmNyZWF0ZSwgbW9kZWwpO1xuICAgIH07XG4gICAgXG4gICAgY29sbGVjdGlvbi5yZW1vdmUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgbW9kZWwgPSBzYW5pdGl6ZShtb2RlbCk7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5yZW1vdmUsIG1vZGVsKTtcbiAgICB9O1xuXG4gICAgY29sbGVjdGlvbi51cGRhdGUgPSBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgdmFyIGtleSwgdmFsdWVzO1xuICAgICAgdmFsdWVzID0ge31cblxuICAgICAgLy8gaWYgdGhlIHNhbWUgb2JqZWN0IHdhcyBwYXNzZWQgdHdpY2VcbiAgICAgIGlmKG1vZGVsID09PSB1cGRhdGVkKSB7XG4gICAgICAgIG1vZGVsID0gXy5jb3B5KHVwZGF0ZWQpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBvbmx5IG5lZWQgdGhlIGlkIHRvIG1ha2UgdGhlIHVwZGF0ZVxuICAgICAgbW9kZWwgPSB7XG4gICAgICAgIF9pZDogbW9kZWwuX2lkXG4gICAgICB9XG5cbiAgICAgIC8vIHN0cmlwIG1vbmdvL2FuZ3VsYXIgcHJvcGVydGllc1xuICAgICAgZm9yKGtleSBpbiB1cGRhdGVkKSB7XG4gICAgICAgIGlmKCEoa2V5WzBdID09PSAnJCcgfHwga2V5WzBdID09PSAnXycpKSB7XG4gICAgICAgICAgdmFsdWVzW2tleV0gPSB1cGRhdGVkW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnVwZGF0ZSwgbW9kZWwsIHZhbHVlcyk7XG4gICAgfTsgXG5cbiAgICBjb2xsZWN0aW9uLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBmbikge1xuICAgICAgaWYoIShsaXN0ZW5lcnNbZXZlbnROYW1lXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICBsaXN0ZW5lcnNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV0ucHVzaChmbik7XG4gICAgfTtcblxuICAgIGNvbGxlY3Rpb24udHJpZ2dlciA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgICAgZGF0YSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmKGxpc3RlbmVyc1tldmVudE5hbWVdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxpc3RlbmVyc1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV1baV0uYXBwbHkodGhpcywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIGNvbGxlY3Rpb24uZm9jdXMgPSBmdW5jdGlvbihfaWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdmb2N1cyBvbicsIF9pZCk7XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZihjb2xsZWN0aW9uW2ldLl9pZCA9PT0gX2lkKSB7XG4gICAgICAgICAgY29sbGVjdGlvbi5mb2N1c2VkID0gXy5jb3B5KGNvbGxlY3Rpb25baV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ2ZvY3VzJywgY29sbGVjdGlvbi5mb2N1c2VkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gdGhlIGl0ZW0gdGhhdCBjdXJyZW50bHkgaGFzIGZvY3VzXG4gICAgY29sbGVjdGlvbi5mb2N1c2VkID0ge307XG4gIFxuICAgIC8vIFJldmVhbCB0aGUgbmFtZSBvZiB0aGlzIGNvbGxlY3Rpb25cbiAgICBjb2xsZWN0aW9uLm5hbWUgPSBuYW1lO1xuICAgIFxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgcmV0dXJuIG1vZGVsO1xufTtcbiIsIlxuLy8gU29ja2V0IFdyYXBwZXJcbi8vIC0tLS0tLS0tLS0tLS0tXG5cbi8vIEFjdHMgYXMgYSB3cmFwcGVyIGFyb3VuZCBzb2NrZXRGYWN0b3J5XG4vLyBhbmQgZXhwb3NlcyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBjcmVhdGVcbi8vIG5hbWVzcGFjZWQgc29ja2V0cywgYmFzZWQgb24gYSBwYXJhbWV0ZXIuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0RmFjdG9yeSkge1xuICByZXR1cm4gZnVuY3Rpb24obmFtZXNwYWNlKSB7XG4gICAgdmFyIGNvbm5lY3RVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwLycgKyBuYW1lc3BhY2U7XG4gICAgcmV0dXJuIHNvY2tldEZhY3Rvcnkoe1xuICAgICAgaW9Tb2NrZXQ6IGlvLmNvbm5lY3QoY29ubmVjdFVybClcbiAgICB9KTtcbiAgfVxufTtcbiIsIlxuLy8gU3RvcmFnZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgbG9jYWxTdG9yYWdlIHN1cHBvcnQgd2l0aCBhIGNvb2tpZVxuLy8gYmFzZWQgZmFsbGJhY2suIFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FjaGUsIHN0b3JhZ2UsIGlkO1xuICBcbiAgaWQgPSAnYXVkaW8tZHJvcC1zdG9yYWdlJztcbiAgc3RvcmFnZSA9IHdoaWNoKCk7XG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGljaCB0eXBlIG9mIHN0b3JhZ2VcbiAgLy8gaXMgYXZhaWxhYmxlIGFuZCByZXR1cm5zIGEgalF1ZXJ5XG4gIC8vIHN0eWxlIGdldHRlci9zZXR0ZXIgZm9yIGl0J3MgdmFsdWUuXG4gIGZ1bmN0aW9uIHdoaWNoKCkge1xuICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2VbaWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZVtpZF0gPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jb29raWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIExvYWQgdGhlIGNvbnRlbnRzIGZyb20gd2hpY2hldmVyXG4gIC8vIHN0b3JhZ2UgaXMgYXZhaWFibGUuIElmIEpTT04gcGFyc2VcbiAgLy8gdGhyb3dzIGFuIGV4Y2VwdGlvbiwgdGhlbiB0aGUgdmFsdWVcbiAgLy8gd2FzIHVuZGVmaW5lZCwgc28gaW5zdGVhZCBjYWNoZSBhblxuICAvLyBlbXB0eSBvYmplY3QuXG4gIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNhY2hlID0gSlNPTi5wYXJzZShzdG9yYWdlKCkpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgY2FjaGUgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlO1xuICB9XG5cbiAgLy8gU2F2ZSB0aGUgY29udGVudHMgb2YgdGhlIGNhY2hlXG4gIC8vIGludG8gc3RvcmFnZVxuICBmdW5jdGlvbiBzYXZlKCkge1xuICAgIHN0b3JhZ2UoSlNPTi5zdHJpbmdpZnkoY2FjaGUpKTtcbiAgfVxuXG4gIC8vIFNldCBhIHZhbHVlIHdpdGhpbiB0aGUgY2FjaGVcbiAgLy8gYmFzZWQgb24gYSBrZXkgYW5kIHRoZW4gc2F2ZSBpdC5cbiAgZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICBjYWNoZVtrZXldID0gdmFsdWU7XG4gICAgc2F2ZSgpO1xuICB9XG5cbiAgLy8gR2V0IGEgdmFsdWUgZnJvbSB0aGUgY2FjaGVcbiAgZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIHJldHVybiBjYWNoZVtrZXldO1xuICB9IFxuXG4gIC8vIEV4cG9zZSBnZXQgYW5kIHNldCBtZXRob2RzXG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXQsXG4gICAgc2V0OiBzZXRcbiAgfVxufTtcbiIsIi8vIHVpU3RhdGUgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEEgdGlueSBmYWN0b3J5IGZvciBtYWludGFpbmluZyB0aGVcbi8vIHN0YXRlIG9mIHRoZSBVSSBhdCBhbnkgdGltZS4gVGhlIG5hbWVcbi8vIG9mIHRoZSB1aSBpbiBxdWVzdGlvbiBzaG91bGQgYmUgcGFzc2VkXG4vLyB0byB0aGUgc2F2ZSBtZXRob2QgdG8gcGVyc2lzdCBpdC5cblxuLy8gVGhlIHN0YXRlIGNhbiB0aGVuIGJlIHJlbG9hZGVkIGF0IGFueVxuLy8gdGltZSBpbiB0aGUgZnV0dXJlLlxuXG4vLyBfX0ltcG9ydGFudF9fIFRoaXMgZG9lcyBub3QgY2hhbmdlXG4vLyB0aGUgRE9NIF9fYXQgYWxsX18uIEl0IGp1c3Qgc2F2ZXNcbi8vIGEgSlNPTiBvYmplY3Qgd2hpY2ggY2FuIHRoZW4gYmUgdXNlZFxuLy8gd2l0aCBhbmd1bGFyIHRvIG9wdGlvbmFsbHkgc2hvdy9oaWRlXG4vLyBvciBhcHBseSBjbGFzc2VzIHRvIHVpIGVsZW1lbnRzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0b3JhZ2UpIHtcbiAgcmV0dXJuIHtcbiAgICBzYXZlOiBmdW5jdGlvbih1aSwgc3RhdGUpIHtcbiAgICAgIHN0b3JhZ2Uuc2V0KHVpLCBzdGF0ZSk7ICBcbiAgICB9LFxuICAgIGxvYWQ6IGZ1bmN0aW9uKHVpKSB7XG4gICAgICByZXR1cm4gc3RvcmFnZS5nZXQodWkpO1xuICAgIH1cbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gXyA9IHtcbiAgY29weTogZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgdmFyIGtleSwgZHVwbGljYXRlID0ge307XG4gICAgZm9yKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGR1cGxpY2F0ZVtrZXldID0gb2JqZWN0W2tleV1cbiAgICB9XG4gICAgcmV0dXJuIGR1cGxpY2F0ZTtcbiAgfVxufVxuIl19
