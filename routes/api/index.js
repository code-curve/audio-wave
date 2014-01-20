// API Helpers
// -----------

// This module exposes a handful
// of useful API wrappers for sending
// around websocket messages.

// # Response
// `(status)` The status message to display
// within the message.  
// This function returns a partially applied
// function that takes one argument: `data`.
var response = function(status) {
  return function(data) {
    return {
      status: status,
      data: data
    }
  };
};

module.exports = {
  success: response('success'),
  error: response('error'),
  warning: response('warning')
};
