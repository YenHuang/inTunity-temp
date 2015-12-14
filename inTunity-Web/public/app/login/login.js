angular.module( 'inTunity.login', [
  'auth0'
])
.controller( 'LoginCtrl', function LoginController( $scope, auth, $location, store, $http ) {

  $scope.about = function() {
    console.log("about");
    $location.path('/about');
  }

  $scope.login = function() {

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

      var user_account = JSON.stringify({
        user_id:id, 
        email: email, 
        nickname: nickname, 
        picture: picture}); // Indented with tab


      console.log(picture);
      console.log(user_account);

           $location.path("/");

    console.log("posting..");
    $http.post('http://localhost:3001/secured/account', {data: user_account}, { 
        headers: {
        'Accept' : '*/*',
        'Content-Type': 'application/json'
       }
    }).success(function(data, status, headers, config) {
          // this callback will be called asynchronously
          // when the response is available
          console.log("come onnn");
          console.log(status);
          console.log("success");
     
      }).error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
           console.log("failed");
          console.log(status);
	 
      });




    }, function(error) {
      console.log("There was an error logging in", error);
    });


  } // end of login function

});
