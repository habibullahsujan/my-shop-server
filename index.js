const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is live now");
});

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster1.rvqsrsr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req,res,next){
  const userAuth=req.headers.authorization;

  if(!userAuth){
    return res.status(403).send({message:'unauthorized access.'})
  }
  const token=userAuth.split(' ')[1];
  
 jwt.verify(token, process.env.JWT_SECRET,function (err, decoded){
    if(err){
      return res.status(403).send({message:'unauthorized access.'})
    }
    req.decoded=decoded;
    next();
  })


}
async function run() {
  try {
    const productsDataBase = client.db("emaJohnShop").collection("products");
    const cartItem=client.db('emaJohnShop').collection('cartItem')
    app.get("/products", async (req, res) => {
        const size=parseInt(req.query.size);
        const page=parseInt(req.query.page);
        // console.log(size,page);
      const query = {};
      const cursor = productsDataBase.find(query);
      //skip=size*page=5*4=20
      //limit =size=5
      const products = await cursor.skip(page*size).limit(size).toArray();
      //count how many data in this database collection
      const totalData = await productsDataBase.estimatedDocumentCount();
      //send a object and inside this send total data and products
      res.send({ totalData, products });
    });

    app.post("/cartItem", async (req, res) => {
      const data=req.body;
      const result=await cartItem.insertOne(data);
      res.send(result)
    });

    app.get('/cartItem', verifyJWT, async(req,res)=>{
      const usrVerify=req.decoded;
      
      if(usrVerify.email !== req.query.email){
        return res.status(403).send({message:'unauthorized access'})
      }
        let query={};
        if(req.query.email){
          query={
            userEmail:req.query.email
          }
        }
        const cursor=cartItem.find(query);
        const result=await cursor.toArray();
        res.send(result)
    });

    app.delete('/deleteCartItem/:id', async(req,res)=>{
      const id=req.params.id;
      console.log(id);
      const query={_id:ObjectId(id)};
      const result= await cartItem.deleteOne(query);
      res.send(result)
    })

    app.post('/jwt', (req,res)=>{
      const email=req.body;
      console.log(email);
      const token=jwt.sign(email,process.env.JWT_SECRET,{expiresIn:'1h'});
      res.send({token})
    })
  } catch (error) {
    console.log(error);
  }
}
run().catch((error) => console.log(error));

app.listen(port, () => {
  console.log("server is running in port:", port);
  
});
