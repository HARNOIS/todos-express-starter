var express = require('express');
var db = require('../db');




var router = express.Router();
// Define a middleware function to set Cache-Control headers for HTML responses
function setCacheControl(req, res, next) {
  // Check if the request is for an HTML page
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Set Cache-Control header to specify no caching for HTML responses
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  // Continue to the next middleware
  next();
}

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
  console.log("\n\n\n")
  console.log("Fetch Active Occurring")
  db.all('SELECT * FROM client_bcba WHERE bcba_id = ?', [req.user.bcba_id], function(err, rows) {
    if (err) { return next(err); }
    console.log("This is the bcba_id", req.user.bcba_id)
    console.log("This is the rows,", rows)
    var activeclients = [];

    // Iterate over each row in the result set
    rows.forEach(function(row, index) {
      db.all('SELECT * FROM client WHERE id = ?', [row.bcba_id], function(err, rows2) {
        if (err) { return next(err); }

        if (rows2.length > 0) {
          // Assuming there's only one row returned for each client_id
          console.log("This is the current row", row)
          activeclients.push({
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

router.get('/activeClient', setCacheControl, fetchClients, fetchActiveClients, function(req,res,next){
    res.render('activeClient', { user: req.user, activeclients: res.locals.activeclients });
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


//router.post('/rbtOrBcba', (req, res, next) => {
//  const user = JSON.parse(req.body.userData);
//  const { role, name } = req.body;
//
//  // Insert or update the corresponding table based on the role
//  if (role === 'bcba') {
//      // Check if the BCBA already exists
//      db.get('SELECT id FROM bcba WHERE name = ?', [name], (err, row) => {
//          if (err) {
//              return next(err);
//          }
//          if (row) {
//              // BCBA already exists, update the user's role and bcba_id
//              const bcba_id = row.id;
//              db.run('UPDATE users SET is_bcba = 1, is_rbt = 0, bcba_name = ?, bcba_id = ? WHERE id = ?', [name, bcba_id, req.user.id], function(err) {
//                  if (err) {
//                      return next(err);
//                  }
//                  // Update user object with new role and ID
//                  user.is_bcba = 1;
//                  user.bcba_id = bcba_id;
//                  user.bcba_name = name;
//                  user.is_rbt = 0;
//                  user.rbt_id = null;
//                  user.rbt_name = null;
//                  console.log("This is the user", user)
//                  res.redirect('/'); // Redirect to a success page
//              });
//          } else {
//              // BCBA does not exist, insert into bcba table
//              db.run('INSERT INTO bcba (name) VALUES (?)', [name], function(err) {
//                  if (err) {
//                      return next(err);
//                  }
//                  // Retrieve the ID of the newly inserted BCBA
//                  const bcba_id = this.lastID;
//                  // Update the user's role and bcba_id in the users table
//                  db.run('UPDATE users SET is_bcba = 1, is_rbt = 0, bcba_name = ?, bcba_id = ? WHERE id = ?', [name, bcba_id, req.user.id], function(err) {
//                      if (err) {
//                          return next(err);
//                      }
//                      // Update user object with new role and ID
//                      user.is_bcba = 1;
//                      user.bcba_id = bcba_id;
//                      user.bcba_name = name;
//                      user.is_rbt = 0;
//                      user.rbt_id = null;
//                      user.rbt_name = null;
//                      console.log("This is the user", user)
//                      res.redirect('/'); // Redirect to a success page
//                  });
//              });
//          }
//      });
//  } else if (role === 'rbt') {
//      // Check if the RBT already exists
//      db.get('SELECT id FROM rbt WHERE name = ?', [name], (err, row) => {
//          if (err) {
//              return next(err);
//          }
//          if (row) {
//              // RBT already exists, update the user's role and rbt_id
//              const rbt_id = row.id;
//              db.run('UPDATE users SET is_bcba = 0, is_rbt = 1, rbt_name = ?, rbt_id = ? WHERE id = ?', [name, rbt_id, req.user.id], function(err) {
//                  if (err) {
//                      return next(err);
//                  }
//                  // Update user object with new role and ID
//                  user.is_bcba = 0;
//                  user.bcba_id = null;
//                  user.bcba_name = null;
//                  user.is_rbt = 1;
//                  user.rbt_id = rbt_id;
//                  user.rbt_name = name;
//                  res.redirect('/'); // Redirect to a success page
//              });
//          } else {
//              // RBT does not exist, insert into rbt table
//              db.run('INSERT INTO rbt (name) VALUES (?)', [name], function(err) {
//                  if (err) {
//                      return next(err);
//                  }
//                  // Retrieve the ID of the newly inserted RBT
//                  const rbt_id = this.lastID;
//                  // Update the user's role and rbt_id in the users table
//                  db.run('UPDATE users SET is_bcba = 0, is_rbt = 1, rbt_name = ?, rbt_id = ? WHERE id = ?', [name, rbt_id, req.user.id], function(err) {
//                      if (err) {
//                          return next(err);
//                      }
//                      // Update user object with new role and ID
//                      user.is_bcba = 0;
//                      user.bcba_id = null;
//                      user.bcba_name = null;
//                      user.is_rbt = 1;
//                      user.rbt_id = rbt_id;
//                      user.rbt_name = name;
//                      res.redirect('/'); // Redirect to a success page
//                  });
//              });
//          }
//      });
//  } else {
//      // Handle invalid role
//      res.status(400).send('Invalid role');
//  }
//});
//




router.get('/fetchAllClientsList', setCacheControl, (req, res) => {
  // Query your database to fetch all clients along with their active status
  db.all(`
    SELECT c.*, 
           CASE 
             WHEN bc.client_id IS NOT NULL THEN 1 
             WHEN rb.client_id IS NOT NULL THEN 1 
             ELSE 0 
           END AS active 
    FROM client c 
    LEFT JOIN client_bcba bc ON c.id = bc.client_id AND bc.bcba_id = ? 
    LEFT JOIN client_rbt rb ON c.id = rb.client_id AND rb.rbt_id = ?
  `, [req.user.bcba_id, req.user.rbt_id], (err, allClients) => {
      if (err) {
          console.error("Failed to fetch all clients from the database:", err);
          res.status(500).send('Failed to fetch all clients from the database');
      } else {
          console.log("This is allClients", allClients)
          // Send the list of all clients with their active status as JSON in the response
          res.status(200).json(allClients);
      }
  });
});

// Define a route to handle the GET request for fetching active clients
router.get('/fetchActiveClientsList', setCacheControl, (req, res) => {
  // Determine the appropriate table based on user's role (BCBA or RBT)
  const tableName = req.user.is_bcba ? 'client_bcba' : 'client_rbt';
  const userIdColumn = req.user.is_bcba ? 'bcba_id' : 'rbt_id';
  const userId = req.user.is_bcba ? req.user.bcba_id : req.user.rbt_id;

  // Query the appropriate table to fetch active clients
  const query = `SELECT client_id FROM ${tableName} WHERE ${userIdColumn} = ?`;
  db.all(query, [userId], (err, activeClients) => {
      if (err) {
          console.error("Failed to fetch active clients from the database:", err);
          res.status(500).send('Failed to fetch active clients from the database');
      } else {
          // Extract the client IDs from the result
          const clientIds = activeClients.map(client => client.client_id);

          // If there are no active clients, send an empty array
          if (clientIds.length === 0) {
              res.status(200).json([]);
              return;
          }

          // Construct the SQL query to fetch actual client details
          const actualQuery = `SELECT * FROM client WHERE id IN (${clientIds.map(() => '?').join(', ')})`;

          // Execute the query with clientIds as parameters
          db.all(actualQuery, clientIds, (err, actualActiveClients) => {
              if (err) {
                  console.error("Failed to fetch actual active clients from the database:", err);
                  res.status(500).send('Failed to fetch actual active clients from the database');
              } else {
                  // Send the list of actual active clients as JSON in the response
                  res.status(200).json(actualActiveClients);
              }
          });
      }
  });
});




// POST route to update client status
router.post('/updateClientStatus', (req, res) => {
  const { clientId, isChecked } = req.body;

  
  if (isChecked) {
      // If checkbox is checked
      if (req.user.is_bcba) {
          const userId = req.user.bcba_id;
          console.log("1");
          // If user is BCBA, insert into client_bcba table
          db.run('INSERT INTO client_bcba (client_id, bcba_id) VALUES (?, ?)', [clientId, userId], function(err) {
              if (err) {
                  console.log("ther error was, ", err)  
                  return res.status(500).send('Error updating client status');
              }
              res.status(200).send('Client status updated successfully');
          });
      } else {
          const userId = req.user.rbt_id;
          console.log("2");
          // If user is RBT, insert into client_rbt table
          db.run('INSERT INTO client_rbt (client_id, rbt_id) VALUES (?, ?)', [clientId, userId], function(err) {
              if (err) {
                  console.log("ther error was, ", err)  
                  return res.status(500).send('Error updating client status');
              }
              res.status(200).send('Client status updated successfully');
          });
      }
  } else {
      // If checkbox is unchecked
      if (req.user.is_bcba) {
        const userId = req.user.bcba_id;
          console.log("3");
          // If user is BCBA, delete from client_bcba table
          db.run('DELETE FROM client_bcba WHERE client_id = ? AND bcba_id = ?', [clientId, userId], function(err) {
              if (err) {
                  console.log(err)
                  return res.status(500).send('Error updating client status');
              }
              res.status(200).send('Client status updated successfully');
          });
      } else {
          const userId = req.user.rbt_id;
          console.log("4");
          // If user is RBT, delete from client_rbt table
          db.run('DELETE FROM client_rbt WHERE client_id = ? AND rbt_id = ?', [clientId, userId], function(err) {
              if (err) {
                  return res.status(500).send('Error updating client status');
              }
              res.status(200).send('Client status updated successfully');
          });
      }
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