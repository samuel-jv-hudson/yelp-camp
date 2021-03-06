const
    Campground = require("../models/campground"),
    User = require("../models/user"),
    passport = require("passport"),
    express = require("express"),
    router = express.Router(),
    async = require("async"),
    crypto = require("crypto"),
    api_key = process.env.MAILGUN_API,
    domain = process.env.MAILGUN_DOMAIN,
    mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });


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
    res.render("register", { page: 'register' });
});

// HANDLE SIGN UP LOGIC
router.post("/register", function (req, res) {
    const newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email,
    });

    if (req.body.adminCode === process.env.ADMIN_CODE) {
        newUser.isAdmin = true;
    }

    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register", { "error": "That email is already in use by another user, please use a different email." });
        };
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to YelpCamp " + user.username + "!");
            res.redirect("/campgrounds");
        });
    });
});

// SHOW LOGIN FORM
router.get("/login", function (req, res) {
    res.render("login", { page: 'login' });
});

// HANDLING LOGIN LOGIC
// Middleware
router.post("/login", function (req, res, next) {
    passport.authenticate("local",
        {
            successRedirect: "/campgrounds",
            failureRedirect: "/login",
            failureFlash: true,
            successFlash: "Welcome to YelpCamp, " + req.body.username + "!"
        })(req, res);
});

// LOGOUT ROUTE
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

// FORGOT PASSWORD ROUTE
router.get("/forgot", function (req, res) {
    res.render("forgot");
});

// HANDLING PASSWORD RESET LOGIC
router.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }, function (err, user) {
                if (!user) {
                    console.log(err);
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var mailOptions = {
                to: user.email,
                from: process.env.WORK_USER,
                subject: 'YelpCamp Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'https://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            console.log(user.email);
            mailgun.messages().send(mailOptions, function (err, body) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(body);
                    console.log('mail sent');
                    req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                }
            });
        }
    ], function (err) {
        if (err) {
            console.log(err);
            return next(err)
        } else {
            res.redirect('/forgot');
        }
    });
});

// RESET PAGE TOKEN ROUTE
router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            console.log("This is reset token error 1", err);
            console.log(user);
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', { token: req.params.token });
    });
});

// HANDLING RESET PAGE INPUT LOGIC
router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    console.log("This is reset token error 2", err)
                    console.log(user);
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        console.log("This is password reset input logic error", err);
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    console.log("Failed to save password error", err);
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function (user, done) {
            var mailOptions = {
                to: user.email,
                from: process.env.WORK_USER,
                subject: 'Your YelpCamp password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your YelpCamp account ' + user.email + ' has just been changed.\n'
            };
            mailgun.messages().send(mailOptions, function (err, body) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(body);
                    console.log('success mail sent');
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err, 'done');
                }
            });
        }
    ], function (err) {
        if (err) {
            console.log(err);
            return next(err)
        } else {
            res.redirect('/campgrounds');
        }
    });
});

// USER PROFILES ROUTE
router.get("/users/:id", function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Something went wrong.");
            res.redirect("/");
        }
        Campground.find().where("author.id").equals(foundUser._id).exec(function (err, campgrounds) {
            if (err) {
                req.flash("error", "Something went wrong.");
                res.redirect("/");
            }
            res.render("users/show", { user: foundUser, campgrounds: campgrounds });
        });
    });
});

module.exports = router;