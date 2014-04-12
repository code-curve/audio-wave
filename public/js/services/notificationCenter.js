var _ = require('../util');

var events = {};

function isRegistered(event) {
  return _.type(events[event], 'object');
}

function on(event, then) {
  if(!isRegistered(event)) {
    events[event] = [];
  }
  events[event].push(then);
}

function emit(event, rest) {
  var args;
  console.warn('Emit', event, isRegistered(event));
  if(isRegistered(event)) {
    args = _.args(arguments).slice(1);
    events[event].forEach(function(then) {
      then.apply(this, args);
    });
  }
}

module.exports = function() {
  return {
    on: on,
    // Only expose required methods
    notify: emit.bind(this, 'notify'),
    confirm: emit.bind(this, 'confirm')
  }
};
