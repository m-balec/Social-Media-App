require('dotenv').config();
const express = require('express');
//const http = require('http');
const https = require('https');
const userRouter = require('./routes/userRoute');
const postRouter = require('./routes/postRoute');
const cors = require('cors');
const fs = require('fs');

const serverOrigin = process.env.SERVER_ORIGIN || 'https://www.thoughtcentral.ca';

const cookieParser = require('cookie-parser');

const port = process.env.PORT || 4001;

const app = express();

// Object to hold all CORS options
const corsObj = {
    allRoutes: true,
    origin: `${serverOrigin}`,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}

app.use(cors(corsObj));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.disable('x-powered-by');

// Additional CORS-related configurations just to be safe
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', `${serverOrigin}`);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

// Allowing app to use custom routes defined in/exported from sererate files
app.use('/user', userRouter);
app.use('/post', postRouter);

// Setting up server to communicate using HTTPS
const httpsOptions = {
    key: fs.readFileSync('/opt/bitnami/apache/conf/thoughtcentral.ca.key').toString(),
    cert: fs.readFileSync('/opt/bitnami/apache/conf/thoughtcentral.ca.crt').toString()
};

const server = https.createServer(httpsOptions, app);

server.listen(port, () => console.log(`Listening on port ${port}`));
