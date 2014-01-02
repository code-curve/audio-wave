var response = function(status) {
  return function(data) {
    status: status,
    data: data
  };
};

module.exports = {
  success: response('success'),
  error: response('error'),
  warning: response('warning')
};
