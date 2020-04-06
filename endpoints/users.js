var express = require('express');
var router = express.Router();
var db = require('../db');
var passwordHash = require('password-hash');

router.use(function timeLog(req, res, next) {
    console.log('User API called at : ', Date.now());
    next(); 
});

const getCollection = function() {
    return db.getCollection('users'); 
}

router.get('/:user?', function(req, res){
    var collection = getCollection();

    collection.find().toArray(function(err, docs) {
        res.json(docs);
    });
});

router.post('/', function(req, res){
    let response = {};
    const collection = getCollection();
    const filter = { username: req.body.username }

    collection.findOne(filter, function(err, user) {
        response['valid'] = passwordHash.verify(req.body.password, user.password);

        res.json(response);
    });
});

module.exports = router;