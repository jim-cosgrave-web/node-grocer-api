const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3100;
const cors = require('cors');
require('dotenv').config();

app.use(cors());

const db = require('./db');
const inventoryRoutes = require('./endpoints/inventory');
const storeRoutes = require('./endpoints/stores');
const userRoutes = require('./endpoints/users');
const groceryListRoutes = require('./endpoints/grocery-list');
const groceryRoutes = require('./endpoints/groceries');
const recipeRoutes = require('./endpoints/recipes');

app.use(bodyParser.json());
app.use('/inventory', inventoryRoutes);
app.use('/stores', storeRoutes);
app.use('/users', userRoutes);
app.use('/list', groceryListRoutes);
app.use('/groceries', groceryRoutes);
app.use('/recipes', recipeRoutes);

db.connect("mongodb+srv://admin:" + process.env.DB_PASSWORD + "@main-cluster-lwdvp.mongodb.net/test?retryWrites=true&w=majority", 'groceriesDB', function (err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    process.exit(1);
  } else {
    app.get('/', (req, res) => res.send('Server is running'))
    app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
  }
});
