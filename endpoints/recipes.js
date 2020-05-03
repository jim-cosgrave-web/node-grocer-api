var express = require('express');
var router = express.Router();
var db = require('../db');
var authentication = require('../middleware/authentication');
const { ObjectId } = require('mongodb').ObjectId;

router.use(function timeLog(req, res, next) {
    //console.log('Grocery List API called at : ', Date.now());
    next();
});

const getCollection = function () {
    return db.getCollection('recipes');
}

const compareNames = (a, b) => {
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    return 0;
}

router.get('/', authentication.authenticateToken, function (req, res) {
    var collection = getCollection();

    collection.find().toArray(function (err, docs) {
        res.json(docs);
    });
});


//
// POST - New Recipe
//
router.post('/', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();

    collection.insertOne(req.body, function (err, result) {
        res.send('OK');
    });
});


module.exports = router;