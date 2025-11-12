
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 3000

app.use(cors());
app.use(express.json())


const uri = "mongodb+srv://krishiLink:DQx9dJnoYmoT7TiA@programming-hero.ifoutmp.mongodb.net/?appName=programming-hero";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db('krishiLink-project');
        const krishiLinkCollection = db.collection('krishiLink');

        app.get('/krishiLink', async (req, res) => {
            const result = await krishiLinkCollection.find().toArray()
            res.send(result)
        });

        app.get('/krishiLink/:id', async (req, res) => {
            const { id } = req.params
            console.log(id)
            const result = await krishiLinkCollection.findOne({ _id: new ObjectId(id) })
            res.send({
                success: true,
                result
            })
        })

        app.post('/krishiLink', async (req, res) => {
            const data = req.body
            const newKrishi = { ...data, create_at: new Date() }
            const result = await krishiLinkCollection.insertOne(newKrishi)
            res.send({
                success: true,
                result
            })
        });


        app.put('/krishiLink/:id', async (req, res) => {
            const { id } = req.params
            const filter = { _id: new ObjectId(id) }
            const updateKrishiLink = req.body

            const update = {
                $set: updateKrishiLink

            }
            const result = await krishiLinkCollection.updateOne(filter, update)
            res.send(result)

        })

        app.post('/krishiLink/:id/interest', async(req, res)=>{
            const id = req.params.id
            const newInterest = req.body

            const result = await krishiLinkCollection.updateOne(
                {_id : new ObjectId(id)},
                {
                    $push: { interest: newInterest }
                }
            )
            console.log("MongoDB Update Result:", result)
            res.send(result)
            
        })

        app.get('/latestKrishi', async (req, res) => {
            const result = await krishiLinkCollection.find().sort({ create_at: -1 }).limit(6).toArray()
            res.send(result)
        })

        app.get('/my-posted', async (req, res) => {
            const email = req.query.email
            const result = await krishiLinkCollection.find({ 'owner.ownerEmail': email }).toArray()
            res.send(result)
        })

        app.delete('/krishiLink/:id', async (req, res) => {
            
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})




