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
    controller: 'SessionController'
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
  'SessisionsController': require('./controllers/SessionsController'),
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
    link: function(scope, element, attrs) {
             
    },
    controller: function($scope, $element, collection) { 
      $scope.name = $element.attr('collection-name');
      $scope.models = collection($scope.name);
      $scope.search = '';
      console.log($scope.models);
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
        // toggle on ` key
        if(e.keyCode === 192) {
          showing = !showing;
          uiState.save(uiKey, showing);
        
          checkVisibility();
          // give focus to input 
          element.find('input')[0].focus();
          // stop ` being inserted
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
    link: function(scope, element, attrs) {
      console.log('Editor');  
    },
    controller: function($scope, $element, collection) {
      var collection;
      $scope.name = $element.attr('collection-name');
      // Overwrite collection to prevent it 
      // from being used again
      collection = collection($scope.name);
      $scope.collection = collection;
    }
  }  
};


},{}],9:[function(require,module,exports){

// adminSocket Factory
// -------------------

// Provides a socket that's connected
// to the admin channel.

module.exports = function(socket) {
  return socket('admin');
};

},{}],10:[function(require,module,exports){

// collection Factory
// ------------------ 

// The collection factory is responsible for maintaing
// the state and a modification interface for collections
// defined at the server side. See `/routes/collection/`
// for more details.

// After the returned function is called with a name
// parameter, the adminSocket waits for the servers
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

  
  // Has this socket recieved ready signal?
  var ready = false;

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

    console.log('create', name);
    
    // aliasing
    socket = adminSocket;
    collection = collections[name] = [];
    event = events(name);

    if(!ready) {
      console.log('wait to be ready'); 
      socket.on('ready', function() {
        console.log('socket ready');
        socket.emit(event.get);
        ready = true;
      });
    } else {
      console.log(event.get);
      socket.emit(event.get);
    }
    
    // ## Socket Events

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
    
    if(name === 'admins') {
      window.collection = collection;
    }

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zdG9yYWdlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy91aVN0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBZG1pblxuLy8gLS0tLS1cblxuLy8gVGhlIGFkbWluIGFwcGxpY2F0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nXG4vLyB0cmFjayBvZiBhbGwgc2Vzc2lvbnMsIGRldmljZXMsIGF1ZGlvIGZpbGVzIGFuZFxuLy8gY29tcG9zZWQgc29uZ3MuXG4vLyBcbi8vIEl0IGFsc28gcHJvdmlkZXMgYSBjb25zb2xlIGZvciB0YWxraW5nIHRvIHRoZVxuLy8gc2VydmVyIGFuZCB0aGUgY29tcG9zZSBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nXG4vLyBzb25nIGZpbGVzIGZyb20gdGhlIGF2YWlsYWJsZSBhdWRpbyBmaWxlcy5cbi8vXG5cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbicsIFsnbmdSb3V0ZScsICdidGZvcmQuc29ja2V0LWlvJ10pLlxuXG5jb25maWcoZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcbiAgJHJvdXRlUHJvdmlkZXIuXG4gIHdoZW4oJy9zZXNzaW9ucycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9zZXNzaW9ucycsXG4gICAgY29udHJvbGxlcjogJ1Nlc3Npb25Db250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2F1ZGlvJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2F1ZGlvJyxcbiAgICBjb250cm9sbGVyOiAnQXVkaW9Db250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL3VzZXJzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3VzZXJzJyxcbiAgICBjb250cm9sbGVyOiAnVXNlcnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2NvbXBvc2UnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY29tcG9zZScsXG4gICAgY29udHJvbGxlcjogJ0NvbXBvc2VDb250cm9sbGVyJ1xuICB9KS5cbiAgb3RoZXJ3aXNlKHtcbiAgICByZWRpcmVjdFRvOiAnL3Nlc3Npb25zJ1xuICB9KTtcbn0pLlxuXG4vLyBDb250cm9sbGVyc1xuLy8gLS0tLS0tLS0tLS1cblxuY29udHJvbGxlcih7XG4gIC8vIE1hbmFnZSBkZXZpY2VzIGluIHNlc3Npb25zXG4gICdTZXNzaXNpb25zQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyJyksXG4gIC8vIENvbXBvc2l0aW9uIG9mIHNvbmcgZmlsZXNcbiAgJ0NvbXBvc2VDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgYWRtaW5pc3RyYXRvcnMgYW5kIHJlZ2lzdGVyZWQgdXNlcnNcbiAgJ1VzZXJzQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvVXNlcnNDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSB1cGxvYWRlZCBhdWRpbyB0cmFja3NcbiAgJ0F1ZGlvQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyJylcbn0pLlxuXG4vLyBEaXJlY3RpdmVzXG4vLyAtLS0tLS0tLS0tXG5cbmRpcmVjdGl2ZSh7XG4gIC8vIEludGVyZmFjZSBmb3IgZWRpdGluZyBjb2xsZWN0aW9uc1xuICAnZWRpdG9yJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2VkaXRvcicpLFxuICAvLyBDb25zb2xlIGZvciBzZXJ2ZXIgY29tbXVuaWNhdGlvblxuICAnY29uc29sZSc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb25zb2xlJyksXG4gIC8vIFNlYXJjaGFibGUgY29sbGVjdGlvbiBpbnRlcmZhY2UgXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbGxlY3Rpb24nKVxufSkuXG5cblxuLy8gU2VydmljZXNcbi8vIC0tLS0tLS0tXG5cbmZhY3Rvcnkoe1xuICAvLyBMb2NhbHN0b3JhZ2UgKyBjb29raWUgc2hpbVxuICAnc3RvcmFnZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvc3RvcmFnZScpLFxuICAvLyBNYWludGFpbiBzdGF0ZSBvZiB1aVxuICAndWlTdGF0ZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvdWlTdGF0ZScpLFxuICAvLyBXZWIgc29ja2V0IHdyYXBwZXJcbiAgJ3NvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvc29ja2V0JyksXG4gIC8vIFNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbiAgJ2FkbWluU29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpLFxuICAvLyBDb2xsZWN0aW9uIG1haW50YWluZXJcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL3NlcnZpY2VzL2NvbGxlY3Rpb24nKVxufSk7XG4iLCIvKipcbiAqIFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiAgXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcblxufTtcbiIsIlxuLy8gQ29sbGVjdGlvbiBkaXJlY3RpdmVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEFkZCB0aGUgYXR0cmlidXRlIGNvbGxlY3Rpb24gdG8gYW4gZWxlbWVudCBhbmQgXG4vLyBzcGVjaWZ5IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGluIGEgJ2NvbGxlY3Rpb24tbmFtZScgXG4vLyBhdHRyaWJ1dGUsIGFuZCB0aGlzIGRpcmVjdGl2ZSB3aWxsIGNyZWF0ZSBhIHNlYXJjaGFibGUsIFxuLy8gc3luY2hyb25pemVkIGRhdGEgdmlldyBvZiB0aGF0IGNvbGxlY3Rpb24uXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbGxlY3Rpb24nLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgIFxuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikgeyBcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAkc2NvcGUubW9kZWxzID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAkc2NvcGUuc2VhcmNoID0gJyc7XG4gICAgICBjb25zb2xlLmxvZygkc2NvcGUubW9kZWxzKTtcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5uYW1lLCAnZGlyZWN0aXZlIGNvbnRyb2xsZXInKTtcbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1aVN0YXRlKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbnNvbGUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIHZhciBzaG93aW5nLCB1aUtleTtcblxuICAgICAgdWlLZXkgPSAnY29uc29sZS1zdGF0ZSdcbiAgICAgIHNob3dpbmcgPSAodWlTdGF0ZS5sb2FkKHVpS2V5KSB8fCBmYWxzZSk7XG4gICAgIFxuICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gXG4gICAgICBmdW5jdGlvbiBjaGVja1Zpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmKHNob3dpbmcpIHtcbiAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9IFxuICAgICAgfVxuICAgICAgICBcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSAgIHtcbiAgICAgICAgLy8gdG9nZ2xlIG9uIGAga2V5XG4gICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTkyKSB7XG4gICAgICAgICAgc2hvd2luZyA9ICFzaG93aW5nO1xuICAgICAgICAgIHVpU3RhdGUuc2F2ZSh1aUtleSwgc2hvd2luZyk7XG4gICAgICAgIFxuICAgICAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuICAgICAgICAgIC8vIGdpdmUgZm9jdXMgdG8gaW5wdXQgXG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgICAgLy8gc3RvcCBgIGJlaW5nIGluc2VydGVkXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGFkbWluU29ja2V0KSB7XG4gICAgICB2YXIgc29ja2V0O1xuXG4gICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuXG4gICAgICBhZG1pblNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJHNjb3BlLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmFkZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICRlbGVtZW50WzBdLnNjcm9sbFRvcCA9ICRlbGVtZW50WzBdLnNjcm9sbEhlaWdodFxuICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICAgIH07XG4gICAgICAgXG4gICAgICAkc2NvcGUuc2VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZSh7XG4gICAgICAgICAgYm9keTogJHNjb3BlLmlucHV0XG4gICAgICAgIH0pO1xuICAgICAgICBhZG1pblNvY2tldC5lbWl0KCdtZXNzYWdlJywgJHNjb3BlLmlucHV0KTtcbiAgICAgICAgJHNjb3BlLmNsZWFyKCk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbiAgXG4iLCJcbi8vIEVkaXRvclxuLy8gLS0tLS0tXG4gXG4vLyBQcm92aWRlcyBhbiBpbnRlcmZhY2UgZm9yIHVwZGF0aW5nIGFuZCBcbi8vIG1vZGlmeWluZyBpdGVtcyBmcm9tIGEgY29sbGVjdGlvbiBzZXJ2aWNlLlxuLy9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgY29uc29sZS5sb2coJ0VkaXRvcicpOyAgXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbjtcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAvLyBPdmVyd3JpdGUgY29sbGVjdGlvbiB0byBwcmV2ZW50IGl0IFxuICAgICAgLy8gZnJvbSBiZWluZyB1c2VkIGFnYWluXG4gICAgICBjb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIlxuLy8gYWRtaW5Tb2NrZXQgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBhIHNvY2tldCB0aGF0J3MgY29ubmVjdGVkXG4vLyB0byB0aGUgYWRtaW4gY2hhbm5lbC5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgcmV0dXJuIHNvY2tldCgnYWRtaW4nKTtcbn07XG4iLCJcbi8vIGNvbGxlY3Rpb24gRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tIFxuXG4vLyBUaGUgY29sbGVjdGlvbiBmYWN0b3J5IGlzIHJlc3BvbnNpYmxlIGZvciBtYWludGFpbmdcbi8vIHRoZSBzdGF0ZSBhbmQgYSBtb2RpZmljYXRpb24gaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uc1xuLy8gZGVmaW5lZCBhdCB0aGUgc2VydmVyIHNpZGUuIFNlZSBgL3JvdXRlcy9jb2xsZWN0aW9uL2Bcbi8vIGZvciBtb3JlIGRldGFpbHMuXG5cbi8vIEFmdGVyIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhIG5hbWVcbi8vIHBhcmFtZXRlciwgdGhlIGFkbWluU29ja2V0IHdhaXRzIGZvciB0aGUgc2VydmVyc1xuLy8gcmVhZHkgZXZlbnQsIGFuZCB0aGVuIHByb2NlZWRzIHRvIGxpc3RlbiB0byB0aGUgZXZlbnRzXG4vLyAoX19jcmVhdGVfXywgX19nZXRfXywgX191cGRhdGVfXywgX19yZW1vdmVfXykgXG4vLyBmb3IgdGhhdCBuYW1lIGFuZCBjcmVhdGVzIGEgc2V0IG9mIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSBcbi8vIHRoZSBkYXRhIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuXG4vLyBGaW5hbGx5LCBhIGR5bmFtaWMgYXJyYXkgY29udGFpbmluZyB0aGUgbW9kZWxzXG4vLyBmcm9tIHRoZSBjb2xsZWN0aW9uIGlzIHJldHVybmVkLCB3aXRoIGNyZWF0ZSwgdXBkYXRlXG4vLyBhbmQgcmVtb3ZlIG1ldGhvZHMgdGFja2VkIG9uIHRvIGl0LiBUaGlzIGNhbiBiZSB1c2VkXG4vLyBib3VuZCBzdHJhaWdodCB0byB0aGUgRE9NIGZyb20gY29udHJvbGxlcnMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcblxuICAvLyBTdG9yZSBhbGwgYXZhaWxhYmxlIGNvbGxlY3Rpb25zIGluIGhlcmUuXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9O1xuXG4gIFxuICAvLyBIYXMgdGhpcyBzb2NrZXQgcmVjaWV2ZWQgcmVhZHkgc2lnbmFsP1xuICB2YXIgcmVhZHkgPSBmYWxzZTtcblxuICAvLyBGaW5kIGFuZCByZXR1cm4gYSBtb2RlbCBmcm9tIGEgY29sbGVjdGlvblxuICAvLyBiYXNlZCBvbiB0aGUgX2lkIHByb3BlcnR5IG9mIHRoZSBxdWVyeSBcbiAgLy8gb2JqZWN0LiBfKFF1ZXJ5IG9iamVjdCBub3JtYWxseSBjb21lcyBmcm9tXG4gIC8vIHRoZSBkYXRhYmFzZSlfXG4gIGZ1bmN0aW9uIGZpbmQoY29sbGVjdGlvbiwgcXVlcnkpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbltpXS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kIHRvIHByb3ZpZGUgY2xlYW4gbG9va2luZ1xuICAvLyBuYW1lcyBmb3Igc29ja2V0IGV2ZW50c1xuICBmdW5jdGlvbiBldmVudHMobmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IG5hbWUgKyAnL2dldCcsXG4gICAgICBjcmVhdGU6IG5hbWUgKyAnL2NyZWF0ZScsXG4gICAgICByZW1vdmU6IG5hbWUgKyAnL3JlbW92ZScsXG4gICAgICB1cGRhdGU6IG5hbWUgKyAnL3VwZGF0ZSdcbiAgICB9XG4gIH1cbiAgXG4gIFxuICAvLyBDcmVhdGVzIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbiB3aXRoIHRoaXMgbmFtZVxuICAvLyBhbmQgcmV0dXJucyBkeW5hbWljIGNvbGxlY3Rpb24gYXJyYXkgYWxvbmdcbiAgLy8gd2l0aCBjb2xsZWN0aW9uIG1hbmlwdWxhdGlvbiBtZXRob2RzLiBTZWVcbiAgLy8gbW9kdWxlIGRvYyBjb21tZW50IGZvciBtb3JlIGRldGFpbHMuIFxuICBmdW5jdGlvbiBtb2RlbChuYW1lKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIHNvY2tldCwgZXZlbnQ7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoaXMgY29sbGVjdGlvblxuICAgIGlmKGNvbGxlY3Rpb25zW25hbWVdKSB7XG4gICAgICAvL3JldHVybiBpdCBzdHJhaWdodCBhd2F5XG4gICAgICBjb25zb2xlLmxvZygnbG9hZCcsIG5hbWUpO1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdjcmVhdGUnLCBuYW1lKTtcbiAgICBcbiAgICAvLyBhbGlhc2luZ1xuICAgIHNvY2tldCA9IGFkbWluU29ja2V0O1xuICAgIGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc1tuYW1lXSA9IFtdO1xuICAgIGV2ZW50ID0gZXZlbnRzKG5hbWUpO1xuXG4gICAgaWYoIXJlYWR5KSB7XG4gICAgICBjb25zb2xlLmxvZygnd2FpdCB0byBiZSByZWFkeScpOyBcbiAgICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3NvY2tldCByZWFkeScpO1xuICAgICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgICAgICByZWFkeSA9IHRydWU7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coZXZlbnQuZ2V0KTtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfVxuICAgIFxuICAgIC8vICMjIFNvY2tldCBFdmVudHNcblxuICAgIHNvY2tldC5vbihldmVudC5nZXQsIGZ1bmN0aW9uKG1vZGVscykge1xuICAgICAgY29sbGVjdGlvbi5sZW5ndGggPSAwO1xuICAgICAgLy8gSSBiZWxpZXZlIHRoZXJlJ3Mgc29tZSBleHBsYWluZyB0byBkbyBoZXJlLlxuICAgICAgY29sbGVjdGlvbi5wdXNoLmFwcGx5KGNvbGxlY3Rpb24sIG1vZGVscy5kYXRhKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC5jcmVhdGUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBjb2xsZWN0aW9uLnB1c2gobW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnJlbW92ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGRlbGV0ZSBmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC51cGRhdGUsIGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICAvLyBjcmVhdGUgc2FmZWd1YXJkIHdpdGggbW9kZWwgZm9yIGZpbmQgLT4gbnVsbFxuICAgICAgKGZpbmQoY29sbGVjdGlvbiwgbW9kZWwpIHx8IG1vZGVsKSA9IHVwZGF0ZWQ7XG4gICAgfSk7XG5cbiAgICAvLyAjIyBFeHBvc2VkIG1ldGhvZHMgIFxuICBcbiAgICBjb2xsZWN0aW9uLmNyZWF0ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5jcmVhdGUsIG1vZGVsKTtcbiAgICB9O1xuICAgIFxuICAgIGNvbGxlY3Rpb24ucmVtb3ZlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnJlbW92ZSwgbW9kZWwpO1xuICAgIH07XG5cbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSA9IGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC51cGRhdGUsIG1vZGVsLCB1cGRhdGVkKTtcbiAgICB9OyBcbiAgICBcbiAgICBpZihuYW1lID09PSAnYWRtaW5zJykge1xuICAgICAgd2luZG93LmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uO1xuICAgIH1cblxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgcmV0dXJuIG1vZGVsO1xufTtcbiIsIlxuLy8gU29ja2V0IFdyYXBwZXJcbi8vIC0tLS0tLS0tLS0tLS0tXG5cbi8vIEFjdHMgYXMgYSB3cmFwcGVyIGFyb3VuZCBzb2NrZXRGYWN0b3J5XG4vLyBhbmQgZXhwb3NlcyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBjcmVhdGVcbi8vIG5hbWVzcGFjZWQgc29ja2V0cywgYmFzZWQgb24gYSBwYXJhbWV0ZXIuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0RmFjdG9yeSkge1xuICByZXR1cm4gZnVuY3Rpb24obmFtZXNwYWNlKSB7XG4gICAgdmFyIGNvbm5lY3RVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwLycgKyBuYW1lc3BhY2U7XG4gICAgcmV0dXJuIHNvY2tldEZhY3Rvcnkoe1xuICAgICAgaW9Tb2NrZXQ6IGlvLmNvbm5lY3QoY29ubmVjdFVybClcbiAgICB9KTtcbiAgfVxufTtcbiIsIlxuLy8gU3RvcmFnZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgbG9jYWxTdG9yYWdlIHN1cHBvcnQgd2l0aCBhIGNvb2tpZVxuLy8gYmFzZWQgZmFsbGJhY2suIFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FjaGUsIHN0b3JhZ2UsIGlkO1xuICBcbiAgaWQgPSAnYXVkaW8tZHJvcC1zdG9yYWdlJztcbiAgc3RvcmFnZSA9IHdoaWNoKCk7XG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGljaCB0eXBlIG9mIHN0b3JhZ2VcbiAgLy8gaXMgYXZhaWxhYmxlIGFuZCByZXR1cm5zIGEgalF1ZXJ5XG4gIC8vIHN0eWxlIGdldHRlci9zZXR0ZXIgZm9yIGl0J3MgdmFsdWUuXG4gIGZ1bmN0aW9uIHdoaWNoKCkge1xuICAgIGlmKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2VbaWRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZVtpZF0gPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmKHR5cGVvZiBkYXRhID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBkb2N1bWVudC5jb29raWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9jdW1lbnQuY29va2llID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIExvYWQgdGhlIGNvbnRlbnRzIGZyb20gd2hpY2hldmVyXG4gIC8vIHN0b3JhZ2UgaXMgYXZhaWFibGUuIElmIEpTT04gcGFyc2VcbiAgLy8gdGhyb3dzIGFuIGV4Y2VwdGlvbiwgdGhlbiB0aGUgdmFsdWVcbiAgLy8gd2FzIHVuZGVmaW5lZCwgc28gaW5zdGVhZCBjYWNoZSBhblxuICAvLyBlbXB0eSBvYmplY3QuXG4gIGZ1bmN0aW9uIGxvYWQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNhY2hlID0gSlNPTi5wYXJzZShzdG9yYWdlKCkpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgY2FjaGUgPSB7fTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlO1xuICB9XG5cbiAgLy8gU2F2ZSB0aGUgY29udGVudHMgb2YgdGhlIGNhY2hlXG4gIC8vIGludG8gc3RvcmFnZVxuICBmdW5jdGlvbiBzYXZlKCkge1xuICAgIHN0b3JhZ2UoSlNPTi5zdHJpbmdpZnkoY2FjaGUpKTtcbiAgfVxuXG4gIC8vIFNldCBhIHZhbHVlIHdpdGhpbiB0aGUgY2FjaGVcbiAgLy8gYmFzZWQgb24gYSBrZXkgYW5kIHRoZW4gc2F2ZSBpdC5cbiAgZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICBjYWNoZVtrZXldID0gdmFsdWU7XG4gICAgc2F2ZSgpO1xuICB9XG5cbiAgLy8gR2V0IGEgdmFsdWUgZnJvbSB0aGUgY2FjaGVcbiAgZnVuY3Rpb24gZ2V0KGtleSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIHJldHVybiBjYWNoZVtrZXldO1xuICB9IFxuXG4gIC8vIEV4cG9zZSBnZXQgYW5kIHNldCBtZXRob2RzXG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXQsXG4gICAgc2V0OiBzZXRcbiAgfVxufTtcbiIsIi8vIHVpU3RhdGUgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEEgdGlueSBmYWN0b3J5IGZvciBtYWludGFpbmluZyB0aGVcbi8vIHN0YXRlIG9mIHRoZSBVSSBhdCBhbnkgdGltZS4gVGhlIG5hbWVcbi8vIG9mIHRoZSB1aSBpbiBxdWVzdGlvbiBzaG91bGQgYmUgcGFzc2VkXG4vLyB0byB0aGUgc2F2ZSBtZXRob2QgdG8gcGVyc2lzdCBpdC5cblxuLy8gVGhlIHN0YXRlIGNhbiB0aGVuIGJlIHJlbG9hZGVkIGF0IGFueVxuLy8gdGltZSBpbiB0aGUgZnV0dXJlLlxuXG4vLyBfX0ltcG9ydGFudF9fIFRoaXMgZG9lcyBub3QgY2hhbmdlXG4vLyB0aGUgRE9NIF9fYXQgYWxsX18uIEl0IGp1c3Qgc2F2ZXNcbi8vIGEgSlNPTiBvYmplY3Qgd2hpY2ggY2FuIHRoZW4gYmUgdXNlZFxuLy8gd2l0aCBhbmd1bGFyIHRvIG9wdGlvbmFsbHkgc2hvdy9oaWRlXG4vLyBvciBhcHBseSBjbGFzc2VzIHRvIHVpIGVsZW1lbnRzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHN0b3JhZ2UpIHtcbiAgcmV0dXJuIHtcbiAgICBzYXZlOiBmdW5jdGlvbih1aSwgc3RhdGUpIHtcbiAgICAgIHN0b3JhZ2Uuc2V0KHVpLCBzdGF0ZSk7ICBcbiAgICB9LFxuICAgIGxvYWQ6IGZ1bmN0aW9uKHVpKSB7XG4gICAgICByZXR1cm4gc3RvcmFnZS5nZXQodWkpO1xuICAgIH1cbiAgfVxufTtcbiJdfQ==
