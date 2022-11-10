require('dotenv').config({ path: '../.env' });
const express = require('express');
const userRouter = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const conn = require('../data/dbConnection');


const minLength = 6;
const maxLength = 16;

// Function to ensure credentials follow length/character guidelines
const credentialsAreValid = (credentialsArray) => {
    // Flag to keep track of whether any characters are invalid
    let invalidCharFlag = false;
    let invalidLengthFlag = false;

    credentialsArray.forEach((credential) => {
        if (credential.length >= minLength && credential.length <= maxLength) {
            // Validate CHARS present in password and username
            let credentialChars = credential.split('');
            credentialChars.forEach((char) => {
                if (char.charCodeAt(0) > 122 || char.charCodeAt(0) < 33) {
                    // Returning status so function will not continue
                    invalidCharFlag = true;
                }
            });
        } else {
            invalidLengthFlag = true;
        }
    });

    if (invalidCharFlag || invalidLengthFlag) {
        return false;
    } else {
        return true;
    }
}

// Validate session cookie middleware
const validateAuthCookie = (req, res, next) => {
    // End function/ return UNAUTHORIZED if there are no cookies in request
    if (!req.cookies) {
        res.status(401).end();
        return;
    }

    // Set sessionToken equal to the desired authentication cookie
    const sessionToken = req.cookies['session_cookie'];
    
    // Ensure that sessionToken acually has a value, if not... END/ return UNAUTHORIZED
    if (!sessionToken) {
        res.status(401).end();
        return;
    }

    // Find session from database using session id
    conn.getSessionById(sessionToken, (sessionResult) => {
        if (sessionResult.length < 1) {
            res.status(401).end();
            return;
        }

        // Check if token is expired
        if (sessionResult[0].expiresAt < (new Date())) {
            conn.deleteSessionById(sessionToken);
            res.status(401).end();
            return;
        }
    });

    next();
}

const hashPassword = (password) => {
    // Generate salt
    let salt = bcrypt.genSaltSync(10);

    // Return hashed password
    return bcrypt.hashSync(password, salt);
}

// Route to create a new User
userRouter.post('/create', (req, res) => {

    // Check that another user by that username does not already exist
    conn.getUserId(req.body.username, (idQueryResult) => {
        // Unknown error
        if (idQueryResult) {
            res.sendStatus(500).end();
            return;
        }

        if (idQueryResult.length > 0) {
            // Alert client of conflict regarding their desired username being taken already
            res.sendStatus(409).end();
            return;
        }

        // Validate password and username LENGTH
        if (!credentialsAreValid([req.body.username, req.body.password])) {
            res.sendStatus(406).end();
            return;
        }

        let hash = hashPassword(req.body.password);

        // Use db Connection object to insert new user into database
        conn.insertUser(req.body.username, hash, (insertId) => {

            if (!insertId) {
                // Unknown error
                res.sendStatus(500).end();
                return
            }

            // Successful
            console.log(`User with id ${insertId} has been inserted successfully.`);
            res.sendStatus(201);
        });
    });
});

// Route to GET record from database for login
userRouter.post('/login', (req, res) => {

    conn.getUserPassword(req.body.username, (result) => {
        if (result.length <= 0) {
            // Alert client of unfound resource
            res.sendStatus(404).end();
            return
        }

        let savedSalt = result[0].password.substring(0, 29);
        let savedPassword = result[0].password;

        let newHash = bcrypt.hashSync(req.body.password, savedSalt);

        if (newHash === savedPassword) {
            console.log(`1 record matching those credentials has been found.`);

            // Randomly generated and secure id to identify an individual session
            const sessionToken = uuid.v4();

            // Date and time of when the token will expire
            const now = new Date();
            const expiresAt = new Date(+ now + 900 * 1000); // 15 mins

            conn.insertSession(sessionToken, req.body.username, expiresAt, (result) => {
                if (result.affectedRows > 0) {
                    res.cookie('session_cookie', sessionToken, { expires: expiresAt });
                    res.status(200).json({ username: req.body.username });
                    return;
                }
            });
        }
    });
});

// Route to GET top 5 usernames from the db matching the search criteria
userRouter.post('/search', (req, res) => {
    // Use db Connection object to get usernames
    conn.getUsernamesList(req.body.search, (result) => {
        if (!result) {
            // Unknown error
            res.sendStatus(500).end();
            return;
        }
        
        if (result.length > 0) {
            // Successful w usernames list
            res.status(200).send(result);
        } else {
            // No usernames found
            res.status(404).send([]);
        }
    });
});

// Route to update user password
userRouter.post('/update', validateAuthCookie, (req, res) => {
    // Use db Connection object to get usernames
    if (req.body.updateField === 'password') {

        // Ensure password meets guidelines
        if (!credentialsAreValid([req.body.newFieldValue])) {
            res.status(409).end();
            return;
        }

        // Hash new password
        let hash = hashPassword(req.body.newFieldValue);

        conn.updateUser('password', hash, req.body.username, (result) => {

            if (!result || result.length < 1) {
                res.status(500).end();
                return;
            }
            if (result.affectedRows < 1) {
                res.status(404).end();
                return;
            }

            res.status(200).send(result);
            return;
        });
    }
});

// Route to return followed and followers for an account
userRouter.post('/friendList', (req, res) => {

    // SELECT USER BY USERNAME OR USER ID
    conn.getUserId(req.body.username, (idQueryResult) => {

        if (idQueryResult.length <= 0) {
            // Alert client of unfound resource
            res.sendStatus(404).end();
            return;
        }

        conn.selectFollowers(idQueryResult[0].id, (followersResult) => {

            if (followersResult.length <= 0) {
                res.sendStatus(404);
                return;
            }

            res.status(200).send(followersResult[0]);
        });
    });
});

// Route to update followers and followed for the 2 users interacting
userRouter.post('/friendList/follow', validateAuthCookie, (req, res) => {
    
    // Get my own followed list and add searched-user to it
    conn.getUserId(req.body.user, (idQueryResult) => {

        if (idQueryResult.length <= 0) {
            // Username not found
            res.status(404).end();
	        return;
        }

        conn.selectFollowers(idQueryResult[0].id, (followersResult) => {

            let newFollowersArr = JSON.parse(followersResult[0].followed);

            // Only executing update query if username is not already in array
            if (!newFollowersArr.includes(req.body.wantsToFollow)) {
                newFollowersArr.push(req.body.wantsToFollow);
                conn.updateUser('followed', JSON.stringify(newFollowersArr), req.body.user, (result) => {
                    //res.status(200).send(result);
                    if (result.affectedRows == 0) {
                        // Server error
                        res.status(500).end();
                        return;
                    }
                });
            } else {
                // Alert client of unaccepted request
                res.status(406).end();
                return;
            }
        });
    });

    // Get followers list of searched-user and add my username to it
    conn.getUserId(req.body.wantsToFollow, (idQueryResult) => {

        if (idQueryResult.length <= 0) {
            // Username not found
            res.status(404).end();
	        return;
        }

        conn.selectFollowers(idQueryResult[0].id, (followersResult) => {

            let newFollowersArr = JSON.parse(followersResult[0].followers);

            // Only executing update query if username is not already in array
            if (!newFollowersArr.includes(req.body.user)) {
                newFollowersArr.push(req.body.user);
                conn.updateUser('followers', JSON.stringify(newFollowersArr), req.body.wantsToFollow, (result) => {
                    //res.status(200).send(result);
                    if (result.affectedRows == 0) {
                        // Server error
                        res.status(500).end();
                        return;
                    } else {
                        // Successful
                        res.status(200).end();
                        return;
                    }
                });
            } else {
                // Alert client of unaccepted request
                res.status(406).end();
                return;
            }
        });
    });
});


// Route to update followers and followed for the 2 users interacting
userRouter.post('/friendList/unfollow', validateAuthCookie, (req, res) => {
    
    // Get my own followed list and remove searched-user to it
    conn.getUserId(req.body.user, (idQueryResult) => {

        if (!idQueryResult || idQueryResult.length <= 0) {
            res.status(404).end();
            return;
        }

        conn.selectFollowers(idQueryResult[0].id, (followersResult) => {

            // Array of users own followed list
            let newFollowersArr = JSON.parse(followersResult[0].followed);

            // Ending function if username of user to unfollow does not exists in users 'followed' array
            if (!newFollowersArr.includes(req.body.wantsToFollow)) {
                res.status(409).end();
                return;
            }

            // Remove username from users followed list
            let index = newFollowersArr.indexOf(req.body.wantsToFollow);
            newFollowersArr.splice(index, 1);
            //newFollowersArr.push(req.body.wantsToFollow);

            conn.updateUser('followed', JSON.stringify(newFollowersArr), req.body.user, (result) => {
                //res.status(200).send(result);
                if (!result || result.affectedRows == 0) {
                    // Server error
                    res.status(500).end();
                    return;
                }
            });
        });
    });
    // Get followers list of searched-user and add my username to it
    conn.getUserId(req.body.wantsToFollow, (idQueryResult) => {

        if (!idQueryResult || idQueryResult.length <= 0) {
            res.status(404).end();
            return;
        }

        conn.selectFollowers(idQueryResult[0].id, (followersResult) => {

            // Get list of target users followers list
            let newFollowersArr = JSON.parse(followersResult[0].followers);

            // End function if name is not found in target users followers list
            if (!newFollowersArr.includes(req.body.user)) {
                res.status(409).end();
                return;
            }

            // Remove users own username from target users followers list
            let index = newFollowersArr.indexOf(req.body.user);
            newFollowersArr.splice(index, 1);

            conn.updateUser('followers', JSON.stringify(newFollowersArr), req.body.wantsToFollow, (result) => {
                //res.status(200).send(result);
                if (!result || result.affectedRows == 0) {
                    // Server error
                    res.sendStatus(500);
                }
            });
        });
    });

    // If we made it this far with no errors, return successful
    res.status(200).end();
    return;
});


// Route to log user out and delete session + session cookie
userRouter.post('/logout', validateAuthCookie, (req, res) => {

    const sessionToken = req.cookies['session_cookie'];

    conn.deleteSessionById(sessionToken, (result) => {

        if (result.affectedRows > 0) {
            console.log(`Session with id ${sessionToken} has been deleted successfully.`);
            res.cookie('session_cookie', '', { expires: new Date() });
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    })
});

userRouter.post('/delete', validateAuthCookie, (req, res) => {

    const sessionToken = req.cookies['session_cookie'];

    console.log(req.body.username);

    if (!req.body.username) {
        res.status(401).end();
        return;
    }

    let userId;

    conn.getUserId(req.body.username, (result) => {

        if (!result || result.length === 0) {
            res.status(404).end();
            return;
        }

        userId = result[0].id;

        conn.deleteUserById(userId, (result) => {
            if (!result || result.affectedRows === 0) {
                res.status(404).end();
                return;
            }
        });
    });

    conn.deleteSessionById(sessionToken, (result) => {
        if (!result || result.affectedRows === 0) {
            res.status(404).end();
            return;
        }
    });

    res.cookie('session_cookie', '', { expires: new Date() });
    res.status(200).end();
    return;
});

// Route to log user out and delete session + session cookie
userRouter.post('/session/get', validateAuthCookie, (req, res) => {

    const sessionToken = req.cookies['session_cookie'];

    // Find session from database using session id
    conn.getSessionById(sessionToken, (sessionResult) => {
        if (sessionResult.length < 1) {
            res.status(401).end();
            return;
        }

        // Check if token is expired
        if (sessionResult[0].expiresAt < (new Date())) {
            conn.deleteSessionById(sessionToken);
            res.status(401).end();
            return;
        }

        // Send username to client
        res.status(200).json({ username: `${sessionResult[0].username}` });
        return;
    });
});

module.exports = userRouter;
