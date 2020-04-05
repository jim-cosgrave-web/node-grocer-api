var MongoClient = require('mongodb').MongoClient

var state = {
  db: null,
}

exports.connect = function(url, database, done) {
  console.log('Connecting to ' + url);
  if (state.db) return done()

  MongoClient.connect(url, function(err, client) {
    if (err) return done(err)

    const db = client.db(database);

    state.db = db
    done()
  })
}

exports.get = function() {
  return state.db
}

exports.getCollection = function(collectionName) {
    return state.db.collection(collectionName);
}

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}