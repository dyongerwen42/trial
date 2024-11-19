const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Voeg dit toe als je omgevingsvariabelen wilt gebruiken

const app = express();

// Zorg ervoor dat de upload-directory bestaat
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware om statische bestanden uit de uploads-directory te serveren
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Laad configuratie vanuit omgevingsvariabelen
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const EMAIL_USER = process.env.EMAIL_USER || 'your-email@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-email-password';
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';

// MongoDB Client
let db;

const connectToMongoDB = async () => {
  try {
    const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db('mydatabase');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

// Verbind met MongoDB
connectToMongoDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

// CORS Configuratie
const allowedOrigins = ['http://localhost:3000', 'http://34.34.100.96:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Laat verzoeken zonder origine (zoals mobiele apps of server-to-server) toe
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'De CORS-policy staat deze origine niet toe.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Rate Limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 100, // Limiteer elke IP tot 100 verzoeken per windowMs
  message: 'Te veel inlogpogingen, probeer het later opnieuw.'
});

// Passport Configuratie
passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
  try {
    const user = await db.collection('users').findOne({ username });
    if (!user) return done(null, false, { message: 'Geen gebruiker gevonden' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Onjuist wachtwoord' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Nodemailer Configuratie
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Middleware om authenticatie te garanderen
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Niet geautoriseerd' });
};

// Helper functie om ObjectId te valideren
const isValidObjectId = (id) => {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
};

// Multer configuratie voor bestandsuploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Helper functie om lege objecten te filteren
const filterEmpty = (array) => array.filter(item => item && typeof item === 'string');

// Routes

// Registratie
app.post('/register', async (req, res) => {
  const { username, password, name, address, phoneNumber, email } = req.body;

  console.log('Ontvangen registratie verzoek met data:', { username, name, address, phoneNumber, email });

  try {
    // Maak automatisch een nieuwe groep aan
    const newGroupData = { groupName: `${name}'s groep`, data: {} }; // Pas indien nodig aan
    console.log('Nieuwe groep aanmaken met data:', newGroupData);
    const groupResult = await db.collection('data').insertOne(newGroupData);
    const finalGroupId = groupResult.insertedId;
    console.log('Nieuwe groep aangemaakt met ID:', finalGroupId);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Wachtwoord succesvol gehasht');

    const newUser = {
      username,
      password: hashedPassword,
      name,
      address,
      phoneNumber,
      email,
      groupId: finalGroupId,
      role: 'main'
    };

    console.log('Nieuwe gebruiker aanmaken met data:', newUser);
    const userResult = await db.collection('users').insertOne(newUser);
    console.log('Nieuwe gebruiker aangemaakt met ID:', userResult.insertedId);

    res.status(201).json({ userId: userResult.insertedId });
  } catch (err) {
    console.error('Fout tijdens registratie:', err);
    res.status(400).json({ error: err.message });
  }
});

// Inloggen
app.post('/login', loginLimiter, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ error: 'Geen gebruiker gevonden' });
    req.logIn(user, err => {
      if (err) return next(err);
      res.status(200).json({ message: 'Ingelogd', user });
    });
  })(req, res, next);
});

// Uitloggen
app.post('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ error: 'Fout bij uitloggen' });
    }
    res.status(200).json({ message: 'Uitgelogd' });
  });
});

// Groepsdata ophalen
app.get('/group-data', ensureAuthenticated, async (req, res) => {
  try {
    const data = await db.collection('data').findOne({ _id: new ObjectId(req.user.groupId) });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MJOPs ophalen
app.get('/mjops', ensureAuthenticated, async (req, res) => {
  try {
    const mjops = await db.collection('mjops').find().toArray();
    res.status(200).json(mjops);
  } catch (err) {
    console.error('Fout bij ophalen van MJOPs:', err);
    res.status(500).json({ error: err.message });
  }
});

// Subuser aanmaken
app.post('/create-subuser', ensureAuthenticated, async (req, res) => {
  const { email, groupId } = req.body;
  try {
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ error: 'Ongeldige groupId' });
    }

    const mainAccount = req.user._id;
    const password = crypto.randomBytes(8).toString('hex');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username: email,
      password: hashedPassword,
      role: 'sub',
      mainAccount: new ObjectId(mainAccount),
      groupId: new ObjectId(groupId)
    };

    const result = await db.collection('users').insertOne(newUser);

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Je Subuser Account',
      text: `Je account is aangemaakt. Gebruikersnaam: ${email}, Wachtwoord: ${password}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Fout bij verzenden van e-mail' });
      }
      res.status(201).json({ message: 'Subuser aangemaakt en e-mail verzonden', user: result.ops[0] });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Nieuwe groepsdata aanmaken
app.post('/data/create', async (req, res) => {
  const { groupName, data } = req.body;
  try {
    const newData = { groupName, data };
    const result = await db.collection('data').insertOne(newData);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// MJOP ophalen op ID
app.get('/mjop/:id', ensureAuthenticated, async (req, res) => {
  try {
    const mjopId = req.params.id;
    if (!isValidObjectId(mjopId)) {
      return res.status(400).json({ error: 'Ongeldige MJOP ID' });
    }

    const mjop = await db.collection('mjops').findOne({ _id: new ObjectId(mjopId) });
    if (!mjop) {
      return res.status(404).json({ error: 'MJOP niet gevonden' });
    }

    res.status(200).json(mjop);
  } catch (err) {
    console.error('Fout bij ophalen van MJOP:', err);
    res.status(500).json({ error: err.message });
  }
});

// MJOP opslaan
app.post('/save-mjop', ensureAuthenticated, upload.none(), async (req, res) => {
  try {
    const { mjop, generalInfo, cashInfo, globalElements, globalSpaces, globalDocuments, offerGroups } = req.body;

    console.log('Ontvangen Global Spaces:', globalSpaces);

    const newMJOP = {
      mjop: JSON.parse(mjop),
      generalInfo: JSON.parse(generalInfo),
      cashInfo: JSON.parse(cashInfo),
      globalElements: JSON.parse(globalElements),
      globalSpaces: JSON.parse(globalSpaces),
      globalDocuments: JSON.parse(globalDocuments),
      offerGroups: JSON.parse(offerGroups),
      createdAt: new Date(),
      createdBy: req.user._id,
    };

    const result = await db.collection('mjops').insertOne(newMJOP);

    res.status(201).json({ message: 'MJOP succesvol opgeslagen', id: result.insertedId });
  } catch (err) {
    console.error('Fout bij opslaan van MJOP:', err);
    res.status(400).json({ error: err.message });
  }
});

// MJOP bijwerken
app.put('/mjop/:id', ensureAuthenticated, upload.none(), async (req, res) => {
  try {
    const mjopId = req.params.id;
    if (!isValidObjectId(mjopId)) {
      return res.status(400).json({ error: 'Ongeldige MJOP ID' });
    }

    const { mjop, generalInfo, cashInfo, globalElements, globalSpaces, globalDocuments, offerGroups } = req.body;

    fs.writeFile('./elements.json', JSON.stringify(globalElements, null, 4), (err) => {
      if (err) {
        console.error('Fout bij schrijven van bestand:', err);
      }
    });

    const updatedMJOP = {
      mjop: JSON.parse(mjop),
      generalInfo: JSON.parse(generalInfo),
      cashInfo: JSON.parse(cashInfo),
      globalElements: JSON.parse(globalElements),
      globalSpaces: JSON.parse(globalSpaces),
      globalDocuments: JSON.parse(globalDocuments),
      offerGroups: JSON.parse(offerGroups),
      updatedAt: new Date(),
      updatedBy: req.user._id,
    };

    console.log('Aangepast MJOP Object:', JSON.stringify(updatedMJOP, null, 2));

    const result = await db.collection('mjops').updateOne(
      { _id: new ObjectId(mjopId) },
      { $set: updatedMJOP }
    );

    console.log('MJOP Update Result:', result);

    res.status(200).json({ message: 'MJOP succesvol bijgewerkt' });
  } catch (err) {
    console.error('Fout bij bijwerken van MJOP:', err);
    res.status(400).json({ error: err.message });
  }
});

// Bestandsupload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Geen bestand geüpload.');
  }
  res.status(200).json({ filePath: req.file.path });
});

// Start de server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
