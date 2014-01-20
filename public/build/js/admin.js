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
      $scope.cursorIndex = 0;

      $scope.focus = function(idx) {
        $scope.cursorIndex = idx;
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zdG9yYWdlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy91aVN0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQWRtaW5cbi8vIC0tLS0tXG5cbi8vIFRoZSBhZG1pbiBhcHBsaWNhdGlvbiBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZ1xuLy8gdHJhY2sgb2YgYWxsIHNlc3Npb25zLCBkZXZpY2VzLCBhdWRpbyBmaWxlcyBhbmRcbi8vIGNvbXBvc2VkIHNvbmdzLlxuLy8gXG4vLyBJdCBhbHNvIHByb3ZpZGVzIGEgY29uc29sZSBmb3IgdGFsa2luZyB0byB0aGVcbi8vIHNlcnZlciBhbmQgdGhlIGNvbXBvc2UgaW50ZXJmYWNlIGZvciBjcmVhdGluZ1xuLy8gc29uZyBmaWxlcyBmcm9tIHRoZSBhdmFpbGFibGUgYXVkaW8gZmlsZXMuXG4vL1xuXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW4nLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvc2Vzc2lvbnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvc2Vzc2lvbnMnLFxuICAgIGNvbnRyb2xsZXI6ICdTZXNzaW9uQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9hdWRpbycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hdWRpbycsXG4gICAgY29udHJvbGxlcjogJ0F1ZGlvQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy91c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy91c2VycycsXG4gICAgY29udHJvbGxlcjogJ1VzZXJzQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9jb21wb3NlJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2NvbXBvc2UnLFxuICAgIGNvbnRyb2xsZXI6ICdDb21wb3NlQ29udHJvbGxlcidcbiAgfSkuXG4gIG90aGVyd2lzZSh7XG4gICAgcmVkaXJlY3RUbzogJy9zZXNzaW9ucydcbiAgfSk7XG59KS5cblxuLy8gQ29udHJvbGxlcnNcbi8vIC0tLS0tLS0tLS0tXG5cbmNvbnRyb2xsZXIoe1xuICAvLyBNYW5hZ2UgZGV2aWNlcyBpbiBzZXNzaW9uc1xuICAnU2Vzc2lzaW9uc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlcicpLFxuICAvLyBDb21wb3NpdGlvbiBvZiBzb25nIGZpbGVzXG4gICdDb21wb3NlQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXInKSxcbiAgLy8gTWFuYWdlIGFkbWluaXN0cmF0b3JzIGFuZCByZWdpc3RlcmVkIHVzZXJzXG4gICdVc2Vyc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1VzZXJzQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgdXBsb2FkZWQgYXVkaW8gdHJhY2tzXG4gICdBdWRpb0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlcicpXG59KS5cblxuLy8gRGlyZWN0aXZlc1xuLy8gLS0tLS0tLS0tLVxuXG5kaXJlY3RpdmUoe1xuICAvLyBJbnRlcmZhY2UgZm9yIGVkaXRpbmcgY29sbGVjdGlvbnNcbiAgJ2VkaXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9lZGl0b3InKSxcbiAgLy8gQ29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbiAgJ2NvbnNvbGUnOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29uc29sZScpLFxuICAvLyBTZWFyY2hhYmxlIGNvbGxlY3Rpb24gaW50ZXJmYWNlIFxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJylcbn0pLlxuXG5cbi8vIFNlcnZpY2VzXG4vLyAtLS0tLS0tLVxuXG5mYWN0b3J5KHtcbiAgLy8gTG9jYWxzdG9yYWdlICsgY29va2llIHNoaW1cbiAgJ3N0b3JhZ2UnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3N0b3JhZ2UnKSxcbiAgLy8gTWFpbnRhaW4gc3RhdGUgb2YgdWlcbiAgJ3VpU3RhdGUnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3VpU3RhdGUnKSxcbiAgLy8gV2ViIHNvY2tldCB3cmFwcGVyXG4gICdzb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpLFxuICAvLyBTb2NrZXQgY29ubmVjdCB0byBhZG1pbiBjaGFubmVsXG4gICdhZG1pblNvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvYWRtaW5Tb2NrZXQnKSxcbiAgLy8gQ29sbGVjdGlvbiBtYWludGFpbmVyXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb2xsZWN0aW9uJylcbn0pO1xuIiwiLyoqXG4gKiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG5cbn07XG4iLCJcbi8vIENvbGxlY3Rpb24gZGlyZWN0aXZlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBZGQgdGhlIGF0dHJpYnV0ZSBjb2xsZWN0aW9uIHRvIGFuIGVsZW1lbnQgYW5kIFxuLy8gc3BlY2lmeSB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBpbiBhICdjb2xsZWN0aW9uLW5hbWUnIFxuLy8gYXR0cmlidXRlLCBhbmQgdGhpcyBkaXJlY3RpdmUgd2lsbCBjcmVhdGUgYSBzZWFyY2hhYmxlLCBcbi8vIHN5bmNocm9uaXplZCBkYXRhIHZpZXcgb2YgdGhhdCBjb2xsZWN0aW9uLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb2xsZWN0aW9uJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgICBcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHsgXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgJHNjb3BlLmN1cnNvckluZGV4ID0gMDtcblxuICAgICAgJHNjb3BlLmZvY3VzID0gZnVuY3Rpb24oaWR4KSB7XG4gICAgICAgICRzY29wZS5jdXJzb3JJbmRleCA9IGlkeDtcbiAgICAgIH07XG4gICAgICAgIFxuICAgICAgY29uc29sZS5sb2coJHNjb3BlLm5hbWUsICdkaXJlY3RpdmUgY29udHJvbGxlcicpO1xuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVpU3RhdGUpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29uc29sZScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7IFxuICAgICAgdmFyIHNob3dpbmcsIHVpS2V5O1xuXG4gICAgICB1aUtleSA9ICdjb25zb2xlLXN0YXRlJ1xuICAgICAgc2hvd2luZyA9ICh1aVN0YXRlLmxvYWQodWlLZXkpIHx8IGZhbHNlKTtcbiAgICAgXG4gICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiBcbiAgICAgIGZ1bmN0aW9uIGNoZWNrVmlzaWJpbGl0eSgpIHtcbiAgICAgICAgaWYoc2hvd2luZykge1xuICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH0gXG4gICAgICB9XG4gICAgICAgIFxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpICAge1xuICAgICAgICAvLyB0b2dnbGUgb24gYCBrZXlcbiAgICAgICAgaWYoZS5rZXlDb2RlID09PSAxOTIpIHtcbiAgICAgICAgICBzaG93aW5nID0gIXNob3dpbmc7XG4gICAgICAgICAgdWlTdGF0ZS5zYXZlKHVpS2V5LCBzaG93aW5nKTtcbiAgICAgICAgXG4gICAgICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgLy8gZ2l2ZSBmb2N1cyB0byBpbnB1dCBcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgICAvLyBzdG9wIGAgYmVpbmcgaW5zZXJ0ZWRcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgYWRtaW5Tb2NrZXQpIHtcbiAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG5cbiAgICAgIGFkbWluU29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsVG9wID0gJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfTtcbiAgICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKHtcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIGFkbWluU29ja2V0LmVtaXQoJ21lc3NhZ2UnLCAkc2NvcGUuaW5wdXQpO1xuICAgICAgICAkc2NvcGUuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIlxuLy8gRWRpdG9yXG4vLyAtLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgdXBkYXRpbmcgYW5kIFxuLy8gbW9kaWZ5aW5nIGl0ZW1zIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG4vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnRWRpdG9yJyk7ICBcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHZhciBjb2xsZWN0aW9uO1xuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgIC8vIE92ZXJ3cml0ZSBjb2xsZWN0aW9uIHRvIHByZXZlbnQgaXQgXG4gICAgICAvLyBmcm9tIGJlaW5nIHVzZWQgYWdhaW5cbiAgICAgIGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vLyBhZG1pblNvY2tldCBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGEgc29ja2V0IHRoYXQncyBjb25uZWN0ZWRcbi8vIHRvIHRoZSBhZG1pbiBjaGFubmVsLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuICByZXR1cm4gc29ja2V0KCdhZG1pbicpO1xufTtcbiIsIlxuLy8gY29sbGVjdGlvbiBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0gXG5cbi8vIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuLy8gdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4vLyBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIGAvcm91dGVzL2NvbGxlY3Rpb24vYFxuLy8gZm9yIG1vcmUgZGV0YWlscy5cblxuLy8gQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuLy8gcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXJzXG4vLyByZWFkeSBldmVudCwgYW5kIHRoZW4gcHJvY2VlZHMgdG8gbGlzdGVuIHRvIHRoZSBldmVudHNcbi8vIChfX2NyZWF0ZV9fLCBfX2dldF9fLCBfX3VwZGF0ZV9fLCBfX3JlbW92ZV9fKSBcbi8vIGZvciB0aGF0IG5hbWUgYW5kIGNyZWF0ZXMgYSBzZXQgb2YgbWV0aG9kcyB0byBtYW5pcHVsYXRlIFxuLy8gdGhlIGRhdGEgb3ZlciB0aGUgc29ja2V0IGNvbm5lY3Rpb24uXG5cbi8vIEZpbmFsbHksIGEgZHluYW1pYyBhcnJheSBjb250YWluaW5nIHRoZSBtb2RlbHNcbi8vIGZyb20gdGhlIGNvbGxlY3Rpb24gaXMgcmV0dXJuZWQsIHdpdGggY3JlYXRlLCB1cGRhdGVcbi8vIGFuZCByZW1vdmUgbWV0aG9kcyB0YWNrZWQgb24gdG8gaXQuIFRoaXMgY2FuIGJlIHVzZWRcbi8vIGJvdW5kIHN0cmFpZ2h0IHRvIHRoZSBET00gZnJvbSBjb250cm9sbGVycy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhZG1pblNvY2tldCkge1xuXG4gIC8vIFN0b3JlIGFsbCBhdmFpbGFibGUgY29sbGVjdGlvbnMgaW4gaGVyZS5cbiAgdmFyIGNvbGxlY3Rpb25zID0ge307XG5cbiAgXG4gIC8vIEhhcyB0aGlzIHNvY2tldCByZWNpZXZlZCByZWFkeSBzaWduYWw/XG4gIHZhciByZWFkeSA9IGZhbHNlO1xuXG4gIC8vIEZpbmQgYW5kIHJldHVybiBhIG1vZGVsIGZyb20gYSBjb2xsZWN0aW9uXG4gIC8vIGJhc2VkIG9uIHRoZSBfaWQgcHJvcGVydHkgb2YgdGhlIHF1ZXJ5IFxuICAvLyBvYmplY3QuIF8oUXVlcnkgb2JqZWN0IG5vcm1hbGx5IGNvbWVzIGZyb21cbiAgLy8gdGhlIGRhdGFiYXNlKV9cbiAgZnVuY3Rpb24gZmluZChjb2xsZWN0aW9uLCBxdWVyeSkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uW2ldLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihjb2xsZWN0aW9uW2ldLl9pZCA9PT0gcXVlcnkuX2lkKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2QgdG8gcHJvdmlkZSBjbGVhbiBsb29raW5nXG4gIC8vIG5hbWVzIGZvciBzb2NrZXQgZXZlbnRzXG4gIGZ1bmN0aW9uIGV2ZW50cyhuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogbmFtZSArICcvZ2V0JyxcbiAgICAgIGNyZWF0ZTogbmFtZSArICcvY3JlYXRlJyxcbiAgICAgIHJlbW92ZTogbmFtZSArICcvcmVtb3ZlJyxcbiAgICAgIHVwZGF0ZTogbmFtZSArICcvdXBkYXRlJ1xuICAgIH1cbiAgfVxuICBcbiAgXG4gIC8vIENyZWF0ZXMgaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uIHdpdGggdGhpcyBuYW1lXG4gIC8vIGFuZCByZXR1cm5zIGR5bmFtaWMgY29sbGVjdGlvbiBhcnJheSBhbG9uZ1xuICAvLyB3aXRoIGNvbGxlY3Rpb24gbWFuaXB1bGF0aW9uIG1ldGhvZHMuIFNlZVxuICAvLyBtb2R1bGUgZG9jIGNvbW1lbnQgZm9yIG1vcmUgZGV0YWlscy4gXG4gIGZ1bmN0aW9uIG1vZGVsKG5hbWUpIHtcbiAgICB2YXIgY29sbGVjdGlvbiwgc29ja2V0LCBldmVudDtcblxuICAgIC8vIGlmIHdlIGhhdmUgYWxyZWFkeSBsb2FkZWQgdGhpcyBjb2xsZWN0aW9uXG4gICAgaWYoY29sbGVjdGlvbnNbbmFtZV0pIHtcbiAgICAgIC8vcmV0dXJuIGl0IHN0cmFpZ2h0IGF3YXlcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkJywgbmFtZSk7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbnNbbmFtZV07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZScsIG5hbWUpO1xuICAgIFxuICAgIC8vIGFsaWFzaW5nXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBpZighcmVhZHkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCd3YWl0IHRvIGJlIHJlYWR5Jyk7IFxuICAgICAgc29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnc29ja2V0IHJlYWR5Jyk7XG4gICAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhldmVudC5nZXQpO1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICB9XG4gICAgXG4gICAgLy8gIyMgU29ja2V0IEV2ZW50c1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmdldCwgZnVuY3Rpb24obW9kZWxzKSB7XG4gICAgICBjb2xsZWN0aW9uLmxlbmd0aCA9IDA7XG4gICAgICAvLyBJIGJlbGlldmUgdGhlcmUncyBzb21lIGV4cGxhaW5nIHRvIGRvIGhlcmUuXG4gICAgICBjb2xsZWN0aW9uLnB1c2guYXBwbHkoY29sbGVjdGlvbiwgbW9kZWxzLmRhdGEpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmNyZWF0ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGNvbGxlY3Rpb24ucHVzaChtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQucmVtb3ZlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgZGVsZXRlIGZpbmQoY29sbGVjdGlvbiwgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnVwZGF0ZSwgZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIC8vIGNyZWF0ZSBzYWZlZ3VhcmQgd2l0aCBtb2RlbCBmb3IgZmluZCAtPiBudWxsXG4gICAgICAoZmluZChjb2xsZWN0aW9uLCBtb2RlbCkgfHwgbW9kZWwpID0gdXBkYXRlZDtcbiAgICB9KTtcblxuICAgIC8vICMjIEV4cG9zZWQgbWV0aG9kcyAgXG4gIFxuICAgIGNvbGxlY3Rpb24uY3JlYXRlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmNyZWF0ZSwgbW9kZWwpO1xuICAgIH07XG4gICAgXG4gICAgY29sbGVjdGlvbi5yZW1vdmUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQucmVtb3ZlLCBtb2RlbCk7XG4gICAgfTtcblxuICAgIGNvbGxlY3Rpb24udXBkYXRlID0gZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnVwZGF0ZSwgbW9kZWwsIHVwZGF0ZWQpO1xuICAgIH07IFxuICAgIFxuICAgIGlmKG5hbWUgPT09ICdhZG1pbnMnKSB7XG4gICAgICB3aW5kb3cuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICByZXR1cm4gbW9kZWw7XG59O1xuIiwiXG4vLyBTb2NrZXQgV3JhcHBlclxuLy8gLS0tLS0tLS0tLS0tLS1cblxuLy8gQWN0cyBhcyBhIHdyYXBwZXIgYXJvdW5kIHNvY2tldEZhY3Rvcnlcbi8vIGFuZCBleHBvc2VzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZVxuLy8gbmFtZXNwYWNlZCBzb2NrZXRzLCBiYXNlZCBvbiBhIHBhcmFtZXRlci5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXRGYWN0b3J5KSB7XG4gIHJldHVybiBmdW5jdGlvbihuYW1lc3BhY2UpIHtcbiAgICB2YXIgY29ubmVjdFVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyArIG5hbWVzcGFjZTtcbiAgICByZXR1cm4gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogaW8uY29ubmVjdChjb25uZWN0VXJsKVxuICAgIH0pO1xuICB9XG59O1xuIiwiXG4vLyBTdG9yYWdlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBsb2NhbFN0b3JhZ2Ugc3VwcG9ydCB3aXRoIGEgY29va2llXG4vLyBiYXNlZCBmYWxsYmFjay4gXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYWNoZSwgc3RvcmFnZSwgaWQ7XG4gIFxuICBpZCA9ICdhdWRpby1kcm9wLXN0b3JhZ2UnO1xuICBzdG9yYWdlID0gd2hpY2goKTtcblxuICAvLyBEZXRlcm1pbmVzIHdoaWNoIHR5cGUgb2Ygc3RvcmFnZVxuICAvLyBpcyBhdmFpbGFibGUgYW5kIHJldHVybnMgYSBqUXVlcnlcbiAgLy8gc3R5bGUgZ2V0dGVyL3NldHRlciBmb3IgaXQncyB2YWx1ZS5cbiAgZnVuY3Rpb24gd2hpY2goKSB7XG4gICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGxvY2FsU3RvcmFnZVtpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlW2lkXSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTG9hZCB0aGUgY29udGVudHMgZnJvbSB3aGljaGV2ZXJcbiAgLy8gc3RvcmFnZSBpcyBhdmFpYWJsZS4gSWYgSlNPTiBwYXJzZVxuICAvLyB0aHJvd3MgYW4gZXhjZXB0aW9uLCB0aGVuIHRoZSB2YWx1ZVxuICAvLyB3YXMgdW5kZWZpbmVkLCBzbyBpbnN0ZWFkIGNhY2hlIGFuXG4gIC8vIGVtcHR5IG9iamVjdC5cbiAgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgY2FjaGUgPSBKU09OLnBhcnNlKHN0b3JhZ2UoKSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBjYWNoZSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGU7XG4gIH1cblxuICAvLyBTYXZlIHRoZSBjb250ZW50cyBvZiB0aGUgY2FjaGVcbiAgLy8gaW50byBzdG9yYWdlXG4gIGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgc3RvcmFnZShKU09OLnN0cmluZ2lmeShjYWNoZSkpO1xuICB9XG5cbiAgLy8gU2V0IGEgdmFsdWUgd2l0aGluIHRoZSBjYWNoZVxuICAvLyBiYXNlZCBvbiBhIGtleSBhbmQgdGhlbiBzYXZlIGl0LlxuICBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcbiAgICBzYXZlKCk7XG4gIH1cblxuICAvLyBHZXQgYSB2YWx1ZSBmcm9tIHRoZSBjYWNoZVxuICBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgcmV0dXJuIGNhY2hlW2tleV07XG4gIH0gXG5cbiAgLy8gRXhwb3NlIGdldCBhbmQgc2V0IG1ldGhvZHNcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGdldCxcbiAgICBzZXQ6IHNldFxuICB9XG59O1xuIiwiLy8gdWlTdGF0ZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gQSB0aW55IGZhY3RvcnkgZm9yIG1haW50YWluaW5nIHRoZVxuLy8gc3RhdGUgb2YgdGhlIFVJIGF0IGFueSB0aW1lLiBUaGUgbmFtZVxuLy8gb2YgdGhlIHVpIGluIHF1ZXN0aW9uIHNob3VsZCBiZSBwYXNzZWRcbi8vIHRvIHRoZSBzYXZlIG1ldGhvZCB0byBwZXJzaXN0IGl0LlxuXG4vLyBUaGUgc3RhdGUgY2FuIHRoZW4gYmUgcmVsb2FkZWQgYXQgYW55XG4vLyB0aW1lIGluIHRoZSBmdXR1cmUuXG5cbi8vIF9fSW1wb3J0YW50X18gVGhpcyBkb2VzIG5vdCBjaGFuZ2Vcbi8vIHRoZSBET00gX19hdCBhbGxfXy4gSXQganVzdCBzYXZlc1xuLy8gYSBKU09OIG9iamVjdCB3aGljaCBjYW4gdGhlbiBiZSB1c2VkXG4vLyB3aXRoIGFuZ3VsYXIgdG8gb3B0aW9uYWxseSBzaG93L2hpZGVcbi8vIG9yIGFwcGx5IGNsYXNzZXMgdG8gdWkgZWxlbWVudHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuICByZXR1cm4ge1xuICAgIHNhdmU6IGZ1bmN0aW9uKHVpLCBzdGF0ZSkge1xuICAgICAgc3RvcmFnZS5zZXQodWksIHN0YXRlKTsgIFxuICAgIH0sXG4gICAgbG9hZDogZnVuY3Rpb24odWkpIHtcbiAgICAgIHJldHVybiBzdG9yYWdlLmdldCh1aSk7XG4gICAgfVxuICB9XG59O1xuIl19
