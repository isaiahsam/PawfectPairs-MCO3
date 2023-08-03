import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import { MongoClient } from "mongodb";
import { exec } from 'child_process';
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
import flash from "express-flash";
import methodOverride from "method-override";
import initializePassport from "./passport-config.js";

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

// Function to start MongoDB server (mongod)
function startMongoDBServer() {
  console.log('Starting MongoDB server...');
  exec('mongod', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting MongoDB server: ${error.message}`);
    } else {
      console.log(`MongoDB server running: ${stdout}`);
    }
  });
}

// Function to start MongoDB shell (mongosh)
function startMongoDBShell() {
  console.log('Starting MongoDB shell...');
  exec('mongosh', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting MongoDB shell: ${error.message}`);
    } else {
      console.log(`MongoDB shell running: ${stdout}`);
    }
  });
}

// Call the functions to start the server and shell
startMongoDBServer();
startMongoDBShell();

// Get the directory name of the current module using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Database Port
const mongoPort = "mongodb://0.0.0.0:27017/Profiles";
mongoose.connect(mongoPort, { useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

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
  waggedUsers: {
    type: Array,
    default: []
  }
})

const Profiles = mongoose.model('Profiles', profileSchema);

Profiles.find({})
  .then(profiles => {
    console.log('Query result:', profiles);
  })
  .catch(error => {
    console.error('Error querying the database:', error);
  });


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


app.get("/app", async function (req, res) {
  try {
    const user = await req.user
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

async function insertDummyProfileData() {
  const user = await Profiles.findOne({ username: "Cornars" });
  if (user === null) { //continue
    try {
      await Profiles.insertMany([
        {
          username: "Cornars",
          password: "password",
          ownerName: "Luis",
          dogName: "Chammy",
          dogBreed: "Papillion",
          location: "Cebu City",
          about: "he is a tiny boy",
          petImage: "istockphoto-92187842-612x612.jpg",
        },
        {
          username: "Isaiah_Pasc",
          password: "password",
          ownerName: "Sam",
          dogName: "Snow",
          dogBreed: "Border Collie",
          location: "Manila",
          about: "he is a big boy",
          petImage: "licensed-image.jpg",
        },
        {
          username: "James",
          password: "password",
          ownerName: "David",
          dogName: "Chunky",
          dogBreed: "Pomeranian",
          location: "Iloilo",
          about: "He is a cute boy",
          petImage: "licensed-image(1).jpg",
        },
        {
          username: "Mark",
          password: "password",
          ownerName: "Jan",
          dogName: "Ching",
          dogBreed: "Chihuahua",
          location: "Manila",
          about: "he is a tiny boy",
          petImage: "chihuahua.jpg",
        },
        {
          username: "xabooty",
          password: "password",
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
insertDummyProfileData(); // CALL ONLY ONCE

app.listen(port, () => {
  console.log('Server running on port ' + port + '.');
});