// Authentication
// --------------

// Provides an authentication interface
// for logging in/out and checking whether
// a user is currently authenticated based
// their session token. 

var api = require('../api')
  , adminDb = require('../mongo')('admins');
  
// # Check
// `(req, res, next)`
// Takes a request object, a response
// object and a next function for response
// piping.  
// If the req has the appropriate session
// associated with it, continue by calling
// next, otherwise force the response
// to render the login page.
function check(req, res, next) {
  if(req.session.name) {
    next();
  } else {
    res.render('login');
  }
}

// # Login
// `(req, res)`
// Takes a request and response object,
// and expects there to be a password
// and a username present in the req variables.
// 
// After querying the database, writes a __JSON__
// success or error object back to the response
// depending on whether the user authenticated.
function login(req, res) {
  var error, success;
  
  adminDb.find({ 
    name: req.body.name, 
    password: req.body.password 
  }, validate);

  function validate(err, docs) {
    if(err) throw err;
    
    // Check how many users 
    // were returned.
    if(docs.length > 0) {
      
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
  }

}

// # Logout
// `(req, res)`
// Deletes the session token for the
// user associated with the request
// object. Then renders the login page.
function logout(req, res) {
  delete req.session.name;
  res.render('login');
}

module.exports = {
  check: check,
  login: login,
  logout: logout
}
