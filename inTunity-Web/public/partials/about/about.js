angular.module( 'inTunity.about', [
  'auth0'
])


.controller( 'AboutCtrl',  function AboutController( $scope, auth, $http, $location, store ) {

  $scope.about = function() {
    $location.path('/about');
  }

  $scope.splashScreen = function() {
    $location.path('/login');
  }

  $scope.signIn = function() {
     auth.signin({
      gravatar:true, 
      loginAfterSignup: true, 
      callbackOnLocationHash: false, 
      connections:['facebook', 'Username-Password-Authentication'],
    }, function(profile, token) {


      store.set('profile', profile);
      store.set('token', token);  

      var id = auth.profile["identities"][0]["user_id"];
      var connection = auth.profile["identities"][0]["connection"];
      var email = auth.profile["email"];
      var provider = auth.profile["identities"][0]["provider"];
      var nickname = auth.profile["name"];
      var picture;

      if(auth.profile["identities"][0]["connection"] == "facebook") {
        picture = "https://graph.facebook.com/" + id  + "/picture?height=9999";
      } else {
        picture = auth.profile["picture"];
      }

      var atSign = nickname.indexOf("@");
      var url_username = "";

      if (atSign != -1) {
        // is email
        url_username = nickname.substring(0,atSign);
      } else {
        // not email
        for (var i = 0; i < nickname.length; i++) {
          if (nickname.charAt(i) == " ") {
             url_username += ".";
          } else {
             url_username += (nickname.charAt(i));
          } 
        }
      }

      var user_account = JSON.stringify({
        user_id:id, 
        email: email, 
        nickname: nickname, 
        picture: picture,
        url_username: url_username
      });
      
      $location.path("/");

      $http.post('http://localhost:3001/secured/account', {data: user_account}, { 
          headers: {
          'Accept' : '*/*',
          'Content-Type': 'application/json'
         }
      }).success(function(data, status, headers, config) {
       
      }).error(function(data, status, headers, config) {

      });

    }, function(error) {
      
    });
  }


});





