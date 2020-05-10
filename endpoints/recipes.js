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

const getCategoryCollection = function () {
    return db.getCollection('recipeCategories');
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

router.get('/categories', function(req, res) {
    const collection = getCategoryCollection();

    collection.find().toArray(function (err, docs) {
        res.json(docs);
    });
});

//
// GET - Recipes
//
router.get('/:userId', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();
    const filter = { user_id: req.user.userId };

    collection.find().toArray(function (err, docs) {
        res.json(docs);
    });
});

//
// GET - Inidividual recipe
//
router.get('/:userId/:recipeId', authentication.authenticateToken, function (req, res) {
    const user_id = req.params.userId;
    const recipe_id = new ObjectId(req.params.recipeId);

    var collection = getCollection();
    const filter = { _id: recipe_id, user_id: req.user.userId }

    collection.findOne(filter, function (err, recipe) {
        res.json(recipe);
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
// PUT - New Recipe
//
router.put('/', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();
    const recipe_id = new ObjectId(req.body._id);
    const filter = { _id: recipe_id, user_id: req.user.userId };

    delete req.body._id;

    collection.update(filter, req.body);
    res.send('OK');
});

//
// POST - New Category
//
router.post('/category', authentication.authenticateToken, function (req, res) {
    const collection = getCategoryCollection();

    const filter = { name: req.body.name }

    collection.findOne(filter, function (err, category) {
        if(!category) {
            collection.insertOne(filter, function(err, result) {
                res.send({added: true});
            });
        } else {
            res.json({exists: true});
        }
    });

    // collection.insertOne(req.body, function (err, result) {
    //     res.send('OK');
    // });
});

//
// GET - Distinct recipe categories by user
//
router.get('/:userId/categories', function (req, res) {
    const collection = getCollection();

    const user_id = new ObjectId(req.user.userId);
    let filter = { user_id: user_id };

    collection.find(req.params.userId).toArray(function (err, docs) {
        let result = docs.map(item => item.categories)
                         .reduce((prev, curr) => prev.concat(curr), [])
                         .filter((item, i, arr) => arr.indexOf(item) === i)
                         .sort();

        res.send(result);
    });
});



module.exports = router;