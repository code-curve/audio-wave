// Util
// ----

// Good old util file!
// Just a handful of methods
// for making your life easier.

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
    var key, duplicate;
    duplicate = {};
    for(key in object) {
      duplicate[key] = object[key];
    }
    return duplicate;
  },
  
  // # property
  // `(name)`
  // Extracts some property name from an object
  property: function(name) {
    return function(object) {
      return object[name];
    }
  },

  // # union
  // `(arr1, arr2, ...)`
  // Performs a union on all of the arrays that
  // are passed to the function. Uses strict type
  // checking. Returns resulting array.
  union: function() {
    var results = [];
     
    for(var i = 0; i < arguments.length; i++) {
      for(var j = 0; j < arguments[i].length; j++) {
        if(results.indexOf(arguments[i][j] === -1)) {
          results.push(arguments[i][j]);
        }
      }
    }

    return results;
  }

};
