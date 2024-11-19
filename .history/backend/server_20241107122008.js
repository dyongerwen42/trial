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

const app = express();

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware to serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Hardcoded MongoDB URI and email credentials
// const MONGO_URI = 'mongodb+srv://apidesk22:o9D2nlbHLai5z8iY@cluster0.gwsphyx.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_URI = 'mongodb://localhost:27017'
const EMAIL_USER = 'your-email@gmail.com';
const EMAIL_PASS = 'your-email-password';

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

// Connect to MongoDB
connectToMongoDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

// Rate Limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many login attempts, please try again later.'
});

// Passport Configuration
passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
  try {
    const user = await db.collection('users').findOne({ username });
    if (!user) return done(null, false, { message: 'No user found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Incorrect password' });

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

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Middleware to ensure authentication
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Helper function to filter empty objects
const filterEmpty = (array) => array.filter(item => item && typeof item === 'string');

// Routes
app.post('/register', async (req, res) => {
  const { username, password, name, address, phoneNumber, email } = req.body;

  console.log('Received registration request with data:', { username, name, address, phoneNumber, email });

  try {
    // Automatically create a new group
    const newGroupData = { groupName: `${name}'s group`, data: {} }; // Customize as needed
    console.log('Creating new group with data:', newGroupData);
    const groupResult = await db.collection('data').insertOne(newGroupData);
    const finalGroupId = groupResult.insertedId;
    console.log('New group created with ID:', finalGroupId);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

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

    console.log('Creating new user with data:', newUser);
    const userResult = await db.collection('users').insertOne(newUser);
    console.log('New user created with ID:', userResult.insertedId);

    res.status(201).json({ userId: userResult.insertedId });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/login', loginLimiter, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ error: 'No user found' });
    req.logIn(user, err => {
      if (err) return next(err);
      res.status(200).json({ message: 'Logged in', user });
    });
  })(req, res, next);
});

app.post('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.status(200).json({ message: 'Logged out' });
  });
});

app.get('/group-data', ensureAuthenticated, async (req, res) => {
  try {
    const data = await db.collection('data').findOne({ _id: new ObjectId(req.user.groupId) });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/mjops', ensureAuthenticated, async (req, res) => {
  try {
    const mjops = await db.collection('mjops').find().toArray();
    res.status(200).json(mjops);
  } catch (err) {
    console.error('Error fetching MJOPs:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/create-subuser', ensureAuthenticated, async (req, res) => {
  const { email, groupId } = req.body;
  try {
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ error: 'Invalid groupId' });
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
      subject: 'Your Subuser Account',
      text: `Your account has been created. Username: ${email}, Password: ${password}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Error sending email' });
      }
      res.status(201).json({ message: 'Subuser created and email sent', user: result.ops[0] });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create new group data
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

// Get MJOP by ID
app.get('/mjop/:id', ensureAuthenticated, async (req, res) => {
  try {
    const mjopId = req.params.id;
    if (!isValidObjectId(mjopId)) {
      return res.status(400).json({ error: 'Invalid MJOP ID' });
    }

    const mjop = await db.collection('mjops').findOne({ _id: new ObjectId(mjopId) });
    if (!mjop) {
      return res.status(404).json({ error: 'MJOP not found' });
    }

    res.status(200).json(mjop);
  } catch (err) {
    console.error('Error fetching MJOP:', err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/save-mjop', ensureAuthenticated, upload.none(), async (req, res) => {
  try {
    const { mjop, generalInfo, cashInfo, globalElements, globalSpaces, globalDocuments, offerGroups } = req.body;


    console.log('Received Global Spaces:', globalSpaces);


    const newMJOP = {
      mjop: JSON.parse(mjop),
      generalInfo: JSON.parse(generalInfo),
      cashInfo: JSON.parse(cashInfo),
      globalElements: JSON.parse(globalElements),
      globalSpaces: JSON.parse(globalSpaces),
      globalDocuments: JSON.parse(globalDocuments),
      offerGroups: JSON.parse(offerGroups), // Parse and include offerGroups
      createdAt: new Date(),
      createdBy: req.user._id,
    };

  

    const result = await db.collection('mjops').insertOne(newMJOP);
    console.log('MJOP Insert Result:', result);

    res.status(201).json({ message: 'MJOP saved successfully', id: result.insertedId });
  } catch (err) {
    console.error('Error saving MJOP:', err);
    res.status(400).json({ error: err.message });
  }
});


app.put('/mjop/:id', ensureAuthenticated, upload.none(), async (req, res) => {
  try {
    const mjopId = req.params.id;
    if (!isValidObjectId(mjopId)) {
      return res.status(400).json({ error: 'Invalid MJOP ID' });
    }

    const { mjop, generalInfo, cashInfo, globalElements, globalSpaces, globalDocuments, offerGroups } = req.body;

    console.log('Received MJOP data for update:', mjop);
    console.log('Received General Info:', generalInfo);
    console.log('Received Cash Info:', cashInfo);
    console.log('Received Global Elements:', globalElements);
    console.log('Received Global Spaces:', globalSpaces);
    console.log('Received Global Documents:', globalDocuments);
    console.log('Received Offer Groups:', offerGroups);

    const updatedMJOP = {
      mjop: JSON.parse(mjop),
      generalInfo: JSON.parse(generalInfo),
      cashInfo: JSON.parse(cashInfo),
      globalElements: JSON.parse(globalElements),
      globalSpaces: JSON.parse(globalSpaces),
      globalDocuments: JSON.parse(globalDocuments),
      offerGroups: JSON.parse(offerGroups), // Parse and include offerGroups
      updatedAt: new Date(),
      updatedBy: req.user._id,
    };

    console.log('Updated MJOP Object:', JSON.stringify(updatedMJOP, null, 2));

    const result = await db.collection('mjops').updateOne(
      { _id: new ObjectId(mjopId) },
      { $set: updatedMJOP }
    );

    console.log('MJOP Update Result:', result);

    res.status(200).json({ message: 'MJOP updated successfully' });
  } catch (err) {
    console.error('Error updating MJOP:', err);
    res.status(400).json({ error: err.message });
  }
});




// Add this route for file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.status(200).json({ filePath: req.file.path });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
