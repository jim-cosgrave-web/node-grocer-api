const express = require('express');
const router = express.Router();
const db = require('../db');
const service = require('../services/stores.service');

const getCollection = function() {
    return db.getCollection('stores'); 
}

router.use(function timeLog(req, res, next) {
    console.log('Stores API called at : ', Date.now());
    next(); 
});

router.get('/:storeId?', function(req, res){
    const collection = getCollection();

    let filter = {};

    if(req.params.storeId) {
        filter = { storeId: req.params.storeId }
    }

    collection.find(filter).toArray(function(err, docs) {
        res.json(docs);
    });
});

router.post('/', function(req, res){
    const collection = getCollection();

    collection.insertOne(req.body, function(err, result){
        res.send('OK');
    });
});

router.post('/:storeId/grocery', function(req, res){
    const collection = getCollection();
    const filter = { storeId: req.params.storeId }
    const grocery = req.body;
    
    collection.findOne(filter, function(err, store) {
        if(!store) {
            res.send('BAD!');
        }

        let category = store.categories ? store.categories.find(c => { return c.name == grocery.category }) : [];
        
        if(category.length == 0) {
            category = { name: grocery.category, groceries: [{ groceryName: grocery.groceryName, order: 1 }] };
            store.categories = [category];
        } else {
            const existing = category.groceries.find(g => { return g.groceryName == grocery.groceryName });

            if(existing) {
                res.send('duplicate grocery');
                return;
            }

            const order = Math.max.apply(Math, category.groceries.map(function(g) { return g.order; }));
            grocery.order = order + 1;

            let newGrocery = { groceryName: grocery.groceryName, order: grocery.order };

            category.groceries.push(newGrocery);
        }

        var newvalues = { $set: { categories: store.categories } };
        collection.updateOne(filter, newvalues, function(err, doc) {
            res.send('OK');
        });
    });
});

module.exports = router;