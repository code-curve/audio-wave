(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

// directives
directive('console', require('./directives/console')).
directive('collection', require('./directives/collection')).
// services
factory('socket', require('./services/socket')).
factory('userSocket', require('./services/userSocket')).
factory('collection', require('./services/collection')).
factory('adminSocket', require('./services/adminSocket'));

},{"./controllers/AudioController.js":2,"./controllers/ComposeController.js":3,"./controllers/SessionsController.js":4,"./controllers/UsersController.js":5,"./directives/collection":6,"./directives/console":7,"./services/adminSocket":8,"./services/collection":9,"./services/socket":10,"./services/userSocket":11}],2:[function(require,module,exports){
module.exports = function($scope) {

    $scope.select = function($files) { 
      console.log($files);
    };
  
};

},{}],3:[function(require,module,exports){
module.exports = function($scope) {
  
};

},{}],4:[function(require,module,exports){
module.exports = function($scope, socket) {
  var socket = socket('admin');
  
  socket.on('ready', function() {
    socket.emit('admins/get');
    window.socket = socket;
  });

  socket.on('admins/get', function(admins) {
    console.table(admins.data);
  });
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

      // call to $scope.models.create()
      // will reflect in database
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
module.exports = function(socket) {
  return socket('admin');
};

},{}],9:[function(require,module,exports){
module.exports = function(adminSocket) {
  var collections = {};  

  function find(collection, model) {
    for(var i = 0; i < collection[i].length; i++) {
      if(collection[i]._id === model._id) {
        return model;
      }
    }
    return null;
  }

  function events(name) {
    return {
      get: name + '/get',
      create: name + '/create',
      remove: name + '/remove',
      update: name + '/update'
    }
  }

  /**
   * In serious need of error handling 
   */
  function model(name) {
    var collection, socket, event;
    
    // if it exists, return it
    if(collections[name]) {
      return collections[name];
    }
     
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

},{}],10:[function(require,module,exports){
module.exports = function(socketFactory) {
  return function(namespace) {
    var connectUrl = 'http://localhost:3000/' + namespace;
    return socketFactory({
      ioSocket: io.connect(connectUrl)
    });
  }
};

},{}],11:[function(require,module,exports){
module.exports = function(socket) {
  return socket('user');
};

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvYWRtaW4uanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL0F1ZGlvQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvY29udHJvbGxlcnMvQ29tcG9zZUNvbnRyb2xsZXIuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL2NvbnRyb2xsZXJzL1Nlc3Npb25zQ29udHJvbGxlci5qcyIsIi9ob21lL2Rhbi9kZXYvYXVkaW8td2F2ZS9wdWJsaWMvanMvZGlyZWN0aXZlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9kaXJlY3RpdmVzL2NvbnNvbGUuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL2FkbWluU29ja2V0LmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9jb2xsZWN0aW9uLmpzIiwiL2hvbWUvZGFuL2Rldi9hdWRpby13YXZlL3B1YmxpYy9qcy9zZXJ2aWNlcy9zb2NrZXQuanMiLCIvaG9tZS9kYW4vZGV2L2F1ZGlvLXdhdmUvcHVibGljL2pzL3NlcnZpY2VzL3VzZXJTb2NrZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJhbmd1bGFyLm1vZHVsZSgnYWRtaW4nLCBbJ25nUm91dGUnLCAnYnRmb3JkLnNvY2tldC1pbyddKS5cblxuY29uZmlnKGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyKSB7XG4gICRyb3V0ZVByb3ZpZGVyLlxuICB3aGVuKCcvc2Vzc2lvbnMnLCB7XG4gICAgdGVtcGxhdGVVcmw6ICcvcGFydGlhbHMvc2Vzc2lvbnMnLFxuICAgIGNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvU2Vzc2lvbnNDb250cm9sbGVyLmpzJylcbiAgfSkuXG4gIHdoZW4oJy9hdWRpbycsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9hdWRpbycsXG4gICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9BdWRpb0NvbnRyb2xsZXIuanMnKVxuICB9KS5cbiAgd2hlbignL3VzZXJzJywge1xuICAgIHRlbXBsYXRlVXJsOiAnL3BhcnRpYWxzL3VzZXJzJyxcbiAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL1VzZXJzQ29udHJvbGxlci5qcycpXG4gIH0pLlxuICB3aGVuKCcvY29tcG9zZScsIHtcbiAgICB0ZW1wbGF0ZVVybDogJy9wYXJ0aWFscy9jb21wb3NlJyxcbiAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0NvbXBvc2VDb250cm9sbGVyLmpzJylcbiAgfSkuXG4gIG90aGVyd2lzZSh7XG4gICAgcmVkaXJlY3RUbzogJy9zZXNzaW9ucydcbiAgfSk7XG59KS5cblxuLy8gZGlyZWN0aXZlc1xuZGlyZWN0aXZlKCdjb25zb2xlJywgcmVxdWlyZSgnLi9kaXJlY3RpdmVzL2NvbnNvbGUnKSkuXG5kaXJlY3RpdmUoJ2NvbGxlY3Rpb24nLCByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvY29sbGVjdGlvbicpKS5cbi8vIHNlcnZpY2VzXG5mYWN0b3J5KCdzb2NrZXQnLCByZXF1aXJlKCcuL3NlcnZpY2VzL3NvY2tldCcpKS5cbmZhY3RvcnkoJ3VzZXJTb2NrZXQnLCByZXF1aXJlKCcuL3NlcnZpY2VzL3VzZXJTb2NrZXQnKSkuXG5mYWN0b3J5KCdjb2xsZWN0aW9uJywgcmVxdWlyZSgnLi9zZXJ2aWNlcy9jb2xsZWN0aW9uJykpLlxuZmFjdG9yeSgnYWRtaW5Tb2NrZXQnLCByZXF1aXJlKCcuL3NlcnZpY2VzL2FkbWluU29ja2V0JykpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUpIHtcblxuICAgICRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbigkZmlsZXMpIHsgXG4gICAgICBjb25zb2xlLmxvZygkZmlsZXMpO1xuICAgIH07XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlKSB7XG4gIFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCBzb2NrZXQpIHtcbiAgdmFyIHNvY2tldCA9IHNvY2tldCgnYWRtaW4nKTtcbiAgXG4gIHNvY2tldC5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgICBzb2NrZXQuZW1pdCgnYWRtaW5zL2dldCcpO1xuICAgIHdpbmRvdy5zb2NrZXQgPSBzb2NrZXQ7XG4gIH0pO1xuXG4gIHNvY2tldC5vbignYWRtaW5zL2dldCcsIGZ1bmN0aW9uKGFkbWlucykge1xuICAgIGNvbnNvbGUudGFibGUoYWRtaW5zLmRhdGEpO1xuICB9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQScsXG4gICAgdGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9jb2xsZWN0aW9uJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICBcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJGVsZW1lbnQsIGNvbGxlY3Rpb24pIHtcbiAgICAgICRzY29wZS5uYW1lID0gJGVsZW1lbnQuYXR0cignY29sbGVjdGlvbi1uYW1lJyk7XG4gICAgICAkc2NvcGUubW9kZWxzID0gY29sbGVjdGlvbigkc2NvcGUubmFtZSk7XG4gICAgICAkc2NvcGUuc2VhcmNoID0gJyc7XG5cbiAgICAgIC8vIGNhbGwgdG8gJHNjb3BlLm1vZGVscy5jcmVhdGUoKVxuICAgICAgLy8gd2lsbCByZWZsZWN0IGluIGRhdGFiYXNlXG4gICAgfVxuICB9ICBcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICB0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2NvbnNvbGUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykgeyBcbiAgICAgIHZhciBzaG93aW5nID0gZmFsc2U7XG4gICAgICBcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIC8vIHRvZ2dsZSBvbiBgIGtleVxuICAgICAgICBpZihlLmtleUNvZGUgPT09IDE5Mikge1xuICAgICAgICAgIHNob3dpbmcgPSAhc2hvd2luZztcbiAgICAgICAgXG4gICAgICAgICAgaWYoc2hvd2luZykge1xuICAgICAgICAgICAgZWxlbWVudC5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIGdpdmUgZm9jdXMgdG8gaW5wdXQgXG4gICAgICAgICAgZWxlbWVudC5maW5kKCdpbnB1dCcpWzBdLmZvY3VzKCk7XG4gICAgICAgICAgLy8gc3RvcCBgIGJlaW5nIGluc2VydGVkXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSkge1xuICAgICAgJHNjb3BlLm1lc3NhZ2VzID0gW107XG4gICAgICAkc2NvcGUuaW5wdXQgPSAnJztcbiAgICAgIFxuICAgICAgJHNjb3BlLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLm1lc3NhZ2VzLnB1c2goe1xuICAgICAgICAgIGJvZHk6ICRzY29wZS5pbnB1dFxuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmlucHV0ID0gJyc7XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbn07XG5cbiAgXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuICByZXR1cm4gc29ja2V0KCdhZG1pbicpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYWRtaW5Tb2NrZXQpIHtcbiAgdmFyIGNvbGxlY3Rpb25zID0ge307ICBcblxuICBmdW5jdGlvbiBmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKSB7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvbGxlY3Rpb25baV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKGNvbGxlY3Rpb25baV0uX2lkID09PSBtb2RlbC5faWQpIHtcbiAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV2ZW50cyhuYW1lKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldDogbmFtZSArICcvZ2V0JyxcbiAgICAgIGNyZWF0ZTogbmFtZSArICcvY3JlYXRlJyxcbiAgICAgIHJlbW92ZTogbmFtZSArICcvcmVtb3ZlJyxcbiAgICAgIHVwZGF0ZTogbmFtZSArICcvdXBkYXRlJ1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbiBzZXJpb3VzIG5lZWQgb2YgZXJyb3IgaGFuZGxpbmcgXG4gICAqL1xuICBmdW5jdGlvbiBtb2RlbChuYW1lKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIHNvY2tldCwgZXZlbnQ7XG4gICAgXG4gICAgLy8gaWYgaXQgZXhpc3RzLCByZXR1cm4gaXRcbiAgICBpZihjb2xsZWN0aW9uc1tuYW1lXSkge1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb25zW25hbWVdO1xuICAgIH1cbiAgICAgXG4gICAgc29ja2V0ID0gYWRtaW5Tb2NrZXQ7XG4gICAgY29sbGVjdGlvbiA9IGNvbGxlY3Rpb25zW25hbWVdID0gW107XG4gICAgZXZlbnQgPSBldmVudHMobmFtZSk7XG5cbiAgICBzb2NrZXQub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5nZXQpO1xuICAgIH0pO1xuICAgIFxuICAgIC8qKlxuICAgICAqIFNvY2tldCBFdmVudHNcbiAgICAgKi9cbiAgICBcbiAgICBzb2NrZXQub24oZXZlbnQuZ2V0LCBmdW5jdGlvbihtb2RlbHMpIHtcbiAgICAgIGNvbGxlY3Rpb24ubGVuZ3RoID0gMDtcbiAgICAgIC8vIEkgYmVsaWV2ZSB0aGVyZSdzIHNvbWUgZXhwbGFpbmcgdG8gZG8gaGVyZS5cbiAgICAgIGNvbGxlY3Rpb24ucHVzaC5hcHBseShjb2xsZWN0aW9uLCBtb2RlbHMuZGF0YSk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQuY3JlYXRlLCBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgY29sbGVjdGlvbi5wdXNoKG1vZGVsKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihldmVudC5yZW1vdmUsIGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBkZWxldGUgZmluZChjb2xsZWN0aW9uLCBtb2RlbCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oZXZlbnQudXBkYXRlLCBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgLy8gY3JlYXRlIHNhZmVndWFyZCB3aXRoIG1vZGVsIGZvciBmaW5kIC0+IG51bGxcbiAgICAgIChmaW5kKGNvbGxlY3Rpb24sIG1vZGVsKSB8fCBtb2RlbCkgPSB1cGRhdGVkO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogRXhwb3NlZCBtZXRob2RzXG4gICAgICovICBcbiAgXG4gICAgY29sbGVjdGlvbi5jcmVhdGUgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQuY3JlYXRlLCBtb2RlbCk7XG4gICAgfTtcbiAgICBcbiAgICBjb2xsZWN0aW9uLnJlbW92ZSA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICBzb2NrZXQuZW1pdChldmVudC5yZW1vdmUsIG1vZGVsKTtcbiAgICB9O1xuXG4gICAgY29sbGVjdGlvbi51cGRhdGUgPSBmdW5jdGlvbihtb2RlbCwgdXBkYXRlZCkge1xuICAgICAgc29ja2V0LmVtaXQoZXZlbnQudXBkYXRlLCBtb2RlbCwgdXBkYXRlZCk7XG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gY29sbGVjdGlvbjtcbiAgfVxuXG4gIHJldHVybiBtb2RlbDtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldEZhY3RvcnkpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWVzcGFjZSkge1xuICAgIHZhciBjb25uZWN0VXJsID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC8nICsgbmFtZXNwYWNlO1xuICAgIHJldHVybiBzb2NrZXRGYWN0b3J5KHtcbiAgICAgIGlvU29ja2V0OiBpby5jb25uZWN0KGNvbm5lY3RVcmwpXG4gICAgfSk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNvY2tldCkge1xuICByZXR1cm4gc29ja2V0KCd1c2VyJyk7XG59O1xuIl19
