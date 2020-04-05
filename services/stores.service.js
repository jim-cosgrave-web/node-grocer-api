var db = require('../db');

const getCollection = function() {
    return db.getCollection('stores'); 
}

exports.getStores = function(storeId) {
    var collection = getCollection();

    collection.find().toArray(function(err, docs) {
        res.json(docs);
    });
}

exports.insertStore = function(store) {
    var collection = getCollection();

    collection.insertOne(store, function(err, result){
        res.send('OK');
    });
}

