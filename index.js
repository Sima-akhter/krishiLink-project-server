
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = 3000

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@programming-hero.ifoutmp.mongodb.net/?appName=programming-hero`

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
        // await client.connect();

        const db = client.db('krishiLink-project');
        const krishiLinkCollection = db.collection('krishiLink');
        const userCollection = db.collection("users");
        // const productCollection = db.collection("products");

         //================= user api ====================//
    app.get("/users",  async (req, res) => {
      try {
        const currentEmail = req.query.currentEmail;
        const limit = parseInt(req.query.limit) || 50;

        const query = currentEmail ? { email: { $ne: currentEmail } } : {};

        const users = await userCollection
          .find(query, { projection: { password: 0 } })
          .limit(limit)
          .toArray();

        res.status(200).send(users);
      } catch (error) {
        console.error("Get users error:", error);
        res.status(500).send({ message: "Failed to fetch users" });
      }
    });

    app.get("/users/:email",  async (req, res) => {
      try {
        const email = req.params.email;

        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }

        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send(user);
      } catch (error) {
        console.error("Get user error:", error);
        res.status(500).send({ message: "Failed to fetch user" });
      }
    });

    app.post("/users",  async (req, res) => {
      try {
        const userData = req.body;

        if (!userData?.email) {
          return res.status(400).send({
            success: false,
            message: "Email is required",
          });
        }
        const existingUser = await userCollection.findOne({
          email: userData.email,
        });
        if (existingUser) {
          await userCollection.updateOne(
            { email: userData.email },
            {
              $set: {
                lastLoginAt: new Date(),
              },
            }
          );
          return res.status(200).send({
            success: true,
            message: "User already exists, login date updated",
          });
        }
        const newUser = {
          ...userData,
          role: "user",
          createdAt: new Date(),
        };
        const result = await userCollection.insertOne(newUser);
        res.status(201).send({
          success: true,
          message: "User created successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("User create error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to create user",
        });
      }
    });

    app.patch("/users/:id/role",  async (req, res) => {
      try {
        const id = req.params.id;
        const { role } = req.body;
        if (!role || !["admin", "user"].includes(role)) {
          return res
            .status(400)
            .send({ success: false, message: "Invalid role" });
        }
        const query = { _id: new ObjectId(id) };
        const update = { $set: { role } };
        const result = await userCollection.updateOne(query, update);

        if (result.modifiedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "User not found or role already set",
          });
        }

        res.send({ success: true, message: `Role updated to ${role}` });
      } catch (error) {
        console.error("Role update error:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to update role" });
      }
    });

    app.delete("/users/:id",  async (req, res) => {
      try {
        const id = req.params.id;

        if (!id) {
          return res
            .status(400)
            .send({ success: false, message: "User ID is required" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }
        res.status(200).send({
          success: true,
          message: "User deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("Delete user error:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete user" });
      }
    });

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

        app.post('/krishiLink/:id/interest', async (req, res) => {
            const id = req.params.id;
            const newInterest = req.body;

            try {

                const product = await krishiLinkCollection.findOne({ _id: new ObjectId(id) });

                if (!product) {
                    return res.status(404).send({ success: false, message: 'Product not found.' });
                }


                const alreadyInterested = product.interest?.some(
                    (item) => item.userEmail === newInterest.userEmail
                );

                if (alreadyInterested) {
                    return res.send({
                        success: false,
                        message: 'You have already submitted an interest for this product.'
                    });
                }


                const interestId = new ObjectId();
                const interestWithId = { _id: interestId, ...newInterest };

                const result = await krishiLinkCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $push: { interest: interestWithId } }
                );

                res.send({
                    success: true,
                    modifiedCount: result.modifiedCount,
                    message: 'Interest submitted successfully.'
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({ success: false, message: 'Error submitting interest.' });
            }
        });



        app.put('/krishiLink/:id/interest-status', async (req, res) => {
            const { id } = req.params;
            const { interestId, status } = req.body;

            try {
                const product = await krishiLinkCollection.findOne({ _id: new ObjectId(id) });
                if (!product) return res.status(404).send({ success: false, message: "Crop not found" });


                const interestIndex = product.interest.findIndex(
                    (item) => item._id.toString() === interestId
                );
                if (interestIndex === -1)
                    return res.status(404).send({ success: false, message: "Interest not found" });


                product.interest[interestIndex].status = status;


                if (status === "accepted") {
                    const interestedQty = Number(product.interest[interestIndex].quantity);
                    product.quantity = String(Math.max(0, Number(product.quantity) - interestedQty));
                }


                const result = await krishiLinkCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            interest: product.interest,
                            quantity: product.quantity
                        }
                    }
                );

                res.send({
                    success: true,
                    message: `Interest ${status} successfully`,
                    modifiedCount: result.modifiedCount,
                    newQuantity: product.quantity
                });
            } catch (error) {
                console.error(error);
                res.status(500).send({ success: false, message: "Error updating interest status" });
            }
        });




        app.get('/krishiLink/:id/received-interests', (req, res) => {
            const { id } = req.params;
            const email = req.query.email;

            krishiLinkCollection.findOne({
                _id: new ObjectId(id),
                'owner.ownerEmail': email
            }).then(product => {
                if (!product) {
                    return res.status(404).send({
                        success: false,
                        message: 'Product not found or you are not the owner of this product.'
                    });
                }


                res.send({
                    success: true,
                    interests: product.interest || []
                });
            }).catch(err => {
                console.error(err);
                res.status(500).send({
                    success: false,
                    message: 'Error fetching received interests.'
                });
            });
        });


        app.get('/latestKrishi', async (req, res) => {
            const result = await krishiLinkCollection.find().sort({ create_at: -1 }).limit(6).toArray()
            res.send(result)
        })

        app.get('/my-posted', async (req, res) => {
            const email = req.query.email
            const result = await krishiLinkCollection.find({ 'owner.ownerEmail': email }).toArray()
            res.send(result)
        })

        app.patch('/krishiLink/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updatedFileds = req.body
            const updatedData = {
                $set: updatedFileds
            }
            const result = await krishiLinkCollection.updateOne(query, updatedData)
            res.send(result)
        })

        app.delete('/krishiLink/:id', async (req, res) => {
            const { id } = req.params
            //   const objectid = new ObjectId(id)
            //   const filter = {_id: ObjectId}
            const result = await krishiLinkCollection.deleteOne({ _id: new ObjectId(id) })
            res.send({
                success: true,
                result
            })
        })



        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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




