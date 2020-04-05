var express = require('express');
var router = express.Router();
var db = require('./db');

router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next(); 
});

const getCollection = function() {
    return db.getCollection('inventory'); 
}

router.get('/:item?', function(req, res){
    var collection = getCollection();

    collection.find().toArray(function(err, docs) {
        res.json(docs);
    });
});

router.post('/', function(req, res){
    var collection = getCollection();

    collection.insertOne(req.body, function(err, result){
        res.send('OK');
    });
});

module.exports = router;