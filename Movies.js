var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//got these three lines from the User.js
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true },function(err){if(err) console.log(err)});
mongoose.set('useCreateIndex', true);

var MovieSchema = new Schema ({
    title: {type: String, required: true},
    releaseDate: {type: Number, required: true},
    Genre: {type: String, enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'],
        required: true},
    actors:
        {type:[{actorName: {type: String, required: true}, characterName: {type: String, required: true}}]},
    imageUrl: {type: String, required: true}

});

var Movie = mongoose.model("Movie", MovieSchema);
module.exports = Movie;