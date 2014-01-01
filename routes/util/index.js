module.exports = {

  type: function(variable, type) {
    return typeof variable === type;
  },
  
  undef: function(variables) {
    if(!variables instanceof Array) variables = [variables];

    return variables.reduce(function(state, variable) {
      return state && this.type(variable, 'undefined');
    }, true);
  }

};
