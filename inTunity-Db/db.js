var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cors = require('cors');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var app = express();
var mongoose = require('mongoose');

var ObjectId = require('mongoose').Types.ObjectId;

var dotenv = require('dotenv');
dotenv.load();

var dbName = 'inTunity';

mongoose.connect(process.env.MONGO + dbName);

app.use(session({ 
	secret: 'inTunity',
	resave: false,
	saveUninitialized: false,
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		ttl: 24 * 60 * 60 //1 day
	})
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

var whitelist = [process.env.WHITELIST];
var cors_options = {
	origin: function (origin, callback) {
		var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
		callback(null, originIsWhitelisted);
	}
};

//Server settings
app.all('/api/*', cors(cors_options));
app.set('port', 3005);

var User = require('./model/User.js');
var Song = require('./model/Song.js');
var location = require('./model/location.js');
var Comment = require('./model/Comment.js');


//routes
var router = express.Router();


// User.find({  }, function(err, user) {
//       if (err) {
//       	throw err;
//       }

//       console.log("delete");
//         // delete him
//       User.remove(function(err) {
//       if (err) {
//            throw err;
//       }
//       console.log('User successfully deleted!');

//       });
// });

// location.find({  }, function(err, loc) {
//       if (err) {
//       	throw err;
//       }

//       console.log("delete");
//         // delete him
//       location.remove(function(err) {
//       if (err) {
//            throw err;
//       }
//       console.log('Location successfully deleted!');
 
//       });
// });



router.post('/api/account', function (req, res, next) {

	User.findOne({user_id: req.body.user_id}, function (err, userObj) {
	    if (err) {
	      console.log(err);
	      res.sendStatus(500);
	    } else if (userObj) {
	      console.log('Found:', userObj);
	      res.sendStatus(500);
	    } else {
	      console.log('User not found!');


      	  // making sure that each url_username is unique
      	  User.find({nickname: req.body.nickname}, function (err, result) {
      		if (result.length == 0) {
      			var newUser = new User({
				    user_id: req.body.user_id,
				    nickname: req.body.nickname,
				    picture: req.body.picture,
				    email: req.body.email,
				    url_username: req.body.url_username
			    });

      			newUser.save(function(err) {
		           if (err) {
		           	 throw err;
		           } else {
	                 console.log('User created!');
	                 res.sendStatus(200);
		           }
		         });

      		} else {
      			// username already exists so add +1 to end
      			var newUser = new User({
				    user_id: req.body.user_id,
				    nickname: req.body.nickname,
				    picture: req.body.picture,
				    email: req.body.email,
				    url_username: req.body.url_username + (result.length + 1).toString()
			    });

      			newUser.save(function(err) {
		           if (err) {
		           	 throw err;
		           } else {
	                 console.log('User created!');
	                 res.sendStatus(200);

		           }
		        });
      		}
      	  });     		
	    }
	 });
});


// get the whole entire accounts
// mainly used for main feed
router.get('/api/account/' , function (req, res, next) {

	User.find({}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(userObj) {

					
	  	// update the timer in here after expiration
	  	// if expired, make that entry null in the db
	  	var today = new Date();

	  	// unix time 
	  	var todayTime = today.getTime()/1000;

	  	for (var i = 0; i < userObj.length; i++) {
	  		if(userObj[i].today_song.length > 0) {

	
		  		// a diff of 600 is about 10 min
		  		//86400 is one day
		  		if (todayTime - userObj[i].today_song[0].unix_time >= 32140800) {		  		
		  			userObj[i].today_song.shift();
		  			userObj[i].save(function(err) {
		           		if (err) {
		             		throw err;
		           		} else {
		                 	console.log('song got updated');
		           		}
		         	});
		  		}
	  		}
	  	} // end of for loop

	  	res.send(userObj);
	  } 
	})

});

//Get all accounts that match a specific string
router.get('/api/account/id/search' , function (req, res, next) {
	//This is the search string req.query["searchString"]
	//req.query["currentUser"]

	//Find current user
	User.findOne({user_id: req.query["currentUser"]}, function(err, currUser) {

		//Pull user ids from the suggested friends
		var ids = req.query["suggestedFriends"];

		if (ids != null) {
			var ids = Object.keys(ids).map(function(key){
				return ids[key];
			});
		}

		User.find({"user_id": { $in: ids}}, function(err, suggestedFriends) {
			if ((typeof req.query["searchString"]) != "string"){
				req.query["searchString"] = "";
			}
			User.find({"nickname" : { "$regex": req.query["searchString"], "$options": "i" }}, function(err, userObj) {
				  if (err) {
					console.log(err);
					res.sendStatus(500);
				  } else if(userObj) {
					console.log(req.query["searchString"]);
					var alreadyFriendsUSER = [];
					var alreadyFriendsSUGG = [];
					
					for (var i = 0; i < userObj.length; i++) {
						//Information for checkboxes/pluses
						if (currUser["following"].indexOf(userObj[i]["user_id"]) > -1){
							//userObj[i] is already friends with the current user
							alreadyFriendsUSER.push(true);
						}
						else{
							alreadyFriendsUSER.push(false);
						}
					}
					
					console.log("Legend");
					console.log(currUser["following"]);
					for (var i = 0; i < suggestedFriends.length; i++) {
						//Information for checkboxes/pluses
						if (currUser["following"].indexOf(suggestedFriends[i]["user_id"]) > -1){
							//userObj[i] is already friends with the current user
							alreadyFriendsSUGG.push(true);
						}
						else{
							alreadyFriendsSUGG.push(false);
						}
					}
					
					var return_obj = [userObj,suggestedFriends,alreadyFriendsUSER,alreadyFriendsSUGG];
					res.send(return_obj); 
				};

			});

	});
	
	}); 
	

});



router.post('/api/account/id/song' , function (req, res, next) {
	User.findOne({user_id: req.body.user_id}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(userObj) {
	  	var song = new Song({
		   	song_title: req.body.song_title,
			song_album_pic: req.body.song_artwork,
			song_url: req.body.song_url,
			unix_time: req.body.unix_time,
			track_id: req.body.track_id,
			song_duration: req.body.song_duration,
			likes: 0,
			who_posted: userObj.id,
			echoStats: req.body.echoStats,
			echoGenre: req.body.echoGenre
	    });
	  	// Save it to Song Table
	    song.save(function(err) {
           if (err) {
           	 throw err;
           } 
        });

	  	userObj.song_history.unshift(song.id);

	  	if (userObj.today_song.length == 0) {
	  		userObj.today_song.push(song.id);
	  	} else {
	  		userObj.today_song.shift();
	  		userObj.today_song.push(song.id);
	  	}
	  

	    userObj.save(function(err, obj) {
	    	if (err) {
	    		throw err;
	    	}


	    	if (req.body.locationFlag == true) {
	    		var locObj = new location({
			    	state: req.body.state,
			    	city: req.body.city,
			    	song_id: obj["song_history"][0],
			    	user_id: userObj.id
		    	});
		    	locObj.save(function(err) {
			    	if (err) {
			    		//throw err;
			    	}	
		  		});	
	    	}
	    	res.sendStatus(200);
	    
  		});	
	  } 
	});
});	




// retrieving all the locations
router.get('/api/location/' , function (req, res, next) {
	location.find({}, function(err, locationObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(locationObj) {
	  	res.send(locationObj);
	  } 
	});
});


//getting a specific user
// need to return something if user does not exist
router.get('/api/account/id/' , function (req, res, next) {
	console.log(req.query["user_id"]);
	User.findOne({user_id:req.query["user_id"]}, function(err, userObj) {

		if (userObj == null) {
			res.send(205);
		}
	  	if (err) {
	    	res.sendStatus(500);
	    	res.send(500);
	  	} else if(userObj) {
	  		console.log("retrieved");
	  		res.send(userObj);
	  	}
	}); 
});



//getting a specific user (USING URL_USERNAME)
// need to return something if user does not exist
router.get('/api/account/url_username/' , function (req, res, next) {
	console.log(req.query["url_username"]);
	User.findOne({url_username:req.query["url_username"]}, function(err, userObj) {

		if (userObj == null) {
			res.send(205);
		}
	  	if (err) {
	    	res.sendStatus(500);
	    	res.send(500);
	  	} else if(userObj) {
	  		console.log("retrieved");
	  		res.send(userObj);
	  	}
	}); 
});


//Pull follow users directly from USER's follow list
router.get('/api/account/loadFollowUsers' , function (req, res, next) {
	console.log(req.query["user_id"]);
	User.findOne({user_id:req.query["user_id"]}, function(err, userObj) {

		if (userObj == null) {
			res.send(205);
		}
	  	if (err) {
	    	res.sendStatus(500);
	    	res.send(500);
	  	} else if(userObj) {
			
			User.find({"user_id": { $in: userObj["following"]}}, function(err, userFollowObj) {
		
				if (userFollowObj == null) {
					res.send(205);
				}
				if (err) {
					res.sendStatus(500);
					res.send(500);
				} else if(userFollowObj) {
					console.log("retrieved");
					res.send([userObj].concat(userFollowObj));
				}
			}); 
	  	}
	}); 
});

//getting a list of specific users 
// need to return something if user does not exist
router.get('/api/account/idBatch' , function (req, res, next) {
	//Pull user ids from the suggested friends
	var ids = req.query["users"];
	 
	var ids = Object.keys(ids).map(function(key){
		return ids[key];
	});
	
	
	console.log("my ids");
	console.log(ids);
	User.find({"user_id": { $in: ids}}, function(err, userObj) {
		
		if (userObj == null) {
			res.send(205);
		}
	  	if (err) {
	    	res.sendStatus(500);
	    	res.send(500);
	  	} else if(userObj) {
	  		console.log("retrieved");
	  		res.send(userObj);
	  	}
	}); 
});


// getting a specific song
router.get('/api/song/id/' , function (req, res, next) {
	Song.findOne({_id:ObjectId(req.query["song_id"])}, function(err, songObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(songObj) {
	  	res.send(songObj);
	  } 
	});
});

// getting a multiple songs
router.get('/api/song/id_multiple/' , function (req, res, next) {
	Song.find({_id: { $in: req.query["song_ids"]}}, function(err, songObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if(songObj) {
	  	res.send(songObj);
	  } 
	});
});



// deleting a specific song 
router.delete('/api/account/id/song/id' , function (req, res, next) {

	User.findOne({user_id: req.query["user_id"]}, function(err, userObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } else if (userObj) {
	 
	  	console.log(req.query["song_id"]);
	  	for (var i = 0; i < userObj["song_history"].length; i++) {
	  		if (userObj["song_history"][i] == req.query["song_id"]) {
	  			userObj["song_history"].splice(i, 1);

	  		}
	  	}
	  	if (userObj["today_song"].length == 1) {
	  		if (userObj["today_song"][0] == req.query["song_id"]) {
	  			userObj["today_song"].shift();
	  			if (userObj["song_history"].length > 0) {
		  			if (userObj["song_history"][0].id != ObjectId(req.query["song_id"])) {
		  				userObj["today_song"][0] = userObj["song_history"][0];
		  			}	
		  		}
	  		}	
	  	}
	  	 	
	  	userObj.save(function(err) {
	    	if (err) {
	    		throw err;
	    	}	
		});	
	  } // end of else if
	  
	});


	Song.findOne({_id:ObjectId(req.query["song_id"]) }, function(err, songObj) {
	  if (err) {
	    console.log(err);
	    res.sendStatus(500);
	  } 
	}).remove().exec();
	res.sendStatus(200);	
});


//Add follower to user's list
//  
router.post('/api/account/id/addfollower', function (req, res, next) {
	User.findOne({user_id: req.body.user_id}, function(err, myUserObj) {
		
		User.findOne({user_id: req.body.other_id}, function(err, otherUserObj) {
			//Check if the FRIEND is already inside the current user's friend list
			var found_in_current = false;
			for (var i = 0;i < myUserObj["following"].length;i++){
				if (myUserObj["following"][i] == otherUserObj["user_id"]){
					found_in_current = true;
				}
			}
			
			//User isn't already in list.. just add it!
			if (! found_in_current){
				myUserObj["following"].unshift(otherUserObj["user_id"]);
			}
			
			//Update the other person's "followers" list
			var found_in_other = false;
			for (var i = 0;i < otherUserObj["followers"].length;i++){
				if (otherUserObj["followers"][i] == req.body.user_id){
					found_in_other = true;
				}
			}
			
			if (! found_in_other){
				otherUserObj["followers"].unshift(req.body.user_id);
			}
			
			//Update the User
			myUserObj.save(function(err) {
				if (err) {
					throw err;
				}
			});	
			
			
			//Update the User
			otherUserObj.save(function(err) {
				if (err) {
					throw err;
				}
			});	
			
			//Send results
			res.send(200, {userAlreadyInList: found_in_current});
		});
		
	});
});


//Remove follower from list
router.post('/api/account/id/removefollower', function (req, res, next) {
	User.findOne({user_id: req.body.user_id}, function(err, myUserObj) {
		
		User.findOne({user_id: req.body.other_id}, function(err, otherUserObj) {
			//Remove other from your following list
			var found_in_current = false;
			for (var i = 0;i < myUserObj["following"].length;i++){
				if (myUserObj["following"][i] == otherUserObj["user_id"]){
					found_in_current = true;
					myUserObj["following"].splice(i,1);
				}
			}
			
			//Update the other person's "followers" list
			var found_in_other = false;
			for (var i = 0;i < otherUserObj["followers"].length;i++){
				if (otherUserObj["followers"][i] == req.body.user_id){
					found_in_other = true;
					otherUserObj["followers"].splice(i,1);
				}
			}
			
			
			//Update the User
			myUserObj.save(function(err) {
				if (err) {
					throw err;
				}
			});	
			
			
			//Update the User
			otherUserObj.save(function(err) {
				if (err) {
					throw err;
				}
			});	
			
			//Send results
			res.send(200, {userAlreadyInList: found_in_current});
		});
		
	});
});

// Like a song
router.post('/api/account/id/likes/song/id', function (req, res, next) {
	var userID = req.body.posted_user_id;
	User.findOne({user_id: userID}, function(err, myUserObj) {
		Song.findOne({_id: ObjectId(req.body.song_id)}, function (err, songObj) {
	    if (err) {
	      console.log(err);
		  res.sendStatus(500);
	    } else if (songObj) {

			var found = false;


			var status = "";

	     	for (var i = 0; i < songObj["who_liked"].length; i++) {
				//Our user has already liked this song
		  		if (songObj["who_liked"][i] == userID) {
					found = true;
					status = "Like";
					
					songObj["who_liked"].splice(i,1);
					songObj["likes"] -=1;
					
					var songIndex = myUserObj["liked_songs"].indexOf(songObj["_id"]);
					myUserObj["liked_songs"].splice(songIndex,1);
		  		}
		  	}
			
			//Couldn't find user in who_liked info of the song! Let him like for the first time.
			if (found == false){
				songObj["who_liked"].unshift(userID);
				songObj["likes"] +=1;
				myUserObj["liked_songs"].unshift(songObj["_id"]);
				status = "Unlike";
			}

		  	// this songObj represents the song information
			songObj.save(function(err) {
		    	if (err) {
		    		throw err;
		    	}	
			});	
			
			// this myUserObj represents the user
			myUserObj.save(function(err) {
		    	if (err) {
		    		throw err;
		    	}	
			});	
			res.send(200, {current_likes: songObj["likes"], response: status});
	    }

	 });
	});
	
});


//Favorite a song
router.post('/api/account/id/favorite/song/id', function (req, res, next) {
	var userID = req.body.posted_user_id; 
	User.findOne({user_id: userID}, function(err, myUserObj) {
		Song.findOne({_id: ObjectId(req.body.song_id)}, function (err, songObj) {
	    if (err) {
	      console.log(err);
		  res.sendStatus(500);
	    } else if (songObj) {

			var found = false;


			var status = "";

	     	for (var i = 0; i < songObj["who_favorited"].length; i++) {
				//Our user has already liked this song
		  		if (songObj["who_favorited"][i] == userID) {
					found = true;
					status = "Favorite";
					
					songObj["who_favorited"].splice(i,1);
					
					var songIndex = myUserObj["favorited_songs"].indexOf(songObj["_id"]);
					myUserObj["favorited_songs"].splice(i,1);
		  		}
		  	}
			
			//Couldn't find user in who_liked info of the song! Let him like for the first time.
			if (found == false){
				songObj["who_favorited"].unshift(userID);
				myUserObj["favorited_songs"].unshift(songObj["_id"]);
				status = "UnFavorite";
			}

		  	// this songObj represents the song information
			songObj.save(function(err) {
		    	if (err) {
		    		throw err;
		    	}	
			});	
			
			// this myUserObj represents the User information
			myUserObj.save(function(err) {
		    	if (err) {
		    		throw err;
		    	}	
			});	
			res.send(200, {current_likes: songObj["who_favorited"].length, response: status});
	    }

	 });
	
	
});
});











app.use(router);

//Create the server
var server = app.listen(app.get('port'), function () {
	console.log('Express server listening on port ' + server.address().port);
});

app.use(function (req, res) {
	var resp = {};
	resp.error = "Not Supported.";
	res.status(404).json(resp);
});