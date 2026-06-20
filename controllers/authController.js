const { getDb } = require('../config/database');

function formatCollegeId(i) {
  const year = new Date().getFullYear();
  const suffix = String(i).padStart(4, '0');
  return `COL${year}${suffix}`;
}

async function login(req, res) {
  try {
    const { username, password, remember } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const db = getDb();
    const user = await db.collection('users').findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      collegeId: user.collegeId,
      collegeName: user.collegeName
    };
    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
    }
    return res.json({ role: user.role });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

async function register(req, res) {
  try {
    const { collegeName, username, password, confirmPassword } = req.body;
    if (!collegeName || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords must match' });
    }
    const db = getDb();
    const existing = await db.collection('users').findOne({ username });
    if (existing) {
      return res.status(409).json({ message: 'Username already taken' });
    }
    const lastUser = await db.collection('users')
      .find({ collegeId: { $regex: '^COL' } })
      .sort({ collegeId: -1 })
      .limit(1)
      .toArray();
    let nextId = 1;
    if (lastUser.length > 0) {
      const numeric = parseInt(lastUser[0].collegeId.slice(7), 10);
      nextId = numeric + 1;
    }
    const collegeId = formatCollegeId(nextId);
    await db.collection('users').insertOne({
      collegeId,
      collegeName,
      username,
      password,
      role: 'user'
    });
    return res.json({ message: 'Account created', collegeId });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
}

async function profile(req, res) {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const db = getDb();
    const user = await db.collection('users').findOne({ username: req.session.user.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: user.username, collegeName: user.collegeName, collegeId: user.collegeId, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load profile', error: error.message });
  }
}

module.exports = { login, register, logout, profile };