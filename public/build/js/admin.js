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
  // Console for server communication
  'console': require('./directives/console'),
  // Searchable collection interface 
  'collection': require('./directives/collection')
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
      
      $scope.saving = false;
    
      $scope.selection = function() {
        var models = $scope.collection;
        for(var i = 0; i < models.length; i++) {
          if(models.focus === models[i]._id) {
            return models[i]
          }
        }
        return {};
      };

      $scope.save = function() {
        var focus = $scope.selection();
        $scope.collection.update(focus, focus);
        $scope.saving = true; 
      };

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
      collection.focus = collection[0]._id;
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zdG9yYWdlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy91aVN0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQWRtaW5cbi8vIC0tLS0tXG5cbi8vIFRoZSBhZG1pbiBhcHBsaWNhdGlvbiBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZ1xuLy8gdHJhY2sgb2YgYWxsIHNlc3Npb25zLCBkZXZpY2VzLCBhdWRpbyBmaWxlcyBhbmRcbi8vIGNvbXBvc2VkIHNvbmdzLlxuLy8gXG4vLyBJdCBhbHNvIHByb3ZpZGVzIGEgY29uc29sZSBmb3IgdGFsa2luZyB0byB0aGVcbi8vIHNlcnZlciBhbmQgdGhlIGNvbXBvc2UgaW50ZXJmYWNlIGZvciBjcmVhdGluZ1xuLy8gc29uZyBmaWxlcyBmcm9tIHRoZSBhdmFpbGFibGUgYXVkaW8gZmlsZXMuXG4vL1xuXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW4nLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvc2Vzc2lvbnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvc2Vzc2lvbnMnLFxuICAgIGNvbnRyb2xsZXI6ICdTZXNzaW9uc0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvYXVkaW8nLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYXVkaW8nLFxuICAgIGNvbnRyb2xsZXI6ICdBdWRpb0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvdXNlcnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvdXNlcnMnLFxuICAgIGNvbnRyb2xsZXI6ICdVc2Vyc0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvY29tcG9zZScsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jb21wb3NlJyxcbiAgICBjb250cm9sbGVyOiAnQ29tcG9zZUNvbnRyb2xsZXInXG4gIH0pLlxuICBvdGhlcndpc2Uoe1xuICAgIHJlZGlyZWN0VG86ICcvc2Vzc2lvbnMnXG4gIH0pO1xufSkuXG5cbi8vIFNlcnZpY2VzXG4vLyAtLS0tLS0tLVxuXG5mYWN0b3J5KHtcbiAgLy8gTG9jYWxzdG9yYWdlICsgY29va2llIHNoaW1cbiAgJ3N0b3JhZ2UnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3N0b3JhZ2UnKSxcbiAgLy8gTWFpbnRhaW4gc3RhdGUgb2YgdWlcbiAgJ3VpU3RhdGUnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3VpU3RhdGUnKSxcbiAgLy8gV2ViIHNvY2tldCB3cmFwcGVyXG4gICdzb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpLFxuICAvLyBTb2NrZXQgY29ubmVjdCB0byBhZG1pbiBjaGFubmVsXG4gICdhZG1pblNvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvYWRtaW5Tb2NrZXQnKSxcbiAgLy8gQ29sbGVjdGlvbiBtYWludGFpbmVyXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb2xsZWN0aW9uJylcbn0pLlxuXG4vLyBDb250cm9sbGVyc1xuLy8gLS0tLS0tLS0tLS1cblxuY29udHJvbGxlcih7XG4gIC8vIE1hbmFnZSBkZXZpY2VzIGluIHNlc3Npb25zXG4gICdTZXNzaW9uc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlcicpLFxuICAvLyBDb21wb3NpdGlvbiBvZiBzb25nIGZpbGVzXG4gICdDb21wb3NlQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXInKSxcbiAgLy8gTWFuYWdlIGFkbWluaXN0cmF0b3JzIGFuZCByZWdpc3RlcmVkIHVzZXJzXG4gICdVc2Vyc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1VzZXJzQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgdXBsb2FkZWQgYXVkaW8gdHJhY2tzXG4gICdBdWRpb0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlcicpXG59KS5cblxuLy8gRGlyZWN0aXZlc1xuLy8gLS0tLS0tLS0tLVxuXG5kaXJlY3RpdmUoe1xuICAvLyBJbnRlcmZhY2UgZm9yIGVkaXRpbmcgY29sbGVjdGlvbnNcbiAgJ2VkaXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9lZGl0b3InKSxcbiAgLy8gQ29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbiAgJ2NvbnNvbGUnOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29uc29sZScpLFxuICAvLyBTZWFyY2hhYmxlIGNvbGxlY3Rpb24gaW50ZXJmYWNlIFxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJylcbn0pO1xuXG5cblxuIiwiLyoqXG4gKiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG5cbn07XG4iLCJcbi8vIENvbGxlY3Rpb24gZGlyZWN0aXZlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBZGQgdGhlIGF0dHJpYnV0ZSBjb2xsZWN0aW9uIHRvIGFuIGVsZW1lbnQgYW5kIFxuLy8gc3BlY2lmeSB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBpbiBhICdjb2xsZWN0aW9uLW5hbWUnIFxuLy8gYXR0cmlidXRlLCBhbmQgdGhpcyBkaXJlY3RpdmUgd2lsbCBjcmVhdGUgYSBzZWFyY2hhYmxlLCBcbi8vIHN5bmNocm9uaXplZCBkYXRhIHZpZXcgb2YgdGhhdCBjb2xsZWN0aW9uLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb2xsZWN0aW9uJyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7IFxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICRzY29wZS5tb2RlbHMgPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgICRzY29wZS5zZWFyY2ggPSAnJztcbiAgICAgIFxuICAgICAgJHNjb3BlLmZvY3VzID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHNjb3BlLm1vZGVscy5mb2N1cyA9IGlkO1xuICAgICAgfTtcbiAgICAgICAgICAgICAgXG4gICAgICBjb25zb2xlLmxvZygkc2NvcGUubmFtZSwgJ2RpcmVjdGl2ZSBjb250cm9sbGVyJyk7XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odWlTdGF0ZSkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb25zb2xlJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHsgXG4gICAgICB2YXIgc2hvd2luZywgdWlLZXk7XG5cbiAgICAgIHVpS2V5ID0gJ2NvbnNvbGUtc3RhdGUnXG4gICAgICBzaG93aW5nID0gKHVpU3RhdGUubG9hZCh1aUtleSkgfHwgZmFsc2UpO1xuICAgICBcbiAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuIFxuICAgICAgZnVuY3Rpb24gY2hlY2tWaXNpYmlsaXR5KCkge1xuICAgICAgICBpZihzaG93aW5nKSB7XG4gICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfSBcbiAgICAgIH1cbiAgICAgICAgXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkgICB7XG4gICAgICAgIC8vIFRvZ2dsZSBvbiBgIGtleVxuICAgICAgICBpZihlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgICAgIHNob3dpbmcgPSAhc2hvd2luZztcbiAgICAgICAgICB1aVN0YXRlLnNhdmUodWlLZXksIHNob3dpbmcpO1xuICAgICAgICBcbiAgICAgICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiAgICAgICAgICAvLyBHaXZlIGZvY3VzIHRvIGlucHV0IFxuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICAgIC8vIFN0b3AgYCBiZWluZyBpbnNlcnRlZCBpbnRvIGNvbnNvbGVcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgYWRtaW5Tb2NrZXQpIHtcbiAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICBcbiAgICAgIGFkbWluU29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsVG9wID0gJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfTtcbiAgICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKHtcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIGFkbWluU29ja2V0LmVtaXQoJ21lc3NhZ2UnLCAkc2NvcGUuaW5wdXQpO1xuICAgICAgICAkc2NvcGUuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIlxuLy8gRWRpdG9yXG4vLyAtLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgdXBkYXRpbmcgYW5kIFxuLy8gbW9kaWZ5aW5nIGl0ZW1zIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG4vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9lZGl0b3InLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgY29uc29sZS5sb2coJ0VkaXRvcicpO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGNvbGxlY3Rpb247XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICBcbiAgICAgIC8vIEdldCB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBuYW1lIGZyb21cbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgYW5kIGJpbmQgaXQgdG9cbiAgICAgIC8vIHRoZSBzY29wZS4gXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgXG4gICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgXG4gICAgICAkc2NvcGUuc2VsZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtb2RlbHMgPSAkc2NvcGUuY29sbGVjdGlvbjtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG1vZGVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKG1vZGVscy5mb2N1cyA9PT0gbW9kZWxzW2ldLl9pZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZGVsc1tpXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge307XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZm9jdXMgPSAkc2NvcGUuc2VsZWN0aW9uKCk7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uLnVwZGF0ZShmb2N1cywgZm9jdXMpO1xuICAgICAgICAkc2NvcGUuc2F2aW5nID0gdHJ1ZTsgXG4gICAgICB9O1xuXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIlxuLy8gYWRtaW5Tb2NrZXQgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBhIHNvY2tldCB0aGF0J3MgY29ubmVjdGVkXG4vLyB0byB0aGUgYWRtaW4gY2hhbm5lbC5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgdmFyIGFkbWluU29ja2V0ID0gc29ja2V0KCdhZG1pbicpO1xuICBhZG1pblNvY2tldC5yZWFkeSA9IGZhbHNlO1xuICBcbiAgYWRtaW5Tb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgYWRtaW5Tb2NrZXQucmVhZHkgPSB0cnVlO1xuICB9KTtcbiAgXG4gIHJldHVybiBhZG1pblNvY2tldDtcbn07XG4iLCJcbi8vIGNvbGxlY3Rpb24gRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tIFxuXG4vLyBUaGUgY29sbGVjdGlvbiBmYWN0b3J5IGlzIHJlc3BvbnNpYmxlIGZvciBtYWludGFpbmdcbi8vIHRoZSBzdGF0ZSBhbmQgYSBtb2RpZmljYXRpb24gaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uc1xuLy8gZGVmaW5lZCBhdCB0aGUgc2VydmVyIHNpZGUuIFNlZSBgL3JvdXRlcy9jb2xsZWN0aW9uL2Bcbi8vIGZvciBtb3JlIGRldGFpbHMuXG5cbi8vIEFmdGVyIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhIG5hbWVcbi8vIHBhcmFtZXRlciwgdGhlIGFkbWluU29ja2V0IHdhaXRzIGZvciB0aGUgc2VydmVyJ3Ncbi8vIHJlYWR5IGV2ZW50LCBhbmQgdGhlbiBwcm9jZWVkcyB0byBsaXN0ZW4gdG8gdGhlIGV2ZW50c1xuLy8gKF9fY3JlYXRlX18sIF9fZ2V0X18sIF9fdXBkYXRlX18sIF9fcmVtb3ZlX18pIFxuLy8gZm9yIHRoYXQgbmFtZSBhbmQgY3JlYXRlcyBhIHNldCBvZiBtZXRob2RzIHRvIG1hbmlwdWxhdGUgXG4vLyB0aGUgZGF0YSBvdmVyIHRoZSBzb2NrZXQgY29ubmVjdGlvbi5cblxuLy8gRmluYWxseSwgYSBkeW5hbWljIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1vZGVsc1xuLy8gZnJvbSB0aGUgY29sbGVjdGlvbiBpcyByZXR1cm5lZCwgd2l0aCBjcmVhdGUsIHVwZGF0ZVxuLy8gYW5kIHJlbW92ZSBtZXRob2RzIHRhY2tlZCBvbiB0byBpdC4gVGhpcyBjYW4gYmUgdXNlZFxuLy8gYm91bmQgc3RyYWlnaHQgdG8gdGhlIERPTSBmcm9tIGNvbnRyb2xsZXJzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFkbWluU29ja2V0KSB7XG5cbiAgLy8gU3RvcmUgYWxsIGF2YWlsYWJsZSBjb2xsZWN0aW9ucyBpbiBoZXJlLlxuICB2YXIgY29sbGVjdGlvbnMgPSB7fTtcblxuXG4gIC8vIEZpbmQgYW5kIHJldHVybiBhIG1vZGVsIGZyb20gYSBjb2xsZWN0aW9uXG4gIC8vIGJhc2VkIG9uIHRoZSBfaWQgcHJvcGVydHkgb2YgdGhlIHF1ZXJ5IFxuICAvLyBvYmplY3QuIF8oUXVlcnkgb2JqZWN0IG5vcm1hbGx5IGNvbWVzIGZyb21cbiAgLy8gdGhlIGRhdGFiYXNlKV9cbiAgZnVuY3Rpb24gZmluZChjb2xsZWN0aW9uLCBxdWVyeSkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uW2ldLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihjb2xsZWN0aW9uW2ldLl9pZCA9PT0gcXVlcnkuX2lkKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2QgdG8gcHJvdmlkZSBjbGVhbiBsb29raW5nXG4gIC8vIG5hbWVzIGZvciBzb2NrZXQgZXZlbnRzXG4gIGZ1bmN0aW9uIGV2ZW50cyhuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogbmFtZSArICcvZ2V0JyxcbiAgICAgIGNyZWF0ZTogbmFtZSArICcvY3JlYXRlJyxcbiAgICAgIHJlbW92ZTogbmFtZSArICcvcmVtb3ZlJyxcbiAgICAgIHVwZGF0ZTogbmFtZSArICcvdXBkYXRlJ1xuICAgIH1cbiAgfVxuICBcbiAgXG4gIC8vIENyZWF0ZXMgaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uIHdpdGggdGhpcyBuYW1lXG4gIC8vIGFuZCByZXR1cm5zIGR5bmFtaWMgY29sbGVjdGlvbiBhcnJheSBhbG9uZ1xuICAvLyB3aXRoIGNvbGxlY3Rpb24gbWFuaXB1bGF0aW9uIG1ldGhvZHMuIFNlZVxuICAvLyBtb2R1bGUgZG9jIGNvbW1lbnQgZm9yIG1vcmUgZGV0YWlscy4gXG4gIGZ1bmN0aW9uIG1vZGVsKG5hbWUpIHtcbiAgICB2YXIgY29sbGVjdGlvbiwgc29ja2V0LCBldmVudDtcblxuICAgIC8vIGlmIHdlIGhhdmUgYWxyZWFkeSBsb2FkZWQgdGhpcyBjb2xsZWN0aW9uXG4gICAgaWYoY29sbGVjdGlvbnNbbmFtZV0pIHtcbiAgICAgIC8vcmV0dXJuIGl0IHN0cmFpZ2h0IGF3YXlcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkJywgbmFtZSk7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbnNbbmFtZV07XG4gICAgfVxuXG4gICAgLy8gYWxpYXNpbmdcbiAgICBzb2NrZXQgPSBhZG1pblNvY2tldDtcbiAgICBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNbbmFtZV0gPSBbXTtcbiAgICBldmVudCA9IGV2ZW50cyhuYW1lKTtcblxuICAgIGlmKHNvY2tldC5yZWFkeSkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vICMjIFNvY2tldCBFdmVudHNcblxuICAgIHNvY2tldC5vbihldmVudC5nZXQsIGZ1bmN0aW9uKG1vZGVscykge1xuICAgICAgY29sbGVjdGlvbi5sZW5ndGggPSAwO1xuICAgICAgLy8gSSBiZWxpZXZlIHRoZXJlJ3Mgc29tZSBleHBsYWluaW5nIHRvIGRvIGhlcmUuXG4gICAgICBjb2xsZWN0aW9uLnB1c2guYXBwbHkoY29sbGVjdGlvbiwgbW9kZWxzLmRhdGEpO1xuICAgICAgY29sbGVjdGlvbi5mb2N1cyA9IGNvbGxlY3Rpb25bMF0uX2lkO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmNyZWF0ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGNvbGxlY3Rpb24ucHVzaChtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQucmVtb3ZlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgZGVsZXRlIGZpbmQoY29sbGVjdGlvbiwgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnVwZGF0ZSwgZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIC8vIENyZWF0ZSBzYWZlZ3VhcmQgd2l0aCBtb2RlbCBmb3IgZmluZCAtPiBudWxsXG4gICAgICAoZmluZChjb2xsZWN0aW9uLCBtb2RlbCkgfHwgbW9kZWwpID0gdXBkYXRlZDtcbiAgICB9KTtcblxuICAgIC8vICMjIEV4cG9zZWQgbWV0aG9kcyAgXG4gIFxuICAgIGNvbGxlY3Rpb24uY3JlYXRlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmNyZWF0ZSwgbW9kZWwpO1xuICAgIH07XG4gICAgXG4gICAgY29sbGVjdGlvbi5yZW1vdmUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQucmVtb3ZlLCBtb2RlbCk7XG4gICAgfTtcblxuICAgIGNvbGxlY3Rpb24udXBkYXRlID0gZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnVwZGF0ZSwgbW9kZWwsIHVwZGF0ZWQpO1xuICAgIH07IFxuICAgIFxuICAgIC8vIFJldmVhbCB0aGUgbmFtZSBvZiB0aGlzIGNvbGxlY3Rpb25cbiAgICBjb2xsZWN0aW9uLm5hbWUgPSBuYW1lO1xuICAgIFxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgcmV0dXJuIG1vZGVsO1xufTtcbiIsIlxuLy8gU29ja2V0IFdyYXBwZXJcbi8vIC0tLS0tLS0tLS0tLS0tXG5cbi8vIEFjdHMgYXMgYSB3cmFwcGVyIGFyb3VuZCBzb2NrZXRGYWN0b3J5XG4vLyBhbmQgZXhwb3NlcyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBjcmVhdGVcbi8vIG5hbWVzcGFjZWQgc29ja2V0cywgYmFzZWQgb24gYSBwYXJhbWV0ZXIuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0RmFjdG9yeSkge1xuICByZXR1cm4gZnVuY3Rpb24obmFtZXNwYWNlKSB7XG4gICAgdmFyIGNvbm5lY3RVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwLycgKyBuYW1lc3BhY2U7XG4gICAgcmV0dXJuIHNvY2tldEZhY3Rvcnkoe1xuICAgICAgaW9Tb2NrZXQ6IGlvLmNvbm5lY3QoY29ubmVjdFVybClcbiAgICB9KTtcbiAgfVxufTtcbiIsIlxuLy8gU3RvcmFnZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgbG9jYWxTdG9yYWdlIHN1cHBvcnQgd2l0aCBhIGNvb2tpZVxuLy8gYmFzZWQgZmFsbGJhY2suIFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FjaGUsIHN0b3JhZ2UsIGlkO1xuICBcbiAgaWQgPSAnYXVkaW8tZHJvcC1zdG9yYWdlJztcbiAgc3RvcmFnZSA9IHdoaWNoKCk7XG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGljaCB0eXBlIG9mIHN0b3JhZ2VcbiAgLy8gaXMgYXZhaWxhYmxlIGFuZCByZXR1cm5zIGEgalF1ZXJ5XG4gIC8vIHN0eWxlIGdldHRlci9zZXR0ZXIgZm9yIGl0J3MgdmFsdWUuXG4gIGZ1bmN0aW9uIHdoaWNoKCkge1xuICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2VbaWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZVtpZF0gPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jb29raWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIExvYWQgdGhlIGNvbnRlbnRzIGZyb20gd2hpY2hldmVyXG4gIC8vIHN0b3JhZ2UgaXMgYXZhaWFibGUuIElmIEpTT04gcGFyc2VcbiAgLy8gdGhyb3dzIGFuIGV4Y2VwdGlvbiwgdGhlbiB0aGUgdmFsdWVcbiAgLy8gd2FzIHVuZGVmaW5lZCwgc28gaW5zdGVhZCBjYWNoZSBhblxuICAvLyBlbXB0eSBvYmplY3QuXG4gIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNhY2hlID0gSlNPTi5wYXJzZShzdG9yYWdlKCkpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgY2FjaGUgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlO1xuICB9XG5cbiAgLy8gU2F2ZSB0aGUgY29udGVudHMgb2YgdGhlIGNhY2hlXG4gIC8vIGludG8gc3RvcmFnZVxuICBmdW5jdGlvbiBzYXZlKCkge1xuICAgIHN0b3JhZ2UoSlNPTi5zdHJpbmdpZnkoY2FjaGUpKTtcbiAgfVxuXG4gIC8vIFNldCBhIHZhbHVlIHdpdGhpbiB0aGUgY2FjaGVcbiAgLy8gYmFzZWQgb24gYSBrZXkgYW5kIHRoZW4gc2F2ZSBpdC5cbiAgZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICBjYWNoZVtrZXldID0gdmFsdWU7XG4gICAgc2F2ZSgpO1xuICB9XG5cbiAgLy8gR2V0IGEgdmFsdWUgZnJvbSB0aGUgY2FjaGVcbiAgZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIHJldHVybiBjYWNoZVtrZXldO1xuICB9IFxuXG4gIC8vIEV4cG9zZSBnZXQgYW5kIHNldCBtZXRob2RzXG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXQsXG4gICAgc2V0OiBzZXRcbiAgfVxufTtcbiIsIi8vIHVpU3RhdGUgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEEgdGlueSBmYWN0b3J5IGZvciBtYWludGFpbmluZyB0aGVcbi8vIHN0YXRlIG9mIHRoZSBVSSBhdCBhbnkgdGltZS4gVGhlIG5hbWVcbi8vIG9mIHRoZSB1aSBpbiBxdWVzdGlvbiBzaG91bGQgYmUgcGFzc2VkXG4vLyB0byB0aGUgc2F2ZSBtZXRob2QgdG8gcGVyc2lzdCBpdC5cblxuLy8gVGhlIHN0YXRlIGNhbiB0aGVuIGJlIHJlbG9hZGVkIGF0IGFueVxuLy8gdGltZSBpbiB0aGUgZnV0dXJlLlxuXG4vLyBfX0ltcG9ydGFudF9fIFRoaXMgZG9lcyBub3QgY2hhbmdlXG4vLyB0aGUgRE9NIF9fYXQgYWxsX18uIEl0IGp1c3Qgc2F2ZXNcbi8vIGEgSlNPTiBvYmplY3Qgd2hpY2ggY2FuIHRoZW4gYmUgdXNlZFxuLy8gd2l0aCBhbmd1bGFyIHRvIG9wdGlvbmFsbHkgc2hvdy9oaWRlXG4vLyBvciBhcHBseSBjbGFzc2VzIHRvIHVpIGVsZW1lbnRzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0b3JhZ2UpIHtcbiAgcmV0dXJuIHtcbiAgICBzYXZlOiBmdW5jdGlvbih1aSwgc3RhdGUpIHtcbiAgICAgIHN0b3JhZ2Uuc2V0KHVpLCBzdGF0ZSk7ICBcbiAgICB9LFxuICAgIGxvYWQ6IGZ1bmN0aW9uKHVpKSB7XG4gICAgICByZXR1cm4gc3RvcmFnZS5nZXQodWkpO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==
