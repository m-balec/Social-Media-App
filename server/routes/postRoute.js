require('dotenv').config({ path: '../.env' });
const express = require('express');
const postRouter = express.Router();
const conn = require('../data/dbConnection');

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
    conn.getSessionById(sessionToken, (result) => {
        if (result.length < 1) {
            res.status(401).end();
            return;
        }

        // Check if token is expired
        if (result[0].expiresAt < (new Date())) {
            res.status(401).end();
            return;
        }
    });

    next();
}

// Route to GET all posts and the users who posted them
postRouter.post('/get', (req, res) => {
    let username = null;

    if (req.body.where) {
        username = req.body.where.username;
    }

    const page = req.query.page;
    const limit = req.query.limit;

    // Call accessLayer function to get all posts with users
    conn.selectPostsWithUsers(username, req.body.feed, page, limit, (result) => {

        if (!result) {
            res.sendStatus(500).end();
            return;
        }

        res.status(200).json(result);
    });
});

// Route to create a new post in the database
postRouter.post('/create', validateAuthCookie, (req, res) => {

    if (req.body.postText === '') {
        res.sendStatus(400).end();
        return;
    }

    // get userID using username first
    conn.getUserId(req.body.username, (idResult) => {

        // Create post only if an id was found belonging to that username
        if (idResult.length <= 0) {
            res.sendStatus(404).end();
            return;
        }
            
        conn.insertPost(idResult[0].id, req.body.postText, (result) => {
        
            if (result.affectedRows <= 0) {
                res.sendStatus(500).end();
                return;
            }
            
            console.log(`Post with id ${result.insertId} has been inserted successfully.`);
            res.status(200).json(result);
        });
    });
});

// Route to delete a post using its
postRouter.post('/delete', validateAuthCookie, (req, res) => {
    // Delete post using its ID
    conn.deletePostById(req.body.postId, (result) => {

        if (result.affectedRows <= 0) {
            res.sendStatus(404).end();
            return;
        }
        
        console.log(`Post with id ${req.body.postId} has been deleted successfully.`);
        res.sendStatus(200);
    });
});

module.exports = postRouter;