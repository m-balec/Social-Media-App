require('dotenv').config({ path: '../.env' });
const mysql = require('mysql');
const dbConfig = require('home/bitnami/conf/config.json');

//Instantiating mySql connection object
const conn = mysql.createConnection({
    host: dbConfig.DB_HOST,
    user: dbConfig.DB_USER, 
    password: dbConfig.DB_PASS,
    database: dbConfig.DB_NAME
});

conn.connect((error) => {
    if (error) throw error;
    console.log(`Connected to database ${process.env.DB_NAME}.`);
});


// SCRIPTS

// create table to hold all users
function createUserTable() {
    var userTableSql = 'CREATE TABLE IF NOT EXISTS user (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, username VARCHAR(31), password VARCHAR(60), followers JSON, followed JSON)';
    conn.query(userTableSql, (err, result) => {
        if (err) throw err;
        console.log('Table Created');
    });
}

// create table to hold posts
function createPostTable() {
    var postTableSql = 'CREATE TABLE IF NOT EXISTS post (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, postDate DATETIME DEFAULT CURRENT_TIMESTAMP, postText VARCHAR(255), FOREIGN KEY (userId) REFERENCES user(id))';
    conn.query(postTableSql, (err, result) => {
        if (err) throw err;
        console.log('Table Created');
    });
}

// inset user to user table
function addUser() {
    let insertUserSQL = `INSERT INTO user (id, username, password, salt) VALUES (NULL, 'ppMan420', '12345', 'salting2')`;
    conn.query(insertUserSQL, (err, result) => {
        if (err) throw err;
        console.log(`User with id ${result.insertId} has been inserted successfully.`);
        return result;
    });
}

// insert post to post table
function addPost() {
    let insertPostSQL = `INSERT INTO post (id, userId, postDate, postText) VALUES (NULL, '2', NOW(), 'This is the text of my post4')`;
    conn.query(insertPostSQL, (err, result) => {
        if (err) throw err;
        console.log(`Post with id ${result.insertId} has been inserted successfully.`);
        return result;
    });
}

// SELECT statement joining both User and Post tables with a 1-many relationship
function PostsAndUserJoinTable() {
    let joinSQL = `SELECT P.id AS post_id, P.postText AS post_text, P.postDate AS post_date,
                    U.username AS user_name , U.ID AS user_id FROM post P
                    LEFT JOIN user U ON P.userid = U.id;`;

    conn.query(joinSQL, (err, result) => {
        if (err) throw err;
        console.log(result);
        return result;
    });
}

function createSessionTable() {
    var sessionTableSql = 'CREATE TABLE IF NOT EXISTS session (id VARCHAR(36) NOT NULL PRIMARY KEY, username VARCHAR(31), expiresAt DATETIME)';
    conn.query(sessionTableSql, (err, result) => {
        if (err) throw err;
        console.log('Table Created');
    });
}

//createUserTable();
//createPostTable();

//addUser();
//addPost();

//PostsAndUserJoinTable();

createSessionTable();
