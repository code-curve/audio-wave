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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zdG9yYWdlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy91aVN0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEFkbWluXG4vLyAtLS0tLVxuXG4vLyBUaGUgYWRtaW4gYXBwbGljYXRpb24gaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmdcbi8vIHRyYWNrIG9mIGFsbCBzZXNzaW9ucywgZGV2aWNlcywgYXVkaW8gZmlsZXMgYW5kXG4vLyBjb21wb3NlZCBzb25ncy5cbi8vIFxuLy8gSXQgYWxzbyBwcm92aWRlcyBhIGNvbnNvbGUgZm9yIHRhbGtpbmcgdG8gdGhlXG4vLyBzZXJ2ZXIgYW5kIHRoZSBjb21wb3NlIGludGVyZmFjZSBmb3IgY3JlYXRpbmdcbi8vIHNvbmcgZmlsZXMgZnJvbSB0aGUgYXZhaWxhYmxlIGF1ZGlvIGZpbGVzLlxuLy9cblxuYW5ndWxhci5tb2R1bGUoJ2FkbWluJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nXSkuXG5cbmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlci5cbiAgd2hlbignL3Nlc3Npb25zJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3Nlc3Npb25zJyxcbiAgICBjb250cm9sbGVyOiAnU2Vzc2lvbnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2F1ZGlvJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2F1ZGlvJyxcbiAgICBjb250cm9sbGVyOiAnQXVkaW9Db250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL3VzZXJzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3VzZXJzJyxcbiAgICBjb250cm9sbGVyOiAnVXNlcnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2NvbXBvc2UnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY29tcG9zZScsXG4gICAgY29udHJvbGxlcjogJ0NvbXBvc2VDb250cm9sbGVyJ1xuICB9KS5cbiAgb3RoZXJ3aXNlKHtcbiAgICByZWRpcmVjdFRvOiAnL3Nlc3Npb25zJ1xuICB9KTtcbn0pLlxuXG4vLyBDb250cm9sbGVyc1xuLy8gLS0tLS0tLS0tLS1cblxuY29udHJvbGxlcih7XG4gIC8vIE1hbmFnZSBkZXZpY2VzIGluIHNlc3Npb25zXG4gICdTZXNzaW9uc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlcicpLFxuICAvLyBDb21wb3NpdGlvbiBvZiBzb25nIGZpbGVzXG4gICdDb21wb3NlQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXInKSxcbiAgLy8gTWFuYWdlIGFkbWluaXN0cmF0b3JzIGFuZCByZWdpc3RlcmVkIHVzZXJzXG4gICdVc2Vyc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1VzZXJzQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgdXBsb2FkZWQgYXVkaW8gdHJhY2tzXG4gICdBdWRpb0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlcicpXG59KS5cblxuLy8gRGlyZWN0aXZlc1xuLy8gLS0tLS0tLS0tLVxuXG5kaXJlY3RpdmUoe1xuICAvLyBJbnRlcmZhY2UgZm9yIGVkaXRpbmcgY29sbGVjdGlvbnNcbiAgJ2VkaXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9lZGl0b3InKSxcbiAgLy8gQ29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbiAgJ2NvbnNvbGUnOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29uc29sZScpLFxuICAvLyBTZWFyY2hhYmxlIGNvbGxlY3Rpb24gaW50ZXJmYWNlIFxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJylcbn0pLlxuXG5cbi8vIFNlcnZpY2VzXG4vLyAtLS0tLS0tLVxuXG5mYWN0b3J5KHtcbiAgLy8gTG9jYWxzdG9yYWdlICsgY29va2llIHNoaW1cbiAgJ3N0b3JhZ2UnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3N0b3JhZ2UnKSxcbiAgLy8gTWFpbnRhaW4gc3RhdGUgb2YgdWlcbiAgJ3VpU3RhdGUnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3VpU3RhdGUnKSxcbiAgLy8gV2ViIHNvY2tldCB3cmFwcGVyXG4gICdzb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpLFxuICAvLyBTb2NrZXQgY29ubmVjdCB0byBhZG1pbiBjaGFubmVsXG4gICdhZG1pblNvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvYWRtaW5Tb2NrZXQnKSxcbiAgLy8gQ29sbGVjdGlvbiBtYWludGFpbmVyXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb2xsZWN0aW9uJylcbn0pO1xuIiwiLyoqXG4gKiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG5cbn07XG4iLCJcbi8vIENvbGxlY3Rpb24gZGlyZWN0aXZlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBZGQgdGhlIGF0dHJpYnV0ZSBjb2xsZWN0aW9uIHRvIGFuIGVsZW1lbnQgYW5kIFxuLy8gc3BlY2lmeSB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBpbiBhICdjb2xsZWN0aW9uLW5hbWUnIFxuLy8gYXR0cmlidXRlLCBhbmQgdGhpcyBkaXJlY3RpdmUgd2lsbCBjcmVhdGUgYSBzZWFyY2hhYmxlLCBcbi8vIHN5bmNocm9uaXplZCBkYXRhIHZpZXcgb2YgdGhhdCBjb2xsZWN0aW9uLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb2xsZWN0aW9uJyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7IFxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICRzY29wZS5tb2RlbHMgPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgICRzY29wZS5zZWFyY2ggPSAnJztcbiAgICAgIFxuICAgICAgJHNjb3BlLmZvY3VzID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHNjb3BlLm1vZGVscy5mb2N1cyA9IGlkO1xuICAgICAgfTtcbiAgICAgICAgICAgICAgXG4gICAgICBjb25zb2xlLmxvZygkc2NvcGUubmFtZSwgJ2RpcmVjdGl2ZSBjb250cm9sbGVyJyk7XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odWlTdGF0ZSkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb25zb2xlJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHsgXG4gICAgICB2YXIgc2hvd2luZywgdWlLZXk7XG5cbiAgICAgIHVpS2V5ID0gJ2NvbnNvbGUtc3RhdGUnXG4gICAgICBzaG93aW5nID0gKHVpU3RhdGUubG9hZCh1aUtleSkgfHwgZmFsc2UpO1xuICAgICBcbiAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuIFxuICAgICAgZnVuY3Rpb24gY2hlY2tWaXNpYmlsaXR5KCkge1xuICAgICAgICBpZihzaG93aW5nKSB7XG4gICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfSBcbiAgICAgIH1cbiAgICAgICAgXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkgICB7XG4gICAgICAgIC8vIFRvZ2dsZSBvbiBgIGtleVxuICAgICAgICBpZihlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgICAgIHNob3dpbmcgPSAhc2hvd2luZztcbiAgICAgICAgICB1aVN0YXRlLnNhdmUodWlLZXksIHNob3dpbmcpO1xuICAgICAgICBcbiAgICAgICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiAgICAgICAgICAvLyBHaXZlIGZvY3VzIHRvIGlucHV0IFxuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICAgIC8vIFN0b3AgYCBiZWluZyBpbnNlcnRlZCBpbnRvIGNvbnNvbGVcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgYWRtaW5Tb2NrZXQpIHtcbiAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICBcbiAgICAgIGFkbWluU29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsVG9wID0gJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfTtcbiAgICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKHtcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIGFkbWluU29ja2V0LmVtaXQoJ21lc3NhZ2UnLCAkc2NvcGUuaW5wdXQpO1xuICAgICAgICAkc2NvcGUuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIlxuLy8gRWRpdG9yXG4vLyAtLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgdXBkYXRpbmcgYW5kIFxuLy8gbW9kaWZ5aW5nIGl0ZW1zIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG4vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9lZGl0b3InLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgY29uc29sZS5sb2coJ0VkaXRvcicpO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGNvbGxlY3Rpb247XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICBcbiAgICAgIC8vIEdldCB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBuYW1lIGZyb21cbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgYW5kIGJpbmQgaXQgdG9cbiAgICAgIC8vIHRoZSBzY29wZS4gXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJcbi8vIGFkbWluU29ja2V0IEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgYSBzb2NrZXQgdGhhdCdzIGNvbm5lY3RlZFxuLy8gdG8gdGhlIGFkbWluIGNoYW5uZWwuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0KSB7XG4gIHZhciBhZG1pblNvY2tldCA9IHNvY2tldCgnYWRtaW4nKTtcbiAgYWRtaW5Tb2NrZXQucmVhZHkgPSBmYWxzZTtcbiAgXG4gIGFkbWluU29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgIGFkbWluU29ja2V0LnJlYWR5ID0gdHJ1ZTtcbiAgfSk7XG4gIFxuICByZXR1cm4gYWRtaW5Tb2NrZXQ7XG59O1xuIiwiXG4vLyBjb2xsZWN0aW9uIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLSBcblxuLy8gVGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBpcyByZXNwb25zaWJsZSBmb3IgbWFpbnRhaW5nXG4vLyB0aGUgc3RhdGUgYW5kIGEgbW9kaWZpY2F0aW9uIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbnNcbi8vIGRlZmluZWQgYXQgdGhlIHNlcnZlciBzaWRlLiBTZWUgYC9yb3V0ZXMvY29sbGVjdGlvbi9gXG4vLyBmb3IgbW9yZSBkZXRhaWxzLlxuXG4vLyBBZnRlciB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggYSBuYW1lXG4vLyBwYXJhbWV0ZXIsIHRoZSBhZG1pblNvY2tldCB3YWl0cyBmb3IgdGhlIHNlcnZlcidzXG4vLyByZWFkeSBldmVudCwgYW5kIHRoZW4gcHJvY2VlZHMgdG8gbGlzdGVuIHRvIHRoZSBldmVudHNcbi8vIChfX2NyZWF0ZV9fLCBfX2dldF9fLCBfX3VwZGF0ZV9fLCBfX3JlbW92ZV9fKSBcbi8vIGZvciB0aGF0IG5hbWUgYW5kIGNyZWF0ZXMgYSBzZXQgb2YgbWV0aG9kcyB0byBtYW5pcHVsYXRlIFxuLy8gdGhlIGRhdGEgb3ZlciB0aGUgc29ja2V0IGNvbm5lY3Rpb24uXG5cbi8vIEZpbmFsbHksIGEgZHluYW1pYyBhcnJheSBjb250YWluaW5nIHRoZSBtb2RlbHNcbi8vIGZyb20gdGhlIGNvbGxlY3Rpb24gaXMgcmV0dXJuZWQsIHdpdGggY3JlYXRlLCB1cGRhdGVcbi8vIGFuZCByZW1vdmUgbWV0aG9kcyB0YWNrZWQgb24gdG8gaXQuIFRoaXMgY2FuIGJlIHVzZWRcbi8vIGJvdW5kIHN0cmFpZ2h0IHRvIHRoZSBET00gZnJvbSBjb250cm9sbGVycy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhZG1pblNvY2tldCkge1xuXG4gIC8vIFN0b3JlIGFsbCBhdmFpbGFibGUgY29sbGVjdGlvbnMgaW4gaGVyZS5cbiAgdmFyIGNvbGxlY3Rpb25zID0ge307XG5cblxuICAvLyBGaW5kIGFuZCByZXR1cm4gYSBtb2RlbCBmcm9tIGEgY29sbGVjdGlvblxuICAvLyBiYXNlZCBvbiB0aGUgX2lkIHByb3BlcnR5IG9mIHRoZSBxdWVyeSBcbiAgLy8gb2JqZWN0LiBfKFF1ZXJ5IG9iamVjdCBub3JtYWxseSBjb21lcyBmcm9tXG4gIC8vIHRoZSBkYXRhYmFzZSlfXG4gIGZ1bmN0aW9uIGZpbmQoY29sbGVjdGlvbiwgcXVlcnkpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbltpXS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kIHRvIHByb3ZpZGUgY2xlYW4gbG9va2luZ1xuICAvLyBuYW1lcyBmb3Igc29ja2V0IGV2ZW50c1xuICBmdW5jdGlvbiBldmVudHMobmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IG5hbWUgKyAnL2dldCcsXG4gICAgICBjcmVhdGU6IG5hbWUgKyAnL2NyZWF0ZScsXG4gICAgICByZW1vdmU6IG5hbWUgKyAnL3JlbW92ZScsXG4gICAgICB1cGRhdGU6IG5hbWUgKyAnL3VwZGF0ZSdcbiAgICB9XG4gIH1cbiAgXG4gIFxuICAvLyBDcmVhdGVzIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbiB3aXRoIHRoaXMgbmFtZVxuICAvLyBhbmQgcmV0dXJucyBkeW5hbWljIGNvbGxlY3Rpb24gYXJyYXkgYWxvbmdcbiAgLy8gd2l0aCBjb2xsZWN0aW9uIG1hbmlwdWxhdGlvbiBtZXRob2RzLiBTZWVcbiAgLy8gbW9kdWxlIGRvYyBjb21tZW50IGZvciBtb3JlIGRldGFpbHMuIFxuICBmdW5jdGlvbiBtb2RlbChuYW1lKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIHNvY2tldCwgZXZlbnQ7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoaXMgY29sbGVjdGlvblxuICAgIGlmKGNvbGxlY3Rpb25zW25hbWVdKSB7XG4gICAgICAvL3JldHVybiBpdCBzdHJhaWdodCBhd2F5XG4gICAgICBjb25zb2xlLmxvZygnbG9hZCcsIG5hbWUpO1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdjcmVhdGUnLCBuYW1lLCAnY29sbGVjdGlvbiBmYWN0b3J5Jyk7XG4gICAgXG4gICAgLy8gYWxpYXNpbmdcbiAgICBzb2NrZXQgPSBhZG1pblNvY2tldDtcbiAgICBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNbbmFtZV0gPSBbXTtcbiAgICBldmVudCA9IGV2ZW50cyhuYW1lKTtcblxuICAgIGlmKHNvY2tldC5yZWFkeSkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vICMjIFNvY2tldCBFdmVudHNcblxuICAgIHNvY2tldC5vbihldmVudC5nZXQsIGZ1bmN0aW9uKG1vZGVscykge1xuICAgICAgY29uc29sZS5sb2coJ0dFVCBjb2xsZWN0aW9uIGRhdGEnKTtcbiAgICAgIGNvbGxlY3Rpb24ubGVuZ3RoID0gMDtcbiAgICAgIC8vIEkgYmVsaWV2ZSB0aGVyZSdzIHNvbWUgZXhwbGFpbmluZyB0byBkbyBoZXJlLlxuICAgICAgY29sbGVjdGlvbi5wdXNoLmFwcGx5KGNvbGxlY3Rpb24sIG1vZGVscy5kYXRhKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC5jcmVhdGUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBjb2xsZWN0aW9uLnB1c2gobW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnJlbW92ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGRlbGV0ZSBmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC51cGRhdGUsIGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICAvLyBDcmVhdGUgc2FmZWd1YXJkIHdpdGggbW9kZWwgZm9yIGZpbmQgLT4gbnVsbFxuICAgICAgKGZpbmQoY29sbGVjdGlvbiwgbW9kZWwpIHx8IG1vZGVsKSA9IHVwZGF0ZWQ7XG4gICAgfSk7XG5cbiAgICAvLyAjIyBFeHBvc2VkIG1ldGhvZHMgIFxuICBcbiAgICBjb2xsZWN0aW9uLmNyZWF0ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5jcmVhdGUsIG1vZGVsKTtcbiAgICB9O1xuICAgIFxuICAgIGNvbGxlY3Rpb24ucmVtb3ZlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnJlbW92ZSwgbW9kZWwpO1xuICAgIH07XG5cbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSA9IGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC51cGRhdGUsIG1vZGVsLCB1cGRhdGVkKTtcbiAgICB9OyBcbiAgICBcbiAgICAvLyBSZXZlYWwgdGhlIG5hbWUgb2YgdGhpcyBjb2xsZWN0aW9uXG4gICAgY29sbGVjdGlvbi5uYW1lID0gbmFtZTtcbiAgICBcbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBtb2RlbDtcbn07XG4iLCJcbi8vIFNvY2tldCBXcmFwcGVyXG4vLyAtLS0tLS0tLS0tLS0tLVxuXG4vLyBBY3RzIGFzIGEgd3JhcHBlciBhcm91bmQgc29ja2V0RmFjdG9yeVxuLy8gYW5kIGV4cG9zZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgY3JlYXRlXG4vLyBuYW1lc3BhY2VkIHNvY2tldHMsIGJhc2VkIG9uIGEgcGFyYW1ldGVyLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iLCJcbi8vIFN0b3JhZ2UgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGxvY2FsU3RvcmFnZSBzdXBwb3J0IHdpdGggYSBjb29raWVcbi8vIGJhc2VkIGZhbGxiYWNrLiBcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNhY2hlLCBzdG9yYWdlLCBpZDtcbiAgXG4gIGlkID0gJ2F1ZGlvLWRyb3Atc3RvcmFnZSc7XG4gIHN0b3JhZ2UgPSB3aGljaCgpO1xuXG4gIC8vIERldGVybWluZXMgd2hpY2ggdHlwZSBvZiBzdG9yYWdlXG4gIC8vIGlzIGF2YWlsYWJsZSBhbmQgcmV0dXJucyBhIGpRdWVyeVxuICAvLyBzdHlsZSBnZXR0ZXIvc2V0dGVyIGZvciBpdCdzIHZhbHVlLlxuICBmdW5jdGlvbiB3aGljaCgpIHtcbiAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlW2lkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2VbaWRdID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBMb2FkIHRoZSBjb250ZW50cyBmcm9tIHdoaWNoZXZlclxuICAvLyBzdG9yYWdlIGlzIGF2YWlhYmxlLiBJZiBKU09OIHBhcnNlXG4gIC8vIHRocm93cyBhbiBleGNlcHRpb24sIHRoZW4gdGhlIHZhbHVlXG4gIC8vIHdhcyB1bmRlZmluZWQsIHNvIGluc3RlYWQgY2FjaGUgYW5cbiAgLy8gZW1wdHkgb2JqZWN0LlxuICBmdW5jdGlvbiBsb2FkKCkge1xuICAgIHRyeSB7XG4gICAgICBjYWNoZSA9IEpTT04ucGFyc2Uoc3RvcmFnZSgpKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGNhY2hlID0ge307XG4gICAgfVxuICAgIHJldHVybiBjYWNoZTtcbiAgfVxuXG4gIC8vIFNhdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjYWNoZVxuICAvLyBpbnRvIHN0b3JhZ2VcbiAgZnVuY3Rpb24gc2F2ZSgpIHtcbiAgICBzdG9yYWdlKEpTT04uc3RyaW5naWZ5KGNhY2hlKSk7XG4gIH1cblxuICAvLyBTZXQgYSB2YWx1ZSB3aXRoaW4gdGhlIGNhY2hlXG4gIC8vIGJhc2VkIG9uIGEga2V5IGFuZCB0aGVuIHNhdmUgaXQuXG4gIGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgY2FjaGVba2V5XSA9IHZhbHVlO1xuICAgIHNhdmUoKTtcbiAgfVxuXG4gIC8vIEdldCBhIHZhbHVlIGZyb20gdGhlIGNhY2hlXG4gIGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgfSBcblxuICAvLyBFeHBvc2UgZ2V0IGFuZCBzZXQgbWV0aG9kc1xuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0XG4gIH1cbn07XG4iLCIvLyB1aVN0YXRlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBIHRpbnkgZmFjdG9yeSBmb3IgbWFpbnRhaW5pbmcgdGhlXG4vLyBzdGF0ZSBvZiB0aGUgVUkgYXQgYW55IHRpbWUuIFRoZSBuYW1lXG4vLyBvZiB0aGUgdWkgaW4gcXVlc3Rpb24gc2hvdWxkIGJlIHBhc3NlZFxuLy8gdG8gdGhlIHNhdmUgbWV0aG9kIHRvIHBlcnNpc3QgaXQuXG5cbi8vIFRoZSBzdGF0ZSBjYW4gdGhlbiBiZSByZWxvYWRlZCBhdCBhbnlcbi8vIHRpbWUgaW4gdGhlIGZ1dHVyZS5cblxuLy8gX19JbXBvcnRhbnRfXyBUaGlzIGRvZXMgbm90IGNoYW5nZVxuLy8gdGhlIERPTSBfX2F0IGFsbF9fLiBJdCBqdXN0IHNhdmVzXG4vLyBhIEpTT04gb2JqZWN0IHdoaWNoIGNhbiB0aGVuIGJlIHVzZWRcbi8vIHdpdGggYW5ndWxhciB0byBvcHRpb25hbGx5IHNob3cvaGlkZVxuLy8gb3IgYXBwbHkgY2xhc3NlcyB0byB1aSBlbGVtZW50cy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdG9yYWdlKSB7XG4gIHJldHVybiB7XG4gICAgc2F2ZTogZnVuY3Rpb24odWksIHN0YXRlKSB7XG4gICAgICBzdG9yYWdlLnNldCh1aSwgc3RhdGUpOyAgXG4gICAgfSxcbiAgICBsb2FkOiBmdW5jdGlvbih1aSkge1xuICAgICAgcmV0dXJuIHN0b3JhZ2UuZ2V0KHVpKTtcbiAgICB9XG4gIH1cbn07XG4iXX0=
