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
    controller: function($scope) {
      $scope.messages = [];
      $scope.input = '';
      
      $scope.send = function() {
        $scope.messages.push({
          body: $scope.input
        });
        $scope.input = '';
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBBZG1pblxuICpcbiAqIFRoZSBhZG1pbiBhcHBsaWNhdGlvbiBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZ1xuICogdHJhY2sgb2YgYWxsIHNlc3Npb25zLCBkZXZpY2VzLCBhdWRpbyBmaWxlcyBhbmRcbiAqIGNvbXBvc2VkIHNvbmdzLlxuICogXG4gKiBJdCBhbHNvIHByb3ZpZGVzIGEgY29uc29sZSBmb3IgdGFsa2luZyB0byB0aGVcbiAqIHNlcnZlciBhbmQgdGhlIGNvbXBvc2UgaW50ZXJmYWNlIGZvciBjcmVhdGluZ1xuICogc29uZyBmaWxlcyBmcm9tIHRoZSBhdmFpbGFibGUgYXVkaW8gZmlsZXMuXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ2FkbWluJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nXSkuXG5cbmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlci5cbiAgd2hlbignL3Nlc3Npb25zJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3Nlc3Npb25zJyxcbiAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcycpXG4gIH0pLlxuICB3aGVuKCcvYXVkaW8nLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYXVkaW8nLFxuICAgIGNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyLmpzJylcbiAgfSkuXG4gIHdoZW4oJy91c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy91c2VycycsXG4gICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Vc2Vyc0NvbnRyb2xsZXIuanMnKVxuICB9KS5cbiAgd2hlbignL2NvbXBvc2UnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY29tcG9zZScsXG4gICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlci5qcycpXG4gIH0pLlxuICBvdGhlcndpc2Uoe1xuICAgIHJlZGlyZWN0VG86ICcvc2Vzc2lvbnMnXG4gIH0pO1xufSkuXG5cbi8qKlxuICogRGlyZWN0aXZlc1xuICovXG5cbi8vIGludGVyZmFjZSBmb3IgZWRpdGluZyBjb2xsZWN0aW9uc1xuZGlyZWN0aXZlKCdlZGl0b3InLCByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvZWRpdG9yJykpLlxuLy8gY29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbmRpcmVjdGl2ZSgnY29uc29sZScsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb25zb2xlJykpLlxuLy8gc2VhcmNoYWJsZSBjb2xsZWN0aW9uIGludGVyZmFjZSBcbmRpcmVjdGl2ZSgnY29sbGVjdGlvbicsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJykpLlxuXG4vKipcbiAqIFNlcnZpY2VzXG4gKi9cblxuLy8gd2ViIHNvY2tldCB3cmFwcGVyXG5mYWN0b3J5KCdzb2NrZXQnLCByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpKS5cbi8vIHNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbmZhY3RvcnkoJ2FkbWluU29ja2V0JywgcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpKS5cbi8vIGNvbGxlY3Rpb24gbWFpbnRhaW5lclxuZmFjdG9yeSgnY29sbGVjdGlvbicsIHJlcXVpcmUoJy4vc2VydmljZXMvY29sbGVjdGlvbicpKTtcbiIsIi8qKlxuICogXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuICBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29sbGVjdGlvbicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7IFxuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgICRzY29wZS5tb2RlbHMgPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgICRzY29wZS5zZWFyY2ggPSAnJztcbiAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5tb2RlbHMpO1xuICAgICAgY29uc29sZS5sb2coJHNjb3BlLm5hbWUsICdkaXJlY3RpdmUgY29udHJvbGxlcicpO1xuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb25zb2xlJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHsgXG4gICAgICB2YXIgc2hvd2luZyA9IGZhbHNlO1xuICAgICAgXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAvLyB0b2dnbGUgb24gYCBrZXlcbiAgICAgICAgaWYoZS5rZXlDb2RlID09PSAxOTIpIHtcbiAgICAgICAgICBzaG93aW5nID0gIXNob3dpbmc7XG4gICAgICAgIFxuICAgICAgICAgIGlmKHNob3dpbmcpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyBnaXZlIGZvY3VzIHRvIGlucHV0IFxuICAgICAgICAgIGVsZW1lbnQuZmluZCgnaW5wdXQnKVswXS5mb2N1cygpO1xuICAgICAgICAgIC8vIHN0b3AgYCBiZWluZyBpbnNlcnRlZFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUpIHtcbiAgICAgICRzY29wZS5tZXNzYWdlcyA9IFtdO1xuICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICBcbiAgICAgICRzY29wZS5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5tZXNzYWdlcy5wdXNoKHtcbiAgICAgICAgICBib2R5OiAkc2NvcGUuaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuXG4gIFxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgY29uc29sZS5sb2coJ0VkaXRvcicpOyAgXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgdmFyIGNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uKCRzY29wZS5uYW1lKTtcbiAgICAgIFxuICAgIH1cbiAgfSAgXG59O1xuXG4iLCJcbi8qKlxuICogYWRtaW5Tb2NrZXQgRmFjdG9yeVxuICogXG4gKiBQcm92aWRlcyBhIHNvY2tldCB0aGF0J3MgY29ubmVjdGVkXG4gKiB0byB0aGUgYWRtaW4gY2hhbm5lbC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuICByZXR1cm4gc29ja2V0KCdhZG1pbicpO1xufTtcbiIsIlxuLyoqXG4gKiBjb2xsZWN0aW9uIEZhY3RvcnlcbiAqIFxuICogVGhlIGNvbGxlY3Rpb24gZmFjdG9yeSBpcyByZXNwb25zaWJsZSBmb3IgbWFpbnRhaW5nXG4gKiB0aGUgc3RhdGUgYW5kIGEgbW9kaWZpY2F0aW9uIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbnNcbiAqIGRlZmluZWQgYXQgdGhlIHNlcnZlciBzaWRlLiBTZWUgL3JvdXRlcy9jb2xsZWN0aW9uL1xuICogZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBBZnRlciB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggYSBuYW1lXG4gKiBwYXJhbWV0ZXIsIHRoZSBhZG1pblNvY2tldCB3YWl0cyBmb3IgdGhlIHNlcnZlcnNcbiAqIHJlYWR5IGV2ZW50LCBhbmQgdGhlbiBwcm9jZWVkcyB0byBsaXN0ZW4gdG8gdGhlIGV2ZW50c1xuICogKGNyZWF0ZSwgZ2V0LCB1cGRhdGUsIHJlbW92ZSkgZm9yIHRoYXQgbmFtZSBhbmQgXG4gKiBjcmVhdGVzIGEgc2V0IG9mIG1ldGhvZHMgdG8gbWFuaXB1bGF0ZSB0aGUgZGF0YVxuICogb3ZlciB0aGUgc29ja2V0IGNvbm5lY3Rpb24uXG4gKlxuICogRmluYWxseSwgYSBkeW5hbWljIGFycmF5IGNvbnRhaW5pbmcgdGhlIG1vZGVsc1xuICogZnJvbSB0aGUgY29sbGVjdGlvbiBpcyByZXR1cm5lZCB3aXRoIGNyZWF0ZSwgdXBkYXRlXG4gKiBhbmQgcmVtb3ZlIG1ldGhvZHMgdGFja2VkIG9uIHRvIGl0LiBUaGlzIGNhbiBiZSB1c2VkXG4gKiBib3VuZCBzdHJhaWdodCB0byB0aGUgRE9NIGZyb20gY29udHJvbGxlcnMuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhZG1pblNvY2tldCkge1xuICAvKipcbiAgICogU3RvcmUgYWxsIGF2YWlsYWJsZSBjb2xsZWN0aW9uc1xuICAgKiBpbiBoZXJlLlxuICAgKi9cbiAgdmFyIGNvbGxlY3Rpb25zID0ge307XG5cbiAgLyoqXG4gICAqIEhhcyB0aGlzIHNvY2tldCByZWNpZXZlZCByZWFkeVxuICAgKiBzaWduYWw/XG4gICAqL1xuICB2YXIgcmVhZHkgPSBmYWxzZTtcblxuICAvKipcbiAgICogRmluZCBhbmQgcmV0dXJuIGEgbW9kZWwgZnJvbSBhIGNvbGxlY3Rpb25cbiAgICogYmFzZWQgb24gdGhlIF9pZCBwcm9wZXJ0eSBvZiB0aGUgcXVlcnkgXG4gICAqIG9iamVjdC4gKFF1ZXJ5IG9iamVjdCBub3JtYWxseSBjb21lcyBmcm9tXG4gICAqIHRoZSBkYXRhYmFzZSlcbiAgICovXG4gIGZ1bmN0aW9uIGZpbmQoY29sbGVjdGlvbiwgcXVlcnkpIHtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgY29sbGVjdGlvbltpXS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoY29sbGVjdGlvbltpXS5faWQgPT09IHF1ZXJ5Ll9pZCkge1xuICAgICAgICByZXR1cm4gY29sbGVjdGlvbltpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCB0byBwcm92aWRlIGNsZWFuIGxvb2tpbmdcbiAgICogbmFtZXMgZm9yIHNvY2tldCBldmVudHNcbiAgICovXG4gIGZ1bmN0aW9uIGV2ZW50cyhuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogbmFtZSArICcvZ2V0JyxcbiAgICAgIGNyZWF0ZTogbmFtZSArICcvY3JlYXRlJyxcbiAgICAgIHJlbW92ZTogbmFtZSArICcvcmVtb3ZlJyxcbiAgICAgIHVwZGF0ZTogbmFtZSArICcvdXBkYXRlJ1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZXMgaW50ZXJmYWNlIGZvciBjb2xsZWN0aW9uIHdpdGggdGhpcyBuYW1lXG4gICAqIGFuZCByZXR1cm5zIGR5bmFtaWMgY29sbGVjdGlvbiBhcnJheSBhbG9uZ1xuICAgKiB3aXRoIGNvbGxlY3Rpb24gbWFuaXB1bGF0aW9uIG1ldGhvZHMuIFNlZVxuICAgKiBtb2R1bGUgZG9jIGNvbW1lbnQgZm9yIG1vcmUgZGV0YWlscy5cbiAgICovIFxuICBmdW5jdGlvbiBtb2RlbChuYW1lKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIHNvY2tldCwgZXZlbnQ7XG5cbiAgICBjb25zb2xlLmxvZyhuYW1lLCAnc2VydmljZScpOyBcbiAgICAvLyBpZiB3ZSBoYXZlIGFscmVhZHkgbG9hZGVkIHRoaXMgY29sbGVjdGlvblxuICAgIGlmKGNvbGxlY3Rpb25zW25hbWVdKSB7XG4gICAgICAvL3JldHVybiBpdCBzdHJhaWdodCBhd2F5XG4gICAgICByZXR1cm4gY29sbGVjdGlvbnNbbmFtZV07XG4gICAgfVxuICAgIFxuICAgIC8vIGFsaWFzaW5nXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBpZighcmVhZHkpIHtcbiAgICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ja2V0LmVtaXQoZXZlbnQuZ2V0KTtcbiAgICAgICAgcmVhZHkgPSB0cnVlO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFNvY2tldCBFdmVudHNcbiAgICAgKi9cbiAgICBcbiAgICBzb2NrZXQub24oZXZlbnQuZ2V0LCBmdW5jdGlvbihtb2RlbHMpIHtcbiAgICAgIGNvbGxlY3Rpb24ubGVuZ3RoID0gMDtcbiAgICAgIC8vIEkgYmVsaWV2ZSB0aGVyZSdzIHNvbWUgZXhwbGFpbmcgdG8gZG8gaGVyZS5cbiAgICAgIGNvbGxlY3Rpb24ucHVzaC5hcHBseShjb2xsZWN0aW9uLCBtb2RlbHMuZGF0YSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQuY3JlYXRlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgY29sbGVjdGlvbi5wdXNoKG1vZGVsKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC5yZW1vdmUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBkZWxldGUgZmluZChjb2xsZWN0aW9uLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQudXBkYXRlLCBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgLy8gY3JlYXRlIHNhZmVndWFyZCB3aXRoIG1vZGVsIGZvciBmaW5kIC0+IG51bGxcbiAgICAgIChmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKSB8fCBtb2RlbCkgPSB1cGRhdGVkO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRXhwb3NlZCBtZXRob2RzXG4gICAgICovICBcbiAgXG4gICAgY29sbGVjdGlvbi5jcmVhdGUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuY3JlYXRlLCBtb2RlbCk7XG4gICAgfTtcbiAgICBcbiAgICBjb2xsZWN0aW9uLnJlbW92ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5yZW1vdmUsIG1vZGVsKTtcbiAgICB9O1xuXG4gICAgY29sbGVjdGlvbi51cGRhdGUgPSBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQudXBkYXRlLCBtb2RlbCwgdXBkYXRlZCk7XG4gICAgfTsgXG5cbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBtb2RlbDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iXX0=
