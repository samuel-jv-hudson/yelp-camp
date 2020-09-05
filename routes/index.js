const
    User = require("../models/user"),
    passport = require("passport"),
    express = require("express"),
    router = express.Router();


// MIDDLEWARE - CURRENT USER LOGGED IN TO SHOW RELEVANT PAGE INFO
router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

// LANDING PAGE/ROOT ROUTE
router.get("/", function (req, res) {
    res.render("landing");
});

// <===========> AUTH ROUTES <===========>

// SHOW REGISTER FORM
router.get("/register", function (req, res) {
    res.render("register");
});

// HANDLE SIGN UP LOGIC
router.post("/register", function (req, res) {
    const newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register", { "error": err.message });
        };
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to YelpCamp " + user.username + "!");
            res.redirect("/campgrounds");
        });
    });
});

// SHOW LOGIN FORM
router.get("/login", function (req, res) {
    res.render("login");
});

// HANDLING LOGIN LOGIC
// Middleware
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function (req, res) {
    });

// LOGOUT ROUTE
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

module.exports = router;