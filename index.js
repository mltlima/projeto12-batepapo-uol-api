import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

//Database connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("api_bate_papo_uol");
});

//Get all participants in the chat
app.get('/participants', async (req, res) => {
    try {
        const participants = await db.collection('users').find({}).toArray();
        res.send(participants);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

const app = express();
app.use(express.json());
app.use(cors()); 

app.listen(5000);