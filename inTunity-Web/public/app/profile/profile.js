angular.module( 'inTunity.profile', [
  'auth0'
])


.controller( 'ProfileCtrl',  function ProfileController( $scope, auth, $http, $location, store, $routeParams ) {


  $scope.auth = auth;
  $scope.tgState = false;

  var prof = (store.get('profile'));

  $scope.owner;
  if (prof["given_name"] != null) {
    $scope.owner = prof["given_name"];
  } else {
    $scope.owner = prof["nickname"];
  }
  var id = prof["identities"][0]["user_id"];


  $scope.logout = function() {
    auth.signout();
    store.remove('profile');
    store.remove('token');
    $location.path('/login');
  }

  $scope.home = function() {
    $location.path('/');
  }

  $scope.addSong = function() {
    $location.path('/add-song');
  }

  $scope.about = function() {
    $location.path('/about');
  }



  $http({
    url: 'http://ec2-52-35-92-198.us-west-2.compute.amazonaws.com:3001/secured/accounts' ,
    method: 'GET'
  }).then(function(response) {  
    $scope.users = (response["data"]["songs"]);
    $scope.whichItem = $routeParams.itemId;

  }); // end of http get




});





