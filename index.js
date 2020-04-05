var express = require('express')
  , bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
var cors = require('cors');

app.use(cors())

var db = require('./db');
var inventoryRoutes = require('./inventory');

app.use(bodyParser.json());
app.use('/inventory', inventoryRoutes);

db.connect('mongodb+srv://admin:Password1@main-cluster-lwdvp.mongodb.net/test?retryWrites=true&w=majority', 'groceriesDB', function (err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    process.exit(1);
  } else {
    app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
  }
});
