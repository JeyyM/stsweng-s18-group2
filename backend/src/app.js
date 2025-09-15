/**
 *  Require modules
 */
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
//const path = require('path');
// const path = require('path');

// branch 1

/**
 *  Configuration/Initialization
 */
dotenv.config();

const app = express();

app.use(express.json());

/**
 *  Session Proper
 */
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");

app.use(cookieParser());

// Updated CORS configuration to handle wildcards and ALLOWED_ORIGINS
let corsOptions;

corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Get allowed origins from environment
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
        
        // If no ALLOWED_ORIGINS set, fall back to old logic
        if (allowedOrigins.length === 0) {
            if (process.env.NODE_ENV === 'production') {
                const prodOrigin = process.env.PROD_ORIGIN || 'https://vercel.com/stswengs18s-projects/unbound-stsweng';
                return origin === prodOrigin ? callback(null, true) : callback(new Error('Not allowed by CORS'));
            } else {
                const devOrigin = process.env.DEV_ORIGIN || 'https://unbound-stsweng-git-dev-branch-stswengs18s-projects.vercel.app/';
                return origin === devOrigin ? callback(null, true) : callback(new Error('Not allowed by CORS'));
            }
        }
        
        // Check if origin matches any allowed pattern
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin === '*') return true;
            
            if (allowedOrigin.includes('*')) {
                // Convert wildcard to regex
                const regex = new RegExp('^' + allowedOrigin.replace(/\*/g, '.*') + '$');
                return regex.test(origin);
            }
            
            return origin === allowedOrigin;
        });
        
        if (isAllowed) {
            console.log(`CORS: Allowed origin: ${origin}`);
            return callback(null, true);
        }
        
        console.log(`CORS: Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.set('trust proxy', 1);
app.use(
    session({
        secret: process.env.SECRET_KEY || "secret-key", 
        resave: false,        
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: "sessions",
        }),
        cookie: {
            maxAge: process.env.COOKIE_MAX_AGE ? parseInt(process.env.COOKIE_MAX_AGE) : null, 
            httpOnly: true, 
            secure: true, // Keep true since you're using HTTPS everywhere
            sameSite: 'none'
        }
    })
);

/**
 *  Require controllers and routes
 */
const caseRoutes = require('./route/caseRoutes');
const accountRoutes = require('./route/accountRoutes');

const caseClosureController = require("./controller/caseClosureController");
const authController = require('./controller/authController.js')  
const interventionRoutes = require('./route/interventionRoutes');
const progressReportRoutes = require('./route/progressReportRoutes');
const interventFinRoutes = require('./route/interventFinRoute.js');
const interventCorrespRoutes = require('./route/interventCorrespForm.js');
const homeVisRoutes = require('./route/interventHomeVisitRoutes.js');
const spuRoutes = require('./route/spuRoutes');
const isAuthenticated = require('./middlewares/isAuthenticated.js')
const createAccountController = require('./controller/createAccountController');
const deleteAccountController = require('./controller/deleteAccountController.js')
const profileRoute = require('../src/route/employeeRoute.js');
const fetchingRoute = require('./route/fetchingRoute.js');
const fileGenerator = require('./route/fileGeneratorRoutes.js');
/**
 *  ============ Routes ==============
 */

// Log requests
app.use((req, res, next) => {
  // console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

// To test sessions, please go to localhost:3000
app.get("/test-session", (req, res) => {
    // Check if a value already exists in the session
    if (req.session.views) {
        req.session.views++;
        res.send(`You have visited this page ${req.session.views} times.`);
    } else {
        req.session.views = 1;
        res.send("Welcome to this page for the first time! Refresh to count views.");
    }
});

// Log in and log out route
app.put('/api/login', authController.loginUser)
app.put('/api/logout', authController.logoutUser)

app.get('/api/session', (req, res) => {
  if (req.session && req.session.user) {
    if(req.session.user.is_active === true)
      res.status(200).json({ user: req.session.user });
    else{
      res.status(200).json({ user: null });
    }
  } else {
    res.status(200).json({ user: null });
  }
});

// ALL ROUTES AFTER THIS ARE NOW GETTING AUTHENTICATED
app.use(isAuthenticated);
// All case routes

app.use('/api/cases', caseRoutes);
// All account routes
app.use('/api', accountRoutes);
app.use('/api', fetchingRoute);
// Intervention routes
app.use('/api/intervention', interventionRoutes);
app.use('/api/interventions/financial',interventFinRoutes);
app.use('/api/interventions/correspondence',interventCorrespRoutes);
app.use('/api/intervention', homeVisRoutes);
app.use('/api/spu',spuRoutes);
// Progress Report routes
app.use('/api/progress-report', progressReportRoutes);
// Case Closure routes

app.get('/api/case-closure/:caseID', caseClosureController.loadCaseClosureForm);
app.put('/api/case-closure/create/:caseID', caseClosureController.createCaseClosureForm);
app.put('/api/case-closure/edit/:caseID', caseClosureController.editCaseClosureForm);
app.put('/api/case-closure/edit/:caseID/:formID', caseClosureController.editCaseClosureForm);
app.put('/api/case-closure/terminate/:caseID', caseClosureController.confirmCaseTermination);
app.put('/api/case-closure/terminate/:caseID/:formID', caseClosureController.confirmCaseTermination);
app.delete('/api/case-closure/delete/:caseID', caseClosureController.deleteCaseClosureForm);
app.delete('/api/case-closure/delete/:caseID/:formID', caseClosureController.deleteCaseClosureForm);

// Delete Accoute routes
app.delete('/api/delete-account/:account', deleteAccountController.deleteAccount);


// File Generator routes
app.use('/api/file-generator', fileGenerator);



// 404 Route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Fetching for viewing
// app.use('/api/dashboard',fetchingRoute);

/**
 *  ============ Extras ==============
 */

/*
Code below was added by gpt as a bug fix to when you reload it turns into json, this happens because of routing issues with
vite+react to be able to use this tho you first need to build the front end

// Serve static files (JS, CSS, images, etc.)
app.use(express.static(path.join(__dirname, '../frontend-dev-test/dist')))

// Serve index.html for any other route (React handles client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend-dev-test/dist/index.html'))
})
for testing
//const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretHere', // use env or fallback
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));
  //For testing
app.get('/setTestSession', (req, res) => {
  req.session.user = { role: 'head', name: 'Test Head User',spu_id : 'AMP', _id: '686e92a03c1f53d3ee65962b'};
  res.send('Session set!');
});*/


module.exports = app;