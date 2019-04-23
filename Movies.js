var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//got these three lines from the User.js
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true },function(err){if(err) console.log(err)});
mongoose.set('useCreateIndex', true);

var MovieSchema = new Schema ({
    Title: {type: String, required: true},
    ReleaseDate: {type: Number, required: true},
    Genre: {type: String, enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'],
        required: true},
    ActorsAndCharacters:
        {type:[{Actor: {type: String, required: true}, Character: {type: String, required: true}}]},
    PhotoLink: {type: String, required: true}

});

var Movie = mongoose.model("Movie", MovieSchema);
module.exports = Movie;