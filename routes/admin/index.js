var admin = require('./admin');
var api = require('./api');

module.exports = {
  
  auth: function(req, res) {
    return !!res.session.email;
  },

  index: function(req, res) {
    res.render('admin');
  },
  
  login: function(req, res) {
    admin.authenticate(req.body.email, req.body.password, 
    function(success) {
      if(success) {
        req.session.email = req.body.email;
        res.redirectTo('/admin');
      } else {
        req.session.error = 'No administrator found with those details';
        res.redirectTo('/admin/login');
      }
    });
  },

  api: {
    create: function(req, res) {
      var error, success;
      
      if(!(req.body.email && req.body.password)) {
        error = api.error('You must supply an email address and a password');
        res.json(error);
      } else {
        admin.create(req.body.email, req.body.password);
        success = api.success('Administrator created successfully');
        res.json(success);
      }
    },

    delete: function(req, res) {
      var error, success;
      
      if(!req.body.email) {
        error = api.error('You must supply an email address');
        res.json(error);
      } else {
        admin.delete(req.body.email);
        success = api.success('Account successfully deleted');
      }
    }

  }

};
