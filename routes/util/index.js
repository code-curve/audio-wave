var util = _ = {

  type: function(variable, type) {
    return typeof variable === type;
  },
  
  undef: function(variables) {
    if(!(variables instanceof Array)) variables = [variables];
    return variables.reduce(function(state, variable) {
      return state && _.type(variable, 'undefined');
    }, true);
  }

};


module.exports = util;
