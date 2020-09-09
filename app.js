// Configure dotenv
require('dotenv').config({ path: './.env' });

// REQUIRE INSTALLED APPS
const
    Campground = require("./models/campground"),
    methodOverride = require("method-override"),
    LocalStrategy = require("passport-local"),
    Comment = require("./models/comment"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    passport = require("passport"),
    mongoose = require("mongoose"),
    seedDB = require("./seeds"),
    express = require("express"),
    app = express(),
    flash = require("connect-flash");


// LINKING EXPORTED ROUTE FILES
const commentRoutes = require("./routes/comments");
const campgroundRoutes = require("./routes/campgrounds");
const indexRoutes = require("./routes/index");

// APP CONFIG
// DATABASEURL key value pair keeps local database and cloud database seperate
const url = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp_v14";
mongoose.connect(url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to DB!");
}).catch(err => {
    console.log("ERROR", err.message);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// SEED THE DATABASE // seedDB();

// requiring moments.js to app
app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "I like to eat eggs everyday!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// APPENDING LINKED ROUTES TO MAKE CODE CLEANER
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

// APP.LISTEN ON PORT 3000
const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started On Port 3000!");
});