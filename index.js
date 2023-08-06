import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose, { mongo } from "mongoose";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import { MongoClient, ObjectId } from "mongodb";
import { exec } from 'child_process';
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import flash from "express-flash";
import methodOverride from "method-override";
import dotenv from "dotenv";
import { type } from "os";


import initializePassport from "./passport-config.js";

dotenv.config()

//Database Port
const mongoPort = process.env.MONGODB_URI;
// const mongoPort = "mongodb://0.0.0.0:27017/Profiles";
mongoose.connect(mongoPort, { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


initializePassport(
  passport,
  email => Profiles.findOne({ "username": email }),
  id => Profiles.findOne({ "_id": id })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/app')
  }
  next()
}


// Get the directory name of the current module using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


//Profile Schema
const profileSchema = new mongoose.Schema({
  username: String,
  password: String,
  ownerName: String,
  dogName: String,
  dogBreed: String,
  location: String,
  about: String,
  petImage: String,
  waggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profiles' }]
})

const Profiles = mongoose.model('Profiles', profileSchema);


//Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Profiles' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profiles' },
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// Set up multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/image/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});


const upload = multer({ storage: storage });

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static("public"));
app.use(session({
  secret: "yes",
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(methodOverride('_method'))
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next()
})

app.get('/getData', async (req, res) => {
  try {
    const collection = db.collection('profiles');
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get/:dogName', async(req, res) => { // treated dogName as unique ID 
  const dogName = req.params.dogName
  try {
    console.log(dogName)
    const user = await Profiles.findOne({dogName: dogName}).select({})
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.get("/", checkNotAuthenticated, function (req, res) {
  const message = "";
  res.render("login", { message });
});

app.get("/register", function (req, res) {
  res.render("register");
})

// Handle Registration
app.post("/register", upload.single('petImage'), async (req, res) => {
  const user = await Profiles.findOne({ username: req.body.username });
  if (user === null) { //continue
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const newProfile = new Profiles({
        username: req.body.username,
        password: hashedPassword,
        ownerName: req.body.ownerName,
        dogName: req.body.dogName,
        dogBreed: req.body.dogBreed,
        location: req.body.location,
        about: req.body.about,
        petImage: req.file ? req.file.filename : null,
      });

      await newProfile.save();
      res.render('successR');
    } catch (err) {
      console.error(err);
      res.status(500).render('failedR');
    }
  }
  else res.render('failedR');
});

// Handle Login
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/app',
  failureRedirect: '/',
  failureFlash: true
}))

//Handle Logout
app.delete('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/waggedList', async (req,res) => {
  try {
    const user = await req.user;
    const wagged = user.waggedUsers;
    res.json(wagged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get("/app", async function (req, res) {
  try {
    const user = await req.user;
    const ownerName = user.ownerName;
    const dogName = user.dogName;
    const dogBreed = user.dogBreed;
    const location = user.location;
    const about = user.about;
    const petImage = "/image/uploads/" + user.petImage;
    res.render("app", {
      petImage,
      dogName,
      dogBreed,
      ownerName,
      location,
      about
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


// Create an API route to add a user ID to the waggedUsers array
app.post("/wagProfile/:profileId", async function (req, res) {
  try {

    const profileId = req.params.profileId;
    // You can also validate if the user is allowed to wag profiles here, if needed.
    const user = await req.user;
    await Profiles.updateOne(
      { username: user.username },
      { $addToSet: { waggedUsers: profileId } }
   )
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.patch("/edit/:id", async (req, res) => {
  const id = req.params.id
  const data = req.body

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: "this user does not exist"})
  }

  try {
    const user = await Profiles.findOneAndUpdate({_id : id}, {
       ...req.body
    })
    console.log(req.body)
    console.log(id)
    res.status(200).json(user)

  } catch (err) {
    res.status(404).json({error: err})
  }
})

//Chat Message Functionality

// route for sending chat message
app.post("/sendMessage/:receiverId", async function (req, res) {
  try {
    // const senderId = req.user._id;
    // const receiverId = req.params.receiverId;
    // const message = req.body.message;

    const { test, receiver, message } = await req.body;
    const sender = await req.user
    const senderId = sender._id
    const receiverId = req.params.receiverId;
    console.log('Data to be inserted:', { senderId, receiverId, message });

    // Save the chat message to the database
    const chatMessage = new ChatMessage({
      // sender: senderId, // profileId / senderId
      // receiver: recieverId, // recieverId
      sender: senderId,
      receiver: receiverId,
      message: message
    });
    await chatMessage.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//route for getting chat messages
app.get("/getMessages/:receiverId", async function (req, res) {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.receiverId;

    // Retrieve chat messages between the two users
    const messages = await ChatMessage.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function insertDummyProfileData() {
  const user = await Profiles.findOne({ username: "Cornars" });
  if (user === null) { //continue
    try {
      await Profiles.insertMany([
        {
          username: "Cornars",
          password: await bcrypt.hash("123", 10),
          ownerName: "Luis",
          dogName: "Chammy",
          dogBreed: "Papillion",
          location: "Cebu City",
          about: "he is a tiny boy",
          petImage: "istockphoto-92187842-612x612.jpg",
        },
        {
          username: "Isaiah_Pasc",
          password: await bcrypt.hash("123", 10),
          ownerName: "Sam",
          dogName: "Snow",
          dogBreed: "Border Collie",
          location: "Manila",
          about: "he is a big boy",
          petImage: "licensed-image.jpg",
        },
        {
          username: "James",
          password: await bcrypt.hash("123", 10),
          ownerName: "David",
          dogName: "Chunky",
          dogBreed: "Pomeranian",
          location: "Iloilo",
          about: "He is a cute boy",
          petImage: "licensed-image(1).jpg",
        },
        {
          username: "Mark",
          password: await bcrypt.hash("123", 10),
          ownerName: "Jan",
          dogName: "Ching",
          dogBreed: "Chihuahua",
          location: "Manila",
          about: "he is a tiny boy",
          petImage: "chihuahua.jpg",
        },
        {
          username: "xabooty",
          password: await bcrypt.hash("123", 10),
          ownerName: "Luis",
          dogName: "Shan",
          dogBreed: "Shih Tzu",
          location: "Cebu City",
          about: "he is a tiny girl",
          petImage: "shih.jpg",
        },
      ]);
    } catch (error) {
      console.log('err', + error)
    }
  }
}
// insertDummyProfileData(); // CALL ONLY ONCE

app.listen(port, () => {
  console.log('Server running on port ' + port + '.');
});
