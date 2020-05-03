var express = require('express');
var router = express.Router();
var db = require('../db');
var authentication = require('../middleware/authentication');

router.use(function timeLog(req, res, next) {
    //console.log('Inventory API called at : ', Date.now());
    next(); 
});

const getCollection = function() {
    return db.getCollection('groceries'); 
}

const getStoresCollection = function () {
    return db.getCollection('stores');
}

router.get('/', authentication.authenticateToken, function(req, res){
    var collection = getCollection();

    collection.find().toArray(function(err, docs) {
        res.json(docs);
    });
});

router.post('/', authentication.authenticateToken, function(req, res){
    var collection = getCollection();

    collection.insertOne(req.body, function(err, result){
        res.send('OK');
    });
});

router.get('/reload', authentication.authenticateToken, function(req, res){
    var collection = getCollection();
    var storesCollection = getStoresCollection();

    collection.deleteMany({}, function(err) {
        storesCollection.find().toArray(function(err, stores) {
            let groceries = [];

            stores.forEach(s => {
                s.categories.forEach(c => {
                    c.groceries.forEach(g => {
                        groceries.push({ name: g.groceryName });
                    });
                });
            });

            collection.insertMany(groceries);

            res.json(groceries);
        });
    });
});


module.exports = router;