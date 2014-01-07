angular.module('login', []).
// Controllers
controller('LoginController', require('./controllers/LoginController')).
// Directive
directive('afterTyping', require('./directives/afterTyping'));
