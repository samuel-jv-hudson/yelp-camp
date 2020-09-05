const mongoose = require("mongoose");

//SCHEMA SETUP
const campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    description: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectID,
            ref: "Comment"
        }
    ]
});

// EXPORT MONGOOSE CODE FUNCTIONALITY TO APP.JS
module.exports = mongoose.model("Campground", campgroundSchema);