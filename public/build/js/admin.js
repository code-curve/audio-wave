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
  'collection': require('./directives/collection'),
  // Searchable sample listing
  'samples': require('./directives/samples')
});




},{"./controllers/AudioController":2,"./controllers/ComposeController":3,"./controllers/SessionsController":4,"./controllers/UsersController":5,"./directives/collection":6,"./directives/console":7,"./directives/creator":8,"./directives/editor":9,"./directives/playback":10,"./directives/samples":11,"./directives/uploadAudio":12,"./filters/minutes":13,"./services/adminSocket":14,"./services/collection":15,"./services/socket":16,"./services/storage":17,"./services/uiState":18}],2:[function(require,module,exports){
/**
 * 
 */

module.exports = function($scope) {
 
};

},{}],3:[function(require,module,exports){
module.exports = function($scope) {
  
};

},{}],4:[function(require,module,exports){
module.exports = function($scope, adminSocket) {
  $scope.clients = [];
  $scope.sessions = [];
  $scope.sessionId = 0;
 
  adminSocket.on('client', function(client) {
    $scope.clients.push(client);
  });

  adminSocket.on('clients', function(clients) {
    $scope.clients = clients;
  });

  adminSocket.on('sessions', function(sessions) {
    $scope.sessions = sessions;
  });

  adminSocket.on('session', function(session) {
    $scope.sessions.push(session);
  });

  $scope.switchSession = function() {
    adminSocket.emit('clients', $scope.sessionId);
  };

  $scope.deleteSession = function() {
    //todo VERIFICATION POPUP NEEDED
    adminSocket.emit('deleteSession', $scope.sessionId);
  };

  $scope.init = function() {
    adminSocket.emit('sessions');
  };

  $scope.init();
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

var _ = require('../util');

module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/collection',
    controller: function($scope, $element, collection) { 
      var schema;

      $scope.name = $element.attr('collection-name');
      $scope.models = collection($scope.name);
      $scope.search = '';
      schema = $element.attr('schema');
      $scope.schema = createSchema(schema);
 
      function createSchema(schemaString) {
        var fields, schema, i;
        if(_.undef(schemaString)) {
          return {};
        }

        schema = {};
        fields = schemaString.split('|');
        for(var i = 0; i < fields.length; i++) {
          schema[fields[i]] = true;
        }

        return schema;
      };

      $scope.focus = function(id) {
        $scope.models.focus = id;
      };
    }
  }  
};


},{"../util":19}],7:[function(require,module,exports){
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
          type: 'history',
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
      $scope.initial = {}; 
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
          $scope.initial = _.copy($scope.collection[0]);
          // No need for mongo ids here
          delete $scope.initial._id;
        }

        $scope.instance = $scope.initial;
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


},{"../util":19}],9:[function(require,module,exports){

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
        document.title = $scope.name;
      };

      $scope.pause = function() {
        $scope.playing = false;
        $scope.audio.pause();
      };

      $scope.stop = function() {
        var src;
        $scope.playing = false;
        $scope.progress = 0;
        $scope.audio.pause();
        src = $scope.audio.src;
        delete $scope.audio;
        $scope.audio = new Audio(src);
        document.title = 'Audiodrop - Admin';
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

// Samples directive
// --------------------
//
// Displays samples for audio tracks
// in a grid like manner.


module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/samples',
    controller: function($scope, $element, collection) { 

      $scope.samples = collection('audio');
      $scope.search = '';
 
      $scope.focus = function(id) {
        // Insert the sample into the track
      };

    }
  }  
};


},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"../util":19}],14:[function(require,module,exports){

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

},{}],15:[function(require,module,exports){
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

},{"../util":19}],16:[function(require,module,exports){

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

},{}],17:[function(require,module,exports){

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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvY3JlYXRvci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9lZGl0b3IuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvcGxheWJhY2suanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvc2FtcGxlcy5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy91cGxvYWRBdWRpby5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZmlsdGVycy9taW51dGVzLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zdG9yYWdlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy91aVN0YXRlLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBZG1pblxuLy8gLS0tLS1cblxuLy8gVGhlIGFkbWluIGFwcGxpY2F0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nXG4vLyB0cmFjayBvZiBhbGwgc2Vzc2lvbnMsIGRldmljZXMsIGF1ZGlvIGZpbGVzIGFuZFxuLy8gY29tcG9zZWQgc29uZ3MuXG4vLyBcbi8vIEl0IGFsc28gcHJvdmlkZXMgYSBjb25zb2xlIGZvciB0YWxraW5nIHRvIHRoZVxuLy8gc2VydmVyIGFuZCB0aGUgY29tcG9zZSBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nXG4vLyBzb25nIGZpbGVzIGZyb20gdGhlIGF2YWlsYWJsZSBhdWRpbyBmaWxlcy5cbi8vXG5cbmFuZ3VsYXIubW9kdWxlKCdhZG1pbicsIFsnbmdSb3V0ZScsICdidGZvcmQuc29ja2V0LWlvJywgJ2FuZ3VsYXJGaWxlVXBsb2FkJ10pLlxuXG5jb25maWcoZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIpIHtcbiAgJHJvdXRlUHJvdmlkZXIuXG4gIHdoZW4oJy9zZXNzaW9ucycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9zZXNzaW9ucycsXG4gICAgY29udHJvbGxlcjogJ1Nlc3Npb25zQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9hdWRpbycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hdWRpbycsXG4gICAgY29udHJvbGxlcjogJ0F1ZGlvQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy91c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy91c2VycycsXG4gICAgY29udHJvbGxlcjogJ1VzZXJzQ29udHJvbGxlcidcbiAgfSkuXG4gIHdoZW4oJy9jb21wb3NlJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL2NvbXBvc2UnLFxuICAgIGNvbnRyb2xsZXI6ICdDb21wb3NlQ29udHJvbGxlcidcbiAgfSkuXG4gIG90aGVyd2lzZSh7XG4gICAgcmVkaXJlY3RUbzogJy9zZXNzaW9ucydcbiAgfSk7XG59KS5cblxuLy8gRmlsdGVyc1xuLy8gLS0tLS0tLVxuXG5maWx0ZXIoe1xuICAvLyBDb252ZXJ0cyBzZWNvbmRzIHRvIG1pbnV0ZXNcbiAgJ21pbnV0ZXMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbWludXRlcycpXG59KS5cblxuLy8gU2VydmljZXNcbi8vIC0tLS0tLS0tXG5cbmZhY3Rvcnkoe1xuICAvLyBMb2NhbHN0b3JhZ2UgKyBjb29raWUgc2hpbVxuICAnc3RvcmFnZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvc3RvcmFnZScpLFxuICAvLyBNYWludGFpbiBzdGF0ZSBvZiB1aVxuICAndWlTdGF0ZSc6IHJlcXVpcmUoJy4vc2VydmljZXMvdWlTdGF0ZScpLFxuICAvLyBXZWIgc29ja2V0IHdyYXBwZXJcbiAgJ3NvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvc29ja2V0JyksXG4gIC8vIFNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbiAgJ2FkbWluU29ja2V0JzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpLFxuICAvLyBDb2xsZWN0aW9uIG1haW50YWluZXJcbiAgJ2NvbGxlY3Rpb24nOiByZXF1aXJlKCcuL3NlcnZpY2VzL2NvbGxlY3Rpb24nKVxufSkuXG5cbi8vIENvbnRyb2xsZXJzXG4vLyAtLS0tLS0tLS0tLVxuXG5jb250cm9sbGVyKHtcbiAgLy8gTWFuYWdlIGRldmljZXMgaW4gc2Vzc2lvbnNcbiAgJ1Nlc3Npb25zQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyJyksXG4gIC8vIENvbXBvc2l0aW9uIG9mIHNvbmcgZmlsZXNcbiAgJ0NvbXBvc2VDb250cm9sbGVyJzogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgYWRtaW5pc3RyYXRvcnMgYW5kIHJlZ2lzdGVyZWQgdXNlcnNcbiAgJ1VzZXJzQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvVXNlcnNDb250cm9sbGVyJyksXG4gIC8vIE1hbmFnZSB1cGxvYWRlZCBhdWRpbyB0cmFja3NcbiAgJ0F1ZGlvQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyJylcbn0pLlxuXG4vLyBEaXJlY3RpdmVzXG4vLyAtLS0tLS0tLS0tXG5cbmRpcmVjdGl2ZSh7XG4gICd1cGxvYWRBdWRpbyc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy91cGxvYWRBdWRpbycpLFxuICAvLyBJbnRlcmZhY2UgZm9yIGVkaXRpbmcgY29sbGVjdGlvbnNcbiAgJ2VkaXRvcic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9lZGl0b3InKSxcbiAgLy8gUGxheWluZyBhdWRpb1xuICAncGxheWJhY2snOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvcGxheWJhY2snKSxcbiAgLy8gSW50ZXJmYWNlIGZvciBjcmVhdGluZyBpdGVtcyBmb3IgY29sbGVjdGlvbnNcbiAgJ2NyZWF0b3InOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY3JlYXRvcicpLFxuICAvLyBDb25zb2xlIGZvciBzZXJ2ZXIgY29tbXVuaWNhdGlvblxuICAnY29uc29sZSc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb25zb2xlJyksXG4gIC8vIFNlYXJjaGFibGUgY29sbGVjdGlvbiBpbnRlcmZhY2UgXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbGxlY3Rpb24nKSxcbiAgLy8gU2VhcmNoYWJsZSBzYW1wbGUgbGlzdGluZ1xuICAnc2FtcGxlcyc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9zYW1wbGVzJylcbn0pO1xuXG5cblxuIiwiLyoqXG4gKiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCBhZG1pblNvY2tldCkge1xuICAkc2NvcGUuY2xpZW50cyA9IFtdO1xuICAkc2NvcGUuc2Vzc2lvbnMgPSBbXTtcbiAgJHNjb3BlLnNlc3Npb25JZCA9IDA7XG4gXG4gIGFkbWluU29ja2V0Lm9uKCdjbGllbnQnLCBmdW5jdGlvbihjbGllbnQpIHtcbiAgICAkc2NvcGUuY2xpZW50cy5wdXNoKGNsaWVudCk7XG4gIH0pO1xuXG4gIGFkbWluU29ja2V0Lm9uKCdjbGllbnRzJywgZnVuY3Rpb24oY2xpZW50cykge1xuICAgICRzY29wZS5jbGllbnRzID0gY2xpZW50cztcbiAgfSk7XG5cbiAgYWRtaW5Tb2NrZXQub24oJ3Nlc3Npb25zJywgZnVuY3Rpb24oc2Vzc2lvbnMpIHtcbiAgICAkc2NvcGUuc2Vzc2lvbnMgPSBzZXNzaW9ucztcbiAgfSk7XG5cbiAgYWRtaW5Tb2NrZXQub24oJ3Nlc3Npb24nLCBmdW5jdGlvbihzZXNzaW9uKSB7XG4gICAgJHNjb3BlLnNlc3Npb25zLnB1c2goc2Vzc2lvbik7XG4gIH0pO1xuXG4gICRzY29wZS5zd2l0Y2hTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgYWRtaW5Tb2NrZXQuZW1pdCgnY2xpZW50cycsICRzY29wZS5zZXNzaW9uSWQpO1xuICB9O1xuXG4gICRzY29wZS5kZWxldGVTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy90b2RvIFZFUklGSUNBVElPTiBQT1BVUCBORUVERURcbiAgICBhZG1pblNvY2tldC5lbWl0KCdkZWxldGVTZXNzaW9uJywgJHNjb3BlLnNlc3Npb25JZCk7XG4gIH07XG5cbiAgJHNjb3BlLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICBhZG1pblNvY2tldC5lbWl0KCdzZXNzaW9ucycpO1xuICB9O1xuXG4gICRzY29wZS5pbml0KCk7XG59O1xuIiwiXG4vLyBDb2xsZWN0aW9uIGRpcmVjdGl2ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gQWRkIHRoZSBhdHRyaWJ1dGUgY29sbGVjdGlvbiB0byBhbiBlbGVtZW50IGFuZCBcbi8vIHNwZWNpZnkgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gaW4gYSAnY29sbGVjdGlvbi1uYW1lJyBcbi8vIGF0dHJpYnV0ZSwgYW5kIHRoaXMgZGlyZWN0aXZlIHdpbGwgY3JlYXRlIGEgc2VhcmNoYWJsZSwgXG4vLyBzeW5jaHJvbml6ZWQgZGF0YSB2aWV3IG9mIHRoYXQgY29sbGVjdGlvbi5cblxudmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbGxlY3Rpb24nLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHsgXG4gICAgICB2YXIgc2NoZW1hO1xuXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgc2NoZW1hID0gJGVsZW1lbnQuYXR0cignc2NoZW1hJyk7XG4gICAgICAkc2NvcGUuc2NoZW1hID0gY3JlYXRlU2NoZW1hKHNjaGVtYSk7XG4gXG4gICAgICBmdW5jdGlvbiBjcmVhdGVTY2hlbWEoc2NoZW1hU3RyaW5nKSB7XG4gICAgICAgIHZhciBmaWVsZHMsIHNjaGVtYSwgaTtcbiAgICAgICAgaWYoXy51bmRlZihzY2hlbWFTdHJpbmcpKSB7XG4gICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgc2NoZW1hID0ge307XG4gICAgICAgIGZpZWxkcyA9IHNjaGVtYVN0cmluZy5zcGxpdCgnfCcpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgc2NoZW1hW2ZpZWxkc1tpXV0gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5mb2N1cyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICRzY29wZS5tb2RlbHMuZm9jdXMgPSBpZDtcbiAgICAgIH07XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odWlTdGF0ZSkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb25zb2xlJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHsgXG4gICAgICB2YXIgc2hvd2luZywgdWlLZXk7XG5cbiAgICAgIHVpS2V5ID0gJ2NvbnNvbGUtc3RhdGUnXG4gICAgICBzaG93aW5nID0gKHVpU3RhdGUubG9hZCh1aUtleSkgfHwgZmFsc2UpO1xuICAgICBcbiAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuIFxuICAgICAgZnVuY3Rpb24gY2hlY2tWaXNpYmlsaXR5KCkge1xuICAgICAgICBpZihzaG93aW5nKSB7XG4gICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfSBcbiAgICAgIH1cbiAgICAgICAgXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkgICB7XG4gICAgICAgIC8vIFRvZ2dsZSBvbiBgIGtleVxuICAgICAgICBpZihlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgICAgIHNob3dpbmcgPSAhc2hvd2luZztcbiAgICAgICAgICB1aVN0YXRlLnNhdmUodWlLZXksIHNob3dpbmcpO1xuICAgICAgICBcbiAgICAgICAgICBjaGVja1Zpc2liaWxpdHkoKTtcbiAgICAgICAgICAvLyBHaXZlIGZvY3VzIHRvIGlucHV0IFxuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICAgIC8vIFN0b3AgYCBiZWluZyBpbnNlcnRlZCBpbnRvIGNvbnNvbGVcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgYWRtaW5Tb2NrZXQpIHtcbiAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICBcbiAgICAgIGFkbWluU29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsVG9wID0gJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfTtcbiAgICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAnaGlzdG9yeScsXG4gICAgICAgICAgYm9keTogJHNjb3BlLmlucHV0XG4gICAgICAgIH0pO1xuICAgICAgICBhZG1pblNvY2tldC5lbWl0KCdtZXNzYWdlJywgJHNjb3BlLmlucHV0KTtcbiAgICAgICAgJHNjb3BlLmNsZWFyKCk7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbiAgXG4iLCJcbi8vIENyZWF0b3Jcbi8vIC0tLS0tLS1cbiBcbi8vIFByb3ZpZGVzIGFuIGludGVyZmFjZSBmb3IgY3JlYXRpbmcgaXRlbXMgXG4vLyBmcm9tIGEgY29sbGVjdGlvbiBzZXJ2aWNlLlxuXG52YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY3JlYXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHtcbiAgICAgIHZhciBjb2xsZWN0aW9uO1xuICAgICAgXG4gICAgICAvLyBHZXQgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gZm9yIHRoaXMgZWRpdG9yXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgICAgICAgXG4gICAgICAvLyBHZXQgdGhlIGNvbGxlY3Rpb24gZm9yIHRoaXMgbmFtZSBmcm9tXG4gICAgICAvLyB0aGUgY29sbGVjdGlvbiBmYWN0b3J5IGFuZCBiaW5kIGl0IHRvXG4gICAgICAvLyB0aGUgc2NvcGUuIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgICBcbiAgICAgIC8vIEluaXRpYWwgc2NoZW1hIGZvciBjcmVhdGlvblxuICAgICAgJHNjb3BlLmluaXRpYWwgPSB7fTsgXG4gICAgICAvLyBBY3R1YWwgbW9kZWwgYm91bmQgdG8gaW5wdXRcbiAgICAgICRzY29wZS5pbnN0YW5jZSA9IHt9O1xuICAgICAgLy8gU2F2aW5nIHN0YXRlXG4gICAgICAkc2NvcGUuY3JlYXRpbmcgPSBmYWxzZTtcblxuICAgICAgJHNjb3BlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkgeyAgICBcbiAgICAgICAgJHNjb3BlLmNyZWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24uY3JlYXRlKCRzY29wZS5pbnN0YW5jZSk7XG4gICAgICB9O1xuICAgICAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbignZ2V0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGlmKCRzY29wZS5jb2xsZWN0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAkc2NvcGUuaW5pdGlhbCA9IF8uY29weSgkc2NvcGUuY29sbGVjdGlvblswXSk7XG4gICAgICAgICAgLy8gTm8gbmVlZCBmb3IgbW9uZ28gaWRzIGhlcmVcbiAgICAgICAgICBkZWxldGUgJHNjb3BlLmluaXRpYWwuX2lkO1xuICAgICAgICB9XG5cbiAgICAgICAgJHNjb3BlLmluc3RhbmNlID0gJHNjb3BlLmluaXRpYWw7XG4gICAgICAgIGZvcihrZXkgaW4gJHNjb3BlLmluc3RhbmNlKSB7XG4gICAgICAgICAgJHNjb3BlLmluc3RhbmNlW2tleV0gPSAnJztcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCdjcmVhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0aW5nID0gZmFsc2U7XG4gICAgICB9KTtcbiBcbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vLyBFZGl0b3Jcbi8vIC0tLS0tLVxuIFxuLy8gUHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciB1cGRhdGluZyBhbmQgXG4vLyBtb2RpZnlpbmcgaXRlbXMgZnJvbSBhIGNvbGxlY3Rpb24gc2VydmljZS5cbi8vXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2VkaXRvcicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBjb25zb2xlLmxvZygnRWRpdG9yJyk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICAgXG4gICAgICAvLyBHZXQgdGhlIGNvbGxlY3Rpb24gZm9yIHRoaXMgbmFtZSBmcm9tXG4gICAgICAvLyB0aGUgY29sbGVjdGlvbiBmYWN0b3J5IGFuZCBiaW5kIGl0IHRvXG4gICAgICAvLyB0aGUgc2NvcGUuIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgIFxuICAgICAgJHNjb3BlLm1vZGVsID0ge307XG4gICBcbiAgICAgICRzY29wZS5zYXZpbmcgPSBmYWxzZTtcbiAgICAgIFxuICAgICAgJHNjb3BlLnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbi5yZW1vdmUoJHNjb3BlLm1vZGVsKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtb2RlbCA9ICRzY29wZS5tb2RlbDtcbiAgICAgICAgY29uc29sZS5sb2coJ2VkaXRlZCcsICRzY29wZS5tb2RlbCk7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uLnVwZGF0ZShtb2RlbCwgbW9kZWwpO1xuICAgICAgICAkc2NvcGUuc2F2aW5nID0gdHJ1ZTsgXG4gICAgICB9O1xuICAgICAgXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbi5vbigndXBkYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zYXZpbmcgPSBmYWxzZTtcbiAgICAgIH0pO1xuICBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCdmb2N1cycsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICAgICRzY29wZS5tb2RlbCA9IG1vZGVsO1xuICAgICAgfSk7XG5cbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDonQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9hdWRpby9wbGF5JyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRpbnRlcnZhbCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGF1ZGlvQ29sbGVjdGlvbiwgdXBkYXRlO1xuICAgICAgXG4gICAgICBhdWRpb0NvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCdhdWRpbycpO1xuICAgICAgXG4gICAgICAkc2NvcGUuYXVkaW8gPSBudWxsO1xuICAgICAgJHNjb3BlLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgICRzY29wZS5wcm9ncmVzcyA9IDA7XG4gICAgICAkc2NvcGUubmFtZSA9ICcnO1xuICAgICAgJHNjb3BlLmR1cmF0aW9uID0gJyc7XG5cbiAgICAgIGF1ZGlvQ29sbGVjdGlvbi5vbignZm9jdXMnLCBmdW5jdGlvbihhdWRpbykge1xuICAgICAgICBcbiAgICAgICAgLy8gVG90YWxseSByZXNldCB0aGUgY3VycmVudCBhdWRpb1xuICAgICAgICBpZigkc2NvcGUucGxheWluZykge1xuICAgICAgICAgICRzY29wZS5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICAgJHNjb3BlLmF1ZGlvLnBhdXNlKCk7XG4gICAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gMDtcbiAgICAgICAgICBkZWxldGUgJHNjb3BlLmF1ZGlvO1xuICAgICAgICAgICRpbnRlcnZhbC5jYW5jZWwodXBkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgJHNjb3BlLm5hbWUgPSBhdWRpby5uYW1lO1xuICAgICAgICAkc2NvcGUuZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbjtcbiAgICAgICAgJHNjb3BlLmF1ZGlvID0gbmV3IEF1ZGlvKCdhdWRpby9wbGF5LycgKyBhdWRpby5faWQpO1xuICAgICAgICAkc2NvcGUuYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCAkc2NvcGUuc3RvcCk7XG4gICAgICAgICRzY29wZS5yZWZyZXNoUHJvZ3Jlc3MoKTtcbiAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICRzY29wZS5wbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5wbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmF1ZGlvLnBsYXkoKTtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSAkc2NvcGUubmFtZTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUucGxheWluZyA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuYXVkaW8ucGF1c2UoKTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzcmM7XG4gICAgICAgICRzY29wZS5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IDA7XG4gICAgICAgICRzY29wZS5hdWRpby5wYXVzZSgpO1xuICAgICAgICBzcmMgPSAkc2NvcGUuYXVkaW8uc3JjO1xuICAgICAgICBkZWxldGUgJHNjb3BlLmF1ZGlvO1xuICAgICAgICAkc2NvcGUuYXVkaW8gPSBuZXcgQXVkaW8oc3JjKTtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSAnQXVkaW9kcm9wIC0gQWRtaW4nO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnByb2dyZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwcm9ncmVzcztcbiAgICAgICAgcHJvZ3Jlc3MgPSAkc2NvcGUuYXVkaW8uY3VycmVudFRpbWUgLyAkc2NvcGUuYXVkaW8uZHVyYXRpb247XG4gICAgICAgICRzY29wZS5wcm9ncmVzcyA9IHByb2dyZXNzICogMTAwO1xuICAgICAgfTtcbiAgICAgIFxuICAgICAgJHNjb3BlLnJlZnJlc2hQcm9ncmVzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB1cGRhdGUgPSAkaW50ZXJ2YWwoJHNjb3BlLnByb2dyZXNzaW9uLCA1MDApO1xuICAgICAgfTtcbiAgICB9XG4gIH1cbn1cbiIsIlxuLy8gU2FtcGxlcyBkaXJlY3RpdmVcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vL1xuLy8gRGlzcGxheXMgc2FtcGxlcyBmb3IgYXVkaW8gdHJhY2tzXG4vLyBpbiBhIGdyaWQgbGlrZSBtYW5uZXIuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvc2FtcGxlcycsXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikgeyBcblxuICAgICAgJHNjb3BlLnNhbXBsZXMgPSBjb2xsZWN0aW9uKCdhdWRpbycpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuIFxuICAgICAgJHNjb3BlLmZvY3VzID0gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgLy8gSW5zZXJ0IHRoZSBzYW1wbGUgaW50byB0aGUgdHJhY2tcbiAgICAgIH07XG5cbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJ3VwbG9hZCBkaXJlY3RpdmUnKTtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvYXVkaW8vdXBsb2FkJyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICR1cGxvYWQsICR0aW1lb3V0KSB7XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIHJlbW92ZShmaWxlKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IoaSA9IDA7IGkgPCAkc2NvcGUuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZigkc2NvcGUuZmlsZXNbaV0gPT09IGZpbGUpIHtcbiAgICAgICAgICAgICRzY29wZS5maWxlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVwbG9hZChmaWxlKSB7XG4gICAgICAgIGZpbGUudXBsb2FkZWQgPSBmYWxzZTtcblxuICAgICAgICAkdXBsb2FkLnVwbG9hZCh7XG4gICAgICAgICAgdXJsOiAnL3VwbG9hZC9hdWRpbycsXG4gICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICB9KS5wcm9ncmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IDEwMCAqIChlLmxvYWRlZCAvIGUudG90YWwpOyBcbiAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICBpZihyZXMuc3RhdHVzID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgIGZpbGUudXBsb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgLy8gR2V0IHJpZCBvZiB0aGUgc3VjY2VzcyBub3RpZmljYXRpb25cbiAgICAgICAgICAgICR0aW1lb3V0KHJlbW92ZS5iaW5kKHRoaXMsIGZpbGUpLCA1MDAwKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsZS5lcnJvciA9IHJlcy5kYXRhLm1lc3NhZ2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KS5lcnJvcihmdW5jdGlvbihkYXRhLCBzdGF0dXMpIHtcbiAgICAgICAgICBmaWxlLmVycm9yID0gJ1RoZXJlIHdhcyBhIHByb2JsZW0gdXBsb2FkaW5nLic7XG4gICAgICAgIH0pO1xuXG4gICAgICB9XG5cbiAgICAgICRzY29wZS5maWxlcyA9IFtdO1xuXG4gICAgICAkc2NvcGUudXBsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCAkc2NvcGUuZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB1cGxvYWQoJHNjb3BlLmZpbGVzW2ldKTsgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKCRmaWxlcykge1xuICAgICAgICAkc2NvcGUuZmlsZXMgPSAkZmlsZXM7XG4gICAgICAgICRzY29wZS5maWxlcy5tYXAoZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSAwO1xuICAgICAgICAgIGZpbGUudXBsb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgICBmaWxlLmVycm9yID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgfVxuICB9XG59XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKF9zZWNvbmRzKSB7ICAgIFxuICAgIHZhciBtaW51dGVzLCBzZWNvbmRzO1xuICAgIFxuICAgIGlmKF8udW5kZWYoX3NlY29uZHMpIHx8IGlzTmFOKF9zZWNvbmRzKSkge1xuICAgICAgcmV0dXJuICcwMDowMCc7XG4gICAgfVxuXG4gICAgbWludXRlcyA9IE1hdGguZmxvb3IoX3NlY29uZHMgLyA2MCk7XG4gICAgc2Vjb25kcyA9IE1hdGguZmxvb3IoKChfc2Vjb25kcyAvIDYwKSAtIG1pbnV0ZXMpICogNjApO1xuXG4gICAgc2Vjb25kcyA9IHNlY29uZHMgPiA5ID8gc2Vjb25kcyA6ICcwJyArIHNlY29uZHM7XG5cbiAgICByZXR1cm4gbWludXRlcyArICc6JyArIHNlY29uZHM7XG4gIH1cbn1cbiIsIlxuLy8gYWRtaW5Tb2NrZXQgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBhIHNvY2tldCB0aGF0J3MgY29ubmVjdGVkXG4vLyB0byB0aGUgYWRtaW4gY2hhbm5lbC5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgdmFyIGFkbWluU29ja2V0ID0gc29ja2V0KCdhZG1pbicpO1xuICBhZG1pblNvY2tldC5yZWFkeSA9IGZhbHNlO1xuICBcbiAgYWRtaW5Tb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgYWRtaW5Tb2NrZXQucmVhZHkgPSB0cnVlO1xuICB9KTtcbiAgXG4gIHJldHVybiBhZG1pblNvY2tldDtcbn07XG4iLCJ2YXIgXyA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLy8gY29sbGVjdGlvbiBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0gXG5cbi8vIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuLy8gdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4vLyBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIGAvcm91dGVzL2NvbGxlY3Rpb24vYFxuLy8gZm9yIG1vcmUgZGV0YWlscy5cblxuLy8gQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuLy8gcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXInc1xuLy8gcmVhZHkgZXZlbnQsIGFuZCB0aGVuIHByb2NlZWRzIHRvIGxpc3RlbiB0byB0aGUgZXZlbnRzXG4vLyAoX19jcmVhdGVfXywgX19nZXRfXywgX191cGRhdGVfXywgX19yZW1vdmVfXykgXG4vLyBmb3IgdGhhdCBuYW1lIGFuZCBjcmVhdGVzIGEgc2V0IG9mIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSBcbi8vIHRoZSBkYXRhIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuXG4vLyBGaW5hbGx5LCBhIGR5bmFtaWMgYXJyYXkgY29udGFpbmluZyB0aGUgbW9kZWxzXG4vLyBmcm9tIHRoZSBjb2xsZWN0aW9uIGlzIHJldHVybmVkLCB3aXRoIGNyZWF0ZSwgdXBkYXRlXG4vLyBhbmQgcmVtb3ZlIG1ldGhvZHMgdGFja2VkIG9uIHRvIGl0LiBUaGlzIGNhbiBiZSB1c2VkXG4vLyBib3VuZCBzdHJhaWdodCB0byB0aGUgRE9NIGZyb20gY29udHJvbGxlcnMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcblxuICAvLyBTdG9yZSBhbGwgYXZhaWxhYmxlIGNvbGxlY3Rpb25zIGluIGhlcmUuXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9O1xuXG5cbiAgLy8gRmluZCBhbmQgcmV0dXJuIGEgbW9kZWwgZnJvbSBhIGNvbGxlY3Rpb25cbiAgLy8gYmFzZWQgb24gdGhlIF9pZCBwcm9wZXJ0eSBvZiB0aGUgcXVlcnkgXG4gIC8vIG9iamVjdC4gXyhRdWVyeSBvYmplY3Qgbm9ybWFsbHkgY29tZXMgZnJvbVxuICAvLyB0aGUgZGF0YWJhc2UpX1xuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgdmFyIGk7XG4gICAgZm9yKGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgXG4gIC8vICMjIHJlbW92ZVxuICAvLyBgKGNvbGxlY3Rpb24sIHF1ZXJ5KWBcbiAgLy8gUmVtb3ZlcyBhbnkgaXRlbXMgZnJvbSBgY29sbGVjdGlvbmAgdGhhdFxuICAvLyBtYXRjaCB0aGUgYF9pZGAgc3VwcGxpZWQgZnJvbSBgcXVlcnlgLlxuICBmdW5jdGlvbiByZW1vdmUoY29sbGVjdGlvbiwgcXVlcnkpIHtcbiAgICB2YXIgaSwgaW5kZXg7XG4gICAgZm9yKGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICBpbmRleCA9IGk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGluZGV4ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29sbGVjdGlvbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2QgdG8gcHJvdmlkZSBjbGVhbiBsb29raW5nXG4gIC8vIG5hbWVzIGZvciBzb2NrZXQgZXZlbnRzXG4gIGZ1bmN0aW9uIGV2ZW50cyhuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogbmFtZSArICcvZ2V0JyxcbiAgICAgIGNyZWF0ZTogbmFtZSArICcvY3JlYXRlJyxcbiAgICAgIHJlbW92ZTogbmFtZSArICcvcmVtb3ZlJyxcbiAgICAgIHVwZGF0ZTogbmFtZSArICcvdXBkYXRlJ1xuICAgIH1cbiAgfVxuICBcbiAgLy8gUmVtb3ZlcyBhbGwgYW5ndWxhciBwcm9wZXJ0aWVzIGZyb21cbiAgLy8gYW4gb2JqZWN0LCBzbyB0aGF0IGl0IG1heSBiZSB1c2VkIGZvclxuICAvLyBxdWVyeWluZyBhdCBtb25nb1xuICBmdW5jdGlvbiBzYW5pdGl6ZShvYmplY3QpIHtcbiAgICB2YXIga2V5LCBzYW5pdGl6ZWQ7XG4gICAgc2FuaXRpemVkID0ge307XG4gICAgZm9yKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGlmKGtleVswXSAhPT0gJyQnKSB7XG4gICAgICAgIHNhbml0aXplZFtrZXldID0gb2JqZWN0W2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzYW5pdGl6ZWQ7XG4gIH1cblxuICAvLyAjIG1vZGVsXG4gIC8vIGAobmFtZSlgXG4gIC8vIENyZWF0ZXMgaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uIHdpdGggdGhpcyBuYW1lXG4gIC8vIGFuZCByZXR1cm5zIGR5bmFtaWMgY29sbGVjdGlvbiBhcnJheSBhbG9uZ1xuICAvLyB3aXRoIGNvbGxlY3Rpb24gbWFuaXB1bGF0aW9uIG1ldGhvZHMuIFNlZVxuICAvLyBtb2R1bGUgZG9jIGNvbW1lbnQgZm9yIG1vcmUgZGV0YWlscy4gXG4gIGZ1bmN0aW9uIG1vZGVsKG5hbWUpIHtcbiAgICB2YXIgY29sbGVjdGlvbiwgc29ja2V0LCBldmVudCwgbGlzdGVuZXJzO1xuXG4gICAgLy8gaWYgd2UgaGF2ZSBhbHJlYWR5IGxvYWRlZCB0aGlzIGNvbGxlY3Rpb25cbiAgICBpZihjb2xsZWN0aW9uc1tuYW1lXSkge1xuICAgICAgLy9yZXR1cm4gaXQgc3RyYWlnaHQgYXdheVxuICAgICAgY29uc29sZS5sb2coJ2xvYWQnLCBuYW1lKTtcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLy8gZXZlbnQgbGlzdGVuZXJzXG4gICAgbGlzdGVuZXJzID0ge307XG5cbiAgICAvLyBhbGlhc2luZ1xuICAgIHNvY2tldCA9IGFkbWluU29ja2V0O1xuICAgIGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc1tuYW1lXSA9IFtdO1xuICAgIGV2ZW50ID0gZXZlbnRzKG5hbWUpO1xuXG4gICAgaWYoc29ja2V0LnJlYWR5KSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gU29ja2V0IEV2ZW50c1xuICAgIC8vIC0tLS0tLS0tLS0tLS1cbiAgICBcbiAgICAvLyAjIGdldFxuICAgIC8vIGAobW9kZWxzKWBcbiAgICAvLyBXaGVuIHRoZSBzb2NrZXQgcmVjZWl2ZXMgYSBnZXQgZXZlbnQsXG4gICAgLy8gcmVzZXQgdGhlIGNvbGxlY3Rpb24gYW5kIHBvcHVsYXRlIGl0IHdpdGhcbiAgICAvLyB0aGUgbmV3IG1vZGVscy4gRmluYWxseSB0cmlnZ2VyIGEgZ2V0IGV2ZW50XG4gICAgLy8gZm9yIGFueSBsaXN0ZW5lcnMuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmdldCwgZnVuY3Rpb24obW9kZWxzKSB7XG4gICAgICAvLyBSZW1vdmUgYWxsIGl0ZW1zIChidXQgZG9uJ3Qgb3ZlcndyaXRlIHRoZSByZWZlcmVuY2UpXG4gICAgICBjb2xsZWN0aW9uLmxlbmd0aCA9IDA7XG4gICAgICAvLyBIYWNreSB3YXkgbm90IHRoYXQgd29uJ3QgcmVzZXQgcmVmZXJlbmNlXG4gICAgICBjb2xsZWN0aW9uLnB1c2guYXBwbHkoY29sbGVjdGlvbiwgbW9kZWxzLmRhdGEpO1xuICAgICAgY29sbGVjdGlvbi5mb2N1cyhjb2xsZWN0aW9uWzBdLl9pZCk7XG4gICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ2dldCcsIG1vZGVscyk7XG4gICAgfSk7XG5cbiAgICAvLyAjIGNyZWF0ZVxuICAgIC8vIGAobW9kZWxzKWBcbiAgICAvLyBJcyBjYWxsZWQgd2hlbmV2ZXIgdGhlIHNvY2tldCByZWNlaXZlc1xuICAgIC8vIGEgY3JlYXRlIGV2ZW50IChhIG5ldyBtb2RlbCBpcyBjcmVhdGVkKS5cbiAgICAvLyBBZGQgdG8gdGhlIGNvbGxlY3Rpb24gYW5kIHRyaWdnZXIgY3JlYXRlLlxuICAgIHNvY2tldC5vbihldmVudC5jcmVhdGUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBjb2xsZWN0aW9uLnB1c2gobW9kZWwuZGF0YSk7XG4gICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ2NyZWF0ZScsIG1vZGVsKTtcbiAgICB9KTtcblxuICAgIC8vICMgcmVtb3ZlXG4gICAgLy8gYChtb2RlbClgXG4gICAgLy8gSXMgY2FsbGVkIHdoZW5ldmVyIHRoZSBzb2NrZXQgcmVjZWl2ZXNcbiAgICAvLyBhIHJlbW92ZSBldmVudC4gUmVtb3ZlcyB0aGUgbW9kZWwgZnJvbVxuICAgIC8vIHRoZSBjb2xsZWN0aW9uIGFuZCB0cmlnZ2VycyByZW1vdmUuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnJlbW92ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIG1vZGVsID0gbW9kZWwuZGF0YTtcbiAgICAgIHJlbW92ZShjb2xsZWN0aW9uLCBtb2RlbCk7ICBcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcigncmVtb3ZlJywgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgLy8gIyB1cGRhdGVcbiAgICAvLyBgKHVwZGF0ZWQpYFxuICAgIC8vIElzIGNhbGxlZCB3aGVuZXZlciB0aGUgc29ja2V0IHJlY2VpdmVzXG4gICAgLy8gYW4gdXBkYXRlIGV2ZW50LCBwYXNzaW5nIHRoZSB1cGRhdGVkIG1vZGVsXG4gICAgLy8gYXMgYW4gYXJndW1lbnQuIFVwZGF0ZXMgdGhlIG1vZGVsIGluIHRoZSBcbiAgICAvLyBjb2xsZWN0aW9uIGFuZCB0aGVuIHRyaWdnZXJzIGFuIHVwZGF0ZSBldmVudC4gXG4gICAgc29ja2V0Lm9uKGV2ZW50LnVwZGF0ZSwgZnVuY3Rpb24odXBkYXRlZCkge1xuICAgICAgdmFyIGtleSwgbW9kZWw7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlZC5kYXRhO1xuXG4gICAgICAvLyBfX0ltcG9ydGFudF9fIHRvIHJlYWQhXG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdmFsdWVzIG9mIHRoZSBtb2RlbFxuICAgICAgLy8gdGhlIGNvbGxlY3Rpb24sIHdlIGNhbiBhY2Nlc3MgaXQgdXNpbmcgZmluZFxuICAgICAgbW9kZWwgPSBmaW5kKGNvbGxlY3Rpb24sIHVwZGF0ZWQpO1xuICAgICAgaWYobW9kZWwpIHsgXG4gICAgICAgIC8vIFdlIGNhbid0IHNldCB0aGUgdmFsdWUgb2YgbW9kZWwgdG8gXG4gICAgICAgIC8vIHVwZGF0ZWQgYXMgdGhhdCB3aWxsIG92ZXJ3cml0ZSB0aGUgcmVmZXJlbmNlLlxuICAgICAgICAvLyBXZSBuZWVkIHRvIGxvb3AgdGhyb3VnaCBhbmQgdXBkYXRlIHRoZVxuICAgICAgICAvLyBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3Qgb25lIGJ5IG9uZS5cbiAgICAgICAgZm9yKGtleSBpbiB1cGRhdGVkKSB7XG4gICAgICAgICAgbW9kZWxba2V5XSA9IHVwZGF0ZWRba2V5XTtcbiAgICAgICAgfVxuICAgICAgICAvLyBBbmQgd2UncmUgZG9uZSFcbiAgICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCd1cGRhdGUnLCBtb2RlbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBFeHBvc2VkIG1ldGhvZHNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBUaGVzZSBtZXRob2RzIGFyZSBhdmFpbGFibGUgb24gdGhlIGNvbGxlY3Rpb25cbiAgICAvLyBvYmplY3QsIGZvciBvdGhlciBtZXRob2RzIHRvIHVzZSB0aGUgY29sbGVjdGlvblxuICAgIC8vIGZ1bmN0aW9uYWxpdHkgdG8gdXBkYXRlIHRoZSBjb2xsZWN0aW9ucyBhdCB0aGUgXG4gICAgLy8gc2VydmVyIHNpZGUuXG4gIFxuICAgIC8vICMgY3JlYXRlXG4gICAgLy8gYChtb2RlbClgXG4gICAgLy8gQWRkcyBhIG1vZGVsIHRvIHRoZSBjb2xsZWN0aW9uXG4gICAgY29sbGVjdGlvbi5jcmVhdGUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuY3JlYXRlLCBtb2RlbCk7XG4gICAgfTtcbiAgICBcbiAgICAvLyAjIHJlbW92ZVxuICAgIC8vIGAobW9kZWwpYFxuICAgIC8vIFJlbW92ZXMgYG1vZGVsYCBmcm9tIHRoZSBjb2xsZWN0aW9uXG4gICAgY29sbGVjdGlvbi5yZW1vdmUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgbW9kZWwgPSBzYW5pdGl6ZShtb2RlbCk7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5yZW1vdmUsIG1vZGVsKTtcbiAgICB9O1xuXG4gICAgLy8gIyB1cGRhdGVcbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSA9IGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICB2YXIga2V5LCB2YWx1ZXM7XG4gICAgICB2YWx1ZXMgPSB7fVxuXG4gICAgICAvLyBpZiB0aGUgc2FtZSBvYmplY3Qgd2FzIHBhc3NlZCB0d2ljZVxuICAgICAgaWYobW9kZWwgPT09IHVwZGF0ZWQpIHtcbiAgICAgICAgbW9kZWwgPSBfLmNvcHkodXBkYXRlZCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG9ubHkgbmVlZCB0aGUgaWQgdG8gbWFrZSB0aGUgdXBkYXRlXG4gICAgICBtb2RlbCA9IHtcbiAgICAgICAgX2lkOiBtb2RlbC5faWRcbiAgICAgIH1cblxuICAgICAgLy8gc3RyaXAgbW9uZ28vYW5ndWxhciBwcm9wZXJ0aWVzXG4gICAgICBmb3Ioa2V5IGluIHVwZGF0ZWQpIHtcbiAgICAgICAgaWYoIShrZXlbMF0gPT09ICckJyB8fCBrZXlbMF0gPT09ICdfJykpIHtcbiAgICAgICAgICB2YWx1ZXNba2V5XSA9IHVwZGF0ZWRba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc29ja2V0LmVtaXQoZXZlbnQudXBkYXRlLCBtb2RlbCwgdmFsdWVzKTtcbiAgICB9OyBcblxuICAgIC8vICMgb25cbiAgICAvLyBgKGV2ZW50TmFtZSwgZm4pYFxuICAgIC8vIFJlZ2lzdGVycyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIHRyaWdnZXJlZFxuICAgIC8vIG9uIHRoZSBldmVudCBzcGVjaWZpZWQgYnkgYGV2ZW50TmFtZWAuXG4gICAgY29sbGVjdGlvbi5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZm4pIHtcbiAgICAgIGlmKCEobGlzdGVuZXJzW2V2ZW50TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgIH1cbiAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdLnB1c2goZm4pO1xuICAgIH07XG5cbiAgICAvLyAjIHRyaWdnZXJcbiAgICAvLyBgKGV2ZW50TmFtZSwgZGF0YS4uLilgXG4gICAgLy8gVHJpZ2dlcnMgYWxsIGV2ZW50cyB3aXRoIHRoZSBuYW1lIHNwZWNpZmllZFxuICAgIC8vIGFuZCBwYXNzZXMgYWxsIHRoZSBvdGhlciBhcmd1bWVudHMgdG8gdGhvc2VcbiAgICAvLyBldmVudCBsaXN0ZW5lcnMuXG4gICAgY29sbGVjdGlvbi50cmlnZ2VyID0gZnVuY3Rpb24oZXZlbnROYW1lLCBkYXRhKSB7XG4gICAgICBkYXRhID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgaWYobGlzdGVuZXJzW2V2ZW50TmFtZV0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGlzdGVuZXJzW2V2ZW50TmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBsaXN0ZW5lcnNbZXZlbnROYW1lXVtpXS5hcHBseSh0aGlzLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLy8gIyBmb2N1c1xuICAgIC8vIGAoX2lkKWBcbiAgICAvLyBNdWx0aSBwdXJwb3NlIGZvY3VzIG1ldGhvZCB3aGljaCBhcHBsaWVzIGEgZm9jdXNcbiAgICAvLyB0byB0aGUgbW9kZWwgd2l0aCB0aGlzIGlkLiBDcmVhdGVzIGEgY29weSBvZiB0aGUgXG4gICAgLy8gZm9jdXNlZCBtb2RlbCAodGhhdCBjYW4gYmUgdXBkYXRlZCkgYW5kIHRyaWdnZXJzXG4gICAgLy8gYSBmb2N1cyBldmVudC5cbiAgICBjb2xsZWN0aW9uLmZvY3VzID0gZnVuY3Rpb24oX2lkKSB7XG4gICAgICBjb25zb2xlLmxvZygnZm9jdXMgb24nLCBfaWQpO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IF9pZCkge1xuICAgICAgICAgIGNvbGxlY3Rpb24uZm9jdXNlZCA9IF8uY29weShjb2xsZWN0aW9uW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdmb2N1cycsIGNvbGxlY3Rpb24uZm9jdXNlZCk7XG4gICAgfVxuICAgIFxuICAgIC8vIHRoZSBpdGVtIHRoYXQgY3VycmVudGx5IGhhcyBmb2N1c1xuICAgIGNvbGxlY3Rpb24uZm9jdXNlZCA9IHt9O1xuICBcbiAgICAvLyBSZXZlYWwgdGhlIG5hbWUgb2YgdGhpcyBjb2xsZWN0aW9uXG4gICAgY29sbGVjdGlvbi5uYW1lID0gbmFtZTtcbiAgICBcbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBtb2RlbDtcbn07XG4iLCJcbi8vIFNvY2tldCBXcmFwcGVyXG4vLyAtLS0tLS0tLS0tLS0tLVxuXG4vLyBBY3RzIGFzIGEgd3JhcHBlciBhcm91bmQgc29ja2V0RmFjdG9yeVxuLy8gYW5kIGV4cG9zZXMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgY3JlYXRlXG4vLyBuYW1lc3BhY2VkIHNvY2tldHMsIGJhc2VkIG9uIGEgcGFyYW1ldGVyLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iLCJcbi8vIFN0b3JhZ2UgRmFjdG9yeVxuLy8gLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGxvY2FsU3RvcmFnZSBzdXBwb3J0IHdpdGggYSBjb29raWVcbi8vIGJhc2VkIGZhbGxiYWNrLiBcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNhY2hlLCBzdG9yYWdlLCBpZDtcbiAgXG4gIGlkID0gJ2F1ZGlvLWRyb3Atc3RvcmFnZSc7XG4gIHN0b3JhZ2UgPSB3aGljaCgpO1xuXG4gIC8vIERldGVybWluZXMgd2hpY2ggdHlwZSBvZiBzdG9yYWdlXG4gIC8vIGlzIGF2YWlsYWJsZSBhbmQgcmV0dXJucyBhIGpRdWVyeVxuICAvLyBzdHlsZSBnZXR0ZXIvc2V0dGVyIGZvciBpdCdzIHZhbHVlLlxuICBmdW5jdGlvbiB3aGljaCgpIHtcbiAgICBpZih3aW5kb3cubG9jYWxTdG9yYWdlKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gbG9jYWxTdG9yYWdlW2lkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2VbaWRdID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZih0eXBlb2YgZGF0YSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBMb2FkIHRoZSBjb250ZW50cyBmcm9tIHdoaWNoZXZlclxuICAvLyBzdG9yYWdlIGlzIGF2YWlhYmxlLiBJZiBKU09OIHBhcnNlXG4gIC8vIHRocm93cyBhbiBleGNlcHRpb24sIHRoZW4gdGhlIHZhbHVlXG4gIC8vIHdhcyB1bmRlZmluZWQsIHNvIGluc3RlYWQgY2FjaGUgYW5cbiAgLy8gZW1wdHkgb2JqZWN0LlxuICBmdW5jdGlvbiBsb2FkKCkge1xuICAgIHRyeSB7XG4gICAgICBjYWNoZSA9IEpTT04ucGFyc2Uoc3RvcmFnZSgpKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGNhY2hlID0ge307XG4gICAgfVxuICAgIHJldHVybiBjYWNoZTtcbiAgfVxuXG4gIC8vIFNhdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjYWNoZVxuICAvLyBpbnRvIHN0b3JhZ2VcbiAgZnVuY3Rpb24gc2F2ZSgpIHtcbiAgICBzdG9yYWdlKEpTT04uc3RyaW5naWZ5KGNhY2hlKSk7XG4gIH1cblxuICAvLyBTZXQgYSB2YWx1ZSB3aXRoaW4gdGhlIGNhY2hlXG4gIC8vIGJhc2VkIG9uIGEga2V5IGFuZCB0aGVuIHNhdmUgaXQuXG4gIGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgY2FjaGVba2V5XSA9IHZhbHVlO1xuICAgIHNhdmUoKTtcbiAgfVxuXG4gIC8vIEdldCBhIHZhbHVlIGZyb20gdGhlIGNhY2hlXG4gIGZ1bmN0aW9uIGdldChrZXkpIHtcbiAgICBpZighY2FjaGUpIGxvYWQoKTtcbiAgICByZXR1cm4gY2FjaGVba2V5XTtcbiAgfSBcblxuICAvLyBFeHBvc2UgZ2V0IGFuZCBzZXQgbWV0aG9kc1xuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIHNldDogc2V0XG4gIH1cbn07XG4iLCIvLyB1aVN0YXRlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBIHRpbnkgZmFjdG9yeSBmb3IgbWFpbnRhaW5pbmcgdGhlXG4vLyBzdGF0ZSBvZiB0aGUgVUkgYXQgYW55IHRpbWUuIFRoZSBuYW1lXG4vLyBvZiB0aGUgdWkgaW4gcXVlc3Rpb24gc2hvdWxkIGJlIHBhc3NlZFxuLy8gdG8gdGhlIHNhdmUgbWV0aG9kIHRvIHBlcnNpc3QgaXQuXG5cbi8vIFRoZSBzdGF0ZSBjYW4gdGhlbiBiZSByZWxvYWRlZCBhdCBhbnlcbi8vIHRpbWUgaW4gdGhlIGZ1dHVyZS5cblxuLy8gX19JbXBvcnRhbnRfXyBUaGlzIGRvZXMgbm90IGNoYW5nZVxuLy8gdGhlIERPTSBfX2F0IGFsbF9fLiBJdCBqdXN0IHNhdmVzXG4vLyBhIEpTT04gb2JqZWN0IHdoaWNoIGNhbiB0aGVuIGJlIHVzZWRcbi8vIHdpdGggYW5ndWxhciB0byBvcHRpb25hbGx5IHNob3cvaGlkZVxuLy8gb3IgYXBwbHkgY2xhc3NlcyB0byB1aSBlbGVtZW50cy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzdG9yYWdlKSB7XG4gIHJldHVybiB7XG4gICAgc2F2ZTogZnVuY3Rpb24odWksIHN0YXRlKSB7XG4gICAgICBzdG9yYWdlLnNldCh1aSwgc3RhdGUpOyAgXG4gICAgfSxcbiAgICBsb2FkOiBmdW5jdGlvbih1aSkge1xuICAgICAgcmV0dXJuIHN0b3JhZ2UuZ2V0KHVpKTtcbiAgICB9XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IF8gPSB7XG4gXG4gIC8vICMgYXJnc1xuICAvLyBgKF9hcmdzKWBcbiAgLy8gVGFrZXMgYSBqYXZhc2NyaXB0IGFyZ3VtZW50cyBvYmplY3RcbiAgLy8gYW5kIGNvbnZlcnRzIGl0IGludG8gYSBzdGFuZGFyZCBhcnJheS5cbiAgYXJnczogZnVuY3Rpb24oX2FyZ3MpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoX2FyZ3MpXG4gIH0sXG5cbiAgLy8gIyB0eXBlXG4gIC8vIGAodmFyaWFibGUsIHR5cGUpYFxuICAvLyBDaGVja3Mgd2hldGhlciB0aGUgdHlwZSBvZiBgdmFyaWFibGVgXG4gIC8vIGlzIHRoZSB0eXBlIHNwZWNpZmllZCB3aXRoaW4gYHR5cGVgLlxuICB0eXBlOiBmdW5jdGlvbih2YXJpYWJsZSwgdHlwZSkge1xuICAgIGlmKCF0eXBlKSByZXR1cm4gdHlwZW9mIHZhcmlhYmxlO1xuICAgIGVsc2UgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZSA9PT0gdHlwZTtcbiAgfSxcbiAgXG4gIC8vICMgdW5kZWZcbiAgLy8gYCh2YXJpYWJsZWApXG4gIC8vIGAodmFyMSwgdmFyMiwgdmFyMywgLi4uKWBcbiAgLy8gYChbdmFyMSwgdmFyMiwgdmFyMywgLi4uXWBcbiAgLy8gUHJvdmlkZXMgYSBxdWljayB3YXkgdG8gY2hlY2sgd2hldGhlciBhXG4gIC8vIHZhcmlhYmxlIChvciBhIGNvbGxlY3Rpb24gb2YgdmFyaWFibGVzKSBpc1xuICAvLyB1bmRlZmluZWQuIEFyZ3VtZW50cyBjYW4gYmUgcGFzc2VkIGFzIGluIFxuICAvLyBhbnkgb2YgdGhlIGFib3ZlIGZvcm1zLlxuICB1bmRlZjogZnVuY3Rpb24odmFyaWFibGVzKSB7XG4gICAgaWYoISh2YXJpYWJsZXMgaW5zdGFuY2VvZiBBcnJheSkpIHZhcmlhYmxlcyA9IF8uYXJncyhhcmd1bWVudHMpO1xuICAgIHJldHVybiB2YXJpYWJsZXMucmVkdWNlKGZ1bmN0aW9uKHN0YXRlLCB2YXJpYWJsZSkge1xuICAgICAgcmV0dXJuIHN0YXRlICYmIF8udHlwZSh2YXJpYWJsZSwgJ3VuZGVmaW5lZCcpO1xuICAgIH0sIHRydWUpO1xuICB9LFxuICBcbiAgY29weTogZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgdmFyIGtleSwgZHVwbGljYXRlID0ge307XG4gICAgZm9yKGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGR1cGxpY2F0ZVtrZXldID0gb2JqZWN0W2tleV1cbiAgICB9XG4gICAgcmV0dXJuIGR1cGxpY2F0ZTtcbiAgfVxufVxuIl19
