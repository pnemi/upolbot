const
  MongoClient = require('mongodb').MongoClient;

  var url = 'mongodb://localhost:27017/upolak';
  // Use connect method to connect to the Server
  MongoClient.connect(url, function(err, db) {
    if (err) {
      throw err;
    }
    let collection = db.collection('classes');

    //
    // collection.insertMany([
    //     {a : 1}, {a : 2}, {a : 3}
    //   ], function(err, result) {
    //
    //     console.log("Inserted 3 documents into the document collection");
    //
    //   });

    collection.findOne({"thanks": {"dik": "1"}}, (err, data) => {
      console.log(data);
      db.close();

    });

  });
