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

  db.run("CREATE TABLE IF NOT EXISTS client_rbt (\
    client_id INTEGER,\
    rbt_id INTEGER,\
    PRIMARY KEY (client_id, rbt_id),\
    FOREIGN KEY (client_id) REFERENCES client(id),\
    FOREIGN KEY (rbt_id) REFERENCES rbt(id))");
  //db.run("CREATE TABLE IF NOT EXISTS ")

  // Create the program table with columns for goals 1 to 30
  db.run(`CREATE TABLE IF NOT EXISTS program (
    id INTEGER PRIMARY KEY,
    goal_type_id INTEGER DEFAULT 0,
    client_id INTEGER UNIQUE,
    title TEXT DEFAULT "title",
    description TEXT DEFAULT "description",
    criteria_of_mastery TEXT DEFAULT "criteria of mastery",
    is_mastered INTEGER DEFAULT 0 CHECK (is_mastered IN (0, 1)),
    goal1 INTEGER CHECK (goal1 >= 0 AND goal1 <= 10) DEFAULT 0,
    goal2 INTEGER CHECK (goal2 >= 0 AND goal2 <= 10) DEFAULT 0,
    goal3 INTEGER CHECK (goal3 >= 0 AND goal3 <= 10) DEFAULT 0,
    goal4 INTEGER CHECK (goal4 >= 0 AND goal4 <= 10) DEFAULT 0,
    goal5 INTEGER CHECK (goal5 >= 0 AND goal5 <= 10) DEFAULT 0,
    goal6 INTEGER CHECK (goal6 >= 0 AND goal6 <= 10) DEFAULT 0,
    goal7 INTEGER CHECK (goal7 >= 0 AND goal7 <= 10) DEFAULT 0,
    goal8 INTEGER CHECK (goal8 >= 0 AND goal8 <= 10) DEFAULT 0,
    goal9 INTEGER CHECK (goal9 >= 0 AND goal9 <= 10) DEFAULT 0,
    goal10 INTEGER CHECK (goal10 >= 0 AND goal10 <= 10) DEFAULT 0,
    goal11 INTEGER CHECK (goal11 >= 0 AND goal11 <= 10) DEFAULT 0,
    goal12 INTEGER CHECK (goal12 >= 0 AND goal12 <= 10) DEFAULT 0,
    goal13 INTEGER CHECK (goal13 >= 0 AND goal13 <= 10) DEFAULT 0,
    goal14 INTEGER CHECK (goal14 >= 0 AND goal14 <= 10) DEFAULT 0,
    goal15 INTEGER CHECK (goal15 >= 0 AND goal15 <= 10) DEFAULT 0,
    goal16 INTEGER CHECK (goal16 >= 0 AND goal16 <= 10) DEFAULT 0,
    goal17 INTEGER CHECK (goal17 >= 0 AND goal17 <= 10) DEFAULT 0,
    goal18 INTEGER CHECK (goal18 >= 0 AND goal18 <= 10) DEFAULT 0,
    goal19 INTEGER CHECK (goal19 >= 0 AND goal19 <= 10) DEFAULT 0,
    goal20 INTEGER CHECK (goal20 >= 0 AND goal20 <= 10) DEFAULT 0,
    goal21 INTEGER CHECK (goal21 >= 0 AND goal21 <= 10) DEFAULT 0,
    goal22 INTEGER CHECK (goal22 >= 0 AND goal22 <= 10) DEFAULT 0,
    goal23 INTEGER CHECK (goal23 >= 0 AND goal23 <= 10) DEFAULT 0,
    goal24 INTEGER CHECK (goal24 >= 0 AND goal24 <= 10) DEFAULT 0,
    goal25 INTEGER CHECK (goal25 >= 0 AND goal25 <= 10) DEFAULT 0,
    goal26 INTEGER CHECK (goal26 >= 0 AND goal26 <= 10) DEFAULT 0,
    goal27 INTEGER CHECK (goal27 >= 0 AND goal27 <= 10) DEFAULT 0,
    goal28 INTEGER CHECK (goal28 >= 0 AND goal28 <= 10) DEFAULT 0,
    goal29 INTEGER CHECK (goal29 >= 0 AND goal29 <= 10) DEFAULT 0,
    goal30 INTEGER CHECK (goal30 >= 0 AND goal30 <= 10) DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES client(id),
    FOREIGN KEY (goal_type_id) REFERENCES goal_type(id)
  )`);


  

  // Create the goal_type table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS goal_type ( 
    id INTEGER PRIMARY KEY,
    option TEXT,
    goal_type0 TEXT,
    goal_type1 TEXT,
    goal_type2 TEXT,
    goal_type3 TEXT,
    goal_type4 TEXT,
    goal_type5 TEXT,
    goal_type6 TEXT,
    goal_type7 TEXT,
    goal_type8 TEXT,
    goal_type9 TEXT,
    goal_type10 TEXT
  )`);






  
  // create an initial user (username: alice, password: letmein)
  var salt = crypto.randomBytes(16);
  db.run('INSERT OR IGNORE INTO users (username, hashed_password, salt) VALUES (?, ?, ?)', [
    'alice',
    crypto.pbkdf2Sync('letmein', salt, 310000, 32, 'sha256'),
    salt
  ]);

  

  // Initialize insurances, clients, and default goal_type
  db.run('INSERT OR IGNORE INTO insurance (name) VALUES ("Insurance A"), ("Insurance B"), ("Insurance C")')
  db.run("INSERT OR IGNORE INTO client (name, dob) VALUES  ('John Doe', '1990-05-15'),  ('Jane Smith', '1985-11-30'),  ('Alice Johnson', '1978-08-22')")
  // Insert a row into the goal_type table
  db.run(`INSERT INTO goal_type (id, option, goal_type0, goal_type1, goal_type2, goal_type3, goal_type4, goal_type5, goal_type6, goal_type7, goal_type8, goal_type9, goal_type10) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
  [0, "default", "Undefined", "Discrete Percentage", "Frequency", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined"]);


});

module.exports = db;
