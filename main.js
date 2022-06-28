console.log("main.js vizsga oké");

const path = require("path");

const express = require("express");
const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

const app = express();

const uri = "mongodb+srv://Reka74:p4ssw0rd@cluster0.gb2st.mongodb.net/?retryWrites=true&w=majority";

function mongo(uri, dbName, collectionName, cbFn){
    
    const client = new MongoClient(uri, { 
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    client.connect(err => {
        
        const collection = client.db(dbName).collection(collectionName);
    
        cbFn(client, collection);
        
    });
}

app.use( express.static( path.join(__dirname, "public") ) );

app.get('/stylists', (req, response) => {

    mongo(uri, "Prooktatas", "Hairsalon", (cli, coll) => {
        coll.find().toArray( function(err, resp){
            
            response.json(resp);

            cli.close();
        });
    })
});

app.get('/admin', (req, response) => {

    mongo(uri, "Prooktatas", "Hairsalon", (cli, coll) => {
        coll.find().toArray( function(err, resp){
            
            response.json(resp);

            cli.close();
        });
    })
});

app.use( express.json() );

app.post('/newreservation', (request, response) => {

    var newRes = request.body;
    newRes._id = ObjectId(newRes._id);

    mongo(uri, "Prooktatas", "Hairsalon", (cli, coll) => {

        coll.updateOne({_id: newRes._id}, {$push: {idopontfoglalas: newRes}}, (err, resp) => {

            response.json({
                message: "Az időpontfoglalás sikeresen mentve.",
            });
           
            cli.close();
        });

    });
});

app.listen(3000);