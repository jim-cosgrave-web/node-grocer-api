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
    return db.getCollection('groceryLists');
}

const getStoreCollection = function () {
    return db.getCollection('stores');
}

const getGroceryCollection = function() {
    return db.getCollection('groceries'); 
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

router.get('/:listId?', authentication.authenticateToken, function (req, res) {
    var collection = getCollection();

    collection.find().toArray(function (err, docs) {
        res.json(docs);
    });
});

//
// Get list for store
//
router.get('/:listId/:storeId', authentication.authenticateToken, function (req, res) {
    let responseList = {};
    responseList.storeId = req.params.storeId;
    responseList.listId = req.params.listId;

    let collection = getCollection();
    let storesCollection = getStoreCollection();
    let list_id = new ObjectId(req.params.listId);
    let store_id = new ObjectId(req.params.storeId);

    let groceryList = [];
    let categories = [{ name: '**Uncategorized**', value: '', uncategorized: true }];

    collection.findOne({ _id: list_id }, function (err, list) {
        responseList.listName = list.name;
        responseList.userId = list.user_id;

        let remainingGroceries = list.groceries.slice();

        storesCollection.findOne({ _id: store_id }, function (err, store) {
            responseList.storeName = store.name;

            //
            // Loop over each category
            //
            for (let i = 0; i < store.categories.length; i++) {
                const storeCategory = store.categories[i];
                let category = { name: storeCategory.name, groceries: [] };
                categories.push({ name: storeCategory.name, value: storeCategory.name });

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
                        const order = storeGrocery.order;

                        if (listGrocery.name == storeGrocery.groceryName) {
                            listGrocery.order = order;
                            category.groceries.push(listGrocery);

                            const index = remainingGroceries.indexOf(listGrocery);
                            remainingGroceries.splice(index, 1);
                        }
                    }
                }

                if (category.groceries.length > 0) {
                    category.groceries.sort((a, b) => a.order - b.order);
                    groceryList.push(category);
                } else {
                    category.hidden = true;
                    groceryList.push(category);
                }
            }

            if(remainingGroceries && remainingGroceries.length > 0) {
                let uncategorized = { name: '**Uncategorized**', uncategorized: true, groceries: remainingGroceries };
                groceryList.splice(0, 0, uncategorized);
            }

            responseList.list = groceryList;
            responseList.categories = categories;

            res.json(responseList);
        });
    });

    // collection.find().toArray(function(err, docs) {
    //     res.json(docs);
    // });
});

router.post('/', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();

    const list_id = new ObjectId(req.body._id);
    const filter = { _id: list_id };

    //
    // Must remove the _id property otherwise mongo throws an error
    //
    delete req.body._id;

    collection.update(filter, req.body, { upsert: true }, function (err, response) {
        if (err) {
            res.send('Error');
        } else {
            res.send('Ok');
        }
    });
});

//
// POST - Add grocery
//
router.post('/grocery', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();
    const list_id = new ObjectId(req.body.list_id);

    let groceryName = req.body.grocery.name.trim();
    let filter = { _id: list_id, "groceries.name": {$regex: new RegExp("^" + groceryName, "i")} };

    delete req.body._id;

    const groceryCollection = getGroceryCollection();
    groceryCollection.update({ name: {$regex: new RegExp("^" + groceryName, "i")} }, { name: groceryName }, {upsert: true});

    collection.findOne(filter, function (err, grocery) {
        if(grocery) {
            //
            // Already exists. Dont add again.
            //
            res.json({ exists: true });
        } else {
            filter = { _id: list_id };

            collection.findOne(filter, function(err, list) {
                if(!list) {
                    res.json({ notFound: { type: "List" }});
                } else {
                    if(!req.body.grocery.checked) {
                        req.body.grocery.checked = false;
                    }

                    list.groceries.push(req.body.grocery);
                    list.groceries.sort(compareNames);

                    collection.update(filter, list);
                    res.json(list);
                }
            });
        }
    });
});

//
// POST - Add grocery
//
router.post('/recipe', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();
    const groceries = req.body.ingredients.filter(g => { return g.checked });
    const filter = { user_id: req.body.user_id };

    delete req.body._id;

    collection.findOne(filter, function (err, list) {
        if (!list) {
            res.json({ exists: false });
            return;
        }

        let checks = [];

        for(let i = 0; i < groceries.length; i++) { 
            let grocery = groceries[i];
            grocery.checked = false;

            const found = list.groceries.find(g => g.name.toLowerCase().trim() === grocery.name.toLowerCase().trim());

            if(!found) {
                list.groceries.push(grocery);
            }

            checks.push({ found: found ? 'found': 'not found', grocery: grocery});
        }

        //res.json({ before: before, after: list, groceries: groceries });
        collection.update(filter, list); 
        res.json(checks);
    });

});

router.put('/grocery', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();

    const list_id = new ObjectId(req.body.list_id);
    let filter = { _id: list_id, "groceries.name": req.body.grocery.name };

    delete req.body._id;

    collection.update(filter, { $set: { "groceries.$": req.body.grocery } });
    res.send('OK');
});

router.post('/toggleGrocery', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();

    const list_id = new ObjectId(req.body.list_id);
    const filter = { _id: list_id, "groceries.name": req.body.grocery.name };

    delete req.body._id;

    collection.update(filter, { $set: { "groceries.$.checked": req.body.grocery.checked } }, function() {
        res.send('Ok');
    });
});

router.post('/removechecked', authentication.authenticateToken, function (req, res) {
    const collection = getCollection();

    const list_id = new ObjectId(req.body.list_id);
    let filter = { _id: list_id  };

    collection.updateMany(filter, { $pull: { "groceries": { checked : true } } }, function() {
        res.send('Ok');
    });
});



module.exports = router;