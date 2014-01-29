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

angular.module('admin', ['ngRoute', 'btford.socket-io', 'angularFileUpload']).

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
  'uploadAudio': require('./directives/uploadAudio'),
  // Interface for editing collections
  'editor': require('./directives/editor'),
  // Interface for creating items for collections
  'creator': require('./directives/creator'),
  // Console for server communication
  'console': require('./directives/console'),
  // Searchable collection interface 
  'collection': require('./directives/collection')
});




},{"./controllers/AudioController":2,"./controllers/ComposeController":3,"./controllers/SessionsController":4,"./controllers/UsersController":5,"./directives/collection":6,"./directives/console":7,"./directives/creator":8,"./directives/editor":9,"./directives/uploadAudio":10,"./services/adminSocket":11,"./services/collection":12,"./services/socket":13,"./services/storage":14,"./services/uiState":15}],2:[function(require,module,exports){
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


},{"../util":16}],9:[function(require,module,exports){

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
module.exports = function() {
  console.log('upload directive');
  return {
    restrict: 'A',
    templateUrl: 'partials/uploadAudio',
    controller: function($scope, $upload, $timeout) {
      
      function remove(file) {
        var i;
        for(i = 0; i < $scope.files.length; i++) {
          if($scope.files[i] === file) {
            $scope.files.splice(i, 1);
          }
        }
      }

      function upload(file) {
        file.uploaded = false;

        $upload.upload({
          url: '/upload/audio',
          file: file
        }).progress(function(e) {
          file.progress = 100 * (e.loaded / e.total); 
        }).success(function(res) {
          if(res.status === 'success') {
            file.uploaded = true;
            // Get rid of the success notification
            $timeout(remove.bind(this, file), 5000);
          } else {
            file.error = res.data.message;
          }
        }).error(function(data, status) {
          file.error = 'There was a problem uploading.';
        });

      }

      $scope.files = [];

      $scope.upload = function() {
        for(var i = 0; i < $scope.files.length; i++) {
          upload($scope.files[i]);         
        }
      };

      $scope.select = function($files) {
        $scope.files = $files;
        $scope.files.map(function(file) {
          file.progress = 0;
          file.uploaded = false;
          file.error = null;
        });
      };

    }
  }
}

},{}],11:[function(require,module,exports){

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

},{}],12:[function(require,module,exports){
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

},{"../util":16}],13:[function(require,module,exports){

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

},{}],14:[function(require,module,exports){

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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvY3JlYXRvci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9lZGl0b3IuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvdXBsb2FkQXVkaW8uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL2FkbWluU29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3N0b3JhZ2UuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3VpU3RhdGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEFkbWluXG4vLyAtLS0tLVxuXG4vLyBUaGUgYWRtaW4gYXBwbGljYXRpb24gaXMgcmVzcG9uc2libGUgZm9yIGtlZXBpbmdcbi8vIHRyYWNrIG9mIGFsbCBzZXNzaW9ucywgZGV2aWNlcywgYXVkaW8gZmlsZXMgYW5kXG4vLyBjb21wb3NlZCBzb25ncy5cbi8vIFxuLy8gSXQgYWxzbyBwcm92aWRlcyBhIGNvbnNvbGUgZm9yIHRhbGtpbmcgdG8gdGhlXG4vLyBzZXJ2ZXIgYW5kIHRoZSBjb21wb3NlIGludGVyZmFjZSBmb3IgY3JlYXRpbmdcbi8vIHNvbmcgZmlsZXMgZnJvbSB0aGUgYXZhaWxhYmxlIGF1ZGlvIGZpbGVzLlxuLy9cblxuYW5ndWxhci5tb2R1bGUoJ2FkbWluJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nLCAnYW5ndWxhckZpbGVVcGxvYWQnXSkuXG5cbmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlci5cbiAgd2hlbignL3Nlc3Npb25zJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3Nlc3Npb25zJyxcbiAgICBjb250cm9sbGVyOiAnU2Vzc2lvbnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2F1ZGlvJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2F1ZGlvJyxcbiAgICBjb250cm9sbGVyOiAnQXVkaW9Db250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL3VzZXJzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3VzZXJzJyxcbiAgICBjb250cm9sbGVyOiAnVXNlcnNDb250cm9sbGVyJ1xuICB9KS5cbiAgd2hlbignL2NvbXBvc2UnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY29tcG9zZScsXG4gICAgY29udHJvbGxlcjogJ0NvbXBvc2VDb250cm9sbGVyJ1xuICB9KS5cbiAgb3RoZXJ3aXNlKHtcbiAgICByZWRpcmVjdFRvOiAnL3Nlc3Npb25zJ1xuICB9KTtcbn0pLlxuXG4vLyBTZXJ2aWNlc1xuLy8gLS0tLS0tLS1cblxuZmFjdG9yeSh7XG4gIC8vIExvY2Fsc3RvcmFnZSArIGNvb2tpZSBzaGltXG4gICdzdG9yYWdlJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9zdG9yYWdlJyksXG4gIC8vIE1haW50YWluIHN0YXRlIG9mIHVpXG4gICd1aVN0YXRlJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy91aVN0YXRlJyksXG4gIC8vIFdlYiBzb2NrZXQgd3JhcHBlclxuICAnc29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9zb2NrZXQnKSxcbiAgLy8gU29ja2V0IGNvbm5lY3QgdG8gYWRtaW4gY2hhbm5lbFxuICAnYWRtaW5Tb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL2FkbWluU29ja2V0JyksXG4gIC8vIENvbGxlY3Rpb24gbWFpbnRhaW5lclxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vc2VydmljZXMvY29sbGVjdGlvbicpXG59KS5cblxuLy8gQ29udHJvbGxlcnNcbi8vIC0tLS0tLS0tLS0tXG5cbmNvbnRyb2xsZXIoe1xuICAvLyBNYW5hZ2UgZGV2aWNlcyBpbiBzZXNzaW9uc1xuICAnU2Vzc2lvbnNDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9TZXNzaW9uc0NvbnRyb2xsZXInKSxcbiAgLy8gQ29tcG9zaXRpb24gb2Ygc29uZyBmaWxlc1xuICAnQ29tcG9zZUNvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0NvbXBvc2VDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSBhZG1pbmlzdHJhdG9ycyBhbmQgcmVnaXN0ZXJlZCB1c2Vyc1xuICAnVXNlcnNDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Vc2Vyc0NvbnRyb2xsZXInKSxcbiAgLy8gTWFuYWdlIHVwbG9hZGVkIGF1ZGlvIHRyYWNrc1xuICAnQXVkaW9Db250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9BdWRpb0NvbnRyb2xsZXInKVxufSkuXG5cbi8vIERpcmVjdGl2ZXNcbi8vIC0tLS0tLS0tLS1cblxuZGlyZWN0aXZlKHtcbiAgJ3VwbG9hZEF1ZGlvJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL3VwbG9hZEF1ZGlvJyksXG4gIC8vIEludGVyZmFjZSBmb3IgZWRpdGluZyBjb2xsZWN0aW9uc1xuICAnZWRpdG9yJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2VkaXRvcicpLFxuICAvLyBJbnRlcmZhY2UgZm9yIGNyZWF0aW5nIGl0ZW1zIGZvciBjb2xsZWN0aW9uc1xuICAnY3JlYXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jcmVhdG9yJyksXG4gIC8vIENvbnNvbGUgZm9yIHNlcnZlciBjb21tdW5pY2F0aW9uXG4gICdjb25zb2xlJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbnNvbGUnKSxcbiAgLy8gU2VhcmNoYWJsZSBjb2xsZWN0aW9uIGludGVyZmFjZSBcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29sbGVjdGlvbicpXG59KTtcblxuXG5cbiIsIi8qKlxuICogXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuICBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuXG59O1xuIiwiXG4vLyBDb2xsZWN0aW9uIGRpcmVjdGl2ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gQWRkIHRoZSBhdHRyaWJ1dGUgY29sbGVjdGlvbiB0byBhbiBlbGVtZW50IGFuZCBcbi8vIHNwZWNpZnkgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gaW4gYSAnY29sbGVjdGlvbi1uYW1lJyBcbi8vIGF0dHJpYnV0ZSwgYW5kIHRoaXMgZGlyZWN0aXZlIHdpbGwgY3JlYXRlIGEgc2VhcmNoYWJsZSwgXG4vLyBzeW5jaHJvbml6ZWQgZGF0YSB2aWV3IG9mIHRoYXQgY29sbGVjdGlvbi5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29sbGVjdGlvbicsXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikgeyBcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAkc2NvcGUubW9kZWxzID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAkc2NvcGUuc2VhcmNoID0gJyc7XG4gICAgICBcbiAgICAgICRzY29wZS5mb2N1cyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICRzY29wZS5tb2RlbHMuZm9jdXMgPSBpZDtcbiAgICAgIH07XG4gICAgICAgICAgICAgIFxuICAgICAgY29uc29sZS5sb2coJHNjb3BlLm5hbWUsICdkaXJlY3RpdmUgY29udHJvbGxlcicpO1xuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVpU3RhdGUpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29uc29sZScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7IFxuICAgICAgdmFyIHNob3dpbmcsIHVpS2V5O1xuXG4gICAgICB1aUtleSA9ICdjb25zb2xlLXN0YXRlJ1xuICAgICAgc2hvd2luZyA9ICh1aVN0YXRlLmxvYWQodWlLZXkpIHx8IGZhbHNlKTtcbiAgICAgXG4gICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiBcbiAgICAgIGZ1bmN0aW9uIGNoZWNrVmlzaWJpbGl0eSgpIHtcbiAgICAgICAgaWYoc2hvd2luZykge1xuICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH0gXG4gICAgICB9XG4gICAgICAgIFxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpICAge1xuICAgICAgICAvLyBUb2dnbGUgb24gYCBrZXlcbiAgICAgICAgaWYoZS5rZXlDb2RlID09PSAxOTIpIHtcbiAgICAgICAgICBzaG93aW5nID0gIXNob3dpbmc7XG4gICAgICAgICAgdWlTdGF0ZS5zYXZlKHVpS2V5LCBzaG93aW5nKTtcbiAgICAgICAgXG4gICAgICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgLy8gR2l2ZSBmb2N1cyB0byBpbnB1dCBcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgICAvLyBTdG9wIGAgYmVpbmcgaW5zZXJ0ZWQgaW50byBjb25zb2xlXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGFkbWluU29ja2V0KSB7XG4gICAgICB2YXIgc29ja2V0O1xuXG4gICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgXG4gICAgICBhZG1pblNvY2tldC5vbignbWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJHNjb3BlLmFkZE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmFkZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICRlbGVtZW50WzBdLnNjcm9sbFRvcCA9ICRlbGVtZW50WzBdLnNjcm9sbEhlaWdodFxuICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICAgIH07XG4gICAgICAgXG4gICAgICAkc2NvcGUuc2VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZSh7XG4gICAgICAgICAgYm9keTogJHNjb3BlLmlucHV0XG4gICAgICAgIH0pO1xuICAgICAgICBhZG1pblNvY2tldC5lbWl0KCdtZXNzYWdlJywgJHNjb3BlLmlucHV0KTtcbiAgICAgICAgJHNjb3BlLmNsZWFyKCk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbiAgXG4iLCJcbi8vIENyZWF0b3Jcbi8vIC0tLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgY3JlYXRpbmcgaXRlbXMgXG4vLyBmcm9tIGEgY29sbGVjdGlvbiBzZXJ2aWNlLlxuXG52YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY3JlYXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnQ3JlYXRvcicpO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGNvbGxlY3Rpb247XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICBcbiAgICAgIC8vIEdldCB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBuYW1lIGZyb21cbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgYW5kIGJpbmQgaXQgdG9cbiAgICAgIC8vIHRoZSBzY29wZS4gXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgIFxuICAgICAgLy8gSW5pdGlhbCBzY2hlbWEgZm9yIGNyZWF0aW9uXG4gICAgICAkc2NvcGUuc2NoZW1hID0ge307IFxuICAgICAgLy8gQWN0dWFsIG1vZGVsIGJvdW5kIHRvIGlucHV0XG4gICAgICAkc2NvcGUuaW5zdGFuY2UgPSB7fTtcbiAgICAgIC8vIFNhdmluZyBzdGF0ZVxuICAgICAgJHNjb3BlLmNyZWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICRzY29wZS5jcmVhdGUgPSBmdW5jdGlvbigpIHsgICAgXG4gICAgICAgICRzY29wZS5jcmVhdGluZyA9IHRydWU7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uLmNyZWF0ZSgkc2NvcGUuaW5zdGFuY2UpO1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ2dldCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIga2V5O1xuICAgICAgICBpZigkc2NvcGUuY29sbGVjdGlvbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgJHNjb3BlLnNjaGVtYSA9IF8uY29weSgkc2NvcGUuY29sbGVjdGlvblswXSk7XG4gICAgICAgICAgLy8gTm8gbmVlZCBmb3IgbW9uZ28gaWRzIGhlcmVcbiAgICAgICAgICBkZWxldGUgJHNjb3BlLnNjaGVtYS5faWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkc2NvcGUuaW5zdGFuY2UgPSAkc2NvcGUuc2NoZW1hO1xuICAgICAgICBmb3Ioa2V5IGluICRzY29wZS5pbnN0YW5jZSkge1xuICAgICAgICAgICRzY29wZS5pbnN0YW5jZVtrZXldID0gJyc7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignY3JlYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5jcmVhdGluZyA9IGZhbHNlO1xuICAgICAgfSk7XG4gXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIlxuLy8gRWRpdG9yXG4vLyAtLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgdXBkYXRpbmcgYW5kIFxuLy8gbW9kaWZ5aW5nIGl0ZW1zIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG4vL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9lZGl0b3InLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgY29uc29sZS5sb2coJ0VkaXRvcicpO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgXG4gICAgICAvLyBHZXQgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gZm9yIHRoaXMgZWRpdG9yXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgICAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIG5hbWUgZnJvbVxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBhbmQgYmluZCBpdCB0b1xuICAgICAgLy8gdGhlIHNjb3BlLiBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICBcbiAgICAgICRzY29wZS5tb2RlbCA9IHt9O1xuICAgXG4gICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgICBcbiAgICAgICRzY29wZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ucmVtb3ZlKCRzY29wZS5tb2RlbCk7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbW9kZWwgPSAkc2NvcGUubW9kZWw7XG4gICAgICAgIGNvbnNvbGUubG9nKCdlZGl0ZWQnLCAkc2NvcGUubW9kZWwpO1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbi51cGRhdGUobW9kZWwsIG1vZGVsKTtcbiAgICAgICAgJHNjb3BlLnNhdmluZyA9IHRydWU7IFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuc2F2aW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignZm9jdXMnLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgICAkc2NvcGUubW9kZWwgPSBtb2RlbDtcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCd1cGxvYWQgZGlyZWN0aXZlJyk7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL3VwbG9hZEF1ZGlvJyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICR1cGxvYWQsICR0aW1lb3V0KSB7XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIHJlbW92ZShmaWxlKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCAkc2NvcGUuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZigkc2NvcGUuZmlsZXNbaV0gPT09IGZpbGUpIHtcbiAgICAgICAgICAgICRzY29wZS5maWxlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwbG9hZChmaWxlKSB7XG4gICAgICAgIGZpbGUudXBsb2FkZWQgPSBmYWxzZTtcblxuICAgICAgICAkdXBsb2FkLnVwbG9hZCh7XG4gICAgICAgICAgdXJsOiAnL3VwbG9hZC9hdWRpbycsXG4gICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICB9KS5wcm9ncmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IDEwMCAqIChlLmxvYWRlZCAvIGUudG90YWwpOyBcbiAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICBpZihyZXMuc3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIGZpbGUudXBsb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gR2V0IHJpZCBvZiB0aGUgc3VjY2VzcyBub3RpZmljYXRpb25cbiAgICAgICAgICAgICR0aW1lb3V0KHJlbW92ZS5iaW5kKHRoaXMsIGZpbGUpLCA1MDAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5lcnJvciA9IHJlcy5kYXRhLm1lc3NhZ2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgICBmaWxlLmVycm9yID0gJ1RoZXJlIHdhcyBhIHByb2JsZW0gdXBsb2FkaW5nLic7XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cbiAgICAgICRzY29wZS5maWxlcyA9IFtdO1xuXG4gICAgICAkc2NvcGUudXBsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCAkc2NvcGUuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB1cGxvYWQoJHNjb3BlLmZpbGVzW2ldKTsgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKCRmaWxlcykge1xuICAgICAgICAkc2NvcGUuZmlsZXMgPSAkZmlsZXM7XG4gICAgICAgICRzY29wZS5maWxlcy5tYXAoZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSAwO1xuICAgICAgICAgIGZpbGUudXBsb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICBmaWxlLmVycm9yID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgfVxuICB9XG59XG4iLCJcbi8vIGFkbWluU29ja2V0IEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgYSBzb2NrZXQgdGhhdCdzIGNvbm5lY3RlZFxuLy8gdG8gdGhlIGFkbWluIGNoYW5uZWwuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0KSB7XG4gIHZhciBhZG1pblNvY2tldCA9IHNvY2tldCgnYWRtaW4nKTtcbiAgYWRtaW5Tb2NrZXQucmVhZHkgPSBmYWxzZTtcbiAgXG4gIGFkbWluU29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgIGFkbWluU29ja2V0LnJlYWR5ID0gdHJ1ZTtcbiAgfSk7XG4gIFxuICByZXR1cm4gYWRtaW5Tb2NrZXQ7XG59O1xuIiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIGNvbGxlY3Rpb24gRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tIFxuXG4vLyBUaGUgY29sbGVjdGlvbiBmYWN0b3J5IGlzIHJlc3BvbnNpYmxlIGZvciBtYWludGFpbmdcbi8vIHRoZSBzdGF0ZSBhbmQgYSBtb2RpZmljYXRpb24gaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uc1xuLy8gZGVmaW5lZCBhdCB0aGUgc2VydmVyIHNpZGUuIFNlZSBgL3JvdXRlcy9jb2xsZWN0aW9uL2Bcbi8vIGZvciBtb3JlIGRldGFpbHMuXG5cbi8vIEFmdGVyIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhIG5hbWVcbi8vIHBhcmFtZXRlciwgdGhlIGFkbWluU29ja2V0IHdhaXRzIGZvciB0aGUgc2VydmVyJ3Ncbi8vIHJlYWR5IGV2ZW50LCBhbmQgdGhlbiBwcm9jZWVkcyB0byBsaXN0ZW4gdG8gdGhlIGV2ZW50c1xuLy8gKF9fY3JlYXRlX18sIF9fZ2V0X18sIF9fdXBkYXRlX18sIF9fcmVtb3ZlX18pIFxuLy8gZm9yIHRoYXQgbmFtZSBhbmQgY3JlYXRlcyBhIHNldCBvZiBtZXRob2RzIHRvIG1hbmlwdWxhdGUgXG4vLyB0aGUgZGF0YSBvdmVyIHRoZSBzb2NrZXQgY29ubmVjdGlvbi5cblxuLy8gRmluYWxseSwgYSBkeW5hbWljIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1vZGVsc1xuLy8gZnJvbSB0aGUgY29sbGVjdGlvbiBpcyByZXR1cm5lZCwgd2l0aCBjcmVhdGUsIHVwZGF0ZVxuLy8gYW5kIHJlbW92ZSBtZXRob2RzIHRhY2tlZCBvbiB0byBpdC4gVGhpcyBjYW4gYmUgdXNlZFxuLy8gYm91bmQgc3RyYWlnaHQgdG8gdGhlIERPTSBmcm9tIGNvbnRyb2xsZXJzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFkbWluU29ja2V0KSB7XG5cbiAgLy8gU3RvcmUgYWxsIGF2YWlsYWJsZSBjb2xsZWN0aW9ucyBpbiBoZXJlLlxuICB2YXIgY29sbGVjdGlvbnMgPSB7fTtcblxuXG4gIC8vIEZpbmQgYW5kIHJldHVybiBhIG1vZGVsIGZyb20gYSBjb2xsZWN0aW9uXG4gIC8vIGJhc2VkIG9uIHRoZSBfaWQgcHJvcGVydHkgb2YgdGhlIHF1ZXJ5IFxuICAvLyBvYmplY3QuIF8oUXVlcnkgb2JqZWN0IG5vcm1hbGx5IGNvbWVzIGZyb21cbiAgLy8gdGhlIGRhdGFiYXNlKV9cbiAgZnVuY3Rpb24gZmluZChjb2xsZWN0aW9uLCBxdWVyeSkge1xuICAgIHZhciBpO1xuICAgIGZvcihpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25baV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgdmFyIGksIGluZGV4O1xuICAgIGZvcihpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgaW5kZXggPSBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHR5cGVvZiBpbmRleCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbGxlY3Rpb24uc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kIHRvIHByb3ZpZGUgY2xlYW4gbG9va2luZ1xuICAvLyBuYW1lcyBmb3Igc29ja2V0IGV2ZW50c1xuICBmdW5jdGlvbiBldmVudHMobmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IG5hbWUgKyAnL2dldCcsXG4gICAgICBjcmVhdGU6IG5hbWUgKyAnL2NyZWF0ZScsXG4gICAgICByZW1vdmU6IG5hbWUgKyAnL3JlbW92ZScsXG4gICAgICB1cGRhdGU6IG5hbWUgKyAnL3VwZGF0ZSdcbiAgICB9XG4gIH1cbiAgXG4gIC8vIFJlbW92ZXMgYWxsIGFuZ3VsYXIgcHJvcGVydGllcyBmcm9tXG4gIC8vIGFuIG9iamVjdCwgc28gdGhhdCBpdCBtYXkgYmUgdXNlZCBmb3JcbiAgLy8gcXVlcnlpbmcgYXQgbW9uZ29cbiAgZnVuY3Rpb24gc2FuaXRpemUob2JqZWN0KSB7XG4gICAgdmFyIGtleSwgc2FuaXRpemVkO1xuICAgIHNhbml0aXplZCA9IHt9O1xuICAgIGZvcihrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBpZihrZXlbMF0gIT09ICckJykge1xuICAgICAgICBzYW5pdGl6ZWRba2V5XSA9IG9iamVjdFtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2FuaXRpemVkO1xuICB9XG5cbiAgLy8gQ3JlYXRlcyBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb24gd2l0aCB0aGlzIG5hbWVcbiAgLy8gYW5kIHJldHVybnMgZHluYW1pYyBjb2xsZWN0aW9uIGFycmF5IGFsb25nXG4gIC8vIHdpdGggY29sbGVjdGlvbiBtYW5pcHVsYXRpb24gbWV0aG9kcy4gU2VlXG4gIC8vIG1vZHVsZSBkb2MgY29tbWVudCBmb3IgbW9yZSBkZXRhaWxzLiBcbiAgZnVuY3Rpb24gbW9kZWwobmFtZSkge1xuICAgIHZhciBjb2xsZWN0aW9uLCBzb2NrZXQsIGV2ZW50LCBsaXN0ZW5lcnM7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoaXMgY29sbGVjdGlvblxuICAgIGlmKGNvbGxlY3Rpb25zW25hbWVdKSB7XG4gICAgICAvL3JldHVybiBpdCBzdHJhaWdodCBhd2F5XG4gICAgICBjb25zb2xlLmxvZygnbG9hZCcsIG5hbWUpO1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvLyBldmVudCBsaXN0ZW5lcnNcbiAgICBsaXN0ZW5lcnMgPSB7fTtcblxuICAgIC8vIGFsaWFzaW5nXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBpZihzb2NrZXQucmVhZHkpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyAjIyBTb2NrZXQgRXZlbnRzXG5cbiAgICBzb2NrZXQub24oZXZlbnQuZ2V0LCBmdW5jdGlvbihtb2RlbHMpIHtcbiAgICAgIGNvbGxlY3Rpb24ubGVuZ3RoID0gMDtcbiAgICAgIC8vIEkgYmVsaWV2ZSB0aGVyZSdzIHNvbWUgZXhwbGFpbmluZyB0byBkbyBoZXJlLlxuICAgICAgY29sbGVjdGlvbi5wdXNoLmFwcGx5KGNvbGxlY3Rpb24sIG1vZGVscy5kYXRhKTtcbiAgICAgIGNvbGxlY3Rpb24uZm9jdXMoY29sbGVjdGlvblswXS5faWQpO1xuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdnZXQnLCBtb2RlbHMpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmNyZWF0ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGNvbGxlY3Rpb24ucHVzaChtb2RlbC5kYXRhKTtcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignY3JlYXRlJywgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnJlbW92ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIG1vZGVsID0gbW9kZWwuZGF0YTtcbiAgICAgIHJlbW92ZShjb2xsZWN0aW9uLCBtb2RlbCk7ICBcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcigncmVtb3ZlJywgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnVwZGF0ZSwgZnVuY3Rpb24odXBkYXRlZCkge1xuICAgICAgdmFyIGtleSwgbW9kZWw7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5kYXRhO1xuXG4gICAgICAvLyBfX0ltcG9ydGFudF9fIHRvIHJlYWQhXG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdmFsdWVzIG9mIHRoZSBtb2RlbFxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24sIHdlIGNhbiBhY2Nlc3MgaXQgdXNpbmcgZmluZFxuICAgICAgbW9kZWwgPSBmaW5kKGNvbGxlY3Rpb24sIHVwZGF0ZWQpO1xuICAgICAgaWYobW9kZWwpIHsgXG4gICAgICAgIC8vIFdlIGNhbid0IHNldCB0aGUgdmFsdWUgb2YgbW9kZWwgdG8gXG4gICAgICAgIC8vIHVwZGF0ZWQgYXMgdGhhdCB3aWxsIG92ZXJ3cml0ZSB0aGUgcmVmZXJlbmNlLlxuICAgICAgICAvLyBXZSBuZWVkIHRvIGxvb3AgdGhyb3VnaCBhbmQgdXBkYXRlIHRoZVxuICAgICAgICAvLyBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3Qgb25lIGJ5IG9uZS5cbiAgICAgICAgZm9yKGtleSBpbiB1cGRhdGVkKSB7XG4gICAgICAgICAgbW9kZWxba2V5XSA9IHVwZGF0ZWRba2V5XTtcbiAgICAgICAgfVxuICAgICAgICAvLyBBbmQgd2UncmUgZG9uZSFcbiAgICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCd1cGRhdGUnLCBtb2RlbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyAjIyBFeHBvc2VkIG1ldGhvZHMgIFxuICBcbiAgICBjb2xsZWN0aW9uLmNyZWF0ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5jcmVhdGUsIG1vZGVsKTtcbiAgICB9O1xuICAgIFxuICAgIGNvbGxlY3Rpb24ucmVtb3ZlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIG1vZGVsID0gc2FuaXRpemUobW9kZWwpO1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQucmVtb3ZlLCBtb2RlbCk7XG4gICAgfTtcblxuICAgIGNvbGxlY3Rpb24udXBkYXRlID0gZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIHZhciBrZXksIHZhbHVlcztcbiAgICAgIHZhbHVlcyA9IHt9XG5cbiAgICAgIC8vIGlmIHRoZSBzYW1lIG9iamVjdCB3YXMgcGFzc2VkIHR3aWNlXG4gICAgICBpZihtb2RlbCA9PT0gdXBkYXRlZCkge1xuICAgICAgICBtb2RlbCA9IF8uY29weSh1cGRhdGVkKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb25seSBuZWVkIHRoZSBpZCB0byBtYWtlIHRoZSB1cGRhdGVcbiAgICAgIG1vZGVsID0ge1xuICAgICAgICBfaWQ6IG1vZGVsLl9pZFxuICAgICAgfVxuXG4gICAgICAvLyBzdHJpcCBtb25nby9hbmd1bGFyIHByb3BlcnRpZXNcbiAgICAgIGZvcihrZXkgaW4gdXBkYXRlZCkge1xuICAgICAgICBpZighKGtleVswXSA9PT0gJyQnIHx8IGtleVswXSA9PT0gJ18nKSkge1xuICAgICAgICAgIHZhbHVlc1trZXldID0gdXBkYXRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzb2NrZXQuZW1pdChldmVudC51cGRhdGUsIG1vZGVsLCB2YWx1ZXMpO1xuICAgIH07IFxuXG4gICAgY29sbGVjdGlvbi5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgIGlmKCEobGlzdGVuZXJzW2V2ZW50TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdLnB1c2goZm4pO1xuICAgIH07XG5cbiAgICBjb2xsZWN0aW9uLnRyaWdnZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGRhdGEpIHtcbiAgICAgIGRhdGEgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZihsaXN0ZW5lcnNbZXZlbnROYW1lXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBjb2xsZWN0aW9uLmZvY3VzID0gZnVuY3Rpb24oX2lkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZm9jdXMgb24nLCBfaWQpO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IF9pZCkge1xuICAgICAgICAgIGNvbGxlY3Rpb24uZm9jdXNlZCA9IF8uY29weShjb2xsZWN0aW9uW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdmb2N1cycsIGNvbGxlY3Rpb24uZm9jdXNlZCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHRoZSBpdGVtIHRoYXQgY3VycmVudGx5IGhhcyBmb2N1c1xuICAgIGNvbGxlY3Rpb24uZm9jdXNlZCA9IHt9O1xuICBcbiAgICAvLyBSZXZlYWwgdGhlIG5hbWUgb2YgdGhpcyBjb2xsZWN0aW9uXG4gICAgY29sbGVjdGlvbi5uYW1lID0gbmFtZTtcbiAgICBcbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBtb2RlbDtcbn07XG4iLCJcbi8vIFNvY2tldCBXcmFwcGVyXG4vLyAtLS0tLS0tLS0tLS0tLVxuXG4vLyBBY3RzIGFzIGEgd3JhcHBlciBhcm91bmQgc29ja2V0RmFjdG9yeVxuLy8gYW5kIGV4cG9zZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgY3JlYXRlXG4vLyBuYW1lc3BhY2VkIHNvY2tldHMsIGJhc2VkIG9uIGEgcGFyYW1ldGVyLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iLCJcbi8vIFN0b3JhZ2UgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGxvY2FsU3RvcmFnZSBzdXBwb3J0IHdpdGggYSBjb29raWVcbi8vIGJhc2VkIGZhbGxiYWNrLiBcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNhY2hlLCBzdG9yYWdlLCBpZDtcbiAgXG4gIGlkID0gJ2F1ZGlvLWRyb3Atc3RvcmFnZSc7XG4gIHN0b3JhZ2UgPSB3aGljaCgpO1xuXG4gIC8vIERldGVybWluZXMgd2hpY2ggdHlwZSBvZiBzdG9yYWdlXG4gIC8vIGlzIGF2YWlsYWJsZSBhbmQgcmV0dXJucyBhIGpRdWVyeVxuICAvLyBzdHlsZSBnZXR0ZXIvc2V0dGVyIGZvciBpdCdzIHZhbHVlLlxuICBmdW5jdGlvbiB3aGljaCgpIHtcbiAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlW2lkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2VbaWRdID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBMb2FkIHRoZSBjb250ZW50cyBmcm9tIHdoaWNoZXZlclxuICAvLyBzdG9yYWdlIGlzIGF2YWlhYmxlLiBJZiBKU09OIHBhcnNlXG4gIC8vIHRocm93cyBhbiBleGNlcHRpb24sIHRoZW4gdGhlIHZhbHVlXG4gIC8vIHdhcyB1bmRlZmluZWQsIHNvIGluc3RlYWQgY2FjaGUgYW5cbiAgLy8gZW1wdHkgb2JqZWN0LlxuICBmdW5jdGlvbiBsb2FkKCkge1xuICAgIHRyeSB7XG4gICAgICBjYWNoZSA9IEpTT04ucGFyc2Uoc3RvcmFnZSgpKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGNhY2hlID0ge307XG4gICAgfVxuICAgIHJldHVybiBjYWNoZTtcbiAgfVxuXG4gIC8vIFNhdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjYWNoZVxuICAvLyBpbnRvIHN0b3JhZ2VcbiAgZnVuY3Rpb24gc2F2ZSgpIHtcbiAgICBzdG9yYWdlKEpTT04uc3RyaW5naWZ5KGNhY2hlKSk7XG4gIH1cblxuICAvLyBTZXQgYSB2YWx1ZSB3aXRoaW4gdGhlIGNhY2hlXG4gIC8vIGJhc2VkIG9uIGEga2V5IGFuZCB0aGVuIHNhdmUgaXQuXG4gIGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgY2FjaGVba2V5XSA9IHZhbHVlO1xuICAgIHNhdmUoKTtcbiAgfVxuXG4gIC8vIEdldCBhIHZhbHVlIGZyb20gdGhlIGNhY2hlXG4gIGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgfSBcblxuICAvLyBFeHBvc2UgZ2V0IGFuZCBzZXQgbWV0aG9kc1xuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0XG4gIH1cbn07XG4iLCIvLyB1aVN0YXRlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBIHRpbnkgZmFjdG9yeSBmb3IgbWFpbnRhaW5pbmcgdGhlXG4vLyBzdGF0ZSBvZiB0aGUgVUkgYXQgYW55IHRpbWUuIFRoZSBuYW1lXG4vLyBvZiB0aGUgdWkgaW4gcXVlc3Rpb24gc2hvdWxkIGJlIHBhc3NlZFxuLy8gdG8gdGhlIHNhdmUgbWV0aG9kIHRvIHBlcnNpc3QgaXQuXG5cbi8vIFRoZSBzdGF0ZSBjYW4gdGhlbiBiZSByZWxvYWRlZCBhdCBhbnlcbi8vIHRpbWUgaW4gdGhlIGZ1dHVyZS5cblxuLy8gX19JbXBvcnRhbnRfXyBUaGlzIGRvZXMgbm90IGNoYW5nZVxuLy8gdGhlIERPTSBfX2F0IGFsbF9fLiBJdCBqdXN0IHNhdmVzXG4vLyBhIEpTT04gb2JqZWN0IHdoaWNoIGNhbiB0aGVuIGJlIHVzZWRcbi8vIHdpdGggYW5ndWxhciB0byBvcHRpb25hbGx5IHNob3cvaGlkZVxuLy8gb3IgYXBwbHkgY2xhc3NlcyB0byB1aSBlbGVtZW50cy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdG9yYWdlKSB7XG4gIHJldHVybiB7XG4gICAgc2F2ZTogZnVuY3Rpb24odWksIHN0YXRlKSB7XG4gICAgICBzdG9yYWdlLnNldCh1aSwgc3RhdGUpOyAgXG4gICAgfSxcbiAgICBsb2FkOiBmdW5jdGlvbih1aSkge1xuICAgICAgcmV0dXJuIHN0b3JhZ2UuZ2V0KHVpKTtcbiAgICB9XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IF8gPSB7XG4gIGNvcHk6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBrZXksIGR1cGxpY2F0ZSA9IHt9O1xuICAgIGZvcihrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBkdXBsaWNhdGVba2V5XSA9IG9iamVjdFtrZXldXG4gICAgfVxuICAgIHJldHVybiBkdXBsaWNhdGU7XG4gIH1cbn1cbiJdfQ==
