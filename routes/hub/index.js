// Hub
// ---

// Hub is designed to act as a mediator and doorway
// between users and the main application. Users
// should be passed into Hub through the connect 
// method, which takes a socket as an argument.
// Once connected, Hub listens for a registration
// event, at which point a user will be built using
// the user proxy supplied at construction and added
// to the user list.
//
// Hub reveals 4 important methods.

// ### select
// Returns a query function that will return 
// a user set based on query parameters.

// ### all
// Returns a list of all users. Technically 
// an alias for select.

// ### connect
// Accepts a socket and waits for a registration
// event before building a new proxy for the user
// and adding it to the user list.

// ###on
// Listen to user events. See Whispers.

var EventEmitter = require('events').EventEmitter
  , _ = require('../util')
  , comparisons = require('./comparisons');


module.exports = function(userProxy) {
  
  var users = [],
    events = new EventEmitter(),
    sessions = {};
 
  // # connect
  // `(socket)`
  // Accepts a socket (designed to be used with socket.io)
  // and listens for a registration event from the socket,
  // upon registration, builds a proxy from the user proxy
  // and adds it to users.
  function connect(socket) {
    socket.emit('welcome');  
    console.log('[User Connected]'.cyan);
    
    socket.on('register', function(settings) {
      var proxy, index;
       
      console.log('[User Registed]'.cyan, settings.session);
       
      // Add the user to the users list
      proxy = userProxy(socket, settings);

      // (push returns the new length)
      index = users.push(proxy) - 1;
      proxy.settings.id = index;

      if(!_.type(sessions[settings.session], 'object')) {
        sessions[settings.session] = [];
        // emit new session
        events.emit('session', settings.session);
      }

      // add this client to its session
      sessions[settings.session].push(proxy);
      
      // emit client join session
      events.emit('client', settings.session);

      console.log('Emit'.green);
      events.emit('registration', proxy);

      // Remove this user when they disconnect
      socket.on('disconnect', function() {
        var i;
        user = users.splice(index, 1);
        for(i = 0; i < sessions[settings.session].length; i++) {
          if(sessions[settings.session][i] === proxy) {
            sessions[settings.session].splice(i, 0);
          }
        }
        events.emit('disconnect', user[0]);
      });

    });    
  };  

  // # select
  // Returns a query function based on a metric, comparator,
  // threshold and an optional user set. Example use:
  // 
  // `var session = Hub.select('session', '==', 3);`
  // 
  // Now calling `session()` will yield a user set of all
  // the users who's session property === 3.
  //
  // For flexibility and advanced querying you can pass
  // a function as the comparator value. The function __must__
  // accept two inputs and return a boolean value.
  //
  // Calling select without the user set parameter will
  // default to using users. Otherwise, queries will be
  // performed on this subset.
  function select(metric, comparator, threshold, set) {
    
    if(_.undef(set)) {
      set = users;
    }
    
    // If no arguments are passed, return every user
    if(arguments.length === 0) {
      return set;
    }
    
    // Otherwise, all arguments must be defined
    if(_.undef(metric, comparator, threshold)) {
      throw new Error('One or more select arguments were undefined');
    }

    // Metric must be a string
    if(!_.type(metric, 'string')) {
      throw new Error('Metric must be a string');
    }

    // Comparator must be a function or a sign
    if(!_.type(comparator, 'function')) {
      if(_.type(comparator, 'string')) {
        
        if(!comparisons[comparator]) { 
            throw new Error('When passed as a string, comparator must be ' 
              + ' one of the following' + Object.keys(comparisons));
        }
        
        // No error was thrown, get comparison function
        // based on the comparator symbol
        comparator = comparisons[comparator];
 
      } else {
        console.log(comparator, typeof comparator);
        throw new Error('Comparator must be a comparison function, or a string');
      }
    }
  
    // Threshold must be a number
    if(!_.type(threshold, 'number')) {
      throw new Error('Threshold must be a number');
    }

   
    // Return a function that will give the results
    // of the query when called.
    var result = set.filter.bind(users, function(user) {
      // Filter out users based on some metric, 
      // comparing it against the threshold with 
      // our comparator funtion.
      return comparator(user.settings[metric], threshold);
    });
    
    // Provide iterator method for result set
    result.each = function(iterator) {
      var userSet = result();
      for(var i = 0; i < userSet; i++) {
        iterator(userSet[i], i);
      }
    };
    
    // Provide global emit for sockets in result set
    result.emit = function() {
      result.each(function(user) {
        user.socket.emit.apply(user.socket, arguments);
      });
    };
    
    // Set some property of all users in this set
    result.set = function(property, value) {
      result.each(function(user) {
        user[property] = value;
      });
    }

    // Provides chainable interface so that we can chain
    // another selection onto an existing result set.
    result.and = function(metric, comparator, threshold) {
      arguments[arguments.length] = result();
      return select.bind(this, arguments);
    };
    
    return result;
  };
  return {
    connect: connect,
    select: select,
    all: select,
    events: events,
    sessions: sessions
  };
};
