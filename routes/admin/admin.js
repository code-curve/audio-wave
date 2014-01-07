var adminDb = require('../mongo')('admins');

module.exports = {

  create: function(name, password) {
    adminDb.insert({
      name: name,
      password: password
    });
  },
  
  authenticate: function(name, password, callback) {
    console.log('checking for user', name, password);
    adminDb.find({ name: name, password: password }, 
    function(err, docs) {
      if(err) throw err;
      console.log(docs);
      callback(docs.length > 0);      
    });
  },
  
  delete: function(name) {
    adminDb.delete({
      name: name
    });
  }

};
