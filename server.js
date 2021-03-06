var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');
var cors = require("cors");
var mongoose = require('mongoose');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
var router = express.Router();

//do i need this V??????!!
//let User = require("./Users");
let Movie = require("./Movies");//makes the Movie obj work from the Movies.js exports line
let Review = require('./reviews');


router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.email = req.body.email;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code === 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.email = req.body.email;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});

//************************************************************************** Edited everything after this line
//THIS BLOCK OF CODE DOES NOT WORK.  WHEN I SEND A REQUEST FROM POSTMAN ALL THE DIFFERENT ROUTES ARE SKIPPED AND THERE IS
//      JUST AN "UNAUTHORIZED" MESSAGE

//need to make sure authHwtController.isAuthenticated is the one used for all the different routes
router.route("/movies")
    .post(authJwtController.isAuthenticated,function(req, res)  //create a new movie
    {//in the function params cannot double up two res's, all four must be different to work
        Movie.findOne({Title: req.body.Title}, function(err)//for whatever reason this only allows one movie into the db at a time
        {
            if (err)
            {
                res.status(400);
            }
            else if(req.body.actors.length < 3)
            {
                res.json({message: "You must have at least 3 actors and characters per movie!"});
            }
            else if (req.data !== 0) {
                //do i need to change the schema and add "Reviews as T/F"  !!!!????
                let newmovie = new Movie;
                newmovie.title = req.body.title;
                newmovie.releaseDate = req.body.releaseDate;
                newmovie.Genre = req.body.Genre;
                newmovie.actors = req.body.actors;
                newmovie.imageUrl = req.body.imageUrl;
                newmovie.save(function (err)
                {
                    if (err)
                    {
                       res.json({message: err});
                    }
                    else
                    {
                        res.json({status: 200, success: true, message: "The movie " + req.body.Title + " has been successfully saved!"});
                    }
                });
            }
        });
    })
    .get(authJwtController.isAuthenticated,function(req,res)//search for a movie
    {
        if(req.query.movieId != null)
        {
            Movie.find({_id: mongoose.Types.ObjectId(req.query.movieId)}, function (err, data) {
                if (err)//if there is any err, print the err and response message
                {
                    res.json(err);
                    res.json({message: "There was an issue trying to find your movie"})
                } else if (data.length === 0)//if there is no return of data the movie was not found
                {   //don't think this is correct
                    res.json({message: "The Movie " + req.body.Title + " was not found"});
                }
                else//if there is no error and there is data which means we found the movie due to the find function
                {
                    if (req.query.reviews === "true") {//uses the query in the url from postman as a "variable" of sorts"
                        Movie.aggregate([
                            {
                                $match: {"_id": mongoose.Types.ObjectId(req.query.movieId)}//this makes it so the reviews that are printed are only the ones with the same movie title
                            },
                            {
                                $lookup:
                                    {
                                        from: "reviews",//must be the name of the collection in mongo db!!!
                                        localField: "title",
                                        foreignField: "MovieTitle",
                                        as: "reviews"
                                    }
                            }
                        ], function (err, doc)//callback function
                        {
                            if (err) {
                                res.json(err);
                            } else {
                                res.json(doc);
                            }
                        });
                    } else {
                        res.json({status: 200, message: "The movie with " + req.body.Title + " was found!"});
                    }
                }
            })
        }
        else
        {
            Movie.find({}, function(err, movieListGarbage)//sends all the movies in the data feild
            {
                if(err)
                {
                    res.json(err);
                }
                else
                {
                    Movie.aggregate(
                    [{
                        $lookup:
                            {
                                from: "reviews",//must be the name of the collection in mongo db!!!
                                localField: "title",
                                foreignField: "MovieTitle",
                                as: "reviews"
                            }
                    }],function (err2, movieList){
                        if(err2)
                        {
                            res.json(err2);
                        }
                        else
                        {
                            res.json(movieList);
                        }
                    });
                }
            })
        }
        //res.json({ status: 200, message: "Movie Found", headers: req.headers, query: req.query, env: process.env.SECRET_KEY});
        //just use the find function from above and print out if there is a record that is found.
    })
    .put(authJwtController.isAuthenticated,function(req,res)//get a movie/search for one ish...
    {
        Movie.findOneAndUpdate({Title: req.body.Title},//originally had .Title but it didn't work with the function(doc)
        {
            Title: req.body.Title,
            releaseDate: req.body.releaseDate,
            Genre: req.body.Genre,
            actors: req.body.actors//because ActorsAndCharacters is the parent schema for the three actors and characters
        },function(err, doc)//originally had (err and data) but I needed doc because I had to switch to use Search to have Heroku work
            {//because Heroku will not work using findOneAndUpdate unless you have .Search and doc, as opposed to .Search and data.length
                if(err)
                {
                    res.json({message: err});
                    res.json({message: "There was an issue trying to update your movie."})
                }
                else if(doc === 0)
                {
                    res.json({message: "Sorry the movie wanted to update was not found in the data base."});
                }
                else
                {
                    res.json({status: 200, message: "The Movie " + req.body.Title + " has been updated!!"});
                }

            });
        //res.json({ status: 200, message: "Movie Found", headers: req.headers, query: req.query, env: process.env.SECRET_KEY});
        //just use the find function from above and print out if there is a record that is found.
    })
    .delete(authJwtController.isAuthenticated, function(req, res)//delete a movie
    {
        Movie.findOneAndDelete({Title: req.body.title}, function(err, data)//got this code from the get request method
        {
            if (err)
            {
                res.json(err);
                res.json({message: "There was an issue trying to find your movie"})
            }
            else if (data.length === null)
            {   //don't think this is correct
                res.json({message: "The Movie " + req.body.title + " was not found"});
            }
            else//if there is no error and the movie is not found
            {
                res.json({message: "The movie with " + req.body.title + " was deleted!"});
            }
        })
    });

router.route("/review")
    .post(authJwtController.isAuthenticated, function(req, res)
    {
        let authorization = req.headers.authorization;//grabs whole jwt token from the authorization variable from postman
        let authParts = authorization.split(" ");//splits the token into and array of two based on where the seperator
        let token = jwt.verify(authParts[1], process.env.SECRET_KEY);//now token 3 is a hash table of sorts (array of user stuff, the user and id..etc)

        Movie.findOne({title: req.body.MovieTitle}, function (err, data)
        {//need to figure out how to see if the title equals one in the movie DB
            if (err)
            {
                res.json(err);
            }
            else if (data != null)
            {

               let temprecord = new Review;
                temprecord.username = token.username;
                temprecord.MovieTitle = req.body.MovieTitle;
                temprecord.review = req.body.review;
                temprecord.rating = req.body.rating;
                temprecord.save(function(err)
                {
                    if(err)
                    {
                        res.json({message: "The review of " + temprecord.MovieTitle + " was not saved.  Make sure all your fields are the correct type!",
                        msg: "MovieTitle should be a STRING, Review should be a STRING, and Stars should be a NUMBER"});
                    }
                    else
                    {
                        res.json({message: "The review for " + req.body.MovieTitle +" was successfully saved!", status: 200});
                    }
                })

            }
            else
            {
                res.json({message: "That movie does not exist"});
            }

        });
    })
    .get(authJwtController.isAuthenticated, function(req, res)
    {
        Review.find({MovieTitle: req.body.MovieTitle}, function (err,data)
        {
            if (err)//if there is any err, print the err and response message
            {
                res.json(err);
                res.json({message: "There was an issue trying to reviews for that title"})
            }
            else if (data.length === 0)//if there is no return of data the movie was not found
            {   //don't think this is correct
                res.json({message: "There was NO review with the title " + req.body.MovieTitle + "."});
            }
            else//if there is no error and there is data which means we found the movie due to the find function
            {
                res.json({status: 200, message: "The there are review/s and movies with the title" + req.body.MovieTitle,
                msg: "IF you want to view the review/s for this title, search this Title in the GetMovie request"});

            }
        })
    });


router.all('*', function(req, res)  //if there is a response that the server has no way to handle.
{
    res.json({error: "Unsupported HTTP Method"})
});

app.use('/', router);
app.listen(process.env.PORT || 8080);

//module.exports = app;

//need to connect to mongoose some how here
/*mongoose.connect(mongoDB, { useNewUrlParser: true },
    {
        //check if there is an error
    }

);
*/
