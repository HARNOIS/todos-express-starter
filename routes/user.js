var express = require('express');
var db = require('../db');




var router = express.Router();



function fetchClients(req, res, next) {
    db.all('SELECT * FROM client', [
    ], function(err, rows) {
      if (err) { return next(err); }
      
      var clients = rows.map(function(row) {
        return {
          id: row.id,
          name: row.name,
          dob: row.dob
        }
      });
      res.locals.clients = clients;
      next();
    });
  }



/* Failed attempt
//Need to chane this to fetch active clients
function fetchActiveClients(req, res, next) {
  db.all('SELECT * FROM client_bcba WHERE bcba_id = ?', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }
    
    foreach 
    var clients = rows.map(function(row) {
      return {
        db.all('SELECT * FROM client WHERE client_id = ?', [row.client_id], function(err,rows2){
          if (err) {return next(err); }
          name : rows2.name;
          
        })
      }
    });
    res.locals.todos = todos;
    res.locals.activeCount = todos.filter(function(todo) { return !todo.completed; }).length;
    res.locals.completedCount = todos.length - res.locals.activeCount;
    next();
  });
}
*/

function fetchActiveClients(req, res, next) {
  db.all('SELECT * FROM client_bcba WHERE bcba_id = ?', [req.user.id], function(err, rows) {
    if (err) { return next(err); }

    var activeclients = [];

    // Iterate over each row in the result set
    rows.forEach(function(row, index) {
      db.all('SELECT * FROM client WHERE client_id = ?', [row.client_id], function(err, rows2) {
        if (err) { return next(err); }

        if (rows2.length > 0) {
          // Assuming there's only one row returned for each client_id
          clients.push({
            id: row.client_id,
            name: rows2[0].name,
            dob: rows2[0].dob
          });
        }

        // If it's the last iteration, set locals and call next
        if (index === rows.length - 1) {
          res.locals.activeclients = activeclients;
          next();
        }
      });
    });

    // If the result set is empty, set locals and call next immediately
    if (rows.length === 0) {
      res.locals.activeclients = activeclients;
      next();
    }
  });
}


router.get('/edit', function(req, res, next) {
    db.all('SELECT * FROM client', [
      ], function(err, rows) {
        if (err) { return next(err); }
        
        var clients = rows.map(function(row) {
          return {
            id: row.id,
            name: row.name,
            dob: row.dob
          }
        });
        res.locals.clients = clients;
        res.render('edit', { user: req.user });
      });
  });

router.get('/activeClient', fetchClients, fetchActiveClients, function(req,res,next){

    res.render('activeClient', { user: req.user, clients: res.locals.clients,   });
  });



router.post('activeClient')


router.get('/newClient', function(req,res,next){
    // Check if success message exists in session
    var successMessage = req.session.successMessage;
    // Clear the success message from session
    req.session.successMessage = null;
    // Render the newClient page with success message
    res.render('newClient', { user: req.user, successMessage: successMessage });
  });

router.post('/newClient', function(req,res,next){
    db.run('INSERT INTO client (name, dob) VALUES (?, ?)', [
        req.body.name,
        req.body.dob,
      ], function(err) {
        if (err) { 
            if (err.code === 'SQLITE_CONSTRAINT'){
                req.session.successMessage = 'Client already exists.';
                return res.redirect('/newClient');
            }
            else {return next(err);}
         }
        // Success message
        req.session.successMessage = 'Client successfully added.';
        return res.redirect('/newClient');
      });
    //res.render('newClient', { user: req.user });
  });  



router.get('/rbtOrBcba', function(req,res,next){


    res.render('rbtOrBcba', { user: req.user });

});


// Route handler for processing the form data
router.post('/rbtOrBcba', (req, res, next) => {
  const { role, name } = req.body;

  // Insert or update the corresponding table based on the role
  if (role === 'bcba') {
      // Insert into bcba table
      db.run('INSERT INTO bcba (name) VALUES (?)', [name], function(err) {
          if (err) {
              return next(err);
          }
          // Update the user's role and bcba_id in the users table
          db.run('UPDATE users SET is_bcba = 1, is_rbt = 0, bcba_name = ?, bcba_id = ? WHERE id = ?', [name, this.lastID, req.user.id], function(err) {
              if (err) {
                  return next(err);
              }
              res.redirect('/'); // Redirect to a success page
          });
      });
  } else if (role === 'rbt') {
      // Insert into rbt table
      db.run('INSERT INTO rbt (name) VALUES (?)', [name], function(err) {
          if (err) {
              return next(err);
          }
          // Update the user's role and rbt_id in the users table
          db.run('UPDATE users SET is_bcba = 0, is_rbt = 1, rbt_name = ?, rbt_id = ? WHERE id = ?', [name, this.lastID, req.user.id], function(err) {
              if (err) {
                  return next(err);
              }
              res.redirect('/'); // Redirect to a success page
          });
      });
  } else {
      // Handle invalid role
      res.status(400).send('Invalid role');
  }
});















// Define custom error handling middleware
router.use(function(err, req, res, next) {
    console.log(err.code);
    // Handle specific errors differently
    if (err.code === 'SQLITE_CONSTRAINT') {
      // Handle SQLite constraint errors (e.g., duplicate client name and dob)
      res.status(400).send('The client already exists.');
    } else {
      // Handle other errors
      res.status(500).send('Something went wrong.');
    }
  });


  


module.exports = router;