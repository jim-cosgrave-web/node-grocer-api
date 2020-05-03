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

//
// GET - Distinct recipe categories by user
//
router.get('/:userId/categories', function (req, res) {
    const collection = getCollection();

    const user_id = new ObjectId(req.params.userId);
    let filter = { user_id: user_id };

    collection.find(req.params.userId).toArray(function (err, docs) {
        let result = docs.map(item => item.categories)

        // flatten to [ "1", "2", "1", "3" ]
        .reduce((prev, curr) => prev.concat(curr), [])
        
        // filter unique [ "1", "2", "3" ]
        .filter((item, i, arr) => arr.indexOf(item) === i)
        .sort();

        const r = ['Vegetarian', 'Fast', 'Meat', 'Lunch', 'Things to make while quarantined', 'Other', 'Favorites', 'Kid Friendly']

        res.send(r.sort());
    });
});


module.exports = router;