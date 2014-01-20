// Comparisons
// -----------

// A smalll set of helper comparators
// for use with hub's querying. Very
// self explanatory, look at the code.

module.exports = {
  '<': function(a, b) {
    return a < b;
  },
  '<=': function(a, b) {
    return a <= b;
  },
  '>': function(a, b) {
    return a > b;
  },
  '>=': function(a, b) {
    return a >= b;
  },
  '==': function(a, b) {
    return a == b;
  },
  '===': function(a, b) {
    return a === b;
  }
};
