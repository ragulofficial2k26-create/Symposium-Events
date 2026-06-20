require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { initDb } = require('./config/database');
const { createDefaultAdmin } = require('./database/seedAdmin');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { auth } = require('./middleware/auth');
const { adminAuth } = require('./middleware/adminAuth');

const app = express();
const publicPath = path.join(__dirname, 'public');
const viewsPath = path.join(__dirname, 'views');

app.use(express.static(publicPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'SymposiumSecret2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 3 }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => res.sendFile(path.join(viewsPath, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(viewsPath, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(viewsPath, 'register.html')));
app.get('/about', (req, res) => res.sendFile(path.join(viewsPath, 'about.html')));
app.get('/events', auth, (req, res) => res.sendFile(path.join(viewsPath, 'events.html')));
app.get('/event-details', auth, (req, res) => res.sendFile(path.join(viewsPath, 'event-details.html')));
app.get('/my-registrations', auth, (req, res) => res.sendFile(path.join(viewsPath, 'my-registrations.html')));
app.get('/profile', auth, (req, res) => res.sendFile(path.join(viewsPath, 'profile.html')));

app.get('/admin/dashboard', adminAuth, (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'dashboard.html')));
app.get('/admin/add-event', adminAuth, (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'add-event.html')));
app.get('/admin/edit-event', adminAuth, (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'edit-event.html')));
app.get('/admin/registrations', adminAuth, (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'registrations.html')));
app.get('/admin/participants', adminAuth, (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'participants.html')));
app.get('/admin/reports', adminAuth, (req, res) => res.sendFile(path.join(viewsPath, 'admin', 'reports.html')));

app.use((req, res) => {
  res.status(404).send('Page not found');
});

const port = process.env.PORT || 3000;

initDb()
  .then(async () => {
    await createDefaultAdmin();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
  });
