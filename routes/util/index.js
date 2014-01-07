module.exports = _ = {

  args: function(_args) {
    return Array.prototype.slice.call(_args)
  },

  type: function(variable, type) {
    if(!type) return typeof variable;
    else return typeof variable === type;
  },
 
  undef: function(variables) {
    if(!(variables instanceof Array)) variables = _.args(arguments);
    return variables.reduce(function(state, variable) {
      return state && _.type(variable, 'undefined');
    }, true);
  },
  
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
