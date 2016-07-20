var app = angular.module('LikeReddit', ['ui.router']);


app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
		postPromise: ['posts', function(posts){
		  return posts.getAll();
    	}]
	  }
    })
	.state('posts', {
	  url: '/posts/{id}',
	  templateUrl: '/posts.html',
	  controller: 'PostsCtrl',
	  resolve: {
    	post: ['$stateParams', 'posts', function($stateParams, posts) {
      	  return posts.get($stateParams.id);
    	}]
  	  }
	})

  $urlRouterProvider.otherwise('home');
}]);


app.factory('posts', ['$http', function($http){
  var o = {
		posts: []
	};
o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    })
  };

o.create = function(post) {
	$http.post('https://2gebipjp57.execute-api.eu-central-1.amazonaws.com/prod', post).success(function(){
		console.log('Post stored in S3!');
	});
  	return $http.post('/posts', post).success(function(data){
    o.posts.push(data);
  });
};

o.upvote = function(post) {
	return $http.put ('/posts/' + post._id + '/upvote', null).success(function(data) {
	post.upvotes += 1;
   });
};

o.downvote = function(post) {
	return $http.put ('/posts/' + post._id + '/downvote', null).success(function(data) {
	post.upvotes -= 1;
   });
};
	
o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res){
      return res.data;
  });
};

o.addComment = function(id, comment) {
	$http.post('/posts/' + id + '/comments', comment);
	return $http.post('https://u0vn85pkmc.execute-api.eu-central-1.amazonaws.com/dev', comment).success(function(){
	});
};

o.upvoteComment = function(post, comment) {
	return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null).success(function(data) {
		comment.upvotes += 1;
	});
};

o.downvoteComment = function(post, comment) {
	return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', null)
		.success(function(data) {
			comment.upvotes -= 1;
	});
};

	return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.logOut = function () {
		$http.post('/logout');
		$window.location.href = '/login' 
	};

	return auth;
}]);

app.controller('MainCtrl', [
	'$scope', 'posts', 
	function($scope, posts) {
		$scope.posts = posts.posts;

		$scope.addPost = function(){
		  if(!$scope.title || $scope.title === '') { return; }
		  posts.create({
		    title: $scope.title,
		    link: $scope.link,
		  });
		  $scope.title = '';
		  $scope.link = '';
		};

		$scope.incrementUpvotes =function(post){
			posts.upvote(post);
		};

		$scope.decrementUpvotes =function(post){
			posts.downvote(post);
		};
	}]);

app.controller('PostsCtrl', [
	'$http',
	'$scope',
	'posts',
	'post',
	function($http, $scope, posts, post){
		$scope.post = post;
		$scope.addComment = function(){
  			if($scope.body === '') { return; }
  			var user;
  			$http.get('/getUser').success(function(data){
      			  user = data.user;
			  var comment = {body: $scope.body,
					 author: user,
					 upvotes: 0, 
					 post: post._id};
      			  posts.addComment(post._id, comment).success(function() {
				var index = post.comments.length-1;
				comment._id = post.comments[index]._id;
    				$scope.post.comments.push(comment);
  			});
  		$scope.body = '';
    			});
	};

	$scope.incrementUpvotes = function(comment){
		posts.upvoteComment(post, comment);
	};

	$scope.decrementUpvotes = function(comment){
		posts.downvoteComment(post, comment);
	};


}]);


app.controller('NavCtrl', [
'$scope',
'$http',
'auth',
function($scope, $http, auth){
  $scope.logOut = auth.logOut;

  $http.get('/getUser').success(function(data){
	  $scope.user = data.user;
  });

}]);
	