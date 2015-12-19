angular.module( 'inTunity.home', [
'auth0'
])


.controller( 'HomeCtrl',  function HomeController( $scope, auth, $http, $location, store, $compile) {

  $scope.auth = auth;
  $scope.tgState = false;
  var prof = (store.get('profile'));
  $scope.owner;
  
  //Global Variables for the iframe and widget
  // var iframe = document.getElementById("sc-widget");
  //var widget = SC.Widget(iframe);
  var globalPlayer;
  /*global SC*/
  



  if (prof["given_name"] != null) {
    $scope.owner = prof["given_name"];
  } else {
    $scope.owner = prof["nickname"];
  }
  var id = prof["identities"][0]["user_id"];

  $scope.logout = function() {
    globalPlayer.pause();
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');

  }

  $scope.home = function() {
    $location.path('/');
  }

  $scope.addSong = function() {
    globalPlayer.pause();
    $location.path('/add-song');
  }

  $scope.about = function() {
    $location.path('/about');
  }



  var username;
  var profilepic;
  var songPic;
  var songtitle;
  var songUrl;

  var timeStamp;
  var dayStamp;

  $scope.users;

  $http({
    url: 'http://localhost:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    songdata = (response["data"]["songs"]);



    var song_array = [];

    var users = response["data"]["songs"];

    // this array has users who only have songs with it
    var correctUsers= [];
  
    // makes sure we only show users who have songs
    for (var i = 0; i < users.length; i++) {
      if (users[i]["today_song"]["song_url"] != "") {

        var date = new Date(users[i]["today_song"]["unix_time"] * 1000);

        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var monthNames = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

        var formmatedDay = monthNames[month] + " " + day + ", " + year;

        var hours = date.getHours();

        var minutes = "0" + date.getMinutes();
        var am_pm = "AM";

        if (hours > 12) {
          hours = hours - 12;
          am_pm = "PM";
        }
        if (hours == 0) {
          hours = 12;
        }


        var formattedTime = hours + ':' + minutes.substr(-2) +  " " + am_pm;
        correctUsers.push(new Array(users[i], formattedTime, formmatedDay));
      } else {
        console.log("user does not have a song for today");
      }
    }

    $scope.users = correctUsers;

  
    // adding all the songs to arr
    for (var i = 0; i < correctUsers.length; i++) {
      songUrl = correctUsers[i][0]["today_song"]["song_url"];
      var entry = {
        url: songUrl
      }
      song_array.push(entry);
    }


    var trackarray = [];
    for (var i = 0; i < correctUsers.length; i++) {
      trackarray.push(new Array(correctUsers[i][0]["today_song"]["track_id"], correctUsers[i][0]["today_song"]["song_album_pic"], correctUsers[i][0]["today_song"]["song_title"], correctUsers[i][0]["today_song"]["song_duration"]));
    }

    console.log("track array:");
    console.log(trackarray);




    SC.initialize({
        client_id: '87be5093d25e70cbe11e0e4e6ae82ce7'
    });

    var paused = false;
    var song_count = 0;
    var song_index = 0;
        

    var trackid = (trackarray[0][0]);
    var url = '/tracks/' + trackid;
    startStream(url);


   

    // when you press on album pic, it will play that song
    $scope.playSpecificSong = function(index) {
      song_index = index;
      song_count = song_index;
      new_song = trackarray[song_count % trackarray.length][0];
      var new_url = '/tracks/' + new_song;
      startStream(new_url);
    }

    // this is for skipping to the previous song
    $scope.prevPlayer = function() {
      song_count--;
      if (song_count < 0) {
        song_count = 0;
      }
      new_song = trackarray[song_count % trackarray.length][0];
      song_index = song_count % trackarray.length;
      console.log("Starting New " + new_song);
      new_url = '/tracks/' + new_song;
      startStream(new_url);
    }

    // this is for skipping to the next song
    $scope.nextPlayer = function() {

      song_count++;
      if (song_count == trackarray.length) {
        song_count = 0;
      }
      song_index = song_count % trackarray.length;
      new_song = trackarray[song_count % trackarray.length][0];
      console.log("Starting New " + new_song);
      new_url = '/tracks/24732726';
      startStream(new_url);
    }


    $scope.pause = function() {
      var pauseButton = document.getElementById('pauseButton');
      if (paused == false) {
        globalPlayer.pause();
        paused = true;
        pauseButton.innerHTML = "Play";
      } else {
        globalPlayer.play();
        paused = false;
        pauseButton.innerHTML = "Pause";
      }
    }

    // goes to the correct position in the screen when songs changes
    function findPos(obj) {
      var curtop = 0;
      if (obj.offsetParent) {
          do {
             curtop += obj.offsetTop - 50;
          } while (obj = obj.offsetParent);
          return [curtop];
      }
    }







    var progressBall = document.getElementById('playHead');
    var time = document.getElementById('time');
    
    var songDuration = 0;
    
    function startStream(newSoundUrl) {


      songDuration = parseInt(trackarray[song_count % trackarray.length][3]);



      SC.stream(newSoundUrl).then(function (player) {
        console.log("Starting New " + newSoundUrl);
        globalPlayer = player;

  

        globalPlayer.play();


        globalPlayer.on('play-start', function () {
          globalPlayer.seek(0);
   

    
          //this is for resetting all the background color to its natural settings
          for (var i = 0; i < trackarray.length; i ++) {
             var row = document.getElementById("song" + i);
             row.style.backgroundColor = "#f5f5f5";
          }

          // this targets which row to highlight
          var rowCurrent = document.getElementById("song"+song_index);
          rowCurrent.style.backgroundColor = "#ffe4c4";
          window.scroll(0,findPos(rowCurrent));

          var album = document.getElementById("artwork");
          album.src = trackarray[song_count % trackarray.length][1];

          var title = document.getElementById("songtitle");
          title.innerHTML = trackarray[song_count % trackarray.length][2];
        }); 

      

        
        

        globalPlayer.on('time', function() {
          songDuration = parseInt(trackarray[song_count % trackarray.length][3]);
          var percent = Math.floor((100 / songDuration) * globalPlayer.currentTime());
          progressBall.style.marginLeft = percent + "%";
        });


        globalPlayer.on('finish', function () {
          globalPlayer.pause();
         
          song_count++;
          new_song = trackarray[song_count % trackarray.length][0];
          song_index = song_count % trackarray.length;
          new_url = '/tracks/' + new_song;
          startStream(newSoundUrl);
        }); // end of finish







      });
    }







     //Handles the progress bar.
    var time = document.getElementById("time");
    var playHead = document.getElementById('playHead');
    var timelineWidth = time.offsetWidth - playHead.offsetWidth;
    
    function clickPercentage(click) {
      var perct = (click.pageX - time.offsetLeft) / timelineWidth;
      return (click.pageX - time.offsetLeft) / timelineWidth;
    }
    
    time.addEventListener('click', function (event) {
      changePosition(event);
    }, false);
    
    playHead.addEventListener('mouseup', mouseUp, false);
    playHead.addEventListener('mousedown', mouseDown, false);
    var beingclicked = false;
    
    function mouseDown() {
        beingclicked = true;
        window.addEventListener('mousemove', changePosition, true);
    }
    
   function mouseUp(click) {
      if (beingclicked == true) {
        changePosition(click);
        window.removeEventListener('mousemove', changePosition, true);
      }
      beingclicked = false;
    }
    
    function changePosition(click) {
      var marginLeft = click.pageX - time.offsetLeft;
      if (marginLeft >= 0 && marginLeft <= timelineWidth) {
          playHead.style.marginLeft = marginLeft + "px";
      }
      if (marginLeft < 0) {
          playHead.style.marginLeft = "0px";
      }
      if (marginLeft > timelineWidth) {
          playHead.style.marginLeft = timelineWidth + "px";
      }
    }

  }); // end of http get



});

