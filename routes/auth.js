var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var db = require('../db');

// Define the LocalStrategy for Passport
passport.use(new LocalStrategy(function verify(username, password, cb) {
    db.get('SELECT * FROM users WHERE username = ?', [username], function(err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

        crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
            if (err) { return cb(err); }
            if (!crypto.timingSafeEqual(row.hashed_password, hashedPassword)) {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
            return cb(null, row);
        });
    });
}));

// Serialize user into the session
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(function(id, cb) {
    db.get('SELECT * FROM users WHERE id = ?', [id], function(err, row) {
        if (err) { return cb(err); }
        if (!row) { return cb(null, false); } // User not found in database
        cb(null, row); // Success, return the user object
    });
});


var router = express.Router();

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.post('/login/password', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}));

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/signup', function(req, res, next) {
    res.render('signup');
});

router.post('/signup', function(req, res, next) {
    var salt = crypto.randomBytes(16);
    crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return next(err); }
        db.run('INSERT INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
            req.body.username,
            hashedPassword,
            salt
        ], function(err) {
            if (err) { return next(err); }
            var user = {
                id: this.lastID,
                username: req.body.username,
                is_bcba: -1,
                bcba_id: -1,
                bcba_name: "",
                is_rbt: -1,
                rbt_id: -1,
                rbt_name: ""
            };
            req.login(user, function(err) {
                if (err) { return next(err); }
                res.redirect('/rbtOrBcba');
            });
        });
    });
});

router.post('/rbtOrBcba', (req, res, next) => {
    const user = JSON.parse(req.body.userData);
    const { role, name } = req.body;

    // Insert or update the corresponding table based on the role
    if (role === 'bcba') {
        // Check if the BCBA already exists
        db.get('SELECT id FROM bcba WHERE name = ?', [name], (err, row) => {
            if (err) {
                return next(err);
            }
            if (row) {
                // BCBA already exists, update the user's role and bcba_id
                const bcba_id = row.id;
                db.run('UPDATE users SET is_bcba = 1, is_rbt = 0, bcba_name = ?, bcba_id = ? WHERE id = ?', [name, bcba_id, req.user.id], function(err) {
                    if (err) {
                        return next(err);
                    }
                    // Update user object with new role and ID
                    req.user.is_bcba = 1;
                    req.user.bcba_id = bcba_id;
                    req.user.bcba_name = name;
                    req.user.is_rbt = 0;
                    req.user.rbt_id = null;
                    req.user.rbt_name = null;
                    res.redirect('/'); // Redirect to a success page
                });
            } else {
                // BCBA does not exist, insert into bcba table
                db.run('INSERT INTO bcba (name) VALUES (?)', [name], function(err) {
                    if (err) {
                        return next(err);
                    }
                    // Retrieve the ID of the newly inserted BCBA
                    const bcba_id = this.lastID;
                    // Update the user's role and bcba_id in the users table
                    db.run('UPDATE users SET is_bcba = 1, is_rbt = 0, bcba_name = ?, bcba_id = ? WHERE id = ?', [name, bcba_id, req.user.id], function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Update user object with new role and ID
                        req.user.is_bcba = 1;
                        req.user.bcba_id = bcba_id;
                        req.user.bcba_name = name;
                        req.user.is_rbt = 0;
                        req.user.rbt_id = null;
                        req.user.rbt_name = null;
                        res.redirect('/'); // Redirect to a success page
                    });
                });
            }
        });
    } else if (role === 'rbt') {
        // Check if the RBT already exists
        db.get('SELECT id FROM rbt WHERE name = ?', [name], (err, row) => {
            if (err) {
                return next(err);
            }
            if (row) {
                // RBT already exists, update the user's role and rbt_id
                const rbt_id = row.id;
                db.run('UPDATE users SET is_bcba = 0, is_rbt = 1, rbt_name = ?, rbt_id = ? WHERE id = ?', [name, rbt_id, req.user.id], function(err) {
                    if (err) {
                        return next(err);
                    }
                    // Update user object with new role and ID
                    req.user.is_bcba = 0;
                    req.user.bcba_id = null;
                    req.user.bcba_name = null;
                    req.user.is_rbt = 1;
                    req.user.rbt_id = rbt_id;
                    req.user.rbt_name = name;
                    res.redirect('/'); // Redirect to a success page
                });
            } else {
                // RBT does not exist, insert into rbt table
                db.run('INSERT INTO rbt (name) VALUES (?)', [name], function(err) {
                    if (err) {
                        return next(err);
                    }
                    // Retrieve the ID of the newly inserted RBT
                    const rbt_id = this.lastID;
                    // Update the user's role and rbt_id in the users table
                    db.run('UPDATE users SET is_bcba = 0, is_rbt = 1, rbt_name = ?, rbt_id = ? WHERE id = ?', [name, rbt_id, req.user.id], function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Update user object with new role and ID
                        req.user.is_bcba = 0;
                        req.user.bcba_id = null;
                        req.user.bcba_name = null;
                        req.user.is_rbt = 1;
                        req.user.rbt_id = rbt_id;
                        req.user.rbt_name = name;
                        res.redirect('/'); // Redirect to a success page
                    });
                });
            }
        });
    } else {
        // Handle invalid role
        res.status(400).send('Invalid role');
    }
});

module.exports = router;
