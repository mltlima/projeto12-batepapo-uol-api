import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


//joi validations
const userSchema = joi.object({
    name: joi.string().required()
});
const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.alternatives().valid('message', 'private_message').required(),
    from: joi.string()
});


//Database connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("api_bate_papo_uol");
});

//Save participants
app.post('/participants', async (req, res) => {
    const { name } = req.body;
    
    const validation = userSchema.validate(req.body);
    if (validation.error) {
        res.sendStatus(422);
        return;
    }
    
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

//Save messages
app.post('/messages', async (req, res) => {
    const { user } = req.headers;
    const { to, text, type } = req.body;

    //validation of information in the body
    const validation = messageSchema.validate(req.body);
    if(validation.error) {
        res.status(422).send(validation.error.details.map((err) => err.message));
        return;
    }

    try {
        const checkUserRegistered = await db.collection('participants').findOne({ name : user });
        if (!checkUserRegistered) {
            res.status(422).send("user not registered");
            return;
        }

        await db.collection("messages").insertOne({
            from: user,
            to: to,
            text: text,
            type: type,
            time: dayjs().locale("pt-br").format("HH:mm:ss")
        });
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

//Get all messages
app.get("/messages", async (req, res) => {
    const { user } = req.headers;
    const { limit } = req.query;
    
    try {
        const messages = await db.collection("messages").find({
            $or: [{ to: 'Todos' }, { from: user }, { to: user }, { type: 'message' }]
        }).sort({ _id: -1 }).toArray(); 
        
        if (limit) {
            res.send(messages.slice(0, parseInt(limit)).reverse());
            return;
        }
        res.status(200).send(messages.reverse());
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

//Participant status
app.post("/status", async (req, res) => {
    const { user } = req.headers;

    try {
        const checkUserRegistered = await db.collection('participants').findOne({ name : user });
        if (!checkUserRegistered) {
            res.status(404).send("user not registered");
            return;
        }

        await db.collection("participants").updateOne({ name : user }, { $set: { lastStatus: Date.now() } });
        res.sendStatus(200);
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

app.listen(5000,() => {
    console.log('Running in http://localhost:5000')
});