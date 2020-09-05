// REQUIRE INSTALLED APPS
require('dotenv').config({ path: './.env' });

// process.env
const mdb_var = process.env.MDB_VAR;

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
mongoose.connect(mdb_var, {
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
app.listen(3000, function () {
    console.log("Listening on port 3000");
});