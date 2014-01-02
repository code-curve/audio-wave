module.exports = function(extensions) {
  if(!extensions instanceof Array) extensions = [extensions];
  return function(file) {
    // check every extension
    for(var i = 0; i < extensions.length; i++) {
      var passed = file.name.indexOf(extension) !== -1;
      if(!passed) return false;
    }
    return true;
  };
};


