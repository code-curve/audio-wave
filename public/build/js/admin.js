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

// Filters
// -------

filter({
  // Converts seconds to minutes
  'minutes': require('./filters/minutes')
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
  // Playing audio
  'playback': require('./directives/playback'),
  // Interface for creating items for collections
  'creator': require('./directives/creator'),
  // Console for server communication
  'console': require('./directives/console'),
  // Searchable collection interface 
  'collection': require('./directives/collection')
});




},{"./controllers/AudioController":2,"./controllers/ComposeController":3,"./controllers/SessionsController":4,"./controllers/UsersController":5,"./directives/collection":6,"./directives/console":7,"./directives/creator":8,"./directives/editor":9,"./directives/playback":10,"./directives/uploadAudio":11,"./filters/minutes":12,"./services/adminSocket":13,"./services/collection":14,"./services/socket":15,"./services/storage":16,"./services/uiState":17}],2:[function(require,module,exports){
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


},{"../util":18}],9:[function(require,module,exports){

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
  return {
    restrict:'A',
    templateUrl: 'partials/audio/play',
    controller: function($scope, $interval, collection) {
      var audioCollection, update;
      
      audioCollection = collection('audio');
      
      $scope.audio = null;
      $scope.playing = false;
      $scope.progress = 0;
      $scope.name = '';
      $scope.duration = '';

      audioCollection.on('focus', function(audio) {
        
        // Totally reset the current audio
        if($scope.playing) {
          $scope.playing = false;
          $scope.audio.pause();
          $scope.progress = 0;
          delete $scope.audio;
          $interval.cancel(update);
        }
        
        $scope.name = audio.name;
        $scope.duration = audio.duration;
        $scope.audio = new Audio('audio/play/' + audio._id);
        $scope.audio.addEventListener('ended', $scope.stop);
        $scope.refreshProgress();
      });
        
      $scope.play = function() {
        $scope.playing = true;
        $scope.audio.play();
      };

      $scope.pause = function() {
        $scope.playing = false;
        $scope.audio.pause();
      };

      $scope.stop = function() {
        $scope.playing = false;
        $scope.progress = 0;
        $scope.audio.pause();
        $scope.audio.currentTime = 0;
      };

      $scope.progression = function() {
        var progress;
        progress = $scope.audio.currentTime / $scope.audio.duration;
        $scope.progress = progress * 100;
      };
      
      $scope.refreshProgress = function() {
        update = $interval($scope.progression, 500);
      };
    }
  }
}

},{}],11:[function(require,module,exports){
module.exports = function() {
  console.log('upload directive');
  return {
    restrict: 'A',
    templateUrl: 'partials/audio/upload',
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

},{}],12:[function(require,module,exports){
var _ = require('../util');

module.exports = function() {
  return function(_seconds) {    
    var minutes, seconds;
    
    if(_.undef(_seconds) || isNaN(_seconds)) {
      return '00:00';
    }

    minutes = Math.floor(_seconds / 60);
    seconds = Math.floor(((_seconds / 60) - minutes) * 60);

    seconds = seconds > 9 ? seconds : '0' + seconds;

    return minutes + ':' + seconds;
  }
}

},{"../util":18}],13:[function(require,module,exports){

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

},{}],14:[function(require,module,exports){
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

},{"../util":18}],15:[function(require,module,exports){

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

},{}],16:[function(require,module,exports){

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

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
module.exports = _ = {
 
  // # args
  // `(_args)`
  // Takes a javascript arguments object
  // and converts it into a standard array.
  args: function(_args) {
    return Array.prototype.slice.call(_args)
  },

  // # type
  // `(variable, type)`
  // Checks whether the type of `variable`
  // is the type specified within `type`.
  type: function(variable, type) {
    if(!type) return typeof variable;
    else return typeof variable === type;
  },
  
  // # undef
  // `(variable`)
  // `(var1, var2, var3, ...)`
  // `([var1, var2, var3, ...]`
  // Provides a quick way to check whether a
  // variable (or a collection of variables) is
  // undefined. Arguments can be passed as in 
  // any of the above forms.
  undef: function(variables) {
    if(!(variables instanceof Array)) variables = _.args(arguments);
    return variables.reduce(function(state, variable) {
      return state && _.type(variable, 'undefined');
    }, true);
  },
  
  copy: function(object) {
    var key, duplicate = {};
    for(key in object) {
      duplicate[key] = object[key]
    }
    return duplicate;
  }
}

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvY3JlYXRvci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9lZGl0b3IuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvcGxheWJhY2suanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvdXBsb2FkQXVkaW8uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2ZpbHRlcnMvbWludXRlcy5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvYWRtaW5Tb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL2NvbGxlY3Rpb24uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3NvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc3RvcmFnZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvdWlTdGF0ZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBZG1pblxuLy8gLS0tLS1cblxuLy8gVGhlIGFkbWluIGFwcGxpY2F0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nXG4vLyB0cmFjayBvZiBhbGwgc2Vzc2lvbnMsIGRldmljZXMsIGF1ZGlvIGZpbGVzIGFuZFxuLy8gY29tcG9zZWQgc29uZ3MuXG4vLyBcbi8vIEl0IGFsc28gcHJvdmlkZXMgYSBjb25zb2xlIGZvciB0YWxraW5nIHRvIHRoZVxuLy8gc2VydmVyIGFuZCB0aGUgY29tcG9zZSBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nXG4vLyBzb25nIGZpbGVzIGZyb20gdGhlIGF2YWlsYWJsZSBhdWRpbyBmaWxlcy5cbi8vXG5cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbicsIFsnbmdSb3V0ZScsICdidGZvcmQuc29ja2V0LWlvJywgJ2FuZ3VsYXJGaWxlVXBsb2FkJ10pLlxuXG5jb25maWcoZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcbiAgJHJvdXRlUHJvdmlkZXIuXG4gIHdoZW4oJy9zZXNzaW9ucycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9zZXNzaW9ucycsXG4gICAgY29udHJvbGxlcjogJ1Nlc3Npb25zQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9hdWRpbycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hdWRpbycsXG4gICAgY29udHJvbGxlcjogJ0F1ZGlvQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy91c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy91c2VycycsXG4gICAgY29udHJvbGxlcjogJ1VzZXJzQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9jb21wb3NlJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2NvbXBvc2UnLFxuICAgIGNvbnRyb2xsZXI6ICdDb21wb3NlQ29udHJvbGxlcidcbiAgfSkuXG4gIG90aGVyd2lzZSh7XG4gICAgcmVkaXJlY3RUbzogJy9zZXNzaW9ucydcbiAgfSk7XG59KS5cblxuLy8gRmlsdGVyc1xuLy8gLS0tLS0tLVxuXG5maWx0ZXIoe1xuICAvLyBDb252ZXJ0cyBzZWNvbmRzIHRvIG1pbnV0ZXNcbiAgJ21pbnV0ZXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbWludXRlcycpXG59KS5cblxuLy8gU2VydmljZXNcbi8vIC0tLS0tLS0tXG5cbmZhY3Rvcnkoe1xuICAvLyBMb2NhbHN0b3JhZ2UgKyBjb29raWUgc2hpbVxuICAnc3RvcmFnZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvc3RvcmFnZScpLFxuICAvLyBNYWludGFpbiBzdGF0ZSBvZiB1aVxuICAndWlTdGF0ZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvdWlTdGF0ZScpLFxuICAvLyBXZWIgc29ja2V0IHdyYXBwZXJcbiAgJ3NvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvc29ja2V0JyksXG4gIC8vIFNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbiAgJ2FkbWluU29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpLFxuICAvLyBDb2xsZWN0aW9uIG1haW50YWluZXJcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL3NlcnZpY2VzL2NvbGxlY3Rpb24nKVxufSkuXG5cbi8vIENvbnRyb2xsZXJzXG4vLyAtLS0tLS0tLS0tLVxuXG5jb250cm9sbGVyKHtcbiAgLy8gTWFuYWdlIGRldmljZXMgaW4gc2Vzc2lvbnNcbiAgJ1Nlc3Npb25zQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyJyksXG4gIC8vIENvbXBvc2l0aW9uIG9mIHNvbmcgZmlsZXNcbiAgJ0NvbXBvc2VDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgYWRtaW5pc3RyYXRvcnMgYW5kIHJlZ2lzdGVyZWQgdXNlcnNcbiAgJ1VzZXJzQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvVXNlcnNDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSB1cGxvYWRlZCBhdWRpbyB0cmFja3NcbiAgJ0F1ZGlvQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyJylcbn0pLlxuXG4vLyBEaXJlY3RpdmVzXG4vLyAtLS0tLS0tLS0tXG5cbmRpcmVjdGl2ZSh7XG4gICd1cGxvYWRBdWRpbyc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy91cGxvYWRBdWRpbycpLFxuICAvLyBJbnRlcmZhY2UgZm9yIGVkaXRpbmcgY29sbGVjdGlvbnNcbiAgJ2VkaXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9lZGl0b3InKSxcbiAgLy8gUGxheWluZyBhdWRpb1xuICAncGxheWJhY2snOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvcGxheWJhY2snKSxcbiAgLy8gSW50ZXJmYWNlIGZvciBjcmVhdGluZyBpdGVtcyBmb3IgY29sbGVjdGlvbnNcbiAgJ2NyZWF0b3InOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY3JlYXRvcicpLFxuICAvLyBDb25zb2xlIGZvciBzZXJ2ZXIgY29tbXVuaWNhdGlvblxuICAnY29uc29sZSc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb25zb2xlJyksXG4gIC8vIFNlYXJjaGFibGUgY29sbGVjdGlvbiBpbnRlcmZhY2UgXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbGxlY3Rpb24nKVxufSk7XG5cblxuXG4iLCIvKipcbiAqIFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiAgXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcblxufTtcbiIsIlxuLy8gQ29sbGVjdGlvbiBkaXJlY3RpdmVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEFkZCB0aGUgYXR0cmlidXRlIGNvbGxlY3Rpb24gdG8gYW4gZWxlbWVudCBhbmQgXG4vLyBzcGVjaWZ5IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGluIGEgJ2NvbGxlY3Rpb24tbmFtZScgXG4vLyBhdHRyaWJ1dGUsIGFuZCB0aGlzIGRpcmVjdGl2ZSB3aWxsIGNyZWF0ZSBhIHNlYXJjaGFibGUsIFxuLy8gc3luY2hyb25pemVkIGRhdGEgdmlldyBvZiB0aGF0IGNvbGxlY3Rpb24uXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbGxlY3Rpb24nLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHsgXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgXG4gICAgICAkc2NvcGUuZm9jdXMgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICAkc2NvcGUubW9kZWxzLmZvY3VzID0gaWQ7XG4gICAgICB9O1xuICAgICAgICAgICAgICBcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5uYW1lLCAnZGlyZWN0aXZlIGNvbnRyb2xsZXInKTtcbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1aVN0YXRlKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbnNvbGUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIHZhciBzaG93aW5nLCB1aUtleTtcblxuICAgICAgdWlLZXkgPSAnY29uc29sZS1zdGF0ZSdcbiAgICAgIHNob3dpbmcgPSAodWlTdGF0ZS5sb2FkKHVpS2V5KSB8fCBmYWxzZSk7XG4gICAgIFxuICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gXG4gICAgICBmdW5jdGlvbiBjaGVja1Zpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmKHNob3dpbmcpIHtcbiAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9IFxuICAgICAgfVxuICAgICAgICBcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSAgIHtcbiAgICAgICAgLy8gVG9nZ2xlIG9uIGAga2V5XG4gICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTkyKSB7XG4gICAgICAgICAgc2hvd2luZyA9ICFzaG93aW5nO1xuICAgICAgICAgIHVpU3RhdGUuc2F2ZSh1aUtleSwgc2hvd2luZyk7XG4gICAgICAgIFxuICAgICAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuICAgICAgICAgIC8vIEdpdmUgZm9jdXMgdG8gaW5wdXQgXG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgICAgLy8gU3RvcCBgIGJlaW5nIGluc2VydGVkIGludG8gY29uc29sZVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBhZG1pblNvY2tldCkge1xuICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgJHNjb3BlLm1lc3NhZ2VzID0gW107XG4gICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIFxuICAgICAgYWRtaW5Tb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkZWxlbWVudFswXS5zY3JvbGxUb3AgPSAkZWxlbWVudFswXS5zY3JvbGxIZWlnaHRcbiAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG4gICAgICB9O1xuICAgICAgIFxuICAgICAgJHNjb3BlLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmFkZE1lc3NhZ2Uoe1xuICAgICAgICAgIGJvZHk6ICRzY29wZS5pbnB1dFxuICAgICAgICB9KTtcbiAgICAgICAgYWRtaW5Tb2NrZXQuZW1pdCgnbWVzc2FnZScsICRzY29wZS5pbnB1dCk7XG4gICAgICAgICRzY29wZS5jbGVhcigpO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuXG4gIFxuIiwiXG4vLyBDcmVhdG9yXG4vLyAtLS0tLS0tXG4gXG4vLyBQcm92aWRlcyBhbiBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nIGl0ZW1zIFxuLy8gZnJvbSBhIGNvbGxlY3Rpb24gc2VydmljZS5cblxudmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NyZWF0b3InLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbjtcbiAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIGVkaXRvclxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIG5hbWUgZnJvbVxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBhbmQgYmluZCBpdCB0b1xuICAgICAgLy8gdGhlIHNjb3BlLiBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAgXG4gICAgICAvLyBJbml0aWFsIHNjaGVtYSBmb3IgY3JlYXRpb25cbiAgICAgICRzY29wZS5zY2hlbWEgPSB7fTsgXG4gICAgICAvLyBBY3R1YWwgbW9kZWwgYm91bmQgdG8gaW5wdXRcbiAgICAgICRzY29wZS5pbnN0YW5jZSA9IHt9O1xuICAgICAgLy8gU2F2aW5nIHN0YXRlXG4gICAgICAkc2NvcGUuY3JlYXRpbmcgPSBmYWxzZTtcblxuICAgICAgJHNjb3BlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkgeyAgICBcbiAgICAgICAgJHNjb3BlLmNyZWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24uY3JlYXRlKCRzY29wZS5pbnN0YW5jZSk7XG4gICAgICB9O1xuICAgICAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignZ2V0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGlmKCRzY29wZS5jb2xsZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAkc2NvcGUuc2NoZW1hID0gXy5jb3B5KCRzY29wZS5jb2xsZWN0aW9uWzBdKTtcbiAgICAgICAgICAvLyBObyBuZWVkIGZvciBtb25nbyBpZHMgaGVyZVxuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUuc2NoZW1hLl9pZDtcbiAgICAgICAgfVxuXG4gICAgICAgICRzY29wZS5pbnN0YW5jZSA9ICRzY29wZS5zY2hlbWE7XG4gICAgICAgIGZvcihrZXkgaW4gJHNjb3BlLmluc3RhbmNlKSB7XG4gICAgICAgICAgJHNjb3BlLmluc3RhbmNlW2tleV0gPSAnJztcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCdjcmVhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0aW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiBcbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vLyBFZGl0b3Jcbi8vIC0tLS0tLVxuIFxuLy8gUHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciB1cGRhdGluZyBhbmQgXG4vLyBtb2RpZnlpbmcgaXRlbXMgZnJvbSBhIGNvbGxlY3Rpb24gc2VydmljZS5cbi8vXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2VkaXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnRWRpdG9yJyk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICAgXG4gICAgICAvLyBHZXQgdGhlIGNvbGxlY3Rpb24gZm9yIHRoaXMgbmFtZSBmcm9tXG4gICAgICAvLyB0aGUgY29sbGVjdGlvbiBmYWN0b3J5IGFuZCBiaW5kIGl0IHRvXG4gICAgICAvLyB0aGUgc2NvcGUuIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgIFxuICAgICAgJHNjb3BlLm1vZGVsID0ge307XG4gICBcbiAgICAgICRzY29wZS5zYXZpbmcgPSBmYWxzZTtcbiAgICAgIFxuICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbi5yZW1vdmUoJHNjb3BlLm1vZGVsKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtb2RlbCA9ICRzY29wZS5tb2RlbDtcbiAgICAgICAgY29uc29sZS5sb2coJ2VkaXRlZCcsICRzY29wZS5tb2RlbCk7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uLnVwZGF0ZShtb2RlbCwgbW9kZWwpO1xuICAgICAgICAkc2NvcGUuc2F2aW5nID0gdHJ1ZTsgXG4gICAgICB9O1xuICAgICAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbigndXBkYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zYXZpbmcgPSBmYWxzZTtcbiAgICAgIH0pO1xuICBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCdmb2N1cycsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICAgICRzY29wZS5tb2RlbCA9IG1vZGVsO1xuICAgICAgfSk7XG5cbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDonQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9hdWRpby9wbGF5JyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRpbnRlcnZhbCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGF1ZGlvQ29sbGVjdGlvbiwgdXBkYXRlO1xuICAgICAgXG4gICAgICBhdWRpb0NvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCdhdWRpbycpO1xuICAgICAgXG4gICAgICAkc2NvcGUuYXVkaW8gPSBudWxsO1xuICAgICAgJHNjb3BlLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgICRzY29wZS5wcm9ncmVzcyA9IDA7XG4gICAgICAkc2NvcGUubmFtZSA9ICcnO1xuICAgICAgJHNjb3BlLmR1cmF0aW9uID0gJyc7XG5cbiAgICAgIGF1ZGlvQ29sbGVjdGlvbi5vbignZm9jdXMnLCBmdW5jdGlvbihhdWRpbykge1xuICAgICAgICBcbiAgICAgICAgLy8gVG90YWxseSByZXNldCB0aGUgY3VycmVudCBhdWRpb1xuICAgICAgICBpZigkc2NvcGUucGxheWluZykge1xuICAgICAgICAgICRzY29wZS5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLmF1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gMDtcbiAgICAgICAgICBkZWxldGUgJHNjb3BlLmF1ZGlvO1xuICAgICAgICAgICRpbnRlcnZhbC5jYW5jZWwodXBkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgJHNjb3BlLm5hbWUgPSBhdWRpby5uYW1lO1xuICAgICAgICAkc2NvcGUuZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbjtcbiAgICAgICAgJHNjb3BlLmF1ZGlvID0gbmV3IEF1ZGlvKCdhdWRpby9wbGF5LycgKyBhdWRpby5faWQpO1xuICAgICAgICAkc2NvcGUuYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCAkc2NvcGUuc3RvcCk7XG4gICAgICAgICRzY29wZS5yZWZyZXNoUHJvZ3Jlc3MoKTtcbiAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICRzY29wZS5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5wbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmF1ZGlvLnBsYXkoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUucGxheWluZyA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuYXVkaW8ucGF1c2UoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IDA7XG4gICAgICAgICRzY29wZS5hdWRpby5wYXVzZSgpO1xuICAgICAgICAkc2NvcGUuYXVkaW8uY3VycmVudFRpbWUgPSAwO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnByb2dyZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwcm9ncmVzcztcbiAgICAgICAgcHJvZ3Jlc3MgPSAkc2NvcGUuYXVkaW8uY3VycmVudFRpbWUgLyAkc2NvcGUuYXVkaW8uZHVyYXRpb247XG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IHByb2dyZXNzICogMTAwO1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLnJlZnJlc2hQcm9ncmVzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB1cGRhdGUgPSAkaW50ZXJ2YWwoJHNjb3BlLnByb2dyZXNzaW9uLCA1MDApO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCd1cGxvYWQgZGlyZWN0aXZlJyk7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2F1ZGlvL3VwbG9hZCcsXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkdXBsb2FkLCAkdGltZW91dCkge1xuICAgICAgXG4gICAgICBmdW5jdGlvbiByZW1vdmUoZmlsZSkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgJHNjb3BlLmZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYoJHNjb3BlLmZpbGVzW2ldID09PSBmaWxlKSB7XG4gICAgICAgICAgICAkc2NvcGUuZmlsZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1cGxvYWQoZmlsZSkge1xuICAgICAgICBmaWxlLnVwbG9hZGVkID0gZmFsc2U7XG5cbiAgICAgICAgJHVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogJy91cGxvYWQvYXVkaW8nLFxuICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgfSkucHJvZ3Jlc3MoZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSAxMDAgKiAoZS5sb2FkZWQgLyBlLnRvdGFsKTsgXG4gICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgaWYocmVzLnN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICBmaWxlLnVwbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIC8vIEdldCByaWQgb2YgdGhlIHN1Y2Nlc3Mgbm90aWZpY2F0aW9uXG4gICAgICAgICAgICAkdGltZW91dChyZW1vdmUuYmluZCh0aGlzLCBmaWxlKSwgNTAwMCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbGUuZXJyb3IgPSByZXMuZGF0YS5tZXNzYWdlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oZGF0YSwgc3RhdHVzKSB7XG4gICAgICAgICAgZmlsZS5lcnJvciA9ICdUaGVyZSB3YXMgYSBwcm9ibGVtIHVwbG9hZGluZy4nO1xuICAgICAgICB9KTtcblxuICAgICAgfVxuXG4gICAgICAkc2NvcGUuZmlsZXMgPSBbXTtcblxuICAgICAgJHNjb3BlLnVwbG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgJHNjb3BlLmZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdXBsb2FkKCRzY29wZS5maWxlc1tpXSk7ICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbigkZmlsZXMpIHtcbiAgICAgICAgJHNjb3BlLmZpbGVzID0gJGZpbGVzO1xuICAgICAgICAkc2NvcGUuZmlsZXMubWFwKGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICBmaWxlLnByb2dyZXNzID0gMDtcbiAgICAgICAgICBmaWxlLnVwbG9hZGVkID0gZmFsc2U7XG4gICAgICAgICAgZmlsZS5lcnJvciA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgIH1cbiAgfVxufVxuIiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihfc2Vjb25kcykgeyAgICBcbiAgICB2YXIgbWludXRlcywgc2Vjb25kcztcbiAgICBcbiAgICBpZihfLnVuZGVmKF9zZWNvbmRzKSB8fCBpc05hTihfc2Vjb25kcykpIHtcbiAgICAgIHJldHVybiAnMDA6MDAnO1xuICAgIH1cblxuICAgIG1pbnV0ZXMgPSBNYXRoLmZsb29yKF9zZWNvbmRzIC8gNjApO1xuICAgIHNlY29uZHMgPSBNYXRoLmZsb29yKCgoX3NlY29uZHMgLyA2MCkgLSBtaW51dGVzKSAqIDYwKTtcblxuICAgIHNlY29uZHMgPSBzZWNvbmRzID4gOSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xuXG4gICAgcmV0dXJuIG1pbnV0ZXMgKyAnOicgKyBzZWNvbmRzO1xuICB9XG59XG4iLCJcbi8vIGFkbWluU29ja2V0IEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gUHJvdmlkZXMgYSBzb2NrZXQgdGhhdCdzIGNvbm5lY3RlZFxuLy8gdG8gdGhlIGFkbWluIGNoYW5uZWwuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0KSB7XG4gIHZhciBhZG1pblNvY2tldCA9IHNvY2tldCgnYWRtaW4nKTtcbiAgYWRtaW5Tb2NrZXQucmVhZHkgPSBmYWxzZTtcbiAgXG4gIGFkbWluU29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgIGFkbWluU29ja2V0LnJlYWR5ID0gdHJ1ZTtcbiAgfSk7XG4gIFxuICByZXR1cm4gYWRtaW5Tb2NrZXQ7XG59O1xuIiwidmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8vIGNvbGxlY3Rpb24gRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tIFxuXG4vLyBUaGUgY29sbGVjdGlvbiBmYWN0b3J5IGlzIHJlc3BvbnNpYmxlIGZvciBtYWludGFpbmdcbi8vIHRoZSBzdGF0ZSBhbmQgYSBtb2RpZmljYXRpb24gaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uc1xuLy8gZGVmaW5lZCBhdCB0aGUgc2VydmVyIHNpZGUuIFNlZSBgL3JvdXRlcy9jb2xsZWN0aW9uL2Bcbi8vIGZvciBtb3JlIGRldGFpbHMuXG5cbi8vIEFmdGVyIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBhIG5hbWVcbi8vIHBhcmFtZXRlciwgdGhlIGFkbWluU29ja2V0IHdhaXRzIGZvciB0aGUgc2VydmVyJ3Ncbi8vIHJlYWR5IGV2ZW50LCBhbmQgdGhlbiBwcm9jZWVkcyB0byBsaXN0ZW4gdG8gdGhlIGV2ZW50c1xuLy8gKF9fY3JlYXRlX18sIF9fZ2V0X18sIF9fdXBkYXRlX18sIF9fcmVtb3ZlX18pIFxuLy8gZm9yIHRoYXQgbmFtZSBhbmQgY3JlYXRlcyBhIHNldCBvZiBtZXRob2RzIHRvIG1hbmlwdWxhdGUgXG4vLyB0aGUgZGF0YSBvdmVyIHRoZSBzb2NrZXQgY29ubmVjdGlvbi5cblxuLy8gRmluYWxseSwgYSBkeW5hbWljIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1vZGVsc1xuLy8gZnJvbSB0aGUgY29sbGVjdGlvbiBpcyByZXR1cm5lZCwgd2l0aCBjcmVhdGUsIHVwZGF0ZVxuLy8gYW5kIHJlbW92ZSBtZXRob2RzIHRhY2tlZCBvbiB0byBpdC4gVGhpcyBjYW4gYmUgdXNlZFxuLy8gYm91bmQgc3RyYWlnaHQgdG8gdGhlIERPTSBmcm9tIGNvbnRyb2xsZXJzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFkbWluU29ja2V0KSB7XG5cbiAgLy8gU3RvcmUgYWxsIGF2YWlsYWJsZSBjb2xsZWN0aW9ucyBpbiBoZXJlLlxuICB2YXIgY29sbGVjdGlvbnMgPSB7fTtcblxuXG4gIC8vIEZpbmQgYW5kIHJldHVybiBhIG1vZGVsIGZyb20gYSBjb2xsZWN0aW9uXG4gIC8vIGJhc2VkIG9uIHRoZSBfaWQgcHJvcGVydHkgb2YgdGhlIHF1ZXJ5IFxuICAvLyBvYmplY3QuIF8oUXVlcnkgb2JqZWN0IG5vcm1hbGx5IGNvbWVzIGZyb21cbiAgLy8gdGhlIGRhdGFiYXNlKV9cbiAgZnVuY3Rpb24gZmluZChjb2xsZWN0aW9uLCBxdWVyeSkge1xuICAgIHZhciBpO1xuICAgIGZvcihpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25baV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIFxuICAvLyAjIyByZW1vdmVcbiAgLy8gYChjb2xsZWN0aW9uLCBxdWVyeSlgXG4gIC8vIFJlbW92ZXMgYW55IGl0ZW1zIGZyb20gYGNvbGxlY3Rpb25gIHRoYXRcbiAgLy8gbWF0Y2ggdGhlIGBfaWRgIHN1cHBsaWVkIGZyb20gYHF1ZXJ5YC5cbiAgZnVuY3Rpb24gcmVtb3ZlKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgdmFyIGksIGluZGV4O1xuICAgIGZvcihpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgaW5kZXggPSBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHR5cGVvZiBpbmRleCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbGxlY3Rpb24uc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBIZWxwZXIgbWV0aG9kIHRvIHByb3ZpZGUgY2xlYW4gbG9va2luZ1xuICAvLyBuYW1lcyBmb3Igc29ja2V0IGV2ZW50c1xuICBmdW5jdGlvbiBldmVudHMobmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IG5hbWUgKyAnL2dldCcsXG4gICAgICBjcmVhdGU6IG5hbWUgKyAnL2NyZWF0ZScsXG4gICAgICByZW1vdmU6IG5hbWUgKyAnL3JlbW92ZScsXG4gICAgICB1cGRhdGU6IG5hbWUgKyAnL3VwZGF0ZSdcbiAgICB9XG4gIH1cbiAgXG4gIC8vIFJlbW92ZXMgYWxsIGFuZ3VsYXIgcHJvcGVydGllcyBmcm9tXG4gIC8vIGFuIG9iamVjdCwgc28gdGhhdCBpdCBtYXkgYmUgdXNlZCBmb3JcbiAgLy8gcXVlcnlpbmcgYXQgbW9uZ29cbiAgZnVuY3Rpb24gc2FuaXRpemUob2JqZWN0KSB7XG4gICAgdmFyIGtleSwgc2FuaXRpemVkO1xuICAgIHNhbml0aXplZCA9IHt9O1xuICAgIGZvcihrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBpZihrZXlbMF0gIT09ICckJykge1xuICAgICAgICBzYW5pdGl6ZWRba2V5XSA9IG9iamVjdFtrZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2FuaXRpemVkO1xuICB9XG5cbiAgLy8gIyBtb2RlbFxuICAvLyBgKG5hbWUpYFxuICAvLyBDcmVhdGVzIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbiB3aXRoIHRoaXMgbmFtZVxuICAvLyBhbmQgcmV0dXJucyBkeW5hbWljIGNvbGxlY3Rpb24gYXJyYXkgYWxvbmdcbiAgLy8gd2l0aCBjb2xsZWN0aW9uIG1hbmlwdWxhdGlvbiBtZXRob2RzLiBTZWVcbiAgLy8gbW9kdWxlIGRvYyBjb21tZW50IGZvciBtb3JlIGRldGFpbHMuIFxuICBmdW5jdGlvbiBtb2RlbChuYW1lKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIHNvY2tldCwgZXZlbnQsIGxpc3RlbmVycztcblxuICAgIC8vIGlmIHdlIGhhdmUgYWxyZWFkeSBsb2FkZWQgdGhpcyBjb2xsZWN0aW9uXG4gICAgaWYoY29sbGVjdGlvbnNbbmFtZV0pIHtcbiAgICAgIC8vcmV0dXJuIGl0IHN0cmFpZ2h0IGF3YXlcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkJywgbmFtZSk7XG4gICAgICByZXR1cm4gY29sbGVjdGlvbnNbbmFtZV07XG4gICAgfVxuICAgIFxuICAgIC8vIGV2ZW50IGxpc3RlbmVyc1xuICAgIGxpc3RlbmVycyA9IHt9O1xuXG4gICAgLy8gYWxpYXNpbmdcbiAgICBzb2NrZXQgPSBhZG1pblNvY2tldDtcbiAgICBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNbbmFtZV0gPSBbXTtcbiAgICBldmVudCA9IGV2ZW50cyhuYW1lKTtcblxuICAgIGlmKHNvY2tldC5yZWFkeSkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgc29ja2V0Lm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFNvY2tldCBFdmVudHNcbiAgICAvLyAtLS0tLS0tLS0tLS0tXG4gICAgXG4gICAgLy8gIyBnZXRcbiAgICAvLyBgKG1vZGVscylgXG4gICAgLy8gV2hlbiB0aGUgc29ja2V0IHJlY2VpdmVzIGEgZ2V0IGV2ZW50LFxuICAgIC8vIHJlc2V0IHRoZSBjb2xsZWN0aW9uIGFuZCBwb3B1bGF0ZSBpdCB3aXRoXG4gICAgLy8gdGhlIG5ldyBtb2RlbHMuIEZpbmFsbHkgdHJpZ2dlciBhIGdldCBldmVudFxuICAgIC8vIGZvciBhbnkgbGlzdGVuZXJzLlxuICAgIHNvY2tldC5vbihldmVudC5nZXQsIGZ1bmN0aW9uKG1vZGVscykge1xuICAgICAgLy8gUmVtb3ZlIGFsbCBpdGVtcyAoYnV0IGRvbid0IG92ZXJ3cml0ZSB0aGUgcmVmZXJlbmNlKVxuICAgICAgY29sbGVjdGlvbi5sZW5ndGggPSAwO1xuICAgICAgLy8gSGFja3kgd2F5IG5vdCB0aGF0IHdvbid0IHJlc2V0IHJlZmVyZW5jZVxuICAgICAgY29sbGVjdGlvbi5wdXNoLmFwcGx5KGNvbGxlY3Rpb24sIG1vZGVscy5kYXRhKTtcbiAgICAgIGNvbGxlY3Rpb24uZm9jdXMoY29sbGVjdGlvblswXS5faWQpO1xuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdnZXQnLCBtb2RlbHMpO1xuICAgIH0pO1xuXG4gICAgLy8gIyBjcmVhdGVcbiAgICAvLyBgKG1vZGVscylgXG4gICAgLy8gSXMgY2FsbGVkIHdoZW5ldmVyIHRoZSBzb2NrZXQgcmVjZWl2ZXNcbiAgICAvLyBhIGNyZWF0ZSBldmVudCAoYSBuZXcgbW9kZWwgaXMgY3JlYXRlZCkuXG4gICAgLy8gQWRkIHRvIHRoZSBjb2xsZWN0aW9uIGFuZCB0cmlnZ2VyIGNyZWF0ZS5cbiAgICBzb2NrZXQub24oZXZlbnQuY3JlYXRlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgY29sbGVjdGlvbi5wdXNoKG1vZGVsLmRhdGEpO1xuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdjcmVhdGUnLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICAvLyAjIHJlbW92ZVxuICAgIC8vIGAobW9kZWwpYFxuICAgIC8vIElzIGNhbGxlZCB3aGVuZXZlciB0aGUgc29ja2V0IHJlY2VpdmVzXG4gICAgLy8gYSByZW1vdmUgZXZlbnQuIFJlbW92ZXMgdGhlIG1vZGVsIGZyb21cbiAgICAvLyB0aGUgY29sbGVjdGlvbiBhbmQgdHJpZ2dlcnMgcmVtb3ZlLlxuICAgIHNvY2tldC5vbihldmVudC5yZW1vdmUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBtb2RlbCA9IG1vZGVsLmRhdGE7XG4gICAgICByZW1vdmUoY29sbGVjdGlvbiwgbW9kZWwpOyAgXG4gICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ3JlbW92ZScsIG1vZGVsKTtcbiAgICB9KTtcblxuICAgIC8vICMgdXBkYXRlXG4gICAgLy8gYCh1cGRhdGVkKWBcbiAgICAvLyBJcyBjYWxsZWQgd2hlbmV2ZXIgdGhlIHNvY2tldCByZWNlaXZlc1xuICAgIC8vIGFuIHVwZGF0ZSBldmVudCwgcGFzc2luZyB0aGUgdXBkYXRlZCBtb2RlbFxuICAgIC8vIGFzIGFuIGFyZ3VtZW50LiBVcGRhdGVzIHRoZSBtb2RlbCBpbiB0aGUgXG4gICAgLy8gY29sbGVjdGlvbiBhbmQgdGhlbiB0cmlnZ2VycyBhbiB1cGRhdGUgZXZlbnQuIFxuICAgIHNvY2tldC5vbihldmVudC51cGRhdGUsIGZ1bmN0aW9uKHVwZGF0ZWQpIHtcbiAgICAgIHZhciBrZXksIG1vZGVsO1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZWQuZGF0YTtcblxuICAgICAgLy8gX19JbXBvcnRhbnRfXyB0byByZWFkIVxuICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHZhbHVlcyBvZiB0aGUgbW9kZWxcbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uLCB3ZSBjYW4gYWNjZXNzIGl0IHVzaW5nIGZpbmRcbiAgICAgIG1vZGVsID0gZmluZChjb2xsZWN0aW9uLCB1cGRhdGVkKTtcbiAgICAgIGlmKG1vZGVsKSB7IFxuICAgICAgICAvLyBXZSBjYW4ndCBzZXQgdGhlIHZhbHVlIG9mIG1vZGVsIHRvIFxuICAgICAgICAvLyB1cGRhdGVkIGFzIHRoYXQgd2lsbCBvdmVyd3JpdGUgdGhlIHJlZmVyZW5jZS5cbiAgICAgICAgLy8gV2UgbmVlZCB0byBsb29wIHRocm91Z2ggYW5kIHVwZGF0ZSB0aGVcbiAgICAgICAgLy8gcHJvcGVydGllcyBvZiB0aGUgb2JqZWN0IG9uZSBieSBvbmUuXG4gICAgICAgIGZvcihrZXkgaW4gdXBkYXRlZCkge1xuICAgICAgICAgIG1vZGVsW2tleV0gPSB1cGRhdGVkW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgLy8gQW5kIHdlJ3JlIGRvbmUhXG4gICAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcigndXBkYXRlJywgbW9kZWwpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRXhwb3NlZCBtZXRob2RzXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gVGhlc2UgbWV0aG9kcyBhcmUgYXZhaWxhYmxlIG9uIHRoZSBjb2xsZWN0aW9uXG4gICAgLy8gb2JqZWN0LCBmb3Igb3RoZXIgbWV0aG9kcyB0byB1c2UgdGhlIGNvbGxlY3Rpb25cbiAgICAvLyBmdW5jdGlvbmFsaXR5IHRvIHVwZGF0ZSB0aGUgY29sbGVjdGlvbnMgYXQgdGhlIFxuICAgIC8vIHNlcnZlciBzaWRlLlxuICBcbiAgICAvLyAjIGNyZWF0ZVxuICAgIC8vIGAobW9kZWwpYFxuICAgIC8vIEFkZHMgYSBtb2RlbCB0byB0aGUgY29sbGVjdGlvblxuICAgIGNvbGxlY3Rpb24uY3JlYXRlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmNyZWF0ZSwgbW9kZWwpO1xuICAgIH07XG4gICAgXG4gICAgLy8gIyByZW1vdmVcbiAgICAvLyBgKG1vZGVsKWBcbiAgICAvLyBSZW1vdmVzIGBtb2RlbGAgZnJvbSB0aGUgY29sbGVjdGlvblxuICAgIGNvbGxlY3Rpb24ucmVtb3ZlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIG1vZGVsID0gc2FuaXRpemUobW9kZWwpO1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQucmVtb3ZlLCBtb2RlbCk7XG4gICAgfTtcblxuICAgIC8vICMgdXBkYXRlXG4gICAgY29sbGVjdGlvbi51cGRhdGUgPSBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgdmFyIGtleSwgdmFsdWVzO1xuICAgICAgdmFsdWVzID0ge31cblxuICAgICAgLy8gaWYgdGhlIHNhbWUgb2JqZWN0IHdhcyBwYXNzZWQgdHdpY2VcbiAgICAgIGlmKG1vZGVsID09PSB1cGRhdGVkKSB7XG4gICAgICAgIG1vZGVsID0gXy5jb3B5KHVwZGF0ZWQpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBvbmx5IG5lZWQgdGhlIGlkIHRvIG1ha2UgdGhlIHVwZGF0ZVxuICAgICAgbW9kZWwgPSB7XG4gICAgICAgIF9pZDogbW9kZWwuX2lkXG4gICAgICB9XG5cbiAgICAgIC8vIHN0cmlwIG1vbmdvL2FuZ3VsYXIgcHJvcGVydGllc1xuICAgICAgZm9yKGtleSBpbiB1cGRhdGVkKSB7XG4gICAgICAgIGlmKCEoa2V5WzBdID09PSAnJCcgfHwga2V5WzBdID09PSAnXycpKSB7XG4gICAgICAgICAgdmFsdWVzW2tleV0gPSB1cGRhdGVkW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnVwZGF0ZSwgbW9kZWwsIHZhbHVlcyk7XG4gICAgfTsgXG5cbiAgICAvLyAjIG9uXG4gICAgLy8gYChldmVudE5hbWUsIGZuKWBcbiAgICAvLyBSZWdpc3RlcnMgYSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSB0cmlnZ2VyZWRcbiAgICAvLyBvbiB0aGUgZXZlbnQgc3BlY2lmaWVkIGJ5IGBldmVudE5hbWVgLlxuICAgIGNvbGxlY3Rpb24ub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGZuKSB7XG4gICAgICBpZighKGxpc3RlbmVyc1tldmVudE5hbWVdIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdID0gW107XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnNbZXZlbnROYW1lXS5wdXNoKGZuKTtcbiAgICB9O1xuXG4gICAgLy8gIyB0cmlnZ2VyXG4gICAgLy8gYChldmVudE5hbWUsIGRhdGEuLi4pYFxuICAgIC8vIFRyaWdnZXJzIGFsbCBldmVudHMgd2l0aCB0aGUgbmFtZSBzcGVjaWZpZWRcbiAgICAvLyBhbmQgcGFzc2VzIGFsbCB0aGUgb3RoZXIgYXJndW1lbnRzIHRvIHRob3NlXG4gICAgLy8gZXZlbnQgbGlzdGVuZXJzLlxuICAgIGNvbGxlY3Rpb24udHJpZ2dlciA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgICAgZGF0YSA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIGlmKGxpc3RlbmVyc1tldmVudE5hbWVdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxpc3RlbmVyc1tldmVudE5hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV1baV0uYXBwbHkodGhpcywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8vICMgZm9jdXNcbiAgICAvLyBgKF9pZClgXG4gICAgLy8gTXVsdGkgcHVycG9zZSBmb2N1cyBtZXRob2Qgd2hpY2ggYXBwbGllcyBhIGZvY3VzXG4gICAgLy8gdG8gdGhlIG1vZGVsIHdpdGggdGhpcyBpZC4gQ3JlYXRlcyBhIGNvcHkgb2YgdGhlIFxuICAgIC8vIGZvY3VzZWQgbW9kZWwgKHRoYXQgY2FuIGJlIHVwZGF0ZWQpIGFuZCB0cmlnZ2Vyc1xuICAgIC8vIGEgZm9jdXMgZXZlbnQuXG4gICAgY29sbGVjdGlvbi5mb2N1cyA9IGZ1bmN0aW9uKF9pZCkge1xuICAgICAgY29uc29sZS5sb2coJ2ZvY3VzIG9uJywgX2lkKTtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBfaWQpIHtcbiAgICAgICAgICBjb2xsZWN0aW9uLmZvY3VzZWQgPSBfLmNvcHkoY29sbGVjdGlvbltpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignZm9jdXMnLCBjb2xsZWN0aW9uLmZvY3VzZWQpO1xuICAgIH1cbiAgICBcbiAgICAvLyB0aGUgaXRlbSB0aGF0IGN1cnJlbnRseSBoYXMgZm9jdXNcbiAgICBjb2xsZWN0aW9uLmZvY3VzZWQgPSB7fTtcbiAgXG4gICAgLy8gUmV2ZWFsIHRoZSBuYW1lIG9mIHRoaXMgY29sbGVjdGlvblxuICAgIGNvbGxlY3Rpb24ubmFtZSA9IG5hbWU7XG4gICAgXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICByZXR1cm4gbW9kZWw7XG59O1xuIiwiXG4vLyBTb2NrZXQgV3JhcHBlclxuLy8gLS0tLS0tLS0tLS0tLS1cblxuLy8gQWN0cyBhcyBhIHdyYXBwZXIgYXJvdW5kIHNvY2tldEZhY3Rvcnlcbi8vIGFuZCBleHBvc2VzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZVxuLy8gbmFtZXNwYWNlZCBzb2NrZXRzLCBiYXNlZCBvbiBhIHBhcmFtZXRlci5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXRGYWN0b3J5KSB7XG4gIHJldHVybiBmdW5jdGlvbihuYW1lc3BhY2UpIHtcbiAgICB2YXIgY29ubmVjdFVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyArIG5hbWVzcGFjZTtcbiAgICByZXR1cm4gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogaW8uY29ubmVjdChjb25uZWN0VXJsKVxuICAgIH0pO1xuICB9XG59O1xuIiwiXG4vLyBTdG9yYWdlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBsb2NhbFN0b3JhZ2Ugc3VwcG9ydCB3aXRoIGEgY29va2llXG4vLyBiYXNlZCBmYWxsYmFjay4gXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYWNoZSwgc3RvcmFnZSwgaWQ7XG4gIFxuICBpZCA9ICdhdWRpby1kcm9wLXN0b3JhZ2UnO1xuICBzdG9yYWdlID0gd2hpY2goKTtcblxuICAvLyBEZXRlcm1pbmVzIHdoaWNoIHR5cGUgb2Ygc3RvcmFnZVxuICAvLyBpcyBhdmFpbGFibGUgYW5kIHJldHVybnMgYSBqUXVlcnlcbiAgLy8gc3R5bGUgZ2V0dGVyL3NldHRlciBmb3IgaXQncyB2YWx1ZS5cbiAgZnVuY3Rpb24gd2hpY2goKSB7XG4gICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGxvY2FsU3RvcmFnZVtpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlW2lkXSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTG9hZCB0aGUgY29udGVudHMgZnJvbSB3aGljaGV2ZXJcbiAgLy8gc3RvcmFnZSBpcyBhdmFpYWJsZS4gSWYgSlNPTiBwYXJzZVxuICAvLyB0aHJvd3MgYW4gZXhjZXB0aW9uLCB0aGVuIHRoZSB2YWx1ZVxuICAvLyB3YXMgdW5kZWZpbmVkLCBzbyBpbnN0ZWFkIGNhY2hlIGFuXG4gIC8vIGVtcHR5IG9iamVjdC5cbiAgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgY2FjaGUgPSBKU09OLnBhcnNlKHN0b3JhZ2UoKSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBjYWNoZSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGU7XG4gIH1cblxuICAvLyBTYXZlIHRoZSBjb250ZW50cyBvZiB0aGUgY2FjaGVcbiAgLy8gaW50byBzdG9yYWdlXG4gIGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgc3RvcmFnZShKU09OLnN0cmluZ2lmeShjYWNoZSkpO1xuICB9XG5cbiAgLy8gU2V0IGEgdmFsdWUgd2l0aGluIHRoZSBjYWNoZVxuICAvLyBiYXNlZCBvbiBhIGtleSBhbmQgdGhlbiBzYXZlIGl0LlxuICBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcbiAgICBzYXZlKCk7XG4gIH1cblxuICAvLyBHZXQgYSB2YWx1ZSBmcm9tIHRoZSBjYWNoZVxuICBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgcmV0dXJuIGNhY2hlW2tleV07XG4gIH0gXG5cbiAgLy8gRXhwb3NlIGdldCBhbmQgc2V0IG1ldGhvZHNcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGdldCxcbiAgICBzZXQ6IHNldFxuICB9XG59O1xuIiwiLy8gdWlTdGF0ZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gQSB0aW55IGZhY3RvcnkgZm9yIG1haW50YWluaW5nIHRoZVxuLy8gc3RhdGUgb2YgdGhlIFVJIGF0IGFueSB0aW1lLiBUaGUgbmFtZVxuLy8gb2YgdGhlIHVpIGluIHF1ZXN0aW9uIHNob3VsZCBiZSBwYXNzZWRcbi8vIHRvIHRoZSBzYXZlIG1ldGhvZCB0byBwZXJzaXN0IGl0LlxuXG4vLyBUaGUgc3RhdGUgY2FuIHRoZW4gYmUgcmVsb2FkZWQgYXQgYW55XG4vLyB0aW1lIGluIHRoZSBmdXR1cmUuXG5cbi8vIF9fSW1wb3J0YW50X18gVGhpcyBkb2VzIG5vdCBjaGFuZ2Vcbi8vIHRoZSBET00gX19hdCBhbGxfXy4gSXQganVzdCBzYXZlc1xuLy8gYSBKU09OIG9iamVjdCB3aGljaCBjYW4gdGhlbiBiZSB1c2VkXG4vLyB3aXRoIGFuZ3VsYXIgdG8gb3B0aW9uYWxseSBzaG93L2hpZGVcbi8vIG9yIGFwcGx5IGNsYXNzZXMgdG8gdWkgZWxlbWVudHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuICByZXR1cm4ge1xuICAgIHNhdmU6IGZ1bmN0aW9uKHVpLCBzdGF0ZSkge1xuICAgICAgc3RvcmFnZS5zZXQodWksIHN0YXRlKTsgIFxuICAgIH0sXG4gICAgbG9hZDogZnVuY3Rpb24odWkpIHtcbiAgICAgIHJldHVybiBzdG9yYWdlLmdldCh1aSk7XG4gICAgfVxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBfID0ge1xuIFxuICAvLyAjIGFyZ3NcbiAgLy8gYChfYXJncylgXG4gIC8vIFRha2VzIGEgamF2YXNjcmlwdCBhcmd1bWVudHMgb2JqZWN0XG4gIC8vIGFuZCBjb252ZXJ0cyBpdCBpbnRvIGEgc3RhbmRhcmQgYXJyYXkuXG4gIGFyZ3M6IGZ1bmN0aW9uKF9hcmdzKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKF9hcmdzKVxuICB9LFxuXG4gIC8vICMgdHlwZVxuICAvLyBgKHZhcmlhYmxlLCB0eXBlKWBcbiAgLy8gQ2hlY2tzIHdoZXRoZXIgdGhlIHR5cGUgb2YgYHZhcmlhYmxlYFxuICAvLyBpcyB0aGUgdHlwZSBzcGVjaWZpZWQgd2l0aGluIGB0eXBlYC5cbiAgdHlwZTogZnVuY3Rpb24odmFyaWFibGUsIHR5cGUpIHtcbiAgICBpZighdHlwZSkgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZTtcbiAgICBlbHNlIHJldHVybiB0eXBlb2YgdmFyaWFibGUgPT09IHR5cGU7XG4gIH0sXG4gIFxuICAvLyAjIHVuZGVmXG4gIC8vIGAodmFyaWFibGVgKVxuICAvLyBgKHZhcjEsIHZhcjIsIHZhcjMsIC4uLilgXG4gIC8vIGAoW3ZhcjEsIHZhcjIsIHZhcjMsIC4uLl1gXG4gIC8vIFByb3ZpZGVzIGEgcXVpY2sgd2F5IHRvIGNoZWNrIHdoZXRoZXIgYVxuICAvLyB2YXJpYWJsZSAob3IgYSBjb2xsZWN0aW9uIG9mIHZhcmlhYmxlcykgaXNcbiAgLy8gdW5kZWZpbmVkLiBBcmd1bWVudHMgY2FuIGJlIHBhc3NlZCBhcyBpbiBcbiAgLy8gYW55IG9mIHRoZSBhYm92ZSBmb3Jtcy5cbiAgdW5kZWY6IGZ1bmN0aW9uKHZhcmlhYmxlcykge1xuICAgIGlmKCEodmFyaWFibGVzIGluc3RhbmNlb2YgQXJyYXkpKSB2YXJpYWJsZXMgPSBfLmFyZ3MoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdmFyaWFibGVzLnJlZHVjZShmdW5jdGlvbihzdGF0ZSwgdmFyaWFibGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZSAmJiBfLnR5cGUodmFyaWFibGUsICd1bmRlZmluZWQnKTtcbiAgICB9LCB0cnVlKTtcbiAgfSxcbiAgXG4gIGNvcHk6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBrZXksIGR1cGxpY2F0ZSA9IHt9O1xuICAgIGZvcihrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBkdXBsaWNhdGVba2V5XSA9IG9iamVjdFtrZXldXG4gICAgfVxuICAgIHJldHVybiBkdXBsaWNhdGU7XG4gIH1cbn1cbiJdfQ==
