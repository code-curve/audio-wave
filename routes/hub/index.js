var Whispers = require('whispers');

var _ = require('../util');
var comparisons = require('./comparisons');

/**
 * Hub is designed to act as a mediator and doorway
 * between users and the main application. Users
 * should be passed into Hub through the connect 
 * method, which takes a socket as an argument.
 * Once connected, Hub listens for a registration
 * event, at which point a user will be built using
 * the user proxy supplied at construction and added
 * to the user list.
 *
 * Hub reveals 4 important methods.
 * select:  Returns a query function that will return 
 *          a user set based on query parameters.
 * all:     Returns a list of all users. Technically 
 *          an alias for select.
 * connect: Accepts a socket and waits for a registration
 *          event before building a new proxy for the user
 *          and adding it to the user list.
 * on:      Listen to user events. See Whispers.
 */

module.exports = function(userProxy) {
  
  var users = [];
  var events = new Whispers();
  
  /**
   * Accepts a socket (designed to be used with socket.io)
   * and listens for a registration event from the socket,
   * upon registration, builds a proxy from our user proxy
   * and adds it to users.
   */
  var connect = function(socket) {
    
    socket.on('register', function(settings) {
      var proxy, index;
      
      // add the user to the users list
      proxy = userProxy(user, settings);
      index = users.push(proxy) - 1;
      
      // fire a registration event
      events.say('registration', proxy); 
      
      // remove this user when they disconnect
      socket.on('disconnect', function() {
        var users = users.splice(index, 1);
        events.say('disconnect', users[0]);
      });

    });    
  };  

  /**
   * Returns a query function based on a metric, comparator
   * and threshold. Example use:
   * 
   * var session = Hub.select('session', '==', 3);
   * 
   * Now calling session() will yield a user set of all
   * the users who's session property === 3.
   *
   * For flexibility and advanced querying you can pass
   * a function as the comparator value. The function must
   * accept two inputs and return a boolean value.
   */
  var select = function(metric, comparator, threshold) {
    
    // if no arguments are passed
    // return every user
    if(arguments.length === 0) {
      return users;
    }
    
    // otherwise, all arguments must be defined
    if(_.undef(metric, comparator, threshold)) {
      throw new Error('One or more select arguments were undefined');
    }

    // metric must be a string
    if(!_.type(metric, 'string')) {
      throw new Error('Metric must be a string');
    }

    // comparator must be a function or a sign
    if(!_.type(comparator, 'function')) {
      if(_.type(comparator, 'string')) {
        
        // switch hack to make sure it's
        // one of the following symbols
        switch(comparator) {
          case '=':break;
          case '==':break;
          case '>':break;
          case '>=':break;
          case '<':break;
          case '<=':break;
          default:
            throw new Error('When passed as a string, comparator must be ' 
              + ' one of the following  =, >, >=, <, <=');
        }
        
        // no error was thrown, get comparison function
        // based on the comparator symbol
        comparator = comparisons[comparator];
 
      } else {
        console.log(comparator, typeof comparator);
        throw new Error('Comparator must be a comparison function, or a string');
      }
    }
  
    // threshold must be a number
    if(!_.type(threshold, 'number')) {
      throw new Error('Threshold must be a number');
    }

   
    // return a function that will give the results
    // of the query when called.
    var result = users.filter.bind(users, function(user) {
      // filter out users based on some metric, 
      // comparing it against the threshold with 
      // our comparator funtion.
      return comparator(user[metric], threshold);
    });
    
    // provide each method on result set
    result.each = function(iterator) {
      var userSet = result();
      for(var i = 0; i < userSet; i++) {
        iterator(userSet[i], i);
      }
    };
    
    // provide global emit of result set
    result.emit = function() {
      result.each(function(user) {
        user.socket.emit.apply(user.socket, arguments);
      });
    };
    
    // set some property of all users in this set
    result.set = function(property, value) {
      result.each(function(user) {
        user[property] = value;
      });
    }
    
    return result;
  };

  return {
    connect: connect,
    select: select,
    all: select,
    on: events.on
  };
};
