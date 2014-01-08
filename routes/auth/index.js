var api = require('../api')
  , adminDb = require('../mongo')('admins');


module.exports = {

  check: function(req, res, next) {
    if(req.session.name) {
      next();
    } else {
      res.render('login');
    }
  },
   
  login: function(req, res) {
    var error, success;
    
    // validate request variables

    adminDb.find({ 
      name: req.body.name, 
      password: req.body.password 
    },
    function(err, docs) {
      if(err) throw err;
      if(docs.length) {
        req.session.name = docs[0].name;
        success = api.success({
          auth: true
        });
        res.json(success);
      } else {
        error = api.error({
          auth: false,
          error: {
            name: 'Nope',
            message: 'Invalid credentials.'
          }
        });
        res.json(error);
      }   
    });
  },

  logout: function(req, res) {
    delete req.session.name;
    res.render('login');
  }

};
