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

//Need to chane this to fetch active clients
function fetchTodos(req, res, next) {
  db.all('SELECT * FROM todos WHERE owner_id = ?', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }
    
    var todos = rows.map(function(row) {
      return {
        id: row.id,
        title: row.title,
        completed: row.completed == 1 ? true : false,
        url: '/' + row.id
      }
    });
    res.locals.todos = todos;
    res.locals.activeCount = todos.filter(function(todo) { return !todo.completed; }).length;
    res.locals.completedCount = todos.length - res.locals.activeCount;
    next();
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

router.get('/activeClient', function(req,res,next){
    res.render('activeClient', { user: req.user });
  });

router.get('/newClient', function(req,res,next){
    res.render('newClient', { user: req.user });
  });

router.post('/newClient', function(req,res,next){
    res.render('newClient', { user: req.user });
  });  





module.exports = router;