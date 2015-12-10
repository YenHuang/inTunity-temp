var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SongHistory = new Schema({
	song_title: String,
	song_album_pic: String,
	song_url: String,
	created_at_time: String,
	created_at_day: String
});

var User = new Schema({
	user_id: {type: String, unique: true },
	nickname: String,
	picture: String,
	email: String,
	today_song: {
		song_title: String,
		song_album_pic: String,
		song_url: String,
		created_at_time: String,
		created_at_day: String,
	},
	song_history: [SongHistory]

	
});

module.exports = mongoose.model('User', User);
