angular.module( 'inTunity.addSong', [
  'auth0'
])
.controller( 'AddSongCtrl', function AddSongController( $scope, auth, $location, store, $http, $compile, musicStatus, $cookieStore) {
  $scope.auth = auth;
  $scope.tgState = false;
  $scope.search = "";

  var prof = (store.get('profile'));
  $scope.owner;
  if (prof["given_name"] != null) {
    $scope.owner = prof["given_name"];
  } else {
    $scope.owner = prof["nickname"];
  }

  SC.initialize({
    client_id: 'a17d2904e0284ac32f1b5f9957fd7c3f'
  });

  $scope.position;

  var id = auth.profile["identities"][0]["user_id"];

  var globalPlayer;
  var trackarray;
  var song_count; 
  var prevTime;

  var progressBall = document.getElementById('playHead');
  var time = document.getElementById('time');

  // var paused = true;

  // $scope.pause = function() {

  //     var pauseButton = document.getElementById('pauseButton');
  //     if (paused == false) {
  //       globalPlayer.pause();
  //       paused = true;
  //       pauseButton.innerHTML = "<h4>Play</h4>";
  //     } else {
  //       globalPlayer.play();
  //       paused = false;
  //       pauseButton.innerHTML = "<h4>Pause</h4>";
  //     }
  // }


  $scope.startStreamingAddSong = function(songUrl, artworkUrl,myTitle, trackid, duration) {
	  
	   
    var prevButton = document.getElementById("prevButton");
    prevButton.style.visibility = "hidden";


    var nextButton = document.getElementById("nextButton");
    nextButton.style.visibility = "hidden";

    var poster = document.getElementById("currentuser");
    poster.style.visibility = "hidden";

    var selectedBy = document.getElementById("selectedBy");
    selectedBy.style.visibility = "hidden";

    songDuration = duration;
    
	
    SC.stream("/tracks/" + trackid).then(function (player) {
    		globalPlayer = player;
    		globalPlayer.play();
        globalPlayer.on('play-start', function () {
		
    		  var endTime = document.getElementById("endTime");
    		  endTime.innerHTML = millisToMinutesAndSeconds(songDuration);
    		  
    		  var album = document.getElementById("artwork");
    		  album.src = artworkUrl;

    		  var title = document.getElementById("songtitle");
    		  title.innerHTML = myTitle;
        }); 



        globalPlayer.on('time', function() {
    		  //Updates information about our currently playing song (shared cross page)
    		  if (globalPlayer.currentTime() < songDuration){
    			;//musicStatus.setStatus(song_count % trackarray.length,globalPlayer.currentTime());
    		  }

          var percent = ((globalPlayer.currentTime() / songDuration)) * time.offsetWidth;
          progressBall.style.width = percent + "px";

          var currentTime = document.getElementById("currentTime");
          currentTime.innerHTML = millisToMinutesAndSeconds(globalPlayer.currentTime());
		

          if (globalPlayer.currentTime() <= (songDuration  * 0.02)) {
            globalPlayer.setVolume(0.8);
          }

          if ((globalPlayer.currentTime() > (songDuration  * 0.02)) && (globalPlayer.currentTime() < (songDuration  * 0.98)) ) {
             globalPlayer.setVolume(1);
          }

          if (globalPlayer.currentTime() >= (songDuration  * 0.98)) {
            globalPlayer.setVolume(0.8);
          }

        });

       

        globalPlayer.on('finish', function () {

			     globalPlayer.seek(0);
        }); // end of finish

      });
    }














  $scope.logout = function() {
	auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
	
	//STOP SOUND PLAYER
	//globalPlayer.pause();
  }
	
  $scope.home = function() {
    $location.path('/');
  }

  $scope.profile = function() {
    var ppl = store.get('profile');
    var ppl_id = ppl["identities"][0]["user_id"];


    $http({
      url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/specificUser' ,
      method: 'GET',
      params: {id: ppl_id}
    }).then(function(response) {  
      console.log(response["data"]["user"]);

      username_url = response["data"]["user"]["url_username"];
      // console.log(username_url);
      $location.path('/profile/' + username_url);
    

    }); // end of http get



  }

  $scope.about = function() {
    $location.path('/about');
  }

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }


  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position){
      console.log(position.coords.latitude);
      console.log(position.coords.longitude);
      localStorage.setItem("latitude", position.coords.latitude);
      localStorage.setItem("longitude", position.coords.longitude);

    });
  } else {
      console.log("Geolocation is not supported by this browser.");
  }

 

  $scope.findSong = function() {
 
     var name = $scope.search;

      var container = document.getElementById("searchResults");
      container.innerHTML = "";

      if (name == "") {
        container.innerHTML = "<h3>Please Enter a Search Query</h3>";
      } else {

        //searching for specific genres / artists
        var page_size = 100;
        SC.get('/tracks', {
          q: name,
          limit: page_size 
        }).then(function(tracks) {
     
          var streamableSongs = [];
          for (var i = 0; i < tracks.length; i++) {
            if (tracks[i]["streamable"] == true) {
              streamableSongs.push(tracks[i]);
            }
          }

          var obj = streamableSongs;


          
          for (var i = 0; i < obj.length; i++) {

            var albumArtwork;
            if(obj[i]['artwork_url'] != null) {
                var album = obj[i]['artwork_url'];
                var index = album.indexOf("large");
                albumArtwork = album.substring(0,index) + "t500x500.jpg";
            } else {
               albumArtwork = "/images/no-art.png";
            }


            var songContainer = document.createElement('div');
            songContainer.className = "col-md-6 search-result";

              var col1 = document.createElement('div');
              col1.className = "col-md-6";


                var img = document.createElement('img');
                img.className = "album-artwork";
                img.src = albumArtwork;

              col1.appendChild(img);

              var col2 = document.createElement('div');
              col2.className = "col-md-6 search-info";


                var songTitle = document.createElement('h4');
                songTitle.innerHTML = obj[i]["title"];

                var likes = document.createElement('h5');
                likes.innerHTML = "Soundcloud likes: " + obj[i]["likes_count"];

                var duration = document.createElement("h5");
                duration.innerHTML = "Time: " + millisToMinutesAndSeconds(obj[i]["duration"]);

        				var playbutton = document.createElement("a");
        				playbutton.href = "";
        				playbutton.innerHTML = "<div class='intunity-button play-button'><h4>" + "Sample Song" + "</h4></div>"
        				playbutton.onclick = function(){
                  var selectedSong = obj[this.id];
                  var id = (selectedSong["id"]);
                  $scope.startStreamingAddSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);
        				}
				
                var confirmSong = document.createElement("div");
                confirmSong.innerHTML = "<h4>Confirm</h4>";

                confirmSong.onclick = function() {
                  console.log("hi");
                  console.log(this.id);
                  console.log(obj[this.id]);
                  var selectedSong = obj[this.id];
                  var id = (selectedSong["id"]);
				  
                  $scope.selectSong(selectedSong["permalink_url"], selectedSong["artwork_url"], selectedSong["title"], id, selectedSong["duration"]);

                }
                confirmSong.className = 'intunity-button play-button confirmSong';
                playbutton.id = i;
                confirmSong.id = i;
                
                var playElement = $compile(playbutton)($scope)[0];
      
              col2.appendChild(songTitle);
              col2.appendChild(likes); 
              col2.appendChild(duration); 
              col2.appendChild(playElement);
              col2.appendChild(confirmSong);

              songContainer.appendChild(col1);
              songContainer.appendChild(col2);

              container.appendChild(songContainer);
          }
        });
      }

    
  } // end of findSong




  $scope.selectSong = function(url, artwork, title, trackid, duration) {
   
    if (artwork != null) {
      var index = artwork.indexOf("large");
      updatedSongPic = artwork.substring(0,index) + "t500x500.jpg";
    } else {
      updatedSongPic = "/images/no-art.png";
    } 

  
    var today = new Date();


    var latitude;
    var longitude;


    latitude = parseFloat(localStorage.getItem("latitude"));
    longitude = parseFloat(localStorage.getItem("longitude"));

    var geocoder = new google.maps.Geocoder;
    var latlng = {lat: parseFloat(latitude), lng: parseFloat(longitude)};
    geocoder.geocode({'location': latlng}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {

        if (results[1]) {
          console.log("result found");
          console.log(results);

          var state = results[2]["address_components"][1]["short_name"];


          var city = results[1]["address_components"][1]["short_name"];


          var song = JSON.stringify({
            user_id: id,
            song_url:url, 
            song_artwork: updatedSongPic, 
            song_title: title,
            unix_time: today.getTime()/1000,
            track_id: trackid,
            song_duration: duration,
            state: state,
            city: city
          });

          console.log(song);

          console.log("adding a song...");
          $http.post('http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/songs', {data: song}, { 
            headers: {
            'Accept' : '*/*',
            'Content-Type': 'application/json'
           }
          }).success(function(data, status, headers, config) {
<<<<<<< HEAD
              console.log(status);
			  musicStatus.confirmSong();
			  curStats = musicStatus.getStatus();
              $cookieStore.put('songNum',curStats[0]);
              $cookieStore.put('songPos',curStats[1]);
=======

             
>>>>>>> a74acf8ffc1b3d03384bebd7d93c63154f7e0fae
              $location.path('/');


          }).error(function(data, status, headers, config) {
              console.log(status);
          });


        
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }
    });
  

  } // end of selectSong()

  $scope.boss = function(url){

    SC.oEmbed(url, {
      auto_play: true,
      buying: false,
      sharing: false,
      download: false,
      show_comments: false,
      show_user: false,
      enable_api: true,
      single_active: false,
      liking:false,
      element: document.getElementById('putTheWidgetHere')
    }).then(function(embed){

  

        iframe = document.getElementsByTagName("iframe")[0];
        widget = SC.Widget(iframe); 
        widget.bind(SC.Widget.Events.FINISH, endSC);
        widget.bind(SC.Widget.Events.PLAY, playSC);
        iframe.height = 125;

    });

    function playSC(){
        var container = document.getElementById("widgetContainer");
        container.style.height = "125px";

        iframe = document.getElementsByTagName("iframe")[0];
        iframe.height = 125;
        widget = SC.Widget(iframe); 
    }

    function endSC(){
        iframe = document.getElementsByTagName("iframe")[0];
        iframe.height = 0;

        var container = document.getElementById("widgetContainer");
        container.style.height = "0px";


    }

  } // end of boss function
  


});






