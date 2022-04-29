import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); 

//Database connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("api_bate_papo_uol");
});

//Save participants
app.post('/participants', async (req, res) => {
    const name = req.query.name;
    //console.log(req);
    //console.log("name: ", req.query.name);

    try {
        const checkUserRegistered = await db.collection('participants').findOne({ name });
        if (checkUserRegistered) {
            res.status(409).send("user already registered");
            return;
        }

        //save user on database
        await db.collection('participants').insertOne({ name, lastStatus: Date.now() });
        //save user entry message on database
        await db.collection('messages').insertOne({ 
            from: name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs().locale("pt-br").format("HH:mm:ss")
        });

        res.sendStatus(201);

    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

//Get all participants in the chat
app.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection('participants').find({}).toArray();
        res.send(participants);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.delete('/participants', async (req, res) => {
    try {
        await db.collection('participants').deleteOne({_id: new ObjectId("626b50c4d77a2d9166b7731a")});
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

app.listen(5000);