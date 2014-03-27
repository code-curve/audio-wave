angular.module('app', ['ngRoute', 'btford.socket-io']).

config(function($routeProvider) {
  $routeProvider.
  when('/:id', {
    templateUrl: '/partials/client',
    controller: 'ClientController'
  }).
  otherwise({
    redirectTo: '/0'
  });
}).

factory({
  'socket': require('./services/socket'),
  'clientSocket': require('./services/clientSocket.js')  
}).

controller({
  'ClientController': require('./controllers/ClientController.js')
});
