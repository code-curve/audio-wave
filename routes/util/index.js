var util = _ = {

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
  }

};


module.exports = util;
