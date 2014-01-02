var adminDb = require('../mongo')('admins');

module.exports = {

  create: function(email, password) {
    adminDb.insert({
      email: email,
      password: password
    });
  },
  
  authenticate: function(email, password, callback) {
    adminDb.find({ email: email, password: password }, 
    function(err, docs) {
      callback(docs.length > 0);      
    });
  },
  
  delete: function(email) {
    adminDb.delete({
      email: email
    });
  }

};
