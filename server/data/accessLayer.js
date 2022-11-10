const mysql = require('mysql');

class DbAccess {
    // Creating connection object upon DbAccess instantiation
    constructor(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) {
        // Instantiating mySql connection pool
        this.conn = mysql.createPool({
            connectionLimit: 30,
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });
    }

    // Function to get the ID associated with a given username
    getUserId(username, callback) {
        let selectUserSQL = `SELECT id FROM user WHERE username=?;`;
        this.conn.query(selectUserSQL, [username], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to get the password hash for an account
    getUserPassword(username, callback) {
        let selectUserSQL = `SELECT password FROM user WHERE username=?;`;
        this.conn.query(selectUserSQL, [username], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // inset user to user table
    insertUser(username, password, callback) {
        this.getUserId(username, (result) => {
            if (result.length == 0) {
                let insertUserSQL = `INSERT INTO user (id, username, password, followers, followed) VALUES (NULL, ?, ?, ?, ?);`;
                this.conn.query(insertUserSQL, [username, password, JSON.stringify([]), JSON.stringify([])], (err, result) => {
                    if (err) throw err;
                    if (callback) callback(result.insertId);
                });
            }
        });
    }

    // insert post to post table
    insertPost(userId, postText, callback) {
        let insertPostSQL = `INSERT INTO post (id, userId, postDate, postText) VALUES (NULL, ?, NOW(), ?)`;
        this. conn.query(insertPostSQL, [userId, postText], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Select user record using username and password - used for LOGIN
    selectUserByCredentials(username, password, callback) {
        let selectUserSQL = `SELECT * FROM user WHERE username=? AND password=?;`;
        this.conn.query(selectUserSQL, [username, password], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Select posts and user of who posted it - will have to make paginated as a full solution -> obviously won't be realistic to load every post
    selectPostsWithUsers(username = '', feed = false, page = null, limit = null, callback) {
        let whereSQL = '';
        let orderBySQL = ' ORDER BY P.postDate DESC';
        let limitSQL = '';
        let offsetSQL = '';

        // Setting whereSQL if we need to limit posts to only ones by a specific user
        if (username  && !feed) whereSQL = ' WHERE U.username=?';
        if (username  && feed) whereSQL = ` WHERE JSON_CONTAINS(U.followers, ?)`;

        if (page) offsetSQL = ` OFFSET ${(page * limit) - limit}`;
        if (limit) limitSQL = ` LIMIT ${limit}`;

        // Full sql statement including where statement (if included) and order-by clause
        let joinSQL = `SELECT P.id AS post_id, P.postText AS post_text, P.postDate AS post_date,
                    U.username AS user_name , U.ID AS user_id, U.followers AS user_followers FROM post P
                    LEFT JOIN user U ON P.userid = U.id${whereSQL}${orderBySQL}${limitSQL}${offsetSQL};`;

        // If this is NOT a feed (ie. only showing posts by one person, not all posts belonging to a users friends)
        if (username && !feed) {
            this.conn.query(joinSQL, [username], (err, result) => {
                if (err) throw err;
                if (callback) callback(result);
            });
        } 
        // If this IS a feed (ie. posts are limitted to only those that are created by people in the users followed list)
        else if (username && feed) {
            this.conn.query(joinSQL, ['["' + username + '"]'], (err, result) => {
                if (err) throw err;
                if (callback) callback(result);
            });
        } else {
            this.conn.query(joinSQL, (err, result) => {
                if (err) throw err;
                if (callback) callback(result);
            });
        }
        
    }

    // Function to get top 5 usernames in the db matching the search criteria
    getUsernamesList(search, callback) {
        let selectUserSQL = `SELECT username FROM user WHERE username LIKE ? LIMIT 5;`;
        this.conn.query(selectUserSQL, [search + '%'], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to delete post using id
    deletePostById(postId, callback) {
        let deletePostSQL = `DELETE FROM post WHERE id=?;`;
        this.conn.query(deletePostSQL, [postId], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to update user using username
    updateUser(updateField, newFieldValue, username, callback) {
        let updateUserSQL = `UPDATE user SET ${updateField}=? WHERE username=?;`;
        this.conn.query(updateUserSQL, [newFieldValue, username], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to select all followers of / those followed by a given username
    selectFollowers(userId, callback) {
        let selectFollowersSQL = `SELECT followers, followed FROM user WHERE id=?;`;
        this.conn.query(selectFollowersSQL, [userId], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // insert session into session table
    insertSession(uuid, username, expiresAt, callback) {
        let insertSessionSQL = `INSERT INTO session (id, username, expiresAt) VALUES (?, ?, ?)`;
        this. conn.query(insertSessionSQL, [uuid, username, expiresAt], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to return session by session ID
    getSessionById(id, callback) {
        let selectSessionSQL = `SELECT * FROM session WHERE id=?;`;
        this.conn.query(selectSessionSQL, [id], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to delete session by id
    deleteSessionById(id, callback) {
        let deleteSessionSQL = `DELETE FROM session WHERE id=?;`;
        this.conn.query(deleteSessionSQL, [id], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

    // Function to delete user by id
    deleteUserById(id, callback) {
        let deleteUserSQL = `DELETE FROM user WHERE id=?;`;
        this.conn.query(deleteUserSQL, [id], (err, result) => {
            if (err) throw err;
            if (callback) callback(result);
        });
    }

}

module.exports = DbAccess;