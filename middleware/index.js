// all the middleare goes here
const
    middlewareObj = {},
    Campground = require("../models/campground"),
    Comments = require("../models/comment");

// MIDDLEWARE - CHECK TO SEE IF LOGGED IN, IF FUNCTOIN INSERTED AND USER NOT LOGGED IN THEN WILL REDIRECT TO LOGIN PAGE
middlewareObj.checkCampgroundOwnership = function (req, res, next) {
    // is user logged in
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                // did user create the campground
                if (foundCampground.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You do not have permission to do that.");
                    res.redirect("back");
                };
            };
        });
    } else {
        req.flash("error", "You need to be logged in to do that.")
        res.redirect("back");
    };
};

// MIDDLEWARE - CHECK WHETHER USER CREATED THE COMMENT TO BE ABLE TO UPDATE COMMENT
middlewareObj.checkCommentOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Comments.findById(req.params.comment_id, function (err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Comment not found.");
                res.redirect("back");
            } else {
                // did user create the comment
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that.");
                    res.redirect("back");
                };
            };
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("back");
    };
};

// Is the user logged in
middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");
};

module.exports = middlewareObj;