const express = require('express');
const router = express.Router();
const db = require('../db');
const service = require('../services/stores.service');
var passwordHash = require('password-hash');

const getCollection = function () {
    return db.getCollection('stores');
}

const getGroceryCollection = function() {
    return db.getCollection('groceries'); 
}

router.use(function timeLog(req, res, next) {
    console.log('Stores API called at --- : ', Date.now());
    next();
});

//
// GET - All stores or by id
//
router.get('/:storeId?', function (req, res) {
    const collection = getCollection();

    let filter = {};

    if (req.params.storeId) {
        filter = { storeId: req.params.storeId }
    }

    collection.find(filter).toArray(function (err, docs) {
        res.json(docs);
    });
});

//
// POST - New Store
//
router.post('/', function (req, res) {
    const collection = getCollection();

    collection.insertOne(req.body, function (err, result) {
        res.send('OK');
    });
});

//
// POST - New Store Category
//
router.post('/:storeId/category', function (req, res) {
    const collection = getCollection();
    const filter = { storeId: req.params.storeId }
    const request = req.body;

    collection.findOne(filter, function (err, store) {
        if (!store) {
            res.send('BAD!');
        }

        category = { name: request.category, groceries: [] };

        const order = Math.max.apply(Math, store.categories.map(function (c) { return c.order; }));
        category.order = order + 1;

        if (!store.categories) {
            store.categories = []
        }

        store.categories.push(category);

        //
        // Update the collection
        // 
        var update = { $set: { categories: store.categories } };
        collection.updateOne(filter, update, function (err, doc) {
            res.json(store.categories);
        });
    });
});

//
// POST - New Store Grocery
//
router.post('/:storeId/grocery', function (req, res) {
    const collection = getCollection();
    const filter = { storeId: req.params.storeId }
    const grocery = req.body;

    const groceryCollection = getGroceryCollection();
    groceryCollection.update({ name: grocery.groceryName.toLowerCase() }, { name: grocery.groceryName }, {upsert: true});

    collection.findOne(filter, function (err, store) {
        if (!store) {
            res.send('BAD!');
        }

        //
        // Find the category in the store if categories exist
        //
        let category = store.categories ? store.categories.find(c => { return c.name == grocery.category }) : [];
        let newGrocery = {};

        //
        // If the category doesnt exist, create a new one
        //
        if (!category || category.length == 0) {
            category = { name: grocery.category ? grocery.category : "Uncategorized", groceries: [{ groceryName: grocery.groceryName, order: 1 }] };

            const order = Math.max.apply(Math, store.categories.map(function (c) { return c.order; }));
            category.order = order + 1;

            if (!store.categories) {
                store.categories = []
            }

            store.categories.push(category);
        } else {
            //
            // If the category exists, find the grocery
            //
            const existing = category.groceries.find(g => { return g.groceryName == grocery.groceryName });

            //
            // If it already exists, dont add it as a duplicate
            //
            if (existing) {
                res.send('duplicate grocery');
                return;
            }

            //
            // Get the max order and set the new grocery to that order + 1
            //
            let order = Math.max.apply(Math, category.groceries.map(function (g) { return g.order; }));

            if (order == Number.NEGATIVE_INFINITY) {
                order = 0;
            }

            grocery.order = order + 1;

            newGrocery = { groceryName: grocery.groceryName, order: grocery.order };

            category.groceries.push(newGrocery);
        }

        //
        // Update the collection
        //
        var update = { $set: { categories: store.categories } };
        collection.updateOne(filter, update, function (err, doc) {
            res.json(newGrocery);
        });
    });
});

//
// PUT - Store Grocery
//
router.put('/:storeId/grocery', function (req, res) {
    const collection = getCollection();
    const filter = { storeId: req.params.storeId }
    const request = req.body;
    const current = request.currentGrocery;
    const updated = request.updatedGrocery;

    collection.findOne(filter, function (err, store) {
        if (!store) {
            res.send('BAD!');
        }

        //
        // Check if the grocery is moving up (close to the top) or down
        //
        const category = store.categories.find(c => c.name == request.category);
        const currentGrocery = category.groceries.find(c => c.groceryName == current.groceryName);
        const swapGrocery = category.groceries.find(c => c.order == updated.order);

        for (let i = 0; i < category.groceries.length; i++) {
            let c = category.groceries[i];

            if (c == currentGrocery) {
                c.order = updated.order;
            }

            if (c == swapGrocery) {
                c.order = current.order;
            }
        }

        //
        // Update the collection
        //
        let updateFilter = { storeId: req.params.storeId, "categories.name": request.category };
        let update = { $set: { "categories.$.groceries": category.groceries } };

        collection.updateOne(updateFilter, update, function (err, doc) {
            res.send('OK');
        });
    });
});

//
// PUT - Store Category
//
router.put('/:storeId/category', function (req, res) {
    const collection = getCollection();
    const filter = { storeId: req.params.storeId }
    const request = req.body;
    const current = request.currentCategory;
    const updated = request.updatedCategory;

    collection.findOne(filter, function (err, store) {
        if (!store) {
            res.send('BAD!');
        }

        //
        // Check if the grocery is moving up (close to the top) or down
        //
        const currentCategory = store.categories.find(c => c.name == request.category);
        const swapCategory = store.categories.find(c => c.order == updated.order);

        for (let i = 0; i < store.categories.length; i++) {
            let c = store.categories[i];

            if (c == currentCategory) {
                c.order = updated.order;
            }

            if (c == swapCategory) {
                c.order = current.order;
            }
        }

        //
        // Update the collection
        //
        let update = { $set: { "categories": store.categories } };

        collection.updateOne(filter, update, function (err, doc) {
            res.send('OK');
        });
    });
});

//
// DELETE - Store Grocery
//
router.delete('/:storeId/grocery', function (req, res) {
    const collection = getCollection();
    const filter = { storeId: req.params.storeId }
    const request = req.body;

    collection.findOne(filter, function (err, store) {
        if (!store) {
            res.send('BAD!');
        }

        let updateFilter = { storeId: req.params.storeId, "categories.name": request.category };
        let update = { $pull: { "categories.$.groceries": { groceryName: request.groceryName } } };

        collection.updateOne(updateFilter, update, function (err, doc) {
            res.send('OK');
        });
    });
});


module.exports = router;