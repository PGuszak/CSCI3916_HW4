var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//got these three lines from the User.js
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true }, function(err){if(err) console.log(err)});
mongoose.set('useCreateIndex', true);

var ReviewSchema = new Schema({
    Reviewer: {type: String, required: true},
    MovieTitle: {type: String, required: true},
    Review: {type: String, required: true},
    Stars: {type: Number, enum: ["1", "2", "3", "4", "5"], required: true}
});

var Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;