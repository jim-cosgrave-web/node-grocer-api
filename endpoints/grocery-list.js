var express = require('express');
var router = express.Router();
var db = require('../db');
const { ObjectId } = require('mongodb').ObjectId;

router.use(function timeLog(req, res, next) {
    console.log('Grocery List API called at : ', Date.now());
    next();
});

const getCollection = function () {
    return db.getCollection('groceryLists');
}

const getStoreCollection = function () {
    return db.getCollection('stores');
}

router.get('/:listId?', function (req, res) {
    var collection = getCollection();

    collection.find().toArray(function (err, docs) {
        res.json(docs);
    });
});

router.get('/:listId/:storeId', function (req, res) {
    let debug = {};
    //debug['storeId'] = req.params.storeId;
    //debug['listId'] = req.params.listId;

    let collection = getCollection();
    let storesCollection = getStoreCollection();
    let list_id = new ObjectId(req.params.listId);
    let store_id = new ObjectId(req.params.storeId);

    let groceryList = [];

    collection.findOne({ _id: list_id }, function (err, list) {
        //debug['listname'] = list;

        storesCollection.findOne({ _id: store_id }, function (err, store) {
            //debug['store'] = store;

            //
            // Loop over each category
            //
            for (let i = 0; i < store.categories.length; i++) {
                const storeCategory = store.categories[i];
                let category = { name: storeCategory.name, groceries: [] };

                //
                // Loop over each grocery in the category
                //
                for (let j = 0; j < storeCategory.groceries.length; j++) {
                    const storeGrocery = storeCategory.groceries[j];

                    //
                    // Loop over groceries in the list
                    //
                    for (let k = 0; k < list.groceries.length; k++) {
                        const listGrocery = list.groceries[k];

                        if (listGrocery.name == storeGrocery.groceryName) {
                            category.groceries.push(storeGrocery);
                        }
                    }
                }

                if (category.groceries.length > 0) {
                    category.groceries.sort((a, b) => a.order - b.order);
                    groceryList.push(category);
                }
            }

            debug['list'] = groceryList;

            res.json(debug);
        });
    });

    // collection.find().toArray(function(err, docs) {
    //     res.json(docs);
    // });
});

router.post('/', function (req, res) {
    var collection = getCollection();

    collection.insertOne(req.body, function (err, result) {
        res.send('OK');
    });
});

module.exports = router;