/**
 * Login 
 *
 * The handler for the login screen that the
 * user sees when authenticating themselves
 * as an administrator. 
 */

angular.module('login', []).

/**
 * Controllers
 */

// handles validation and login requests
controller('LoginController', require('./controllers/LoginController')).


/**
 * Directives
 */

// fires event when the user stops typing
directive('afterTyping', require('./directives/afterTyping'));
