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
  'collection': require('./services/collection'),
  // Notification center
  'notificationCenter': require('./services/notificationCenter')
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
  'samples': require('./directives/samples'),
  // Confirmation dialogue
  'confirm': require('./directives/confirm'),
  // Notification dialogue
  'notify': require('./directives/notify')
});




},{"./controllers/AudioController":2,"./controllers/ComposeController":3,"./controllers/SessionsController":4,"./controllers/UsersController":5,"./directives/collection":6,"./directives/confirm":7,"./directives/console":8,"./directives/creator":9,"./directives/editor":10,"./directives/notify":11,"./directives/playback":12,"./directives/samples":13,"./directives/uploadAudio":14,"./filters/minutes":15,"./services/adminSocket":16,"./services/collection":17,"./services/notificationCenter":18,"./services/socket":19,"./services/storage":20,"./services/uiState":21}],2:[function(require,module,exports){
/**
 * 
 */

module.exports = function($scope) {
 
};

},{}],3:[function(require,module,exports){
module.exports = function($scope) {
  
};

},{}],4:[function(require,module,exports){
module.exports = function($scope, adminSocket, notificationCenter) {
  $scope.clients = [];
  $scope.sessions = [];
  $scope.sessionId;
  
  notificationCenter.confirm({
    name: 'YOLO',
    ok: function() {
      alert('win');
    },
    cancel: function() {
      alert('lose');
    }
  });

  adminSocket.on('client', function(client) {
    $scope.clients.push(client);
  });

  adminSocket.on('clients', function(clients) {
    $scope.clients = clients;
  });

  adminSocket.on('sessions', function(sessions) {
    $scope.sessions = sessions;
    console.warn($scope.sessions);
  });

  adminSocket.on('session', function(session) {
    $scope.sessions.push(session);
    notificationCenter.notify({
      icon: 'sitemap', 
      name: 'New Session',
      message: 'Session ' + session + ' created' 
    });
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


},{"../util":22}],7:[function(require,module,exports){
module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/confirm',
    link: function(scope, element, attrs) { 
      
    },
    controller: function($scope, notificationCenter) {
      $scope.showConfirmation = false;
      
      // Takes a function, returns a function that
      // calls the fn arg and then closes the confirm.
      function andClose(fn) {
        return function() {
          fn();
          $scope.showConfirmation = false;
        }
      }

      $scope.ok = function() {
        console.warning('Default OK');
      };

      $scope.cancel = function() {
        console.warning('Default cancel');
      };
      
      notificationCenter.on('confirmation', function(settings) {
        $scope.title = settings.title;
        $scope.description = settings.description;
        $scope.ok = andClose(settings.ok);
        $scope.cancel = andClose(settings.cancel);
        $scope.showConfirmation = true;
      });

    }
  };
};

  

},{}],8:[function(require,module,exports){
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
        var date = new Date();
        
        message.date = {
          hours: date.getHours(),
          minutes: date.getMinutes()
        };

        $scope.messages.push(message);
        
        $element[0].scrollTop = $element[0].scrollHeight
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

  

},{}],9:[function(require,module,exports){

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


},{"../util":22}],10:[function(require,module,exports){

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


},{}],11:[function(require,module,exports){
module.exports = function($timeout) {
  return {
    restrict: 'A',
    templateUrl: 'partials/notification',
    link: function(scope, element, attrs) { 
      
    },
    controller: function($scope, notificationCenter) {
      $scope.showNotification = false;
        
      notificationCenter.on('notify', function(settings) {
        console.log('Notify');
        $scope.settings = settings;
        $scope.showNotification = true;
        $timeout(function() {
          $scope.showNotification = false;
        }, 2000);
      });

    }
  };
};

  

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){

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


},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{"../util":22}],16:[function(require,module,exports){

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

},{}],17:[function(require,module,exports){
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

},{"../util":22}],18:[function(require,module,exports){
var _ = require('../util');

var events = {};

function isRegistered(event) {
  return _.type(events[event], 'object');
}

function on(event, then) {
  if(!isRegistered(event)) {
    events[event] = [];
  }
  events[event].push(then);
}

function emit(event, rest) {
  var args;
  console.warn('Emit', event, isRegistered(event));
  if(isRegistered(event)) {
    args = _.args(arguments).slice(1);
    events[event].forEach(function(then) {
      then.apply(this, args);
    });
  }
}

module.exports = function() {
  return {
    on: on,
    // Only expose required methods
    notify: emit.bind(this, 'notify'),
    confirm: emit.bind(this, 'confirm')
  }
};

},{"../util":22}],19:[function(require,module,exports){

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

},{}],20:[function(require,module,exports){

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

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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
  },


}

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbmZpcm0uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvY29uc29sZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jcmVhdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2VkaXRvci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9ub3RpZnkuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvcGxheWJhY2suanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvc2FtcGxlcy5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy91cGxvYWRBdWRpby5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZmlsdGVycy9taW51dGVzLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvbm90aWZpY2F0aW9uQ2VudGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3N0b3JhZ2UuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3VpU3RhdGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQWRtaW5cbi8vIC0tLS0tXG5cbi8vIFRoZSBhZG1pbiBhcHBsaWNhdGlvbiBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZ1xuLy8gdHJhY2sgb2YgYWxsIHNlc3Npb25zLCBkZXZpY2VzLCBhdWRpbyBmaWxlcyBhbmRcbi8vIGNvbXBvc2VkIHNvbmdzLlxuLy8gXG4vLyBJdCBhbHNvIHByb3ZpZGVzIGEgY29uc29sZSBmb3IgdGFsa2luZyB0byB0aGVcbi8vIHNlcnZlciBhbmQgdGhlIGNvbXBvc2UgaW50ZXJmYWNlIGZvciBjcmVhdGluZ1xuLy8gc29uZyBmaWxlcyBmcm9tIHRoZSBhdmFpbGFibGUgYXVkaW8gZmlsZXMuXG4vL1xuXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW4nLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbycsICdhbmd1bGFyRmlsZVVwbG9hZCddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvc2Vzc2lvbnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvc2Vzc2lvbnMnLFxuICAgIGNvbnRyb2xsZXI6ICdTZXNzaW9uc0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvYXVkaW8nLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYXVkaW8nLFxuICAgIGNvbnRyb2xsZXI6ICdBdWRpb0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvdXNlcnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvdXNlcnMnLFxuICAgIGNvbnRyb2xsZXI6ICdVc2Vyc0NvbnRyb2xsZXInXG4gIH0pLlxuICB3aGVuKCcvY29tcG9zZScsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jb21wb3NlJyxcbiAgICBjb250cm9sbGVyOiAnQ29tcG9zZUNvbnRyb2xsZXInXG4gIH0pLlxuICBvdGhlcndpc2Uoe1xuICAgIHJlZGlyZWN0VG86ICcvc2Vzc2lvbnMnXG4gIH0pO1xufSkuXG5cbi8vIEZpbHRlcnNcbi8vIC0tLS0tLS1cblxuZmlsdGVyKHtcbiAgLy8gQ29udmVydHMgc2Vjb25kcyB0byBtaW51dGVzXG4gICdtaW51dGVzJzogcmVxdWlyZSgnLi9maWx0ZXJzL21pbnV0ZXMnKVxufSkuXG5cbi8vIFNlcnZpY2VzXG4vLyAtLS0tLS0tLVxuXG5mYWN0b3J5KHtcbiAgLy8gTG9jYWxzdG9yYWdlICsgY29va2llIHNoaW1cbiAgJ3N0b3JhZ2UnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3N0b3JhZ2UnKSxcbiAgLy8gTWFpbnRhaW4gc3RhdGUgb2YgdWlcbiAgJ3VpU3RhdGUnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3VpU3RhdGUnKSxcbiAgLy8gV2ViIHNvY2tldCB3cmFwcGVyXG4gICdzb2NrZXQnOiByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpLFxuICAvLyBTb2NrZXQgY29ubmVjdCB0byBhZG1pbiBjaGFubmVsXG4gICdhZG1pblNvY2tldCc6IHJlcXVpcmUoJy4vc2VydmljZXMvYWRtaW5Tb2NrZXQnKSxcbiAgLy8gQ29sbGVjdGlvbiBtYWludGFpbmVyXG4gICdjb2xsZWN0aW9uJzogcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb2xsZWN0aW9uJyksXG4gIC8vIE5vdGlmaWNhdGlvbiBjZW50ZXJcbiAgJ25vdGlmaWNhdGlvbkNlbnRlcic6IHJlcXVpcmUoJy4vc2VydmljZXMvbm90aWZpY2F0aW9uQ2VudGVyJylcbn0pLlxuXG4vLyBDb250cm9sbGVyc1xuLy8gLS0tLS0tLS0tLS1cblxuY29udHJvbGxlcih7XG4gIC8vIE1hbmFnZSBkZXZpY2VzIGluIHNlc3Npb25zXG4gICdTZXNzaW9uc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlcicpLFxuICAvLyBDb21wb3NpdGlvbiBvZiBzb25nIGZpbGVzXG4gICdDb21wb3NlQ29udHJvbGxlcic6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXInKSxcbiAgLy8gTWFuYWdlIGFkbWluaXN0cmF0b3JzIGFuZCByZWdpc3RlcmVkIHVzZXJzXG4gICdVc2Vyc0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1VzZXJzQ29udHJvbGxlcicpLFxuICAvLyBNYW5hZ2UgdXBsb2FkZWQgYXVkaW8gdHJhY2tzXG4gICdBdWRpb0NvbnRyb2xsZXInOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlcicpXG59KS5cblxuLy8gRGlyZWN0aXZlc1xuLy8gLS0tLS0tLS0tLVxuXG5kaXJlY3RpdmUoe1xuICAndXBsb2FkQXVkaW8nOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvdXBsb2FkQXVkaW8nKSxcbiAgLy8gSW50ZXJmYWNlIGZvciBlZGl0aW5nIGNvbGxlY3Rpb25zXG4gICdlZGl0b3InOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvZWRpdG9yJyksXG4gIC8vIFBsYXlpbmcgYXVkaW9cbiAgJ3BsYXliYWNrJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL3BsYXliYWNrJyksXG4gIC8vIEludGVyZmFjZSBmb3IgY3JlYXRpbmcgaXRlbXMgZm9yIGNvbGxlY3Rpb25zXG4gICdjcmVhdG9yJzogcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NyZWF0b3InKSxcbiAgLy8gQ29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbiAgJ2NvbnNvbGUnOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29uc29sZScpLFxuICAvLyBTZWFyY2hhYmxlIGNvbGxlY3Rpb24gaW50ZXJmYWNlIFxuICAnY29sbGVjdGlvbic6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJyksXG4gIC8vIFNlYXJjaGFibGUgc2FtcGxlIGxpc3RpbmdcbiAgJ3NhbXBsZXMnOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvc2FtcGxlcycpLFxuICAvLyBDb25maXJtYXRpb24gZGlhbG9ndWVcbiAgJ2NvbmZpcm0nOiByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29uZmlybScpLFxuICAvLyBOb3RpZmljYXRpb24gZGlhbG9ndWVcbiAgJ25vdGlmeSc6IHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9ub3RpZnknKVxufSk7XG5cblxuXG4iLCIvKipcbiAqIFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiAgXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUsIGFkbWluU29ja2V0LCBub3RpZmljYXRpb25DZW50ZXIpIHtcbiAgJHNjb3BlLmNsaWVudHMgPSBbXTtcbiAgJHNjb3BlLnNlc3Npb25zID0gW107XG4gICRzY29wZS5zZXNzaW9uSWQ7XG4gIFxuICBub3RpZmljYXRpb25DZW50ZXIuY29uZmlybSh7XG4gICAgbmFtZTogJ1lPTE8nLFxuICAgIG9rOiBmdW5jdGlvbigpIHtcbiAgICAgIGFsZXJ0KCd3aW4nKTtcbiAgICB9LFxuICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XG4gICAgICBhbGVydCgnbG9zZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgYWRtaW5Tb2NrZXQub24oJ2NsaWVudCcsIGZ1bmN0aW9uKGNsaWVudCkge1xuICAgICRzY29wZS5jbGllbnRzLnB1c2goY2xpZW50KTtcbiAgfSk7XG5cbiAgYWRtaW5Tb2NrZXQub24oJ2NsaWVudHMnLCBmdW5jdGlvbihjbGllbnRzKSB7XG4gICAgJHNjb3BlLmNsaWVudHMgPSBjbGllbnRzO1xuICB9KTtcblxuICBhZG1pblNvY2tldC5vbignc2Vzc2lvbnMnLCBmdW5jdGlvbihzZXNzaW9ucykge1xuICAgICRzY29wZS5zZXNzaW9ucyA9IHNlc3Npb25zO1xuICAgIGNvbnNvbGUud2Fybigkc2NvcGUuc2Vzc2lvbnMpO1xuICB9KTtcblxuICBhZG1pblNvY2tldC5vbignc2Vzc2lvbicsIGZ1bmN0aW9uKHNlc3Npb24pIHtcbiAgICAkc2NvcGUuc2Vzc2lvbnMucHVzaChzZXNzaW9uKTtcbiAgICBub3RpZmljYXRpb25DZW50ZXIubm90aWZ5KHtcbiAgICAgIGljb246ICdzaXRlbWFwJywgXG4gICAgICBuYW1lOiAnTmV3IFNlc3Npb24nLFxuICAgICAgbWVzc2FnZTogJ1Nlc3Npb24gJyArIHNlc3Npb24gKyAnIGNyZWF0ZWQnIFxuICAgIH0pO1xuICB9KTtcblxuICAkc2NvcGUuc3dpdGNoU2Vzc2lvbiA9IGZ1bmN0aW9uKCkge1xuICAgIGFkbWluU29ja2V0LmVtaXQoJ2NsaWVudHMnLCAkc2NvcGUuc2Vzc2lvbklkKTtcbiAgfTtcbiAgXG4gICRzY29wZS5kZWxldGVTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgLy90b2RvIFZFUklGSUNBVElPTiBQT1BVUCBORUVERURcbiAgICBhZG1pblNvY2tldC5lbWl0KCdkZWxldGVTZXNzaW9uJywgJHNjb3BlLnNlc3Npb25JZCk7XG4gIH07XG5cbiAgJHNjb3BlLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICBhZG1pblNvY2tldC5lbWl0KCdzZXNzaW9ucycpO1xuICB9O1xuXG4gICRzY29wZS5pbml0KCk7XG59O1xuIiwiXG4vLyBDb2xsZWN0aW9uIGRpcmVjdGl2ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gQWRkIHRoZSBhdHRyaWJ1dGUgY29sbGVjdGlvbiB0byBhbiBlbGVtZW50IGFuZCBcbi8vIHNwZWNpZnkgdGhlIG5hbWUgb2YgdGhlIGNvbGxlY3Rpb24gaW4gYSAnY29sbGVjdGlvbi1uYW1lJyBcbi8vIGF0dHJpYnV0ZSwgYW5kIHRoaXMgZGlyZWN0aXZlIHdpbGwgY3JlYXRlIGEgc2VhcmNoYWJsZSwgXG4vLyBzeW5jaHJvbml6ZWQgZGF0YSB2aWV3IG9mIHRoYXQgY29sbGVjdGlvbi5cblxudmFyIF8gPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbGxlY3Rpb24nLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHsgXG4gICAgICB2YXIgc2NoZW1hO1xuXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgc2NoZW1hID0gJGVsZW1lbnQuYXR0cignc2NoZW1hJyk7XG4gICAgICAkc2NvcGUuc2NoZW1hID0gY3JlYXRlU2NoZW1hKHNjaGVtYSk7XG4gXG4gICAgICBmdW5jdGlvbiBjcmVhdGVTY2hlbWEoc2NoZW1hU3RyaW5nKSB7XG4gICAgICAgIHZhciBmaWVsZHMsIHNjaGVtYSwgaTtcbiAgICAgICAgaWYoXy51bmRlZihzY2hlbWFTdHJpbmcpKSB7XG4gICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgc2NoZW1hID0ge307XG4gICAgICAgIGZpZWxkcyA9IHNjaGVtYVN0cmluZy5zcGxpdCgnfCcpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgc2NoZW1hW2ZpZWxkc1tpXV0gPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5mb2N1cyA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICRzY29wZS5tb2RlbHMuZm9jdXMgPSBpZDtcbiAgICAgIH07XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbmZpcm0nLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIFxuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCBub3RpZmljYXRpb25DZW50ZXIpIHtcbiAgICAgICRzY29wZS5zaG93Q29uZmlybWF0aW9uID0gZmFsc2U7XG4gICAgICBcbiAgICAgIC8vIFRha2VzIGEgZnVuY3Rpb24sIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0XG4gICAgICAvLyBjYWxscyB0aGUgZm4gYXJnIGFuZCB0aGVuIGNsb3NlcyB0aGUgY29uZmlybS5cbiAgICAgIGZ1bmN0aW9uIGFuZENsb3NlKGZuKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBmbigpO1xuICAgICAgICAgICRzY29wZS5zaG93Q29uZmlybWF0aW9uID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgJHNjb3BlLm9rID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUud2FybmluZygnRGVmYXVsdCBPSycpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLndhcm5pbmcoJ0RlZmF1bHQgY2FuY2VsJyk7XG4gICAgICB9O1xuICAgICAgXG4gICAgICBub3RpZmljYXRpb25DZW50ZXIub24oJ2NvbmZpcm1hdGlvbicsIGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICAgICRzY29wZS50aXRsZSA9IHNldHRpbmdzLnRpdGxlO1xuICAgICAgICAkc2NvcGUuZGVzY3JpcHRpb24gPSBzZXR0aW5ncy5kZXNjcmlwdGlvbjtcbiAgICAgICAgJHNjb3BlLm9rID0gYW5kQ2xvc2Uoc2V0dGluZ3Mub2spO1xuICAgICAgICAkc2NvcGUuY2FuY2VsID0gYW5kQ2xvc2Uoc2V0dGluZ3MuY2FuY2VsKTtcbiAgICAgICAgJHNjb3BlLnNob3dDb25maXJtYXRpb24gPSB0cnVlO1xuICAgICAgfSk7XG5cbiAgICB9XG4gIH07XG59O1xuXG4gIFxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1aVN0YXRlKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbnNvbGUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIHZhciBzaG93aW5nLCB1aUtleTtcblxuICAgICAgdWlLZXkgPSAnY29uc29sZS1zdGF0ZSdcbiAgICAgIHNob3dpbmcgPSAodWlTdGF0ZS5sb2FkKHVpS2V5KSB8fCBmYWxzZSk7XG4gICAgIFxuICAgICAgY2hlY2tWaXNpYmlsaXR5KCk7XG4gXG4gICAgICBmdW5jdGlvbiBjaGVja1Zpc2liaWxpdHkoKSB7XG4gICAgICAgIGlmKHNob3dpbmcpIHtcbiAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9IFxuICAgICAgfVxuICAgICAgICBcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSAgIHtcbiAgICAgICAgLy8gVG9nZ2xlIG9uIGAga2V5XG4gICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTkyKSB7XG4gICAgICAgICAgc2hvd2luZyA9ICFzaG93aW5nO1xuICAgICAgICAgIHVpU3RhdGUuc2F2ZSh1aUtleSwgc2hvd2luZyk7XG4gICAgICAgIFxuICAgICAgICAgIGNoZWNrVmlzaWJpbGl0eSgpO1xuICAgICAgICAgIC8vIEdpdmUgZm9jdXMgdG8gaW5wdXQgXG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgICAgLy8gU3RvcCBgIGJlaW5nIGluc2VydGVkIGludG8gY29uc29sZVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBhZG1pblNvY2tldCkge1xuICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgJHNjb3BlLm1lc3NhZ2VzID0gW107XG4gICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIFxuICAgICAgYWRtaW5Tb2NrZXQub24oJ21lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgfSk7XG5cbiAgICAgICRzY29wZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIH07XG5cbiAgICAgICRzY29wZS5hZGRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgIFxuICAgICAgICBtZXNzYWdlLmRhdGUgPSB7XG4gICAgICAgICAgaG91cnM6IGRhdGUuZ2V0SG91cnMoKSxcbiAgICAgICAgICBtaW51dGVzOiBkYXRlLmdldE1pbnV0ZXMoKVxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICBcbiAgICAgICAgJGVsZW1lbnRbMF0uc2Nyb2xsVG9wID0gJGVsZW1lbnRbMF0uc2Nyb2xsSGVpZ2h0XG4gICAgICB9O1xuICAgICAgIFxuICAgICAgJHNjb3BlLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmFkZE1lc3NhZ2Uoe1xuICAgICAgICAgIHR5cGU6ICdoaXN0b3J5JyxcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIGFkbWluU29ja2V0LmVtaXQoJ21lc3NhZ2UnLCAkc2NvcGUuaW5wdXQpO1xuICAgICAgICAkc2NvcGUuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIlxuLy8gQ3JlYXRvclxuLy8gLS0tLS0tLVxuIFxuLy8gUHJvdmlkZXMgYW4gaW50ZXJmYWNlIGZvciBjcmVhdGluZyBpdGVtcyBcbi8vIGZyb20gYSBjb2xsZWN0aW9uIHNlcnZpY2UuXG5cbnZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jcmVhdG9yJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIFxuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgdmFyIGNvbGxlY3Rpb247XG4gICAgICBcbiAgICAgIC8vIEdldCB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBlZGl0b3JcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAgICAgICBcbiAgICAgIC8vIEdldCB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBuYW1lIGZyb21cbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgYW5kIGJpbmQgaXQgdG9cbiAgICAgIC8vIHRoZSBzY29wZS4gXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgIFxuICAgICAgLy8gSW5pdGlhbCBzY2hlbWEgZm9yIGNyZWF0aW9uXG4gICAgICAkc2NvcGUuaW5pdGlhbCA9IHt9OyBcbiAgICAgIC8vIEFjdHVhbCBtb2RlbCBib3VuZCB0byBpbnB1dFxuICAgICAgJHNjb3BlLmluc3RhbmNlID0ge307XG4gICAgICAvLyBTYXZpbmcgc3RhdGVcbiAgICAgICRzY29wZS5jcmVhdGluZyA9IGZhbHNlO1xuXG4gICAgICAkc2NvcGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7ICAgIFxuICAgICAgICAkc2NvcGUuY3JlYXRpbmcgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuY29sbGVjdGlvbi5jcmVhdGUoJHNjb3BlLmluc3RhbmNlKTtcbiAgICAgIH07XG4gICAgICBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCdnZXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgaWYoJHNjb3BlLmNvbGxlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICRzY29wZS5pbml0aWFsID0gXy5jb3B5KCRzY29wZS5jb2xsZWN0aW9uWzBdKTtcbiAgICAgICAgICAvLyBObyBuZWVkIGZvciBtb25nbyBpZHMgaGVyZVxuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUuaW5pdGlhbC5faWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkc2NvcGUuaW5zdGFuY2UgPSAkc2NvcGUuaW5pdGlhbDtcbiAgICAgICAgZm9yKGtleSBpbiAkc2NvcGUuaW5zdGFuY2UpIHtcbiAgICAgICAgICAkc2NvcGUuaW5zdGFuY2Vba2V5XSA9ICcnO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ2NyZWF0ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUuY3JlYXRpbmcgPSBmYWxzZTtcbiAgICAgIH0pO1xuIFxuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJcbi8vIEVkaXRvclxuLy8gLS0tLS0tXG4gXG4vLyBQcm92aWRlcyBhbiBpbnRlcmZhY2UgZm9yIHVwZGF0aW5nIGFuZCBcbi8vIG1vZGlmeWluZyBpdGVtcyBmcm9tIGEgY29sbGVjdGlvbiBzZXJ2aWNlLlxuLy9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvZWRpdG9yJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFZGl0b3InKTtcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHtcbiAgICAgIFxuICAgICAgLy8gR2V0IHRoZSBuYW1lIG9mIHRoZSBjb2xsZWN0aW9uIGZvciB0aGlzIGVkaXRvclxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICAgICAgICBcbiAgICAgIC8vIEdldCB0aGUgY29sbGVjdGlvbiBmb3IgdGhpcyBuYW1lIGZyb21cbiAgICAgIC8vIHRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgYW5kIGJpbmQgaXQgdG9cbiAgICAgIC8vIHRoZSBzY29wZS4gXG4gICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgXG4gICAgICAkc2NvcGUubW9kZWwgPSB7fTtcbiAgIFxuICAgICAgJHNjb3BlLnNhdmluZyA9IGZhbHNlO1xuICAgICAgXG4gICAgICAkc2NvcGUucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5jb2xsZWN0aW9uLnJlbW92ZSgkc2NvcGUubW9kZWwpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1vZGVsID0gJHNjb3BlLm1vZGVsO1xuICAgICAgICBjb25zb2xlLmxvZygnZWRpdGVkJywgJHNjb3BlLm1vZGVsKTtcbiAgICAgICAgJHNjb3BlLmNvbGxlY3Rpb24udXBkYXRlKG1vZGVsLCBtb2RlbCk7XG4gICAgICAgICRzY29wZS5zYXZpbmcgPSB0cnVlOyBcbiAgICAgIH07XG4gICAgICBcbiAgICAgICRzY29wZS5jb2xsZWN0aW9uLm9uKCd1cGRhdGUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLnNhdmluZyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIFxuICAgICAgJHNjb3BlLmNvbGxlY3Rpb24ub24oJ2ZvY3VzJywgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgICAgJHNjb3BlLm1vZGVsID0gbW9kZWw7XG4gICAgICB9KTtcblxuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCR0aW1lb3V0KSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL25vdGlmaWNhdGlvbicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7IFxuICAgICAgXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsIG5vdGlmaWNhdGlvbkNlbnRlcikge1xuICAgICAgJHNjb3BlLnNob3dOb3RpZmljYXRpb24gPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICBub3RpZmljYXRpb25DZW50ZXIub24oJ25vdGlmeScsIGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdOb3RpZnknKTtcbiAgICAgICAgJHNjb3BlLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgICRzY29wZS5zaG93Tm90aWZpY2F0aW9uID0gdHJ1ZTtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHNjb3BlLnNob3dOb3RpZmljYXRpb24gPSBmYWxzZTtcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgICB9KTtcblxuICAgIH1cbiAgfTtcbn07XG5cbiAgXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OidBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2F1ZGlvL3BsYXknLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGludGVydmFsLCBjb2xsZWN0aW9uKSB7XG4gICAgICB2YXIgYXVkaW9Db2xsZWN0aW9uLCB1cGRhdGU7XG4gICAgICBcbiAgICAgIGF1ZGlvQ29sbGVjdGlvbiA9IGNvbGxlY3Rpb24oJ2F1ZGlvJyk7XG4gICAgICBcbiAgICAgICRzY29wZS5hdWRpbyA9IG51bGw7XG4gICAgICAkc2NvcGUucGxheWluZyA9IGZhbHNlO1xuICAgICAgJHNjb3BlLnByb2dyZXNzID0gMDtcbiAgICAgICRzY29wZS5uYW1lID0gJyc7XG4gICAgICAkc2NvcGUuZHVyYXRpb24gPSAnJztcblxuICAgICAgYXVkaW9Db2xsZWN0aW9uLm9uKCdmb2N1cycsIGZ1bmN0aW9uKGF1ZGlvKSB7XG4gICAgICAgIFxuICAgICAgICAvLyBUb3RhbGx5IHJlc2V0IHRoZSBjdXJyZW50IGF1ZGlvXG4gICAgICAgIGlmKCRzY29wZS5wbGF5aW5nKSB7XG4gICAgICAgICAgJHNjb3BlLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgICAkc2NvcGUuYXVkaW8ucGF1c2UoKTtcbiAgICAgICAgICAkc2NvcGUucHJvZ3Jlc3MgPSAwO1xuICAgICAgICAgIGRlbGV0ZSAkc2NvcGUuYXVkaW87XG4gICAgICAgICAgJGludGVydmFsLmNhbmNlbCh1cGRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAkc2NvcGUubmFtZSA9IGF1ZGlvLm5hbWU7XG4gICAgICAgICRzY29wZS5kdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uO1xuICAgICAgICAkc2NvcGUuYXVkaW8gPSBuZXcgQXVkaW8oJ2F1ZGlvL3BsYXkvJyArIGF1ZGlvLl9pZCk7XG4gICAgICAgICRzY29wZS5hdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsICRzY29wZS5zdG9wKTtcbiAgICAgICAgJHNjb3BlLnJlZnJlc2hQcm9ncmVzcygpO1xuICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgJHNjb3BlLnBsYXkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLnBsYXlpbmcgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuYXVkaW8ucGxheSgpO1xuICAgICAgICBkb2N1bWVudC50aXRsZSA9ICRzY29wZS5uYW1lO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5wbGF5aW5nID0gZmFsc2U7XG4gICAgICAgICRzY29wZS5hdWRpby5wYXVzZSgpO1xuICAgICAgfTtcblxuICAgICAgJHNjb3BlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNyYztcbiAgICAgICAgJHNjb3BlLnBsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gMDtcbiAgICAgICAgJHNjb3BlLmF1ZGlvLnBhdXNlKCk7XG4gICAgICAgIHNyYyA9ICRzY29wZS5hdWRpby5zcmM7XG4gICAgICAgIGRlbGV0ZSAkc2NvcGUuYXVkaW87XG4gICAgICAgICRzY29wZS5hdWRpbyA9IG5ldyBBdWRpbyhzcmMpO1xuICAgICAgICBkb2N1bWVudC50aXRsZSA9ICdBdWRpb2Ryb3AgLSBBZG1pbic7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUucHJvZ3Jlc3Npb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb2dyZXNzO1xuICAgICAgICBwcm9ncmVzcyA9ICRzY29wZS5hdWRpby5jdXJyZW50VGltZSAvICRzY29wZS5hdWRpby5kdXJhdGlvbjtcbiAgICAgICAgJHNjb3BlLnByb2dyZXNzID0gcHJvZ3Jlc3MgKiAxMDA7XG4gICAgICB9O1xuICAgICAgXG4gICAgICAkc2NvcGUucmVmcmVzaFByb2dyZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHVwZGF0ZSA9ICRpbnRlcnZhbCgkc2NvcGUucHJvZ3Jlc3Npb24sIDUwMCk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxufVxuIiwiXG4vLyBTYW1wbGVzIGRpcmVjdGl2ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vXG4vLyBEaXNwbGF5cyBzYW1wbGVzIGZvciBhdWRpbyB0cmFja3Ncbi8vIGluIGEgZ3JpZCBsaWtlIG1hbm5lci5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9zYW1wbGVzJyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7IFxuXG4gICAgICAkc2NvcGUuc2FtcGxlcyA9IGNvbGxlY3Rpb24oJ2F1ZGlvJyk7XG4gICAgICAkc2NvcGUuc2VhcmNoID0gJyc7XG4gXG4gICAgICAkc2NvcGUuZm9jdXMgPSBmdW5jdGlvbihpZCkge1xuICAgICAgICAvLyBJbnNlcnQgdGhlIHNhbXBsZSBpbnRvIHRoZSB0cmFja1xuICAgICAgfTtcblxuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygndXBsb2FkIGRpcmVjdGl2ZScpO1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9hdWRpby91cGxvYWQnLFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHVwbG9hZCwgJHRpbWVvdXQpIHtcbiAgICAgIFxuICAgICAgZnVuY3Rpb24gcmVtb3ZlKGZpbGUpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvcihpID0gMDsgaSA8ICRzY29wZS5maWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKCRzY29wZS5maWxlc1tpXSA9PT0gZmlsZSkge1xuICAgICAgICAgICAgJHNjb3BlLmZpbGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gdXBsb2FkKGZpbGUpIHtcbiAgICAgICAgZmlsZS51cGxvYWRlZCA9IGZhbHNlO1xuXG4gICAgICAgICR1cGxvYWQudXBsb2FkKHtcbiAgICAgICAgICB1cmw6ICcvdXBsb2FkL2F1ZGlvJyxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pLnByb2dyZXNzKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBmaWxlLnByb2dyZXNzID0gMTAwICogKGUubG9hZGVkIC8gZS50b3RhbCk7IFxuICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgIGlmKHJlcy5zdGF0dXMgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgZmlsZS51cGxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAvLyBHZXQgcmlkIG9mIHRoZSBzdWNjZXNzIG5vdGlmaWNhdGlvblxuICAgICAgICAgICAgJHRpbWVvdXQocmVtb3ZlLmJpbmQodGhpcywgZmlsZSksIDUwMDApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWxlLmVycm9yID0gcmVzLmRhdGEubWVzc2FnZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKGRhdGEsIHN0YXR1cykge1xuICAgICAgICAgIGZpbGUuZXJyb3IgPSAnVGhlcmUgd2FzIGEgcHJvYmxlbSB1cGxvYWRpbmcuJztcbiAgICAgICAgfSk7XG5cbiAgICAgIH1cblxuICAgICAgJHNjb3BlLmZpbGVzID0gW107XG5cbiAgICAgICRzY29wZS51cGxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8ICRzY29wZS5maWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHVwbG9hZCgkc2NvcGUuZmlsZXNbaV0pOyAgICAgICAgIFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oJGZpbGVzKSB7XG4gICAgICAgICRzY29wZS5maWxlcyA9ICRmaWxlcztcbiAgICAgICAgJHNjb3BlLmZpbGVzLm1hcChmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IDA7XG4gICAgICAgICAgZmlsZS51cGxvYWRlZCA9IGZhbHNlO1xuICAgICAgICAgIGZpbGUuZXJyb3IgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICB9XG4gIH1cbn1cbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oX3NlY29uZHMpIHsgICAgXG4gICAgdmFyIG1pbnV0ZXMsIHNlY29uZHM7XG4gICAgXG4gICAgaWYoXy51bmRlZihfc2Vjb25kcykgfHwgaXNOYU4oX3NlY29uZHMpKSB7XG4gICAgICByZXR1cm4gJzAwOjAwJztcbiAgICB9XG5cbiAgICBtaW51dGVzID0gTWF0aC5mbG9vcihfc2Vjb25kcyAvIDYwKTtcbiAgICBzZWNvbmRzID0gTWF0aC5mbG9vcigoKF9zZWNvbmRzIC8gNjApIC0gbWludXRlcykgKiA2MCk7XG5cbiAgICBzZWNvbmRzID0gc2Vjb25kcyA+IDkgPyBzZWNvbmRzIDogJzAnICsgc2Vjb25kcztcblxuICAgIHJldHVybiBtaW51dGVzICsgJzonICsgc2Vjb25kcztcbiAgfVxufVxuIiwiXG4vLyBhZG1pblNvY2tldCBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFByb3ZpZGVzIGEgc29ja2V0IHRoYXQncyBjb25uZWN0ZWRcbi8vIHRvIHRoZSBhZG1pbiBjaGFubmVsLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuICB2YXIgYWRtaW5Tb2NrZXQgPSBzb2NrZXQoJ2FkbWluJyk7XG4gIGFkbWluU29ja2V0LnJlYWR5ID0gZmFsc2U7XG4gIFxuICBhZG1pblNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICBhZG1pblNvY2tldC5yZWFkeSA9IHRydWU7XG4gIH0pO1xuICBcbiAgcmV0dXJuIGFkbWluU29ja2V0O1xufTtcbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vLyBjb2xsZWN0aW9uIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLSBcblxuLy8gVGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBpcyByZXNwb25zaWJsZSBmb3IgbWFpbnRhaW5nXG4vLyB0aGUgc3RhdGUgYW5kIGEgbW9kaWZpY2F0aW9uIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbnNcbi8vIGRlZmluZWQgYXQgdGhlIHNlcnZlciBzaWRlLiBTZWUgYC9yb3V0ZXMvY29sbGVjdGlvbi9gXG4vLyBmb3IgbW9yZSBkZXRhaWxzLlxuXG4vLyBBZnRlciB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggYSBuYW1lXG4vLyBwYXJhbWV0ZXIsIHRoZSBhZG1pblNvY2tldCB3YWl0cyBmb3IgdGhlIHNlcnZlcidzXG4vLyByZWFkeSBldmVudCwgYW5kIHRoZW4gcHJvY2VlZHMgdG8gbGlzdGVuIHRvIHRoZSBldmVudHNcbi8vIChfX2NyZWF0ZV9fLCBfX2dldF9fLCBfX3VwZGF0ZV9fLCBfX3JlbW92ZV9fKSBcbi8vIGZvciB0aGF0IG5hbWUgYW5kIGNyZWF0ZXMgYSBzZXQgb2YgbWV0aG9kcyB0byBtYW5pcHVsYXRlIFxuLy8gdGhlIGRhdGEgb3ZlciB0aGUgc29ja2V0IGNvbm5lY3Rpb24uXG5cbi8vIEZpbmFsbHksIGEgZHluYW1pYyBhcnJheSBjb250YWluaW5nIHRoZSBtb2RlbHNcbi8vIGZyb20gdGhlIGNvbGxlY3Rpb24gaXMgcmV0dXJuZWQsIHdpdGggY3JlYXRlLCB1cGRhdGVcbi8vIGFuZCByZW1vdmUgbWV0aG9kcyB0YWNrZWQgb24gdG8gaXQuIFRoaXMgY2FuIGJlIHVzZWRcbi8vIGJvdW5kIHN0cmFpZ2h0IHRvIHRoZSBET00gZnJvbSBjb250cm9sbGVycy5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhZG1pblNvY2tldCkge1xuXG4gIC8vIFN0b3JlIGFsbCBhdmFpbGFibGUgY29sbGVjdGlvbnMgaW4gaGVyZS5cbiAgdmFyIGNvbGxlY3Rpb25zID0ge307XG5cblxuICAvLyBGaW5kIGFuZCByZXR1cm4gYSBtb2RlbCBmcm9tIGEgY29sbGVjdGlvblxuICAvLyBiYXNlZCBvbiB0aGUgX2lkIHByb3BlcnR5IG9mIHRoZSBxdWVyeSBcbiAgLy8gb2JqZWN0LiBfKFF1ZXJ5IG9iamVjdCBub3JtYWxseSBjb21lcyBmcm9tXG4gIC8vIHRoZSBkYXRhYmFzZSlfXG4gIGZ1bmN0aW9uIGZpbmQoY29sbGVjdGlvbiwgcXVlcnkpIHtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihjb2xsZWN0aW9uW2ldLl9pZCA9PT0gcXVlcnkuX2lkKSB7XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBcbiAgLy8gIyMgcmVtb3ZlXG4gIC8vIGAoY29sbGVjdGlvbiwgcXVlcnkpYFxuICAvLyBSZW1vdmVzIGFueSBpdGVtcyBmcm9tIGBjb2xsZWN0aW9uYCB0aGF0XG4gIC8vIG1hdGNoIHRoZSBgX2lkYCBzdXBwbGllZCBmcm9tIGBxdWVyeWAuXG4gIGZ1bmN0aW9uIHJlbW92ZShjb2xsZWN0aW9uLCBxdWVyeSkge1xuICAgIHZhciBpLCBpbmRleDtcbiAgICBmb3IoaSA9IDA7IGkgPCBjb2xsZWN0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihjb2xsZWN0aW9uW2ldLl9pZCA9PT0gcXVlcnkuX2lkKSB7XG4gICAgICAgIGluZGV4ID0gaTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0eXBlb2YgaW5kZXggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb2xsZWN0aW9uLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZCB0byBwcm92aWRlIGNsZWFuIGxvb2tpbmdcbiAgLy8gbmFtZXMgZm9yIHNvY2tldCBldmVudHNcbiAgZnVuY3Rpb24gZXZlbnRzKG5hbWUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiBuYW1lICsgJy9nZXQnLFxuICAgICAgY3JlYXRlOiBuYW1lICsgJy9jcmVhdGUnLFxuICAgICAgcmVtb3ZlOiBuYW1lICsgJy9yZW1vdmUnLFxuICAgICAgdXBkYXRlOiBuYW1lICsgJy91cGRhdGUnXG4gICAgfVxuICB9XG4gIFxuICAvLyBSZW1vdmVzIGFsbCBhbmd1bGFyIHByb3BlcnRpZXMgZnJvbVxuICAvLyBhbiBvYmplY3QsIHNvIHRoYXQgaXQgbWF5IGJlIHVzZWQgZm9yXG4gIC8vIHF1ZXJ5aW5nIGF0IG1vbmdvXG4gIGZ1bmN0aW9uIHNhbml0aXplKG9iamVjdCkge1xuICAgIHZhciBrZXksIHNhbml0aXplZDtcbiAgICBzYW5pdGl6ZWQgPSB7fTtcbiAgICBmb3Ioa2V5IGluIG9iamVjdCkge1xuICAgICAgaWYoa2V5WzBdICE9PSAnJCcpIHtcbiAgICAgICAgc2FuaXRpemVkW2tleV0gPSBvYmplY3Rba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNhbml0aXplZDtcbiAgfVxuXG4gIC8vICMgbW9kZWxcbiAgLy8gYChuYW1lKWBcbiAgLy8gQ3JlYXRlcyBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb24gd2l0aCB0aGlzIG5hbWVcbiAgLy8gYW5kIHJldHVybnMgZHluYW1pYyBjb2xsZWN0aW9uIGFycmF5IGFsb25nXG4gIC8vIHdpdGggY29sbGVjdGlvbiBtYW5pcHVsYXRpb24gbWV0aG9kcy4gU2VlXG4gIC8vIG1vZHVsZSBkb2MgY29tbWVudCBmb3IgbW9yZSBkZXRhaWxzLiBcbiAgZnVuY3Rpb24gbW9kZWwobmFtZSkge1xuICAgIHZhciBjb2xsZWN0aW9uLCBzb2NrZXQsIGV2ZW50LCBsaXN0ZW5lcnM7XG5cbiAgICAvLyBpZiB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoaXMgY29sbGVjdGlvblxuICAgIGlmKGNvbGxlY3Rpb25zW25hbWVdKSB7XG4gICAgICAvL3JldHVybiBpdCBzdHJhaWdodCBhd2F5XG4gICAgICBjb25zb2xlLmxvZygnbG9hZCcsIG5hbWUpO1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvLyBldmVudCBsaXN0ZW5lcnNcbiAgICBsaXN0ZW5lcnMgPSB7fTtcblxuICAgIC8vIGFsaWFzaW5nXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBpZihzb2NrZXQucmVhZHkpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvLyBTb2NrZXQgRXZlbnRzXG4gICAgLy8gLS0tLS0tLS0tLS0tLVxuICAgIFxuICAgIC8vICMgZ2V0XG4gICAgLy8gYChtb2RlbHMpYFxuICAgIC8vIFdoZW4gdGhlIHNvY2tldCByZWNlaXZlcyBhIGdldCBldmVudCxcbiAgICAvLyByZXNldCB0aGUgY29sbGVjdGlvbiBhbmQgcG9wdWxhdGUgaXQgd2l0aFxuICAgIC8vIHRoZSBuZXcgbW9kZWxzLiBGaW5hbGx5IHRyaWdnZXIgYSBnZXQgZXZlbnRcbiAgICAvLyBmb3IgYW55IGxpc3RlbmVycy5cbiAgICBzb2NrZXQub24oZXZlbnQuZ2V0LCBmdW5jdGlvbihtb2RlbHMpIHtcbiAgICAgIC8vIFJlbW92ZSBhbGwgaXRlbXMgKGJ1dCBkb24ndCBvdmVyd3JpdGUgdGhlIHJlZmVyZW5jZSlcbiAgICAgIGNvbGxlY3Rpb24ubGVuZ3RoID0gMDtcbiAgICAgIC8vIEhhY2t5IHdheSBub3QgdGhhdCB3b24ndCByZXNldCByZWZlcmVuY2VcbiAgICAgIGNvbGxlY3Rpb24ucHVzaC5hcHBseShjb2xsZWN0aW9uLCBtb2RlbHMuZGF0YSk7XG4gICAgICBjb2xsZWN0aW9uLmZvY3VzKGNvbGxlY3Rpb25bMF0uX2lkKTtcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignZ2V0JywgbW9kZWxzKTtcbiAgICB9KTtcblxuICAgIC8vICMgY3JlYXRlXG4gICAgLy8gYChtb2RlbHMpYFxuICAgIC8vIElzIGNhbGxlZCB3aGVuZXZlciB0aGUgc29ja2V0IHJlY2VpdmVzXG4gICAgLy8gYSBjcmVhdGUgZXZlbnQgKGEgbmV3IG1vZGVsIGlzIGNyZWF0ZWQpLlxuICAgIC8vIEFkZCB0byB0aGUgY29sbGVjdGlvbiBhbmQgdHJpZ2dlciBjcmVhdGUuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmNyZWF0ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGNvbGxlY3Rpb24ucHVzaChtb2RlbC5kYXRhKTtcbiAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignY3JlYXRlJywgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgLy8gIyByZW1vdmVcbiAgICAvLyBgKG1vZGVsKWBcbiAgICAvLyBJcyBjYWxsZWQgd2hlbmV2ZXIgdGhlIHNvY2tldCByZWNlaXZlc1xuICAgIC8vIGEgcmVtb3ZlIGV2ZW50LiBSZW1vdmVzIHRoZSBtb2RlbCBmcm9tXG4gICAgLy8gdGhlIGNvbGxlY3Rpb24gYW5kIHRyaWdnZXJzIHJlbW92ZS5cbiAgICBzb2NrZXQub24oZXZlbnQucmVtb3ZlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgbW9kZWwgPSBtb2RlbC5kYXRhO1xuICAgICAgcmVtb3ZlKGNvbGxlY3Rpb24sIG1vZGVsKTsgIFxuICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdyZW1vdmUnLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICAvLyAjIHVwZGF0ZVxuICAgIC8vIGAodXBkYXRlZClgXG4gICAgLy8gSXMgY2FsbGVkIHdoZW5ldmVyIHRoZSBzb2NrZXQgcmVjZWl2ZXNcbiAgICAvLyBhbiB1cGRhdGUgZXZlbnQsIHBhc3NpbmcgdGhlIHVwZGF0ZWQgbW9kZWxcbiAgICAvLyBhcyBhbiBhcmd1bWVudC4gVXBkYXRlcyB0aGUgbW9kZWwgaW4gdGhlIFxuICAgIC8vIGNvbGxlY3Rpb24gYW5kIHRoZW4gdHJpZ2dlcnMgYW4gdXBkYXRlIGV2ZW50LiBcbiAgICBzb2NrZXQub24oZXZlbnQudXBkYXRlLCBmdW5jdGlvbih1cGRhdGVkKSB7XG4gICAgICB2YXIga2V5LCBtb2RlbDtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVkLmRhdGE7XG5cbiAgICAgIC8vIF9fSW1wb3J0YW50X18gdG8gcmVhZCFcbiAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB2YWx1ZXMgb2YgdGhlIG1vZGVsXG4gICAgICAvLyB0aGUgY29sbGVjdGlvbiwgd2UgY2FuIGFjY2VzcyBpdCB1c2luZyBmaW5kXG4gICAgICBtb2RlbCA9IGZpbmQoY29sbGVjdGlvbiwgdXBkYXRlZCk7XG4gICAgICBpZihtb2RlbCkgeyBcbiAgICAgICAgLy8gV2UgY2FuJ3Qgc2V0IHRoZSB2YWx1ZSBvZiBtb2RlbCB0byBcbiAgICAgICAgLy8gdXBkYXRlZCBhcyB0aGF0IHdpbGwgb3ZlcndyaXRlIHRoZSByZWZlcmVuY2UuXG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbG9vcCB0aHJvdWdoIGFuZCB1cGRhdGUgdGhlXG4gICAgICAgIC8vIHByb3BlcnRpZXMgb2YgdGhlIG9iamVjdCBvbmUgYnkgb25lLlxuICAgICAgICBmb3Ioa2V5IGluIHVwZGF0ZWQpIHtcbiAgICAgICAgICBtb2RlbFtrZXldID0gdXBkYXRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICAgIC8vIEFuZCB3ZSdyZSBkb25lIVxuICAgICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ3VwZGF0ZScsIG1vZGVsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEV4cG9zZWQgbWV0aG9kc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFRoZXNlIG1ldGhvZHMgYXJlIGF2YWlsYWJsZSBvbiB0aGUgY29sbGVjdGlvblxuICAgIC8vIG9iamVjdCwgZm9yIG90aGVyIG1ldGhvZHMgdG8gdXNlIHRoZSBjb2xsZWN0aW9uXG4gICAgLy8gZnVuY3Rpb25hbGl0eSB0byB1cGRhdGUgdGhlIGNvbGxlY3Rpb25zIGF0IHRoZSBcbiAgICAvLyBzZXJ2ZXIgc2lkZS5cbiAgXG4gICAgLy8gIyBjcmVhdGVcbiAgICAvLyBgKG1vZGVsKWBcbiAgICAvLyBBZGRzIGEgbW9kZWwgdG8gdGhlIGNvbGxlY3Rpb25cbiAgICBjb2xsZWN0aW9uLmNyZWF0ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5jcmVhdGUsIG1vZGVsKTtcbiAgICB9O1xuICAgIFxuICAgIC8vICMgcmVtb3ZlXG4gICAgLy8gYChtb2RlbClgXG4gICAgLy8gUmVtb3ZlcyBgbW9kZWxgIGZyb20gdGhlIGNvbGxlY3Rpb25cbiAgICBjb2xsZWN0aW9uLnJlbW92ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBtb2RlbCA9IHNhbml0aXplKG1vZGVsKTtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnJlbW92ZSwgbW9kZWwpO1xuICAgIH07XG5cbiAgICAvLyAjIHVwZGF0ZVxuICAgIGNvbGxlY3Rpb24udXBkYXRlID0gZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIHZhciBrZXksIHZhbHVlcztcbiAgICAgIHZhbHVlcyA9IHt9XG5cbiAgICAgIC8vIGlmIHRoZSBzYW1lIG9iamVjdCB3YXMgcGFzc2VkIHR3aWNlXG4gICAgICBpZihtb2RlbCA9PT0gdXBkYXRlZCkge1xuICAgICAgICBtb2RlbCA9IF8uY29weSh1cGRhdGVkKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gb25seSBuZWVkIHRoZSBpZCB0byBtYWtlIHRoZSB1cGRhdGVcbiAgICAgIG1vZGVsID0ge1xuICAgICAgICBfaWQ6IG1vZGVsLl9pZFxuICAgICAgfVxuXG4gICAgICAvLyBzdHJpcCBtb25nby9hbmd1bGFyIHByb3BlcnRpZXNcbiAgICAgIGZvcihrZXkgaW4gdXBkYXRlZCkge1xuICAgICAgICBpZighKGtleVswXSA9PT0gJyQnIHx8IGtleVswXSA9PT0gJ18nKSkge1xuICAgICAgICAgIHZhbHVlc1trZXldID0gdXBkYXRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzb2NrZXQuZW1pdChldmVudC51cGRhdGUsIG1vZGVsLCB2YWx1ZXMpO1xuICAgIH07IFxuXG4gICAgLy8gIyBvblxuICAgIC8vIGAoZXZlbnROYW1lLCBmbilgXG4gICAgLy8gUmVnaXN0ZXJzIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgdHJpZ2dlcmVkXG4gICAgLy8gb24gdGhlIGV2ZW50IHNwZWNpZmllZCBieSBgZXZlbnROYW1lYC5cbiAgICBjb2xsZWN0aW9uLm9uID0gZnVuY3Rpb24oZXZlbnROYW1lLCBmbikge1xuICAgICAgaWYoIShsaXN0ZW5lcnNbZXZlbnROYW1lXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICBsaXN0ZW5lcnNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgfVxuICAgICAgbGlzdGVuZXJzW2V2ZW50TmFtZV0ucHVzaChmbik7XG4gICAgfTtcblxuICAgIC8vICMgdHJpZ2dlclxuICAgIC8vIGAoZXZlbnROYW1lLCBkYXRhLi4uKWBcbiAgICAvLyBUcmlnZ2VycyBhbGwgZXZlbnRzIHdpdGggdGhlIG5hbWUgc3BlY2lmaWVkXG4gICAgLy8gYW5kIHBhc3NlcyBhbGwgdGhlIG90aGVyIGFyZ3VtZW50cyB0byB0aG9zZVxuICAgIC8vIGV2ZW50IGxpc3RlbmVycy5cbiAgICBjb2xsZWN0aW9uLnRyaWdnZXIgPSBmdW5jdGlvbihldmVudE5hbWUsIGRhdGEpIHtcbiAgICAgIGRhdGEgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZihsaXN0ZW5lcnNbZXZlbnROYW1lXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnNbZXZlbnROYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGxpc3RlbmVyc1tldmVudE5hbWVdW2ldLmFwcGx5KHRoaXMsIGRhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvLyAjIGZvY3VzXG4gICAgLy8gYChfaWQpYFxuICAgIC8vIE11bHRpIHB1cnBvc2UgZm9jdXMgbWV0aG9kIHdoaWNoIGFwcGxpZXMgYSBmb2N1c1xuICAgIC8vIHRvIHRoZSBtb2RlbCB3aXRoIHRoaXMgaWQuIENyZWF0ZXMgYSBjb3B5IG9mIHRoZSBcbiAgICAvLyBmb2N1c2VkIG1vZGVsICh0aGF0IGNhbiBiZSB1cGRhdGVkKSBhbmQgdHJpZ2dlcnNcbiAgICAvLyBhIGZvY3VzIGV2ZW50LlxuICAgIGNvbGxlY3Rpb24uZm9jdXMgPSBmdW5jdGlvbihfaWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdmb2N1cyBvbicsIF9pZCk7XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZihjb2xsZWN0aW9uW2ldLl9pZCA9PT0gX2lkKSB7XG4gICAgICAgICAgY29sbGVjdGlvbi5mb2N1c2VkID0gXy5jb3B5KGNvbGxlY3Rpb25baV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb2xsZWN0aW9uLnRyaWdnZXIoJ2ZvY3VzJywgY29sbGVjdGlvbi5mb2N1c2VkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gdGhlIGl0ZW0gdGhhdCBjdXJyZW50bHkgaGFzIGZvY3VzXG4gICAgY29sbGVjdGlvbi5mb2N1c2VkID0ge307XG4gIFxuICAgIC8vIFJldmVhbCB0aGUgbmFtZSBvZiB0aGlzIGNvbGxlY3Rpb25cbiAgICBjb2xsZWN0aW9uLm5hbWUgPSBuYW1lO1xuICAgIFxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgcmV0dXJuIG1vZGVsO1xufTtcbiIsInZhciBfID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgZXZlbnRzID0ge307XG5cbmZ1bmN0aW9uIGlzUmVnaXN0ZXJlZChldmVudCkge1xuICByZXR1cm4gXy50eXBlKGV2ZW50c1tldmVudF0sICdvYmplY3QnKTtcbn1cblxuZnVuY3Rpb24gb24oZXZlbnQsIHRoZW4pIHtcbiAgaWYoIWlzUmVnaXN0ZXJlZChldmVudCkpIHtcbiAgICBldmVudHNbZXZlbnRdID0gW107XG4gIH1cbiAgZXZlbnRzW2V2ZW50XS5wdXNoKHRoZW4pO1xufVxuXG5mdW5jdGlvbiBlbWl0KGV2ZW50LCByZXN0KSB7XG4gIHZhciBhcmdzO1xuICBjb25zb2xlLndhcm4oJ0VtaXQnLCBldmVudCwgaXNSZWdpc3RlcmVkKGV2ZW50KSk7XG4gIGlmKGlzUmVnaXN0ZXJlZChldmVudCkpIHtcbiAgICBhcmdzID0gXy5hcmdzKGFyZ3VtZW50cykuc2xpY2UoMSk7XG4gICAgZXZlbnRzW2V2ZW50XS5mb3JFYWNoKGZ1bmN0aW9uKHRoZW4pIHtcbiAgICAgIHRoZW4uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICBvbjogb24sXG4gICAgLy8gT25seSBleHBvc2UgcmVxdWlyZWQgbWV0aG9kc1xuICAgIG5vdGlmeTogZW1pdC5iaW5kKHRoaXMsICdub3RpZnknKSxcbiAgICBjb25maXJtOiBlbWl0LmJpbmQodGhpcywgJ2NvbmZpcm0nKVxuICB9XG59O1xuIiwiXG4vLyBTb2NrZXQgV3JhcHBlclxuLy8gLS0tLS0tLS0tLS0tLS1cblxuLy8gQWN0cyBhcyBhIHdyYXBwZXIgYXJvdW5kIHNvY2tldEZhY3Rvcnlcbi8vIGFuZCBleHBvc2VzIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGNyZWF0ZVxuLy8gbmFtZXNwYWNlZCBzb2NrZXRzLCBiYXNlZCBvbiBhIHBhcmFtZXRlci5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXRGYWN0b3J5KSB7XG4gIHJldHVybiBmdW5jdGlvbihuYW1lc3BhY2UpIHtcbiAgICB2YXIgY29ubmVjdFVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyArIG5hbWVzcGFjZTtcbiAgICByZXR1cm4gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogaW8uY29ubmVjdChjb25uZWN0VXJsKVxuICAgIH0pO1xuICB9XG59O1xuIiwiXG4vLyBTdG9yYWdlIEZhY3Rvcnlcbi8vIC0tLS0tLS0tLS0tLS0tLVxuXG4vLyBQcm92aWRlcyBsb2NhbFN0b3JhZ2Ugc3VwcG9ydCB3aXRoIGEgY29va2llXG4vLyBiYXNlZCBmYWxsYmFjay4gXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYWNoZSwgc3RvcmFnZSwgaWQ7XG4gIFxuICBpZCA9ICdhdWRpby1kcm9wLXN0b3JhZ2UnO1xuICBzdG9yYWdlID0gd2hpY2goKTtcblxuICAvLyBEZXRlcm1pbmVzIHdoaWNoIHR5cGUgb2Ygc3RvcmFnZVxuICAvLyBpcyBhdmFpbGFibGUgYW5kIHJldHVybnMgYSBqUXVlcnlcbiAgLy8gc3R5bGUgZ2V0dGVyL3NldHRlciBmb3IgaXQncyB2YWx1ZS5cbiAgZnVuY3Rpb24gd2hpY2goKSB7XG4gICAgaWYod2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGxvY2FsU3RvcmFnZVtpZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlW2lkXSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYodHlwZW9mIGRhdGEgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkb2N1bWVudC5jb29raWUgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTG9hZCB0aGUgY29udGVudHMgZnJvbSB3aGljaGV2ZXJcbiAgLy8gc3RvcmFnZSBpcyBhdmFpYWJsZS4gSWYgSlNPTiBwYXJzZVxuICAvLyB0aHJvd3MgYW4gZXhjZXB0aW9uLCB0aGVuIHRoZSB2YWx1ZVxuICAvLyB3YXMgdW5kZWZpbmVkLCBzbyBpbnN0ZWFkIGNhY2hlIGFuXG4gIC8vIGVtcHR5IG9iamVjdC5cbiAgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgY2FjaGUgPSBKU09OLnBhcnNlKHN0b3JhZ2UoKSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBjYWNoZSA9IHt9O1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGU7XG4gIH1cblxuICAvLyBTYXZlIHRoZSBjb250ZW50cyBvZiB0aGUgY2FjaGVcbiAgLy8gaW50byBzdG9yYWdlXG4gIGZ1bmN0aW9uIHNhdmUoKSB7XG4gICAgc3RvcmFnZShKU09OLnN0cmluZ2lmeShjYWNoZSkpO1xuICB9XG5cbiAgLy8gU2V0IGEgdmFsdWUgd2l0aGluIHRoZSBjYWNoZVxuICAvLyBiYXNlZCBvbiBhIGtleSBhbmQgdGhlbiBzYXZlIGl0LlxuICBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIGlmKCFjYWNoZSkgbG9hZCgpO1xuICAgIGNhY2hlW2tleV0gPSB2YWx1ZTtcbiAgICBzYXZlKCk7XG4gIH1cblxuICAvLyBHZXQgYSB2YWx1ZSBmcm9tIHRoZSBjYWNoZVxuICBmdW5jdGlvbiBnZXQoa2V5KSB7XG4gICAgaWYoIWNhY2hlKSBsb2FkKCk7XG4gICAgcmV0dXJuIGNhY2hlW2tleV07XG4gIH0gXG5cbiAgLy8gRXhwb3NlIGdldCBhbmQgc2V0IG1ldGhvZHNcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGdldCxcbiAgICBzZXQ6IHNldFxuICB9XG59O1xuIiwiLy8gdWlTdGF0ZSBGYWN0b3J5XG4vLyAtLS0tLS0tLS0tLS0tLS1cblxuLy8gQSB0aW55IGZhY3RvcnkgZm9yIG1haW50YWluaW5nIHRoZVxuLy8gc3RhdGUgb2YgdGhlIFVJIGF0IGFueSB0aW1lLiBUaGUgbmFtZVxuLy8gb2YgdGhlIHVpIGluIHF1ZXN0aW9uIHNob3VsZCBiZSBwYXNzZWRcbi8vIHRvIHRoZSBzYXZlIG1ldGhvZCB0byBwZXJzaXN0IGl0LlxuXG4vLyBUaGUgc3RhdGUgY2FuIHRoZW4gYmUgcmVsb2FkZWQgYXQgYW55XG4vLyB0aW1lIGluIHRoZSBmdXR1cmUuXG5cbi8vIF9fSW1wb3J0YW50X18gVGhpcyBkb2VzIG5vdCBjaGFuZ2Vcbi8vIHRoZSBET00gX19hdCBhbGxfXy4gSXQganVzdCBzYXZlc1xuLy8gYSBKU09OIG9iamVjdCB3aGljaCBjYW4gdGhlbiBiZSB1c2VkXG4vLyB3aXRoIGFuZ3VsYXIgdG8gb3B0aW9uYWxseSBzaG93L2hpZGVcbi8vIG9yIGFwcGx5IGNsYXNzZXMgdG8gdWkgZWxlbWVudHMuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RvcmFnZSkge1xuICByZXR1cm4ge1xuICAgIHNhdmU6IGZ1bmN0aW9uKHVpLCBzdGF0ZSkge1xuICAgICAgc3RvcmFnZS5zZXQodWksIHN0YXRlKTsgIFxuICAgIH0sXG4gICAgbG9hZDogZnVuY3Rpb24odWkpIHtcbiAgICAgIHJldHVybiBzdG9yYWdlLmdldCh1aSk7XG4gICAgfVxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBfID0ge1xuIFxuICAvLyAjIGFyZ3NcbiAgLy8gYChfYXJncylgXG4gIC8vIFRha2VzIGEgamF2YXNjcmlwdCBhcmd1bWVudHMgb2JqZWN0XG4gIC8vIGFuZCBjb252ZXJ0cyBpdCBpbnRvIGEgc3RhbmRhcmQgYXJyYXkuXG4gIGFyZ3M6IGZ1bmN0aW9uKF9hcmdzKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKF9hcmdzKVxuICB9LFxuXG4gIC8vICMgdHlwZVxuICAvLyBgKHZhcmlhYmxlLCB0eXBlKWBcbiAgLy8gQ2hlY2tzIHdoZXRoZXIgdGhlIHR5cGUgb2YgYHZhcmlhYmxlYFxuICAvLyBpcyB0aGUgdHlwZSBzcGVjaWZpZWQgd2l0aGluIGB0eXBlYC5cbiAgdHlwZTogZnVuY3Rpb24odmFyaWFibGUsIHR5cGUpIHtcbiAgICBpZighdHlwZSkgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZTtcbiAgICBlbHNlIHJldHVybiB0eXBlb2YgdmFyaWFibGUgPT09IHR5cGU7XG4gIH0sXG4gIFxuICAvLyAjIHVuZGVmXG4gIC8vIGAodmFyaWFibGVgKVxuICAvLyBgKHZhcjEsIHZhcjIsIHZhcjMsIC4uLilgXG4gIC8vIGAoW3ZhcjEsIHZhcjIsIHZhcjMsIC4uLl1gXG4gIC8vIFByb3ZpZGVzIGEgcXVpY2sgd2F5IHRvIGNoZWNrIHdoZXRoZXIgYVxuICAvLyB2YXJpYWJsZSAob3IgYSBjb2xsZWN0aW9uIG9mIHZhcmlhYmxlcykgaXNcbiAgLy8gdW5kZWZpbmVkLiBBcmd1bWVudHMgY2FuIGJlIHBhc3NlZCBhcyBpbiBcbiAgLy8gYW55IG9mIHRoZSBhYm92ZSBmb3Jtcy5cbiAgdW5kZWY6IGZ1bmN0aW9uKHZhcmlhYmxlcykge1xuICAgIGlmKCEodmFyaWFibGVzIGluc3RhbmNlb2YgQXJyYXkpKSB2YXJpYWJsZXMgPSBfLmFyZ3MoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gdmFyaWFibGVzLnJlZHVjZShmdW5jdGlvbihzdGF0ZSwgdmFyaWFibGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZSAmJiBfLnR5cGUodmFyaWFibGUsICd1bmRlZmluZWQnKTtcbiAgICB9LCB0cnVlKTtcbiAgfSxcbiAgXG4gIGNvcHk6IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBrZXksIGR1cGxpY2F0ZSA9IHt9O1xuICAgIGZvcihrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBkdXBsaWNhdGVba2V5XSA9IG9iamVjdFtrZXldXG4gICAgfVxuICAgIHJldHVybiBkdXBsaWNhdGU7XG4gIH0sXG5cblxufVxuIl19
