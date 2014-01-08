(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Admin
 *
 * The admin application is responsible for keeping
 * track of all sessions, devices, audio files and
 * composed songs.
 * 
 * It also provides a console for talking to the
 * server and the compose interface for creating
 * song files from the available audio files.
 */

angular.module('admin', ['ngRoute', 'btford.socket-io']).

config(function($routeProvider) {
  $routeProvider.
  when('/sessions', {
    templateUrl: '/partials/sessions',
    controller: require('./controllers/SessionsController.js')
  }).
  when('/audio', {
    templateUrl: '/partials/audio',
    controller: require('./controllers/AudioController.js')
  }).
  when('/users', {
    templateUrl: '/partials/users',
    controller: require('./controllers/UsersController.js')
  }).
  when('/compose', {
    templateUrl: '/partials/compose',
    controller: require('./controllers/ComposeController.js')
  }).
  otherwise({
    redirectTo: '/sessions'
  });
}).

/**
 * Directives
 */

// interface for editing collections
directive('editor', require('./directives/editor')).
// console for server communication
directive('console', require('./directives/console')).
// searchable collection interface 
directive('collection', require('./directives/collection')).

/**
 * Services
 */

// web socket wrapper
factory('socket', require('./services/socket')).
// socket connect to admin channel
factory('adminSocket', require('./services/adminSocket')).
// collection maintainer
factory('collection', require('./services/collection'));

},{"./controllers/AudioController.js":2,"./controllers/ComposeController.js":3,"./controllers/SessionsController.js":4,"./controllers/UsersController.js":5,"./directives/collection":6,"./directives/console":7,"./directives/editor":8,"./services/adminSocket":9,"./services/collection":10,"./services/socket":11}],2:[function(require,module,exports){
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
module.exports = function() {
  return {
    restrict: 'A',
    templateUrl: 'partials/console',
    link: function(scope, element, attrs) { 
      var showing = false;
      
      document.addEventListener('keydown', function(e) {
        // toggle on ` key
        if(e.keyCode === 192) {
          showing = !showing;
        
          if(showing) {
            element.addClass('visible');
          } else {
            element.removeClass('visible');
          }
          
          // give focus to input 
          element.find('input')[0].focus();
          // stop ` being inserted
          e.preventDefault();
        }
      });
    },
    controller: function($scope, adminSocket) {
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
        console.log(message);
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
module.exports = function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      console.log('Editor');  
    },
    controller: function($scope, $element, collection) {
      $scope.name = $element.attr('collection-name');
      var collection = collection($scope.name);
      
    }
  }  
};


},{}],9:[function(require,module,exports){

/**
 * adminSocket Factory
 * 
 * Provides a socket that's connected
 * to the admin channel.
 */

module.exports = function(socket) {
  return socket('admin');
};

},{}],10:[function(require,module,exports){

/**
 * collection Factory
 * 
 * The collection factory is responsible for maintaing
 * the state and a modification interface for collections
 * defined at the server side. See /routes/collection/
 * for more details.
 *
 * After the returned function is called with a name
 * parameter, the adminSocket waits for the servers
 * ready event, and then proceeds to listen to the events
 * (create, get, update, remove) for that name and 
 * creates a set of methods to manipulate the data
 * over the socket connection.
 *
 * Finally, a dynamic array containing the models
 * from the collection is returned with create, update
 * and remove methods tacked on to it. This can be used
 * bound straight to the DOM from controllers.
 */

module.exports = function(adminSocket) {
  /**
   * Store all available collections
   * in here.
   */
  var collections = {};

  /**
   * Has this socket recieved ready
   * signal?
   */
  var ready = false;

  /**
   * Find and return a model from a collection
   * based on the _id property of the query 
   * object. (Query object normally comes from
   * the database)
   */
  function find(collection, query) {
    for(var i = 0; i < collection[i].length; i++) {
      if(collection[i]._id === query._id) {
        return collection[i];
      }
    }
    return null;
  }

  /**
   * Helper method to provide clean looking
   * names for socket events
   */
  function events(name) {
    return {
      get: name + '/get',
      create: name + '/create',
      remove: name + '/remove',
      update: name + '/update'
    }
  }
  
  /**
   * Creates interface for collection with this name
   * and returns dynamic collection array along
   * with collection manipulation methods. See
   * module doc comment for more details.
   */ 
  function model(name) {
    var collection, socket, event;

    console.log(name, 'service'); 
    // if we have already loaded this collection
    if(collections[name]) {
      //return it straight away
      return collections[name];
    }
    
    // aliasing
    socket = adminSocket;
    collection = collections[name] = [];
    event = events(name);

    if(!ready) {
      socket.on('ready', function() {
        socket.emit(event.get);
        ready = true;
      });
    } else {
      socket.emit(event.get);
    }
    
    /**
     * Socket Events
     */
    
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

    /**
     * Exposed methods
     */  
  
    collection.create = function(model) {
      socket.emit(event.create, model);
    };
    
    collection.remove = function(model) {
      socket.emit(event.remove, model);
    };

    collection.update = function(model, updated) {
      socket.emit(event.update, model, updated);
    }; 

    return collection;
  }

  return model;
};

},{}],11:[function(require,module,exports){
module.exports = function(socketFactory) {
  return function(namespace) {
    var connectUrl = 'http://localhost:3000/' + namespace;
    return socketFactory({
      ioSocket: io.connect(connectUrl)
    });
  }
};

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEFkbWluXG4gKlxuICogVGhlIGFkbWluIGFwcGxpY2F0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciBrZWVwaW5nXG4gKiB0cmFjayBvZiBhbGwgc2Vzc2lvbnMsIGRldmljZXMsIGF1ZGlvIGZpbGVzIGFuZFxuICogY29tcG9zZWQgc29uZ3MuXG4gKiBcbiAqIEl0IGFsc28gcHJvdmlkZXMgYSBjb25zb2xlIGZvciB0YWxraW5nIHRvIHRoZVxuICogc2VydmVyIGFuZCB0aGUgY29tcG9zZSBpbnRlcmZhY2UgZm9yIGNyZWF0aW5nXG4gKiBzb25nIGZpbGVzIGZyb20gdGhlIGF2YWlsYWJsZSBhdWRpbyBmaWxlcy5cbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgnYWRtaW4nLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvc2Vzc2lvbnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvc2Vzc2lvbnMnLFxuICAgIGNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyLmpzJylcbiAgfSkuXG4gIHdoZW4oJy9hdWRpbycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hdWRpbycsXG4gICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9BdWRpb0NvbnRyb2xsZXIuanMnKVxuICB9KS5cbiAgd2hlbignL3VzZXJzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3VzZXJzJyxcbiAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1VzZXJzQ29udHJvbGxlci5qcycpXG4gIH0pLlxuICB3aGVuKCcvY29tcG9zZScsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jb21wb3NlJyxcbiAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0NvbXBvc2VDb250cm9sbGVyLmpzJylcbiAgfSkuXG4gIG90aGVyd2lzZSh7XG4gICAgcmVkaXJlY3RUbzogJy9zZXNzaW9ucydcbiAgfSk7XG59KS5cblxuLyoqXG4gKiBEaXJlY3RpdmVzXG4gKi9cblxuLy8gaW50ZXJmYWNlIGZvciBlZGl0aW5nIGNvbGxlY3Rpb25zXG5kaXJlY3RpdmUoJ2VkaXRvcicsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9lZGl0b3InKSkuXG4vLyBjb25zb2xlIGZvciBzZXJ2ZXIgY29tbXVuaWNhdGlvblxuZGlyZWN0aXZlKCdjb25zb2xlJywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbnNvbGUnKSkuXG4vLyBzZWFyY2hhYmxlIGNvbGxlY3Rpb24gaW50ZXJmYWNlIFxuZGlyZWN0aXZlKCdjb2xsZWN0aW9uJywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbGxlY3Rpb24nKSkuXG5cbi8qKlxuICogU2VydmljZXNcbiAqL1xuXG4vLyB3ZWIgc29ja2V0IHdyYXBwZXJcbmZhY3RvcnkoJ3NvY2tldCcsIHJlcXVpcmUoJy4vc2VydmljZXMvc29ja2V0JykpLlxuLy8gc29ja2V0IGNvbm5lY3QgdG8gYWRtaW4gY2hhbm5lbFxuZmFjdG9yeSgnYWRtaW5Tb2NrZXQnLCByZXF1aXJlKCcuL3NlcnZpY2VzL2FkbWluU29ja2V0JykpLlxuLy8gY29sbGVjdGlvbiBtYWludGFpbmVyXG5mYWN0b3J5KCdjb2xsZWN0aW9uJywgcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb2xsZWN0aW9uJykpO1xuIiwiLyoqXG4gKiBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG5cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb2xsZWN0aW9uJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICBcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHsgXG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgY29uc29sZS5sb2coJHNjb3BlLm1vZGVscyk7XG4gICAgICBjb25zb2xlLmxvZygkc2NvcGUubmFtZSwgJ2RpcmVjdGl2ZSBjb250cm9sbGVyJyk7XG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbnNvbGUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIHZhciBzaG93aW5nID0gZmFsc2U7XG4gICAgICBcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHRvZ2dsZSBvbiBgIGtleVxuICAgICAgICBpZihlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgICAgIHNob3dpbmcgPSAhc2hvd2luZztcbiAgICAgICAgXG4gICAgICAgICAgaWYoc2hvd2luZykge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIGdpdmUgZm9jdXMgdG8gaW5wdXQgXG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgICAgLy8gc3RvcCBgIGJlaW5nIGluc2VydGVkXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgYWRtaW5Tb2NrZXQpIHtcbiAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG5cbiAgICAgIGFkbWluU29ja2V0Lm9uKCdtZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAkc2NvcGUuYWRkTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIH0pO1xuXG4gICAgICAkc2NvcGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuXG4gICAgICAkc2NvcGUuYWRkTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgICAgfTtcbiAgICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5hZGRNZXNzYWdlKHtcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIGFkbWluU29ja2V0LmVtaXQoJ21lc3NhZ2UnLCAkc2NvcGUuaW5wdXQpO1xuICAgICAgICAkc2NvcGUuY2xlYXIoKTtcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFZGl0b3InKTsgIFxuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICBcbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vKipcbiAqIGFkbWluU29ja2V0IEZhY3RvcnlcbiAqIFxuICogUHJvdmlkZXMgYSBzb2NrZXQgdGhhdCdzIGNvbm5lY3RlZFxuICogdG8gdGhlIGFkbWluIGNoYW5uZWwuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgcmV0dXJuIHNvY2tldCgnYWRtaW4nKTtcbn07XG4iLCJcbi8qKlxuICogY29sbGVjdGlvbiBGYWN0b3J5XG4gKiBcbiAqIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuICogdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4gKiBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIC9yb3V0ZXMvY29sbGVjdGlvbi9cbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuICogcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXJzXG4gKiByZWFkeSBldmVudCwgYW5kIHRoZW4gcHJvY2VlZHMgdG8gbGlzdGVuIHRvIHRoZSBldmVudHNcbiAqIChjcmVhdGUsIGdldCwgdXBkYXRlLCByZW1vdmUpIGZvciB0aGF0IG5hbWUgYW5kIFxuICogY3JlYXRlcyBhIHNldCBvZiBtZXRob2RzIHRvIG1hbmlwdWxhdGUgdGhlIGRhdGFcbiAqIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuICpcbiAqIEZpbmFsbHksIGEgZHluYW1pYyBhcnJheSBjb250YWluaW5nIHRoZSBtb2RlbHNcbiAqIGZyb20gdGhlIGNvbGxlY3Rpb24gaXMgcmV0dXJuZWQgd2l0aCBjcmVhdGUsIHVwZGF0ZVxuICogYW5kIHJlbW92ZSBtZXRob2RzIHRhY2tlZCBvbiB0byBpdC4gVGhpcyBjYW4gYmUgdXNlZFxuICogYm91bmQgc3RyYWlnaHQgdG8gdGhlIERPTSBmcm9tIGNvbnRyb2xsZXJzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcbiAgLyoqXG4gICAqIFN0b3JlIGFsbCBhdmFpbGFibGUgY29sbGVjdGlvbnNcbiAgICogaW4gaGVyZS5cbiAgICovXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9O1xuXG4gIC8qKlxuICAgKiBIYXMgdGhpcyBzb2NrZXQgcmVjaWV2ZWQgcmVhZHlcbiAgICogc2lnbmFsP1xuICAgKi9cbiAgdmFyIHJlYWR5ID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEZpbmQgYW5kIHJldHVybiBhIG1vZGVsIGZyb20gYSBjb2xsZWN0aW9uXG4gICAqIGJhc2VkIG9uIHRoZSBfaWQgcHJvcGVydHkgb2YgdGhlIHF1ZXJ5IFxuICAgKiBvYmplY3QuIChRdWVyeSBvYmplY3Qgbm9ybWFsbHkgY29tZXMgZnJvbVxuICAgKiB0aGUgZGF0YWJhc2UpXG4gICAqL1xuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb25baV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25baV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdG8gcHJvdmlkZSBjbGVhbiBsb29raW5nXG4gICAqIG5hbWVzIGZvciBzb2NrZXQgZXZlbnRzXG4gICAqL1xuICBmdW5jdGlvbiBldmVudHMobmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IG5hbWUgKyAnL2dldCcsXG4gICAgICBjcmVhdGU6IG5hbWUgKyAnL2NyZWF0ZScsXG4gICAgICByZW1vdmU6IG5hbWUgKyAnL3JlbW92ZScsXG4gICAgICB1cGRhdGU6IG5hbWUgKyAnL3VwZGF0ZSdcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGVzIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbiB3aXRoIHRoaXMgbmFtZVxuICAgKiBhbmQgcmV0dXJucyBkeW5hbWljIGNvbGxlY3Rpb24gYXJyYXkgYWxvbmdcbiAgICogd2l0aCBjb2xsZWN0aW9uIG1hbmlwdWxhdGlvbiBtZXRob2RzLiBTZWVcbiAgICogbW9kdWxlIGRvYyBjb21tZW50IGZvciBtb3JlIGRldGFpbHMuXG4gICAqLyBcbiAgZnVuY3Rpb24gbW9kZWwobmFtZSkge1xuICAgIHZhciBjb2xsZWN0aW9uLCBzb2NrZXQsIGV2ZW50O1xuXG4gICAgY29uc29sZS5sb2cobmFtZSwgJ3NlcnZpY2UnKTsgXG4gICAgLy8gaWYgd2UgaGF2ZSBhbHJlYWR5IGxvYWRlZCB0aGlzIGNvbGxlY3Rpb25cbiAgICBpZihjb2xsZWN0aW9uc1tuYW1lXSkge1xuICAgICAgLy9yZXR1cm4gaXQgc3RyYWlnaHQgYXdheVxuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cbiAgICBcbiAgICAvLyBhbGlhc2luZ1xuICAgIHNvY2tldCA9IGFkbWluU29ja2V0O1xuICAgIGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uc1tuYW1lXSA9IFtdO1xuICAgIGV2ZW50ID0gZXZlbnRzKG5hbWUpO1xuXG4gICAgaWYoIXJlYWR5KSB7XG4gICAgICBzb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgICAgIHJlYWR5ID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBTb2NrZXQgRXZlbnRzXG4gICAgICovXG4gICAgXG4gICAgc29ja2V0Lm9uKGV2ZW50LmdldCwgZnVuY3Rpb24obW9kZWxzKSB7XG4gICAgICBjb2xsZWN0aW9uLmxlbmd0aCA9IDA7XG4gICAgICAvLyBJIGJlbGlldmUgdGhlcmUncyBzb21lIGV4cGxhaW5nIHRvIGRvIGhlcmUuXG4gICAgICBjb2xsZWN0aW9uLnB1c2guYXBwbHkoY29sbGVjdGlvbiwgbW9kZWxzLmRhdGEpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LmNyZWF0ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGNvbGxlY3Rpb24ucHVzaChtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQucmVtb3ZlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgZGVsZXRlIGZpbmQoY29sbGVjdGlvbiwgbW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnVwZGF0ZSwgZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIC8vIGNyZWF0ZSBzYWZlZ3VhcmQgd2l0aCBtb2RlbCBmb3IgZmluZCAtPiBudWxsXG4gICAgICAoZmluZChjb2xsZWN0aW9uLCBtb2RlbCkgfHwgbW9kZWwpID0gdXBkYXRlZDtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIEV4cG9zZWQgbWV0aG9kc1xuICAgICAqLyAgXG4gIFxuICAgIGNvbGxlY3Rpb24uY3JlYXRlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmNyZWF0ZSwgbW9kZWwpO1xuICAgIH07XG4gICAgXG4gICAgY29sbGVjdGlvbi5yZW1vdmUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQucmVtb3ZlLCBtb2RlbCk7XG4gICAgfTtcblxuICAgIGNvbGxlY3Rpb24udXBkYXRlID0gZnVuY3Rpb24obW9kZWwsIHVwZGF0ZWQpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnVwZGF0ZSwgbW9kZWwsIHVwZGF0ZWQpO1xuICAgIH07IFxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICByZXR1cm4gbW9kZWw7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXRGYWN0b3J5KSB7XG4gIHJldHVybiBmdW5jdGlvbihuYW1lc3BhY2UpIHtcbiAgICB2YXIgY29ubmVjdFVybCA9ICdodHRwOi8vbG9jYWxob3N0OjMwMDAvJyArIG5hbWVzcGFjZTtcbiAgICByZXR1cm4gc29ja2V0RmFjdG9yeSh7XG4gICAgICBpb1NvY2tldDogaW8uY29ubmVjdChjb25uZWN0VXJsKVxuICAgIH0pO1xuICB9XG59O1xuIl19
