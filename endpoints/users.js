var express = require('express');
var router = express.Router();
var db = require('../db');
var passwordHash = require('password-hash');
var authentication = require('../middleware/authentication');
const { ObjectId } = require('mongodb').ObjectId;

router.use(function timeLog(req, res, next) {
    //console.log('User API called at : ', Date.now());
    next();
});

const getCollection = function () {
    return db.getCollection('users');
}

router.get('/:user?', function (req, res) {
    var collection = getCollection();

    collection.find().toArray(function (err, docs) {
        res.json(docs);
    });
});

router.post('/', function (req, res) {
    let response = {};
    const collection = getCollection();
    const filter = { username: req.body.username }

    collection.findOne(filter, function (err, user) {
        if (!user) {
            res.json({ unauthorized: true });
            return;
        }

        response.valid = passwordHash.verify(req.body.password, user.password);

        if (response.valid) {
            response.token = authentication.generateAccessToken(user);
            response.user_id = user._id;

            res.json(response);
        } else {
            res.json({ status: 'Please enter a valid username/password' });
        }
    });
});

//
// POST - Subscribe to a store
//
router.post('/subscribeToStore', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();
    const filter = { _id: new ObjectId(req.user.userId) };

    collection.findOne(filter, function (err, user) {
        if (!user) {
            res.json({ unauthorized: true });
            return;
        }

        const store = req.body.store;

        if (!user.stores) {
            user.stores = [];
        }

        user.stores.push(store);

        var update = { $set: { stores: user.stores } };

        collection.updateOne(filter, update, function (err, doc) {
            res.json(user);
        });

        return;
    });
});

//
// POST - Unsubscribe from a store
//
router.post('/unsubscribeFromStore', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();
    const filter = { _id: new ObjectId(req.user.userId) };

    collection.findOne(filter, function (err, user) {
        if (!user) {
            res.json({ unauthorized: true });
            return;
        }

        const store = req.body.store;

        if (!user.stores) {
            res.json({ error: 'Not found' });
            return;
        }

        let index = user.stores.map(function (s) { return s.store_id; }).indexOf(store._id.toString());
        user.stores.splice(index, 1);

        var update = { $set: { stores: user.stores } };

        collection.updateOne(filter, update, function (err, doc) {
            res.json(user);
        });

        return;
    });
});

module.exports = router;