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
      var collection;
      
      // Get the name of the collection for this editor
      $scope.name = $element.attr('collection-name');
            
      // Get the collection for this name from
      // the collection factory and bind it to
      // the scope. 
      $scope.collection = collection($scope.name);
      
      $scope.model = {};
   
      $scope.saving = false;
       
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
    for(var i = 0; i < collection.length; i++) {
      if(collection[i]._id === query._id) {
        return collection[i];
      }
    }
    return null;
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
      delete find(collection, model);
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvY3JlYXRvci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9lZGl0b3IuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL2FkbWluU29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3N0b3JhZ2UuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3VpU3RhdGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEFkbWluXG4vLyAtLS0tLVxuXG4vLyBUaGUgYWRtaW4gYXBwbGljYXRpb24gaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmdcbi8vIHRyYWNrIG9mIGFsbCBzZXNzaW9ucywgZGV2aWNlcywgYXVkaW8gZmlsZXMgYW5kXG4vLyBjb21wb3NlZCBzb25ncy5cbi8vIFxuLy8gSXQgYWxzbyBwcm92aWRlcyBhIGNvbnNvbGUgZm9yIHRhbGtpbmcgdG8gdGhlXG4vLyBzZXJ2ZXIgYW5kIHRoZSBjb21wb3NlIGludGVyZmFjZSBmb3IgY3JlYXRpbmdcbi8vIHNvbmcgZmlsZXMgZnJvbSB0aGUgYXZhaWxhYmxlIGF1ZGlvIGZpbGVzLlxuLy9cblxuYW5ndWxhci5tb2R1bGUoJ2FkbWluJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nXSkuXG5cbmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlci5cbiAgd2hlbignL3Nlc3Npb25zJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3Nlc3Npb25zJyxcbiAgICBjb250cm9sbGVyOiAnU2Vzc2lvbnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2F1ZGlvJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2F1ZGlvJyxcbiAgICBjb250cm9sbGVyOiAnQXVkaW9Db250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL3VzZXJzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3VzZXJzJyxcbiAgICBjb250cm9sbGVyOiAnVXNlcnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2NvbXBvc2UnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY29tcG9zZScsXG4gICAgY29udHJvbGxlcjogJ0NvbXBvc2VDb250cm9sbGVyJ1xuICB9KS5cbiAgb3RoZXJ3aXNlKHtcbiAgICByZWRpcmVjdFRvOiAnL3Nlc3Npb25zJ1xuICB9KTtcbn0pLlxuXG4vLyBTZXJ2aWNlc1xuLy8gLS0tLS0tLS1cblxuZmFjdG9yeSh7XG4gIC8vIExvY2Fsc3RvcmFnZSArIGNvb2tpZSBzaGltXG4gICdzdG9yYWdlJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9zdG9yYWdlJyksXG4gIC8vIE1haW50YWluIHN0YXRlIG9mIHVpXG4gICd1aVN0YXRlJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy91aVN0YXRlJyksXG4gIC8vIFdlYiBzb2NrZXQgd3JhcHBlclxuICAnc29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9zb2NrZXQnKSxcbiAgLy8gU29ja2V0IGNvbm5lY3QgdG8gYWRtaW4gY2hhbm5lbFxuICAnYWRtaW5Tb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL2FkbWluU29ja2V0JyksXG4gIC8vIENvbGxlY3Rpb24gbWFpbnRhaW5lclxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vc2VydmljZXMvY29sbGVjdGlvbicpXG59KS5cblxuLy8gQ29udHJvbGxlcnNcbi8vIC0tLS0tLS0tLS0tXG5cbmNvbnRyb2xsZXIoe1xuICAvLyBNYW5hZ2UgZGV2aWNlcyBpbiBzZXNzaW9uc1xuICAnU2Vzc2lvbnNDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9TZXNzaW9uc0NvbnRyb2xsZXInKSxcbiAgLy8gQ29tcG9zaXRpb24gb2Ygc29uZyBmaWxlc1xuICAnQ29tcG9zZUNvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0NvbXBvc2VDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSBhZG1pbmlzdHJhdG9ycyBhbmQgcmVnaXN0ZXJlZCB1c2Vyc1xuICAnVXNlcnNDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Vc2Vyc0NvbnRyb2xsZXInKSxcbiAgLy8gTWFuYWdlIHVwbG9hZGVkIGF1ZGlvIHRyYWNrc1xuICAnQXVkaW9Db250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9BdWRpb0NvbnRyb2xsZXInKVxufSkuXG5cbi8vIERpcmVjdGl2ZXNcbi8vIC0tLS0tLS0tLS1cblxuZGlyZWN0aXZlKHtcbiAgLy8gSW50ZXJmYWNlIGZvciBlZGl0aW5nIGNvbGxlY3Rpb25zXG4gICdlZGl0b3InOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvZWRpdG9yJyksXG4gIC8vIEludGVyZmFjZSBmb3IgY3JlYXRpbmcgaXRlbXMgZm9yIGNvbGxlY3Rpb25zXG4gICdjcmVhdG9yJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NyZWF0b3InKSxcbiAgLy8gQ29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbiAgJ2NvbnNvbGUnOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29uc29sZScpLFxuICAvLyBTZWFyY2hhYmxlIGNvbGxlY3Rpb24gaW50ZXJmYWNlIFxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJylcbn0pO1xuXG5cblxuIiwiLyoqXG4gKiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG5cbn07XG4iLCJcbi8vIENvbGxlY3Rpb24gZGlyZWN0aXZlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBZGQgdGhlIGF0dHJpYnV0ZSBjb2xsZWN0aW9uIHRvIGFuIGVsZW1lbnQgYW5kIFxuLy8gc3BlY2lmeSB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBpbiBhICdjb2xsZWN0aW9uLW5hbWUnIFxuLy8gYXR0cmlidXRlLCBhbmQgdGhpcyBkaXJlY3RpdmUgd2lsbCBjcmVhdGUgYSBzZWFyY2hhYmxlLCBcbi8vIHN5bmNocm9uaXplZCBkYXRhIHZpZXcgb2YgdGhhdCBjb2xsZWN0aW9uLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb2xsZWN0aW9uJyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7IFxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICRzY29wZS5tb2RlbHMgPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgICRzY29wZS5zZWFyY2ggPSAnJztcbiAgICAgIFxuICAgICAgJHNjb3BlLmZvY3VzID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHNjb3BlLm1vZGVscy5mb2N1cyA9IGlkO1xuICAgICAgfTtcbiAgICAgICAgICAgICAgXG4gICAgICBjb25zb2xlLmxvZygkc2NvcGUubmFtZSwgJ2RpcmVjdGl2ZSBjb250cm9sbGVyJyk7XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odWlTdGF0ZSkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb25zb2xlJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHsgXG4gICAgICB2YXIgc2hvd2luZywgdWlLZXk7XG5cbiAgICAgIHVpS2V5ID0gJ2NvbnNvbGUtc3RhdGUnXG4gICAgICBzaG93aW5nID0gKHVpU3RhdGUubG9hZCh1aUtleSkgfHwgZmFsc2UpO1xuICAgICBcbiAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuIFxuICAgICAgZnVuY3Rpb24gY2hlY2tWaXNpYmlsaXR5KCkge1xuICAgICAgICBpZihzaG93aW5nKSB7XG4gICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfSBcbiAgICAgIH1cbiAgICAgICAgXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkgICB7XG4gICAgICAgIC8vIFRvZ2dsZSBvbiBgIGtleVxuICAgICAgICBpZihlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgICAgIHNob3dpbmcgPSAhc2hvd2luZztcbiAgICAgICAgICB1aVN0YXRlLnNhdmUodWlLZXksIHNob3dpbmcpO1xuICAgICAgICBcbiAgICAgICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiAgICAgICAgICAvLyBHaXZlIGZvY3VzIHRvIGlucHV0IFxuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICAgIC8vIFN0b3AgYCBiZWluZyBpbnNlcnRlZCBpbnRvIGNvbnNvbGVcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgYWRtaW5Tb2NrZXQpIHtcbiAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICBcbiAgICAgIGFkbWluU29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsVG9wID0gJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfTtcbiAgICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKHtcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIGFkbWluU29ja2V0LmVtaXQoJ21lc3NhZ2UnLCAkc2NvcGUuaW5wdXQpO1xuICAgICAgICAkc2NvcGUuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIlxuLy8gQ3JlYXRvclxuLy8gLS0tLS0tLVxuIFxuLy8gUHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciBjcmVhdGluZyBpdGVtcyBcbi8vIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG5cbnZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jcmVhdG9yJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdDcmVhdG9yJyk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbjtcbiAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIGVkaXRvclxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIG5hbWUgZnJvbVxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBhbmQgYmluZCBpdCB0b1xuICAgICAgLy8gdGhlIHNjb3BlLiBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAgXG4gICAgICAvLyBJbml0aWFsIHNjaGVtYSBmb3IgY3JlYXRpb25cbiAgICAgICRzY29wZS5zY2hlbWEgPSB7fTsgXG4gICAgICAvLyBBY3R1YWwgbW9kZWwgYm91bmQgdG8gaW5wdXRcbiAgICAgICRzY29wZS5pbnN0YW5jZSA9IHt9O1xuICAgICAgLy8gU2F2aW5nIHN0YXRlXG4gICAgICAkc2NvcGUuY3JlYXRpbmcgPSBmYWxzZTtcblxuICAgICAgJHNjb3BlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkgeyAgICBcbiAgICAgICAgJHNjb3BlLmNyZWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24uY3JlYXRlKCRzY29wZS5pbnN0YW5jZSk7XG4gICAgICB9O1xuICAgICAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignZ2V0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGlmKCRzY29wZS5jb2xsZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAkc2NvcGUuc2NoZW1hID0gXy5jb3B5KCRzY29wZS5jb2xsZWN0aW9uWzBdKTtcbiAgICAgICAgICAvLyBObyBuZWVkIGZvciBtb25nbyBpZHMgaGVyZVxuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUuc2NoZW1hLl9pZDtcbiAgICAgICAgfVxuXG4gICAgICAgICRzY29wZS5pbnN0YW5jZSA9ICRzY29wZS5zY2hlbWE7XG4gICAgICAgIGZvcihrZXkgaW4gJHNjb3BlLmluc3RhbmNlKSB7XG4gICAgICAgICAgJHNjb3BlLmluc3RhbmNlW2tleV0gPSAnJztcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCdjcmVhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0aW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiBcbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vLyBFZGl0b3Jcbi8vIC0tLS0tLVxuIFxuLy8gUHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciB1cGRhdGluZyBhbmQgXG4vLyBtb2RpZnlpbmcgaXRlbXMgZnJvbSBhIGNvbGxlY3Rpb24gc2VydmljZS5cbi8vXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2VkaXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnRWRpdG9yJyk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbjtcbiAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIGVkaXRvclxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIG5hbWUgZnJvbVxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBhbmQgYmluZCBpdCB0b1xuICAgICAgLy8gdGhlIHNjb3BlLiBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICBcbiAgICAgICRzY29wZS5tb2RlbCA9IHt9O1xuICAgXG4gICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgICAgXG4gICAgICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbW9kZWwgPSAkc2NvcGUubW9kZWw7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlZGl0ZWQnLCAkc2NvcGUubW9kZWwpO1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbi51cGRhdGUobW9kZWwsIG1vZGVsKTtcbiAgICAgICAgJHNjb3BlLnNhdmluZyA9IHRydWU7IFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignZm9jdXMnLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgICAkc2NvcGUubW9kZWwgPSBtb2RlbDtcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIlxuLy8gYWRtaW5Tb2NrZXQgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBhIHNvY2tldCB0aGF0J3MgY29ubmVjdGVkXG4vLyB0byB0aGUgYWRtaW4gY2hhbm5lbC5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgdmFyIGFkbWluU29ja2V0ID0gc29ja2V0KCdhZG1pbicpO1xuICBhZG1pblNvY2tldC5yZWFkeSA9IGZhbHNlO1xuICBcbiAgYWRtaW5Tb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgYWRtaW5Tb2NrZXQucmVhZHkgPSB0cnVlO1xuICB9KTtcbiAgXG4gIHJldHVybiBhZG1pblNvY2tldDtcbn07XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy8gY29sbGVjdGlvbiBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0gXG5cbi8vIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuLy8gdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4vLyBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIGAvcm91dGVzL2NvbGxlY3Rpb24vYFxuLy8gZm9yIG1vcmUgZGV0YWlscy5cblxuLy8gQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuLy8gcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXInc1xuLy8gcmVhZHkgZXZlbnQsIGFuZCB0aGVuIHByb2NlZWRzIHRvIGxpc3RlbiB0byB0aGUgZXZlbnRzXG4vLyAoX19jcmVhdGVfXywgX19nZXRfXywgX191cGRhdGVfXywgX19yZW1vdmVfXykgXG4vLyBmb3IgdGhhdCBuYW1lIGFuZCBjcmVhdGVzIGEgc2V0IG9mIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSBcbi8vIHRoZSBkYXRhIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuXG4vLyBGaW5hbGx5LCBhIGR5bmFtaWMgYXJyYXkgY29udGFpbmluZyB0aGUgbW9kZWxzXG4vLyBmcm9tIHRoZSBjb2xsZWN0aW9uIGlzIHJldHVybmVkLCB3aXRoIGNyZWF0ZSwgdXBkYXRlXG4vLyBhbmQgcmVtb3ZlIG1ldGhvZHMgdGFja2VkIG9uIHRvIGl0LiBUaGlzIGNhbiBiZSB1c2VkXG4vLyBib3VuZCBzdHJhaWdodCB0byB0aGUgRE9NIGZyb20gY29udHJvbGxlcnMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcblxuICAvLyBTdG9yZSBhbGwgYXZhaWxhYmxlIGNvbGxlY3Rpb25zIGluIGhlcmUuXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9O1xuXG5cbiAgLy8gRmluZCBhbmQgcmV0dXJuIGEgbW9kZWwgZnJvbSBhIGNvbGxlY3Rpb25cbiAgLy8gYmFzZWQgb24gdGhlIF9pZCBwcm9wZXJ0eSBvZiB0aGUgcXVlcnkgXG4gIC8vIG9iamVjdC4gXyhRdWVyeSBvYmplY3Qgbm9ybWFsbHkgY29tZXMgZnJvbVxuICAvLyB0aGUgZGF0YWJhc2UpX1xuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25baV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZCB0byBwcm92aWRlIGNsZWFuIGxvb2tpbmdcbiAgLy8gbmFtZXMgZm9yIHNvY2tldCBldmVudHNcbiAgZnVuY3Rpb24gZXZlbnRzKG5hbWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiBuYW1lICsgJy9nZXQnLFxuICAgICAgY3JlYXRlOiBuYW1lICsgJy9jcmVhdGUnLFxuICAgICAgcmVtb3ZlOiBuYW1lICsgJy9yZW1vdmUnLFxuICAgICAgdXBkYXRlOiBuYW1lICsgJy91cGRhdGUnXG4gICAgfVxuICB9XG4gIFxuICBcbiAgLy8gQ3JlYXRlcyBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb24gd2l0aCB0aGlzIG5hbWVcbiAgLy8gYW5kIHJldHVybnMgZHluYW1pYyBjb2xsZWN0aW9uIGFycmF5IGFsb25nXG4gIC8vIHdpdGggY29sbGVjdGlvbiBtYW5pcHVsYXRpb24gbWV0aG9kcy4gU2VlXG4gIC8vIG1vZHVsZSBkb2MgY29tbWVudCBmb3IgbW9yZSBkZXRhaWxzLiBcbiAgZnVuY3Rpb24gbW9kZWwobmFtZSkge1xuICAgIHZhciBjb2xsZWN0aW9uLCBzb2NrZXQsIGV2ZW50LCBsaXN0ZW5lcnM7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoaXMgY29sbGVjdGlvblxuICAgIGlmKGNvbGxlY3Rpb25zW25hbWVdKSB7XG4gICAgICAvL3JldHVybiBpdCBzdHJhaWdodCBhd2F5XG4gICAgICBjb25zb2xlLmxvZygnbG9hZCcsIG5hbWUpO1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvLyBldmVudCBsaXN0ZW5lcnNcbiAgICBsaXN0ZW5lcnMgPSB7fTtcblxuICAgIC8vIGFsaWFzaW5nXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBpZihzb2NrZXQucmVhZHkpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyAjIyBTb2NrZXQgRXZlbnRzXG5cbiAgICBzb2NrZXQub24oZXZlbnQuZ2V0LCBmdW5jdGlvbihtb2RlbHMpIHtcbiAgICAgIGNvbGxlY3Rpb24ubGVuZ3RoID0gMDtcbiAgICAgIC8vIEkgYmVsaWV2ZSB0aGVyZSdzIHNvbWUgZXhwbGFpbmluZyB0byBkbyBoZXJlLlxuICAgICAgY29sbGVjdGlvbi5wdXNoLmFwcGx5KGNvbGxlY3Rpb24sIG1vZGVscy5kYXRhKTtcbiAgICAgIGNvbGxlY3Rpb24uZm9jdXMoY29sbGVjdGlvblswXS5faWQpO1xuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdnZXQnLCBtb2RlbHMpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmNyZWF0ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGNvbGxlY3Rpb24ucHVzaChtb2RlbC5kYXRhKTtcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignY3JlYXRlJywgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnJlbW92ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGRlbGV0ZSBmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKTtcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcigncmVtb3ZlJywgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnVwZGF0ZSwgZnVuY3Rpb24odXBkYXRlZCkge1xuICAgICAgdmFyIGtleSwgbW9kZWw7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5kYXRhO1xuXG4gICAgICAvLyBfX0ltcG9ydGFudF9fIHRvIHJlYWQhXG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdmFsdWVzIG9mIHRoZSBtb2RlbFxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24sIHdlIGNhbiBhY2Nlc3MgaXQgdXNpbmcgZmluZFxuICAgICAgbW9kZWwgPSBmaW5kKGNvbGxlY3Rpb24sIHVwZGF0ZWQpO1xuICAgICAgICBpZihtb2RlbCkgeyBcbiAgICAgICAgLy8gV2UgY2FuJ3Qgc2V0IHRoZSB2YWx1ZSBvZiBtb2RlbCB0byBcbiAgICAgICAgLy8gdXBkYXRlZCBhcyB0aGF0IHdpbGwgb3ZlcndyaXRlIHRoZSByZWZlcmVuY2UuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbG9vcCB0aHJvdWdoIGFuZCB1cGRhdGUgdGhlXG4gICAgICAgIC8vIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBvbmUgYnkgb25lLlxuICAgICAgICBmb3Ioa2V5IGluIHVwZGF0ZWQpIHtcbiAgICAgICAgICBtb2RlbFtrZXldID0gdXBkYXRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICAgIC8vIEFuZCB3ZSdyZSBkb25lIVxuICAgICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ3VwZGF0ZScsIG1vZGVsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vICMjIEV4cG9zZWQgbWV0aG9kcyAgXG4gIFxuICAgIGNvbGxlY3Rpb24uY3JlYXRlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmNyZWF0ZSwgbW9kZWwpO1xuICAgIH07XG4gICAgXG4gICAgY29sbGVjdGlvbi5yZW1vdmUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQucmVtb3ZlLCBtb2RlbCk7XG4gICAgfTtcblxuICAgIGNvbGxlY3Rpb24udXBkYXRlID0gZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIHZhciBrZXksIHZhbHVlcztcbiAgICAgIHZhbHVlcyA9IHt9XG5cbiAgICAgIC8vIGlmIHRoZSBzYW1lIG9iamVjdCB3YXMgcGFzc2VkIHR3aWNlXG4gICAgICBpZihtb2RlbCA9PT0gdXBkYXRlZCkge1xuICAgICAgICBtb2RlbCA9IF8uY29weSh1cGRhdGVkKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb25seSBuZWVkIHRoZSBpZCB0byBtYWtlIHRoZSB1cGRhdGVcbiAgICAgIG1vZGVsID0ge1xuICAgICAgICBfaWQ6IG1vZGVsLl9pZFxuICAgICAgfVxuXG4gICAgICAvLyBzdHJpcCBtb25nby9hbmd1bGFyIHByb3BlcnRpZXNcbiAgICAgIGZvcihrZXkgaW4gdXBkYXRlZCkge1xuICAgICAgICBpZighKGtleVswXSA9PT0gJyQnIHx8IGtleVswXSA9PT0gJ18nKSkge1xuICAgICAgICAgIHZhbHVlc1trZXldID0gdXBkYXRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzb2NrZXQuZW1pdChldmVudC51cGRhdGUsIG1vZGVsLCB2YWx1ZXMpO1xuICAgIH07IFxuXG4gICAgY29sbGVjdGlvbi5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgIGlmKCEobGlzdGVuZXJzW2V2ZW50TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdLnB1c2goZm4pO1xuICAgIH07XG5cbiAgICBjb2xsZWN0aW9uLnRyaWdnZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGRhdGEpIHtcbiAgICAgIGRhdGEgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZihsaXN0ZW5lcnNbZXZlbnROYW1lXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBjb2xsZWN0aW9uLmZvY3VzID0gZnVuY3Rpb24oX2lkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZm9jdXMgb24nLCBfaWQpO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IF9pZCkge1xuICAgICAgICAgIGNvbGxlY3Rpb24uZm9jdXNlZCA9IF8uY29weShjb2xsZWN0aW9uW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdmb2N1cycsIGNvbGxlY3Rpb24uZm9jdXNlZCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHRoZSBpdGVtIHRoYXQgY3VycmVudGx5IGhhcyBmb2N1c1xuICAgIGNvbGxlY3Rpb24uZm9jdXNlZCA9IHt9O1xuICBcbiAgICAvLyBSZXZlYWwgdGhlIG5hbWUgb2YgdGhpcyBjb2xsZWN0aW9uXG4gICAgY29sbGVjdGlvbi5uYW1lID0gbmFtZTtcbiAgICBcbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBtb2RlbDtcbn07XG4iLCJcbi8vIFNvY2tldCBXcmFwcGVyXG4vLyAtLS0tLS0tLS0tLS0tLVxuXG4vLyBBY3RzIGFzIGEgd3JhcHBlciBhcm91bmQgc29ja2V0RmFjdG9yeVxuLy8gYW5kIGV4cG9zZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgY3JlYXRlXG4vLyBuYW1lc3BhY2VkIHNvY2tldHMsIGJhc2VkIG9uIGEgcGFyYW1ldGVyLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iLCJcbi8vIFN0b3JhZ2UgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGxvY2FsU3RvcmFnZSBzdXBwb3J0IHdpdGggYSBjb29raWVcbi8vIGJhc2VkIGZhbGxiYWNrLiBcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNhY2hlLCBzdG9yYWdlLCBpZDtcbiAgXG4gIGlkID0gJ2F1ZGlvLWRyb3Atc3RvcmFnZSc7XG4gIHN0b3JhZ2UgPSB3aGljaCgpO1xuXG4gIC8vIERldGVybWluZXMgd2hpY2ggdHlwZSBvZiBzdG9yYWdlXG4gIC8vIGlzIGF2YWlsYWJsZSBhbmQgcmV0dXJucyBhIGpRdWVyeVxuICAvLyBzdHlsZSBnZXR0ZXIvc2V0dGVyIGZvciBpdCdzIHZhbHVlLlxuICBmdW5jdGlvbiB3aGljaCgpIHtcbiAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlW2lkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2VbaWRdID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBMb2FkIHRoZSBjb250ZW50cyBmcm9tIHdoaWNoZXZlclxuICAvLyBzdG9yYWdlIGlzIGF2YWlhYmxlLiBJZiBKU09OIHBhcnNlXG4gIC8vIHRocm93cyBhbiBleGNlcHRpb24sIHRoZW4gdGhlIHZhbHVlXG4gIC8vIHdhcyB1bmRlZmluZWQsIHNvIGluc3RlYWQgY2FjaGUgYW5cbiAgLy8gZW1wdHkgb2JqZWN0LlxuICBmdW5jdGlvbiBsb2FkKCkge1xuICAgIHRyeSB7XG4gICAgICBjYWNoZSA9IEpTT04ucGFyc2Uoc3RvcmFnZSgpKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGNhY2hlID0ge307XG4gICAgfVxuICAgIHJldHVybiBjYWNoZTtcbiAgfVxuXG4gIC8vIFNhdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjYWNoZVxuICAvLyBpbnRvIHN0b3JhZ2VcbiAgZnVuY3Rpb24gc2F2ZSgpIHtcbiAgICBzdG9yYWdlKEpTT04uc3RyaW5naWZ5KGNhY2hlKSk7XG4gIH1cblxuICAvLyBTZXQgYSB2YWx1ZSB3aXRoaW4gdGhlIGNhY2hlXG4gIC8vIGJhc2VkIG9uIGEga2V5IGFuZCB0aGVuIHNhdmUgaXQuXG4gIGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgY2FjaGVba2V5XSA9IHZhbHVlO1xuICAgIHNhdmUoKTtcbiAgfVxuXG4gIC8vIEdldCBhIHZhbHVlIGZyb20gdGhlIGNhY2hlXG4gIGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgfSBcblxuICAvLyBFeHBvc2UgZ2V0IGFuZCBzZXQgbWV0aG9kc1xuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0XG4gIH1cbn07XG4iLCIvLyB1aVN0YXRlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBIHRpbnkgZmFjdG9yeSBmb3IgbWFpbnRhaW5pbmcgdGhlXG4vLyBzdGF0ZSBvZiB0aGUgVUkgYXQgYW55IHRpbWUuIFRoZSBuYW1lXG4vLyBvZiB0aGUgdWkgaW4gcXVlc3Rpb24gc2hvdWxkIGJlIHBhc3NlZFxuLy8gdG8gdGhlIHNhdmUgbWV0aG9kIHRvIHBlcnNpc3QgaXQuXG5cbi8vIFRoZSBzdGF0ZSBjYW4gdGhlbiBiZSByZWxvYWRlZCBhdCBhbnlcbi8vIHRpbWUgaW4gdGhlIGZ1dHVyZS5cblxuLy8gX19JbXBvcnRhbnRfXyBUaGlzIGRvZXMgbm90IGNoYW5nZVxuLy8gdGhlIERPTSBfX2F0IGFsbF9fLiBJdCBqdXN0IHNhdmVzXG4vLyBhIEpTT04gb2JqZWN0IHdoaWNoIGNhbiB0aGVuIGJlIHVzZWRcbi8vIHdpdGggYW5ndWxhciB0byBvcHRpb25hbGx5IHNob3cvaGlkZVxuLy8gb3IgYXBwbHkgY2xhc3NlcyB0byB1aSBlbGVtZW50cy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdG9yYWdlKSB7XG4gIHJldHVybiB7XG4gICAgc2F2ZTogZnVuY3Rpb24odWksIHN0YXRlKSB7XG4gICAgICBzdG9yYWdlLnNldCh1aSwgc3RhdGUpOyAgXG4gICAgfSxcbiAgICBsb2FkOiBmdW5jdGlvbih1aSkge1xuICAgICAgcmV0dXJuIHN0b3JhZ2UuZ2V0KHVpKTtcbiAgICB9XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IF8gPSB7XG4gIGNvcHk6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBrZXksIGR1cGxpY2F0ZSA9IHt9O1xuICAgIGZvcihrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBkdXBsaWNhdGVba2V5XSA9IG9iamVjdFtrZXldXG4gICAgfVxuICAgIHJldHVybiBkdXBsaWNhdGU7XG4gIH1cbn1cbiJdfQ==
