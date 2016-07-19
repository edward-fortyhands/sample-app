var express = require('express');
var router = express.Router();
var stormpath = require('express-stormpath');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');



/* GET home page. */
router.get('/', stormpath.loginRequired, function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/posts', stormpath.loginRequired, function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ return next(err); }

    res.json(posts);
  });
});

router.post('/posts', function(req, res, next) {
  var post = new Post(req.body);
  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.post.comment = comment;
    return next();
  });
});

router.get('/posts/:post', stormpath.loginRequired, function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

router.put('/posts/:post/upvote', stormpath.loginRequired, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.put('/posts/:post/downvote', stormpath.loginRequired, function(req, res, next) {
  req.post.downvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.post('/posts/:post/comments', stormpath.loginRequired, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = req.user.givenName;
  comment.save(function(err, comment){
    if(err){ 
    	return next(err); 
    }
     req.post.save(function(err, comment) {
      if(err){ return next(err); }

      res.json(comment);
    });
    req.post.comments.push(comment);
  });
});

router.put('/posts/:post/comments/:comment/upvote', stormpath.loginRequired, function(req, res, next) {
  req.post.comment.upvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});

router.put('/posts/:post/comments/:comment/downvote', stormpath.loginRequired, function(req, res, next) {
  req.post.comment.downvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});


module.exports = router;
