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
  // Console for server communication
  'console': require('./directives/console'),
  // Searchable collection interface 
  'collection': require('./directives/collection')
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
});

},{"./controllers/AudioController":2,"./controllers/ComposeController":3,"./controllers/SessionsController":4,"./controllers/UsersController":5,"./directives/collection":6,"./directives/console":7,"./directives/editor":8,"./services/adminSocket":9,"./services/collection":10,"./services/socket":11,"./services/storage":12,"./services/uiState":13}],2:[function(require,module,exports){
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

      $scope.selection = function() {
        var models = $scope.collection;
        for(var i = 0; i < models.length; i++) {
          if(models.focus === models[i]._id) {
            return models[i]
          }
        }
        return {};
      }
    }
  }  
};


},{}],9:[function(require,module,exports){

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

},{}],10:[function(require,module,exports){

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
    for(var i = 0; i < collection[i].length; i++) {
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
    var collection, socket, event;

    // if we have already loaded this collection
    if(collections[name]) {
      //return it straight away
      console.log('load', name);
      return collections[name];
    }

    console.log('create', name, 'collection factory');
    
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
      console.log('GET collection data');
      collection.length = 0;
      // I believe there's some explaining to do here.
      collection.push.apply(collection, models.data);
    });

    socket.on(event.create, function(model) {
      collection.push(model);
    });

    socket.on(event.remove, function(model) {
      delete find(collection, model);
    });

    socket.on(event.update, function(model, updated) {
      // Create safeguard with model for find -> null
      (find(collection, model) || model) = updated;
    });

    // ## Exposed methods  
  
    collection.create = function(model) {
      socket.emit(event.create, model);
    };
    
    collection.remove = function(model) {
      socket.emit(event.remove, model);
    };

    collection.update = function(model, updated) {
      socket.emit(event.update, model, updated);
    }; 
    
    // Reveal the name of this collection
    collection.name = name;
    
    return collection;
  }

  return model;
};

},{}],11:[function(require,module,exports){

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

},{}],12:[function(require,module,exports){

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

},{}],13:[function(require,module,exports){
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

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zdG9yYWdlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy91aVN0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQWRtaW5cbi8vIC0tLS0tXG5cbi8vIFRoZSBhZG1pbiBhcHBsaWNhdGlvbiBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZ1xuLy8gdHJhY2sgb2YgYWxsIHNlc3Npb25zLCBkZXZpY2VzLCBhdWRpbyBmaWxlcyBhbmRcbi8vIGNvbXBvc2VkIHNvbmdzLlxuLy8gXG4vLyBJdCBhbHNvIHByb3ZpZGVzIGEgY29uc29sZSBmb3IgdGFsa2luZyB0byB0aGVcbi8vIHNlcnZlciBhbmQgdGhlIGNvbXBvc2UgaW50ZXJmYWNlIGZvciBjcmVhdGluZ1xuLy8gc29uZyBmaWxlcyBmcm9tIHRoZSBhdmFpbGFibGUgYXVkaW8gZmlsZXMuXG4vL1xuXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW4nLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvc2Vzc2lvbnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvc2Vzc2lvbnMnLFxuICAgIGNvbnRyb2xsZXI6ICdTZXNzaW9uc0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvYXVkaW8nLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYXVkaW8nLFxuICAgIGNvbnRyb2xsZXI6ICdBdWRpb0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvdXNlcnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvdXNlcnMnLFxuICAgIGNvbnRyb2xsZXI6ICdVc2Vyc0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvY29tcG9zZScsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jb21wb3NlJyxcbiAgICBjb250cm9sbGVyOiAnQ29tcG9zZUNvbnRyb2xsZXInXG4gIH0pLlxuICBvdGhlcndpc2Uoe1xuICAgIHJlZGlyZWN0VG86ICcvc2Vzc2lvbnMnXG4gIH0pO1xufSkuXG5cbi8vIENvbnRyb2xsZXJzXG4vLyAtLS0tLS0tLS0tLVxuXG5jb250cm9sbGVyKHtcbiAgLy8gTWFuYWdlIGRldmljZXMgaW4gc2Vzc2lvbnNcbiAgJ1Nlc3Npb25zQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyJyksXG4gIC8vIENvbXBvc2l0aW9uIG9mIHNvbmcgZmlsZXNcbiAgJ0NvbXBvc2VDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgYWRtaW5pc3RyYXRvcnMgYW5kIHJlZ2lzdGVyZWQgdXNlcnNcbiAgJ1VzZXJzQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvVXNlcnNDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSB1cGxvYWRlZCBhdWRpbyB0cmFja3NcbiAgJ0F1ZGlvQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyJylcbn0pLlxuXG4vLyBEaXJlY3RpdmVzXG4vLyAtLS0tLS0tLS0tXG5cbmRpcmVjdGl2ZSh7XG4gIC8vIEludGVyZmFjZSBmb3IgZWRpdGluZyBjb2xsZWN0aW9uc1xuICAnZWRpdG9yJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2VkaXRvcicpLFxuICAvLyBDb25zb2xlIGZvciBzZXJ2ZXIgY29tbXVuaWNhdGlvblxuICAnY29uc29sZSc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb25zb2xlJyksXG4gIC8vIFNlYXJjaGFibGUgY29sbGVjdGlvbiBpbnRlcmZhY2UgXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbGxlY3Rpb24nKVxufSkuXG5cblxuLy8gU2VydmljZXNcbi8vIC0tLS0tLS0tXG5cbmZhY3Rvcnkoe1xuICAvLyBMb2NhbHN0b3JhZ2UgKyBjb29raWUgc2hpbVxuICAnc3RvcmFnZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvc3RvcmFnZScpLFxuICAvLyBNYWludGFpbiBzdGF0ZSBvZiB1aVxuICAndWlTdGF0ZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvdWlTdGF0ZScpLFxuICAvLyBXZWIgc29ja2V0IHdyYXBwZXJcbiAgJ3NvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvc29ja2V0JyksXG4gIC8vIFNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbiAgJ2FkbWluU29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpLFxuICAvLyBDb2xsZWN0aW9uIG1haW50YWluZXJcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL3NlcnZpY2VzL2NvbGxlY3Rpb24nKVxufSk7XG4iLCIvKipcbiAqIFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiAgXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcblxufTtcbiIsIlxuLy8gQ29sbGVjdGlvbiBkaXJlY3RpdmVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEFkZCB0aGUgYXR0cmlidXRlIGNvbGxlY3Rpb24gdG8gYW4gZWxlbWVudCBhbmQgXG4vLyBzcGVjaWZ5IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGluIGEgJ2NvbGxlY3Rpb24tbmFtZScgXG4vLyBhdHRyaWJ1dGUsIGFuZCB0aGlzIGRpcmVjdGl2ZSB3aWxsIGNyZWF0ZSBhIHNlYXJjaGFibGUsIFxuLy8gc3luY2hyb25pemVkIGRhdGEgdmlldyBvZiB0aGF0IGNvbGxlY3Rpb24uXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbGxlY3Rpb24nLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHsgXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgXG4gICAgICAkc2NvcGUuZm9jdXMgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICAkc2NvcGUubW9kZWxzLmZvY3VzID0gaWQ7XG4gICAgICB9O1xuICAgICAgICAgICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5uYW1lLCAnZGlyZWN0aXZlIGNvbnRyb2xsZXInKTtcbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1aVN0YXRlKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbnNvbGUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIHZhciBzaG93aW5nLCB1aUtleTtcblxuICAgICAgdWlLZXkgPSAnY29uc29sZS1zdGF0ZSdcbiAgICAgIHNob3dpbmcgPSAodWlTdGF0ZS5sb2FkKHVpS2V5KSB8fCBmYWxzZSk7XG4gICAgIFxuICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gXG4gICAgICBmdW5jdGlvbiBjaGVja1Zpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmKHNob3dpbmcpIHtcbiAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9IFxuICAgICAgfVxuICAgICAgICBcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSAgIHtcbiAgICAgICAgLy8gVG9nZ2xlIG9uIGAga2V5XG4gICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTkyKSB7XG4gICAgICAgICAgc2hvd2luZyA9ICFzaG93aW5nO1xuICAgICAgICAgIHVpU3RhdGUuc2F2ZSh1aUtleSwgc2hvd2luZyk7XG4gICAgICAgIFxuICAgICAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuICAgICAgICAgIC8vIEdpdmUgZm9jdXMgdG8gaW5wdXQgXG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgICAgLy8gU3RvcCBgIGJlaW5nIGluc2VydGVkIGludG8gY29uc29sZVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBhZG1pblNvY2tldCkge1xuICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgJHNjb3BlLm1lc3NhZ2VzID0gW107XG4gICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIFxuICAgICAgYWRtaW5Tb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkZWxlbWVudFswXS5zY3JvbGxUb3AgPSAkZWxlbWVudFswXS5zY3JvbGxIZWlnaHRcbiAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG4gICAgICB9O1xuICAgICAgIFxuICAgICAgJHNjb3BlLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmFkZE1lc3NhZ2Uoe1xuICAgICAgICAgIGJvZHk6ICRzY29wZS5pbnB1dFxuICAgICAgICB9KTtcbiAgICAgICAgYWRtaW5Tb2NrZXQuZW1pdCgnbWVzc2FnZScsICRzY29wZS5pbnB1dCk7XG4gICAgICAgICRzY29wZS5jbGVhcigpO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuXG4gIFxuIiwiXG4vLyBFZGl0b3Jcbi8vIC0tLS0tLVxuIFxuLy8gUHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciB1cGRhdGluZyBhbmQgXG4vLyBtb2RpZnlpbmcgaXRlbXMgZnJvbSBhIGNvbGxlY3Rpb24gc2VydmljZS5cbi8vXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2VkaXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnRWRpdG9yJyk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbjtcbiAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIGVkaXRvclxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIG5hbWUgZnJvbVxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBhbmQgYmluZCBpdCB0b1xuICAgICAgLy8gdGhlIHNjb3BlLiBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG5cbiAgICAgICRzY29wZS5zZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1vZGVscyA9ICRzY29wZS5jb2xsZWN0aW9uO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbW9kZWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYobW9kZWxzLmZvY3VzID09PSBtb2RlbHNbaV0uX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxzW2ldXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vLyBhZG1pblNvY2tldCBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGEgc29ja2V0IHRoYXQncyBjb25uZWN0ZWRcbi8vIHRvIHRoZSBhZG1pbiBjaGFubmVsLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuICB2YXIgYWRtaW5Tb2NrZXQgPSBzb2NrZXQoJ2FkbWluJyk7XG4gIGFkbWluU29ja2V0LnJlYWR5ID0gZmFsc2U7XG4gIFxuICBhZG1pblNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICBhZG1pblNvY2tldC5yZWFkeSA9IHRydWU7XG4gIH0pO1xuICBcbiAgcmV0dXJuIGFkbWluU29ja2V0O1xufTtcbiIsIlxuLy8gY29sbGVjdGlvbiBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0gXG5cbi8vIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuLy8gdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4vLyBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIGAvcm91dGVzL2NvbGxlY3Rpb24vYFxuLy8gZm9yIG1vcmUgZGV0YWlscy5cblxuLy8gQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuLy8gcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXInc1xuLy8gcmVhZHkgZXZlbnQsIGFuZCB0aGVuIHByb2NlZWRzIHRvIGxpc3RlbiB0byB0aGUgZXZlbnRzXG4vLyAoX19jcmVhdGVfXywgX19nZXRfXywgX191cGRhdGVfXywgX19yZW1vdmVfXykgXG4vLyBmb3IgdGhhdCBuYW1lIGFuZCBjcmVhdGVzIGEgc2V0IG9mIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSBcbi8vIHRoZSBkYXRhIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuXG4vLyBGaW5hbGx5LCBhIGR5bmFtaWMgYXJyYXkgY29udGFpbmluZyB0aGUgbW9kZWxzXG4vLyBmcm9tIHRoZSBjb2xsZWN0aW9uIGlzIHJldHVybmVkLCB3aXRoIGNyZWF0ZSwgdXBkYXRlXG4vLyBhbmQgcmVtb3ZlIG1ldGhvZHMgdGFja2VkIG9uIHRvIGl0LiBUaGlzIGNhbiBiZSB1c2VkXG4vLyBib3VuZCBzdHJhaWdodCB0byB0aGUgRE9NIGZyb20gY29udHJvbGxlcnMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcblxuICAvLyBTdG9yZSBhbGwgYXZhaWxhYmxlIGNvbGxlY3Rpb25zIGluIGhlcmUuXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9O1xuXG5cbiAgLy8gRmluZCBhbmQgcmV0dXJuIGEgbW9kZWwgZnJvbSBhIGNvbGxlY3Rpb25cbiAgLy8gYmFzZWQgb24gdGhlIF9pZCBwcm9wZXJ0eSBvZiB0aGUgcXVlcnkgXG4gIC8vIG9iamVjdC4gXyhRdWVyeSBvYmplY3Qgbm9ybWFsbHkgY29tZXMgZnJvbVxuICAvLyB0aGUgZGF0YWJhc2UpX1xuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb25baV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25baV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZCB0byBwcm92aWRlIGNsZWFuIGxvb2tpbmdcbiAgLy8gbmFtZXMgZm9yIHNvY2tldCBldmVudHNcbiAgZnVuY3Rpb24gZXZlbnRzKG5hbWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiBuYW1lICsgJy9nZXQnLFxuICAgICAgY3JlYXRlOiBuYW1lICsgJy9jcmVhdGUnLFxuICAgICAgcmVtb3ZlOiBuYW1lICsgJy9yZW1vdmUnLFxuICAgICAgdXBkYXRlOiBuYW1lICsgJy91cGRhdGUnXG4gICAgfVxuICB9XG4gIFxuICBcbiAgLy8gQ3JlYXRlcyBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb24gd2l0aCB0aGlzIG5hbWVcbiAgLy8gYW5kIHJldHVybnMgZHluYW1pYyBjb2xsZWN0aW9uIGFycmF5IGFsb25nXG4gIC8vIHdpdGggY29sbGVjdGlvbiBtYW5pcHVsYXRpb24gbWV0aG9kcy4gU2VlXG4gIC8vIG1vZHVsZSBkb2MgY29tbWVudCBmb3IgbW9yZSBkZXRhaWxzLiBcbiAgZnVuY3Rpb24gbW9kZWwobmFtZSkge1xuICAgIHZhciBjb2xsZWN0aW9uLCBzb2NrZXQsIGV2ZW50O1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhbHJlYWR5IGxvYWRlZCB0aGlzIGNvbGxlY3Rpb25cbiAgICBpZihjb2xsZWN0aW9uc1tuYW1lXSkge1xuICAgICAgLy9yZXR1cm4gaXQgc3RyYWlnaHQgYXdheVxuICAgICAgY29uc29sZS5sb2coJ2xvYWQnLCBuYW1lKTtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uc1tuYW1lXTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnY3JlYXRlJywgbmFtZSwgJ2NvbGxlY3Rpb24gZmFjdG9yeScpO1xuICAgIFxuICAgIC8vIGFsaWFzaW5nXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBpZihzb2NrZXQucmVhZHkpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyAjIyBTb2NrZXQgRXZlbnRzXG5cbiAgICBzb2NrZXQub24oZXZlbnQuZ2V0LCBmdW5jdGlvbihtb2RlbHMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdHRVQgY29sbGVjdGlvbiBkYXRhJyk7XG4gICAgICBjb2xsZWN0aW9uLmxlbmd0aCA9IDA7XG4gICAgICAvLyBJIGJlbGlldmUgdGhlcmUncyBzb21lIGV4cGxhaW5pbmcgdG8gZG8gaGVyZS5cbiAgICAgIGNvbGxlY3Rpb24ucHVzaC5hcHBseShjb2xsZWN0aW9uLCBtb2RlbHMuZGF0YSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQuY3JlYXRlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgY29sbGVjdGlvbi5wdXNoKG1vZGVsKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC5yZW1vdmUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBkZWxldGUgZmluZChjb2xsZWN0aW9uLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQudXBkYXRlLCBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgLy8gQ3JlYXRlIHNhZmVndWFyZCB3aXRoIG1vZGVsIGZvciBmaW5kIC0+IG51bGxcbiAgICAgIChmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKSB8fCBtb2RlbCkgPSB1cGRhdGVkO1xuICAgIH0pO1xuXG4gICAgLy8gIyMgRXhwb3NlZCBtZXRob2RzICBcbiAgXG4gICAgY29sbGVjdGlvbi5jcmVhdGUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuY3JlYXRlLCBtb2RlbCk7XG4gICAgfTtcbiAgICBcbiAgICBjb2xsZWN0aW9uLnJlbW92ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5yZW1vdmUsIG1vZGVsKTtcbiAgICB9O1xuXG4gICAgY29sbGVjdGlvbi51cGRhdGUgPSBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQudXBkYXRlLCBtb2RlbCwgdXBkYXRlZCk7XG4gICAgfTsgXG4gICAgXG4gICAgLy8gUmV2ZWFsIHRoZSBuYW1lIG9mIHRoaXMgY29sbGVjdGlvblxuICAgIGNvbGxlY3Rpb24ubmFtZSA9IG5hbWU7XG4gICAgXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICByZXR1cm4gbW9kZWw7XG59O1xuIiwiXG4vLyBTb2NrZXQgV3JhcHBlclxuLy8gLS0tLS0tLS0tLS0tLS1cblxuLy8gQWN0cyBhcyBhIHdyYXBwZXIgYXJvdW5kIHNvY2tldEZhY3Rvcnlcbi8vIGFuZCBleHBvc2VzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZVxuLy8gbmFtZXNwYWNlZCBzb2NrZXRzLCBiYXNlZCBvbiBhIHBhcmFtZXRlci5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXRGYWN0b3J5KSB7XG4gIHJldHVybiBmdW5jdGlvbihuYW1lc3BhY2UpIHtcbiAgICB2YXIgY29ubmVjdFVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyArIG5hbWVzcGFjZTtcbiAgICByZXR1cm4gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogaW8uY29ubmVjdChjb25uZWN0VXJsKVxuICAgIH0pO1xuICB9XG59O1xuIiwiXG4vLyBTdG9yYWdlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBsb2NhbFN0b3JhZ2Ugc3VwcG9ydCB3aXRoIGEgY29va2llXG4vLyBiYXNlZCBmYWxsYmFjay4gXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYWNoZSwgc3RvcmFnZSwgaWQ7XG4gIFxuICBpZCA9ICdhdWRpby1kcm9wLXN0b3JhZ2UnO1xuICBzdG9yYWdlID0gd2hpY2goKTtcblxuICAvLyBEZXRlcm1pbmVzIHdoaWNoIHR5cGUgb2Ygc3RvcmFnZVxuICAvLyBpcyBhdmFpbGFibGUgYW5kIHJldHVybnMgYSBqUXVlcnlcbiAgLy8gc3R5bGUgZ2V0dGVyL3NldHRlciBmb3IgaXQncyB2YWx1ZS5cbiAgZnVuY3Rpb24gd2hpY2goKSB7XG4gICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGxvY2FsU3RvcmFnZVtpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlW2lkXSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTG9hZCB0aGUgY29udGVudHMgZnJvbSB3aGljaGV2ZXJcbiAgLy8gc3RvcmFnZSBpcyBhdmFpYWJsZS4gSWYgSlNPTiBwYXJzZVxuICAvLyB0aHJvd3MgYW4gZXhjZXB0aW9uLCB0aGVuIHRoZSB2YWx1ZVxuICAvLyB3YXMgdW5kZWZpbmVkLCBzbyBpbnN0ZWFkIGNhY2hlIGFuXG4gIC8vIGVtcHR5IG9iamVjdC5cbiAgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgY2FjaGUgPSBKU09OLnBhcnNlKHN0b3JhZ2UoKSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBjYWNoZSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGU7XG4gIH1cblxuICAvLyBTYXZlIHRoZSBjb250ZW50cyBvZiB0aGUgY2FjaGVcbiAgLy8gaW50byBzdG9yYWdlXG4gIGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgc3RvcmFnZShKU09OLnN0cmluZ2lmeShjYWNoZSkpO1xuICB9XG5cbiAgLy8gU2V0IGEgdmFsdWUgd2l0aGluIHRoZSBjYWNoZVxuICAvLyBiYXNlZCBvbiBhIGtleSBhbmQgdGhlbiBzYXZlIGl0LlxuICBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcbiAgICBzYXZlKCk7XG4gIH1cblxuICAvLyBHZXQgYSB2YWx1ZSBmcm9tIHRoZSBjYWNoZVxuICBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgcmV0dXJuIGNhY2hlW2tleV07XG4gIH0gXG5cbiAgLy8gRXhwb3NlIGdldCBhbmQgc2V0IG1ldGhvZHNcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGdldCxcbiAgICBzZXQ6IHNldFxuICB9XG59O1xuIiwiLy8gdWlTdGF0ZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gQSB0aW55IGZhY3RvcnkgZm9yIG1haW50YWluaW5nIHRoZVxuLy8gc3RhdGUgb2YgdGhlIFVJIGF0IGFueSB0aW1lLiBUaGUgbmFtZVxuLy8gb2YgdGhlIHVpIGluIHF1ZXN0aW9uIHNob3VsZCBiZSBwYXNzZWRcbi8vIHRvIHRoZSBzYXZlIG1ldGhvZCB0byBwZXJzaXN0IGl0LlxuXG4vLyBUaGUgc3RhdGUgY2FuIHRoZW4gYmUgcmVsb2FkZWQgYXQgYW55XG4vLyB0aW1lIGluIHRoZSBmdXR1cmUuXG5cbi8vIF9fSW1wb3J0YW50X18gVGhpcyBkb2VzIG5vdCBjaGFuZ2Vcbi8vIHRoZSBET00gX19hdCBhbGxfXy4gSXQganVzdCBzYXZlc1xuLy8gYSBKU09OIG9iamVjdCB3aGljaCBjYW4gdGhlbiBiZSB1c2VkXG4vLyB3aXRoIGFuZ3VsYXIgdG8gb3B0aW9uYWxseSBzaG93L2hpZGVcbi8vIG9yIGFwcGx5IGNsYXNzZXMgdG8gdWkgZWxlbWVudHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuICByZXR1cm4ge1xuICAgIHNhdmU6IGZ1bmN0aW9uKHVpLCBzdGF0ZSkge1xuICAgICAgc3RvcmFnZS5zZXQodWksIHN0YXRlKTsgIFxuICAgIH0sXG4gICAgbG9hZDogZnVuY3Rpb24odWkpIHtcbiAgICAgIHJldHVybiBzdG9yYWdlLmdldCh1aSk7XG4gICAgfVxuICB9XG59O1xuIl19
