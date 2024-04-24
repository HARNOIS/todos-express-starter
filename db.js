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
  

  // Create the behavior table with columns for goals 1 to 30
  db.run(`CREATE TABLE IF NOT EXISTS behavior_plan (
    id INTEGER PRIMARY KEY,
    goal_type_id INTEGER DEFAULT 0,
    client_id INTEGER UNIQUE,
    title TEXT DEFAULT "title",
    description TEXT DEFAULT "description",
    goal1_id INTEGER,
    goal2_id INTEGER,
    goal3_id INTEGER,
    goal4_id INTEGER,
    goal5_id INTEGER,
    goal6_id INTEGER,
    goal7_id INTEGER,
    goal8_id INTEGER,
    goal9_id INTEGER,
    goal10_id INTEGER,
    goal11_id INTEGER,
    goal12_id INTEGER,
    goal13_id INTEGER,
    goal14_id INTEGER,
    goal15_id INTEGER,
    goal16_id INTEGER,
    goal17_id INTEGER,
    goal18_id INTEGER,
    goal19_id INTEGER,
    goal20_id INTEGER,
    goal21_id INTEGER,
    goal22_id INTEGER,
    goal23_id INTEGER,
    goal24_id INTEGER,
    goal25_id INTEGER,
    goal26_id INTEGER,
    goal27_id INTEGER,
    goal28_id INTEGER,
    goal29_id INTEGER,
    goal30_id INTEGER,
    FOREIGN KEY (goal1_id) REFERENCES goal(id),
    FOREIGN KEY (goal2_id) REFERENCES goal(id),
    FOREIGN KEY (goal3_id) REFERENCES goal(id),
    FOREIGN KEY (goal4_id) REFERENCES goal(id),
    FOREIGN KEY (goal5_id) REFERENCES goal(id),
    FOREIGN KEY (goal6_id) REFERENCES goal(id),
    FOREIGN KEY (goal7_id) REFERENCES goal(id),
    FOREIGN KEY (goal8_id) REFERENCES goal(id),
    FOREIGN KEY (goal9_id) REFERENCES goal(id),
    FOREIGN KEY (goal10_id) REFERENCES goal(id),
    FOREIGN KEY (goal11_id) REFERENCES goal(id),
    FOREIGN KEY (goal12_id) REFERENCES goal(id),
    FOREIGN KEY (goal13_id) REFERENCES goal(id),
    FOREIGN KEY (goal14_id) REFERENCES goal(id),
    FOREIGN KEY (goal15_id) REFERENCES goal(id),
    FOREIGN KEY (goal16_id) REFERENCES goal(id),
    FOREIGN KEY (goal17_id) REFERENCES goal(id),
    FOREIGN KEY (goal18_id) REFERENCES goal(id),
    FOREIGN KEY (goal19_id) REFERENCES goal(id),
    FOREIGN KEY (goal20_id) REFERENCES goal(id),
    FOREIGN KEY (goal21_id) REFERENCES goal(id),
    FOREIGN KEY (goal22_id) REFERENCES goal(id),
    FOREIGN KEY (goal23_id) REFERENCES goal(id),
    FOREIGN KEY (goal24_id) REFERENCES goal(id),
    FOREIGN KEY (goal25_id) REFERENCES goal(id),
    FOREIGN KEY (goal26_id) REFERENCES goal(id),
    FOREIGN KEY (goal27_id) REFERENCES goal(id),
    FOREIGN KEY (goal28_id) REFERENCES goal(id),
    FOREIGN KEY (goal29_id) REFERENCES goal(id),
    FOREIGN KEY (goal30_id) REFERENCES goal(id),
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



  // Create goal table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS goal (
    id INTEGER PRIMARY KEY,
    title TEXT DEFAULT "title",
    description TEXT DEFAULT "description",
    goal_type TEXT,
    criteria_of_mastery TEXT DEFAULT "criteria of mastery",
    is_mastered INTEGER DEFAULT 0 CHECK (is_mastered IN (0, 1)),
    client_id INTEGER,
    behavior_plan_id INTEGER,
    FOREIGN KEY (behavior_plan_id) REFERENCES behavior_plan(id),
    FOREIGN KEY (client_id) REFERENCES client(id)
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
  db.run(`INSERT OR IGNORE INTO goal_type (id, option, goal_type0, goal_type1, goal_type2, goal_type3, goal_type4, goal_type5, goal_type6, goal_type7, goal_type8, goal_type9, goal_type10) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
  [0, "default", "Undefined", "Discrete Percentage", "Frequency", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined", "Yet to be defined"]);


  


});

module.exports = db;
