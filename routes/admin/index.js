var admin = require('./admin');
var api = require('./api');

module.exports = {
  
  auth: function(req, res, next) {
    if(req.session.name) {
      next();
    } else {
      res.redirect('/admin/login');
    }
  },

  index: function(req, res) {
    res.render('admin');
  },

  login: function(req, res) {
    res.render('login');
  },

  logout: function(req, res) {
    delete req.session.name;
    res.render('login');
  },
  
  api: {
    
    // AUTHENTICATE 
    authenticate: function(req, res) {
      var error, success;
      
      admin.authenticate(req.body.name, req.body.password, 
      function(success) {
        if(success) {
          
          req.session.name = req.body.name;
          success = api.success({
            auth: true 
          });
          res.json(success);
          
        } else {
          
          error = api.error({
            auth: false,
            error: {
              name: 'Invalid credentials',
              message: 'No admins were found with those details'
            }
          });
          res.json(error);
          
        }
      });
    },

    // CREATE AN ADMIN
    create: function(req, res) {
      var error, success;
      
      if(!(req.body.name && req.body.password)) {
        error = api.error('You must supply a name and a password');
        res.json(error);
      } else {
        admin.create(req.body.name, req.body.password);
        success = api.success('Administrator created successfully');
        res.json(success);
      }
    },

    // DELETE AN ADMIN
    delete: function(req, res) {
      var error, success;
      
      if(!req.body.name) {
        error = api.error('You must supply a name');
        res.json(error);
      } else {
        admin.delete(req.body.name);
        success = api.success('Account successfully deleted');
      }
    }

  }
};
