var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

mkdirp.sync('var/db');

var db = new sqlite3.Database('var/db/todos.db');

db.serialize(function() {
  // create the database schema for the todos app
  // Enable foreign key support

  // Create the users table with foreign key constraints
  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      hashed_password BLOB,
      salt BLOB,
      name TEXT,
      email TEXT UNIQUE,
      email_verified INTEGER,
      is_bcba INTEGER DEFAULT 1 CHECK (is_bcba IN (0, 1)),
      bcba_id INTEGER,
      bcba_name TEXT,
      is_rbt INTEGER DEFAULT 0 CHECK (is_rbt IN (0, 1)),
      rbt_id INTEGER,
      rbt_name TEXT,
      FOREIGN KEY (bcba_id) REFERENCES bcba(id),
      FOREIGN KEY (rbt_id) REFERENCES rbt(id)
  )`);


  
  
  db.run("CREATE TABLE IF NOT EXISTS federated_credentials ( \
    id INTEGER PRIMARY KEY, \
    user_id INTEGER NOT NULL, \
    provider TEXT NOT NULL, \
    subject TEXT NOT NULL, \
    UNIQUE (provider, subject) \
  )");
  
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    owner_id INTEGER NOT NULL, \
    title TEXT NOT NULL, \
    completed INTEGER \
  )");

  db.run("CREATE TABLE IF NOT EXISTS bcba ( \
    id INTEGER PRIMARY KEY, \
    name TEXT UNIQUE \
  )");

  db.run("CREATE TABLE IF NOT EXISTS rbt ( \
      id INTEGER PRIMARY KEY, \
      name TEXT UNIQUE \
  )");


  db.run("CREATE TABLE IF NOT EXISTS insurance ( \
    id INTEGER PRIMARY KEY, \
    name TEXT \
  )");

  db.run("CREATE TABLE IF NOT EXISTS client ( \
    id INTEGER PRIMARY KEY, \
    name TEXT, \
    dob TEXT CHECK ( \
      dob LIKE '____-__-__' \
      AND dob GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' \
    ), \
    CONSTRAINT unique_name_dob UNIQUE (name, dob) \
  )");

  db.run("CREATE TABLE IF NOT EXISTS client_bcba (\
    client_id INTEGER,\
    bcba_id INTEGER,\
    PRIMARY KEY (client_id, bcba_id),\
    FOREIGN KEY (client_id) REFERENCES client(id),\
    FOREIGN KEY (bcba_id) REFERENCES bcba(id))");

  //db.run("CREATE TABLE IF NOT EXISTS ")
  
  // create an initial user (username: alice, password: letmein)
  var salt = crypto.randomBytes(16);
  db.run('INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
    'alice',
    crypto.pbkdf2Sync('letmein', salt, 310000, 32, 'sha256'),
    salt
  ]);

  

  // Initialize insurances 
  db.run('INSERT OR IGNORE INTO insurance (name) VALUES ("Insurance A"), ("Insurance B"), ("Insurance C")')
  db.run("INSERT OR IGNORE INTO client (name, dob) VALUES  ('John Doe', '1990-05-15'),  ('Jane Smith', '1985-11-30'),  ('Alice Johnson', '1978-08-22')")

});

module.exports = db;
