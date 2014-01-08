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
      
      $scope.focus = function(index) {
        $scope.models.focus(index);
      };

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
    
    // if we have already loaded this collection
    if(collections[name]) {
      //return it straight away
      return collections[name];
    }
    
    // aliasing
    socket = adminSocket;
    collection = collections[name] = [];
    event = events(name);

    socket.on('ready', function() {
      socket.emit(event.get);
    });
    
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2RpcmVjdGl2ZXMvZWRpdG9yLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9hZG1pblNvY2tldC5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvY29sbGVjdGlvbi5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvc2VydmljZXMvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBBZG1pblxuICpcbiAqIFRoZSBhZG1pbiBhcHBsaWNhdGlvbiBpcyByZXNwb25zaWJsZSBmb3Iga2VlcGluZ1xuICogdHJhY2sgb2YgYWxsIHNlc3Npb25zLCBkZXZpY2VzLCBhdWRpbyBmaWxlcyBhbmRcbiAqIGNvbXBvc2VkIHNvbmdzLlxuICogXG4gKiBJdCBhbHNvIHByb3ZpZGVzIGEgY29uc29sZSBmb3IgdGFsa2luZyB0byB0aGVcbiAqIHNlcnZlciBhbmQgdGhlIGNvbXBvc2UgaW50ZXJmYWNlIGZvciBjcmVhdGluZ1xuICogc29uZyBmaWxlcyBmcm9tIHRoZSBhdmFpbGFibGUgYXVkaW8gZmlsZXMuXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ2FkbWluJywgWyduZ1JvdXRlJywgJ2J0Zm9yZC5zb2NrZXQtaW8nXSkuXG5cbmNvbmZpZyhmdW5jdGlvbigkcm91dGVQcm92aWRlcikge1xuICAkcm91dGVQcm92aWRlci5cbiAgd2hlbignL3Nlc3Npb25zJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3Nlc3Npb25zJyxcbiAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcycpXG4gIH0pLlxuICB3aGVuKCcvYXVkaW8nLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvYXVkaW8nLFxuICAgIGNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvQXVkaW9Db250cm9sbGVyLmpzJylcbiAgfSkuXG4gIHdoZW4oJy91c2VycycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy91c2VycycsXG4gICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Vc2Vyc0NvbnRyb2xsZXIuanMnKVxuICB9KS5cbiAgd2hlbignL2NvbXBvc2UnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvY29tcG9zZScsXG4gICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9Db21wb3NlQ29udHJvbGxlci5qcycpXG4gIH0pLlxuICBvdGhlcndpc2Uoe1xuICAgIHJlZGlyZWN0VG86ICcvc2Vzc2lvbnMnXG4gIH0pO1xufSkuXG5cbi8qKlxuICogRGlyZWN0aXZlc1xuICovXG5cbi8vIGludGVyZmFjZSBmb3IgZWRpdGluZyBjb2xsZWN0aW9uc1xuZGlyZWN0aXZlKCdlZGl0b3InLCByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvZWRpdG9yJykpLlxuLy8gY29uc29sZSBmb3Igc2VydmVyIGNvbW11bmljYXRpb25cbmRpcmVjdGl2ZSgnY29uc29sZScsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb25zb2xlJykpLlxuLy8gc2VhcmNoYWJsZSBjb2xsZWN0aW9uIGludGVyZmFjZSBcbmRpcmVjdGl2ZSgnY29sbGVjdGlvbicsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9jb2xsZWN0aW9uJykpLlxuXG4vKipcbiAqIFNlcnZpY2VzXG4gKi9cblxuLy8gd2ViIHNvY2tldCB3cmFwcGVyXG5mYWN0b3J5KCdzb2NrZXQnLCByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpKS5cbi8vIHNvY2tldCBjb25uZWN0IHRvIGFkbWluIGNoYW5uZWxcbmZhY3RvcnkoJ2FkbWluU29ja2V0JywgcmVxdWlyZSgnLi9zZXJ2aWNlcy9hZG1pblNvY2tldCcpKS5cbi8vIGNvbGxlY3Rpb24gbWFpbnRhaW5lclxuZmFjdG9yeSgnY29sbGVjdGlvbicsIHJlcXVpcmUoJy4vc2VydmljZXMvY29sbGVjdGlvbicpKTtcbiIsIi8qKlxuICogXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcbiBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuICBcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSkge1xuXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29sbGVjdGlvbicsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgXG4gICAgfSxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRlbGVtZW50LCBjb2xsZWN0aW9uKSB7XG4gICAgICAkc2NvcGUubmFtZSA9ICRlbGVtZW50LmF0dHIoJ2NvbGxlY3Rpb24tbmFtZScpO1xuICAgICAgJHNjb3BlLm1vZGVscyA9IGNvbGxlY3Rpb24oJHNjb3BlLm5hbWUpO1xuICAgICAgJHNjb3BlLnNlYXJjaCA9ICcnO1xuICAgICAgXG4gICAgICAkc2NvcGUuZm9jdXMgPSBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAkc2NvcGUubW9kZWxzLmZvY3VzKGluZGV4KTtcbiAgICAgIH07XG5cbiAgICB9XG4gIH0gIFxufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0EnLFxuICAgIHRlbXBsYXRlVXJsOiAncGFydGlhbHMvY29uc29sZScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7IFxuICAgICAgdmFyIHNob3dpbmcgPSBmYWxzZTtcbiAgICAgIFxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgLy8gdG9nZ2xlIG9uIGAga2V5XG4gICAgICAgIGlmKGUua2V5Q29kZSA9PT0gMTkyKSB7XG4gICAgICAgICAgc2hvd2luZyA9ICFzaG93aW5nO1xuICAgICAgICBcbiAgICAgICAgICBpZihzaG93aW5nKSB7XG4gICAgICAgICAgICBlbGVtZW50LmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZ2l2ZSBmb2N1cyB0byBpbnB1dCBcbiAgICAgICAgICBlbGVtZW50LmZpbmQoJ2lucHV0JylbMF0uZm9jdXMoKTtcbiAgICAgICAgICAvLyBzdG9wIGAgYmVpbmcgaW5zZXJ0ZWRcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlKSB7XG4gICAgICAkc2NvcGUubWVzc2FnZXMgPSBbXTtcbiAgICAgICRzY29wZS5pbnB1dCA9ICcnO1xuICAgICAgXG4gICAgICAkc2NvcGUuc2VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2NvcGUubWVzc2FnZXMucHVzaCh7XG4gICAgICAgICAgYm9keTogJHNjb3BlLmlucHV0XG4gICAgICAgIH0pO1xuICAgICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIH07XG4gICAgfVxuICB9O1xufTtcblxuICBcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFZGl0b3InKTsgIFxuICAgIH0sXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHNjb3BlLCAkZWxlbWVudCwgY29sbGVjdGlvbikge1xuICAgICAgJHNjb3BlLm5hbWUgPSAkZWxlbWVudC5hdHRyKCdjb2xsZWN0aW9uLW5hbWUnKTtcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICBcbiAgICB9XG4gIH0gIFxufTtcblxuIiwiXG4vKipcbiAqIGFkbWluU29ja2V0IEZhY3RvcnlcbiAqIFxuICogUHJvdmlkZXMgYSBzb2NrZXQgdGhhdCdzIGNvbm5lY3RlZFxuICogdG8gdGhlIGFkbWluIGNoYW5uZWwuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgcmV0dXJuIHNvY2tldCgnYWRtaW4nKTtcbn07XG4iLCJcbi8qKlxuICogY29sbGVjdGlvbiBGYWN0b3J5XG4gKiBcbiAqIFRoZSBjb2xsZWN0aW9uIGZhY3RvcnkgaXMgcmVzcG9uc2libGUgZm9yIG1haW50YWluZ1xuICogdGhlIHN0YXRlIGFuZCBhIG1vZGlmaWNhdGlvbiBpbnRlcmZhY2UgZm9yIGNvbGxlY3Rpb25zXG4gKiBkZWZpbmVkIGF0IHRoZSBzZXJ2ZXIgc2lkZS4gU2VlIC9yb3V0ZXMvY29sbGVjdGlvbi9cbiAqIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQWZ0ZXIgdGhlIHJldHVybmVkIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIGEgbmFtZVxuICogcGFyYW1ldGVyLCB0aGUgYWRtaW5Tb2NrZXQgd2FpdHMgZm9yIHRoZSBzZXJ2ZXJzXG4gKiByZWFkeSBldmVudCwgYW5kIHRoZW4gcHJvY2VlZHMgdG8gbGlzdGVuIHRvIHRoZSBldmVudHNcbiAqIChjcmVhdGUsIGdldCwgdXBkYXRlLCByZW1vdmUpIGZvciB0aGF0IG5hbWUgYW5kIFxuICogY3JlYXRlcyBhIHNldCBvZiBtZXRob2RzIHRvIG1hbmlwdWxhdGUgdGhlIGRhdGFcbiAqIG92ZXIgdGhlIHNvY2tldCBjb25uZWN0aW9uLlxuICpcbiAqIEZpbmFsbHksIGEgZHluYW1pYyBhcnJheSBjb250YWluaW5nIHRoZSBtb2RlbHNcbiAqIGZyb20gdGhlIGNvbGxlY3Rpb24gaXMgcmV0dXJuZWQgd2l0aCBjcmVhdGUsIHVwZGF0ZVxuICogYW5kIHJlbW92ZSBtZXRob2RzIHRhY2tlZCBvbiB0byBpdC4gVGhpcyBjYW4gYmUgdXNlZFxuICogYm91bmQgc3RyYWlnaHQgdG8gdGhlIERPTSBmcm9tIGNvbnRyb2xsZXJzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcbiAgLyoqXG4gICAqIFN0b3JlIGFsbCBhdmFpbGFibGUgY29sbGVjdGlvbnNcbiAgICogaW4gaGVyZS5cbiAgICovXG4gIHZhciBjb2xsZWN0aW9ucyA9IHt9OyAgXG5cbiAgLyoqXG4gICAqIEZpbmQgYW5kIHJldHVybiBhIG1vZGVsIGZyb20gYSBjb2xsZWN0aW9uXG4gICAqIGJhc2VkIG9uIHRoZSBfaWQgcHJvcGVydHkgb2YgdGhlIHF1ZXJ5IFxuICAgKiBvYmplY3QuIChRdWVyeSBvYmplY3Qgbm9ybWFsbHkgY29tZXMgZnJvbVxuICAgKiB0aGUgZGF0YWJhc2UpXG4gICAqL1xuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIHF1ZXJ5KSB7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb25baV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBxdWVyeS5faWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25baV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgdG8gcHJvdmlkZSBjbGVhbiBsb29raW5nXG4gICAqIG5hbWVzIGZvciBzb2NrZXQgZXZlbnRzXG4gICAqL1xuICBmdW5jdGlvbiBldmVudHMobmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IG5hbWUgKyAnL2dldCcsXG4gICAgICBjcmVhdGU6IG5hbWUgKyAnL2NyZWF0ZScsXG4gICAgICByZW1vdmU6IG5hbWUgKyAnL3JlbW92ZScsXG4gICAgICB1cGRhdGU6IG5hbWUgKyAnL3VwZGF0ZSdcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGVzIGludGVyZmFjZSBmb3IgY29sbGVjdGlvbiB3aXRoIHRoaXMgbmFtZVxuICAgKiBhbmQgcmV0dXJucyBkeW5hbWljIGNvbGxlY3Rpb24gYXJyYXkgYWxvbmdcbiAgICogd2l0aCBjb2xsZWN0aW9uIG1hbmlwdWxhdGlvbiBtZXRob2RzLiBTZWVcbiAgICogbW9kdWxlIGRvYyBjb21tZW50IGZvciBtb3JlIGRldGFpbHMuXG4gICAqLyBcbiAgZnVuY3Rpb24gbW9kZWwobmFtZSkge1xuICAgIHZhciBjb2xsZWN0aW9uLCBzb2NrZXQsIGV2ZW50O1xuICAgIFxuICAgIC8vIGlmIHdlIGhhdmUgYWxyZWFkeSBsb2FkZWQgdGhpcyBjb2xsZWN0aW9uXG4gICAgaWYoY29sbGVjdGlvbnNbbmFtZV0pIHtcbiAgICAgIC8vcmV0dXJuIGl0IHN0cmFpZ2h0IGF3YXlcbiAgICAgIHJldHVybiBjb2xsZWN0aW9uc1tuYW1lXTtcbiAgICB9XG4gICAgXG4gICAgLy8gYWxpYXNpbmdcbiAgICBzb2NrZXQgPSBhZG1pblNvY2tldDtcbiAgICBjb2xsZWN0aW9uID0gY29sbGVjdGlvbnNbbmFtZV0gPSBbXTtcbiAgICBldmVudCA9IGV2ZW50cyhuYW1lKTtcblxuICAgIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LmdldCk7XG4gICAgfSk7XG4gICAgXG4gICAgLyoqXG4gICAgICogU29ja2V0IEV2ZW50c1xuICAgICAqL1xuICAgIFxuICAgIHNvY2tldC5vbihldmVudC5nZXQsIGZ1bmN0aW9uKG1vZGVscykge1xuICAgICAgY29sbGVjdGlvbi5sZW5ndGggPSAwO1xuICAgICAgLy8gSSBiZWxpZXZlIHRoZXJlJ3Mgc29tZSBleHBsYWluZyB0byBkbyBoZXJlLlxuICAgICAgY29sbGVjdGlvbi5wdXNoLmFwcGx5KGNvbGxlY3Rpb24sIG1vZGVscy5kYXRhKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC5jcmVhdGUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBjb2xsZWN0aW9uLnB1c2gobW9kZWwpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKGV2ZW50LnJlbW92ZSwgZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIGRlbGV0ZSBmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC51cGRhdGUsIGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICAvLyBjcmVhdGUgc2FmZWd1YXJkIHdpdGggbW9kZWwgZm9yIGZpbmQgLT4gbnVsbFxuICAgICAgKGZpbmQoY29sbGVjdGlvbiwgbW9kZWwpIHx8IG1vZGVsKSA9IHVwZGF0ZWQ7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBFeHBvc2VkIG1ldGhvZHNcbiAgICAgKi8gIFxuICBcbiAgICBjb2xsZWN0aW9uLmNyZWF0ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5jcmVhdGUsIG1vZGVsKTtcbiAgICB9O1xuICAgIFxuICAgIGNvbGxlY3Rpb24ucmVtb3ZlID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgIHNvY2tldC5lbWl0KGV2ZW50LnJlbW92ZSwgbW9kZWwpO1xuICAgIH07XG5cbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSA9IGZ1bmN0aW9uKG1vZGVsLCB1cGRhdGVkKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC51cGRhdGUsIG1vZGVsLCB1cGRhdGVkKTtcbiAgICB9OyBcblxuICAgIHJldHVybiBjb2xsZWN0aW9uO1xuICB9XG5cbiAgcmV0dXJuIG1vZGVsO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc29ja2V0RmFjdG9yeSkge1xuICByZXR1cm4gZnVuY3Rpb24obmFtZXNwYWNlKSB7XG4gICAgdmFyIGNvbm5lY3RVcmwgPSAnaHR0cDovL2xvY2FsaG9zdDozMDAwLycgKyBuYW1lc3BhY2U7XG4gICAgcmV0dXJuIHNvY2tldEZhY3Rvcnkoe1xuICAgICAgaW9Tb2NrZXQ6IGlvLmNvbm5lY3QoY29ubmVjdFVybClcbiAgICB9KTtcbiAgfVxufTtcbiJdfQ==
