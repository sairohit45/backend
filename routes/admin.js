const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Admin Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get all questions (admin)
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const { department, section } = req.query;
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (section) {
      query += ' AND section = ?';
      params.push(section);
    }

    query += ' ORDER BY created_at DESC';

    const [questions] = await db.query(query, params);
    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Add question
router.post('/questions', authMiddleware, async (req, res) => {
  try {
    const { department, section, question, optionA, optionB, optionC, optionD, correctOption } = req.body;

    if (!department || !section || !question || !optionA || !optionB || !optionC || !optionD || !correctOption) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [result] = await db.query(
      `INSERT INTO questions (department, section, question, option_a, option_b, option_c, option_d, correct_option) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [department, section, question, optionA, optionB, optionC, optionD, correctOption.toUpperCase()]
    );

    res.json({ id: result.insertId, message: 'Question added successfully' });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ message: 'Failed to add question' });
  }
});

// Delete question
router.delete('/questions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM questions WHERE id = ?', [id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

// Get responses with duplicate detection
router.get('/responses', authMiddleware, async (req, res) => {
  try {
    const { date, department, section } = req.query;
    
    let query = `
      SELECT r.*, 
        (SELECT COUNT(*) FROM responses r2 
         WHERE r2.roll_number = r.roll_number 
         AND DATE(r2.submitted_at) = DATE(r.submitted_at)
         AND r2.id < r.id) > 0 as is_duplicate
      FROM responses r 
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND DATE(r.submitted_at) = ?';
      params.push(date);
    }
    if (department) {
      query += ' AND r.department = ?';
      params.push(department);
    }
    if (section) {
      query += ' AND r.section = ?';
      params.push(section);
    }

    query += ' ORDER BY r.submitted_at DESC';

    const [responses] = await db.query(query, params);
    res.json(responses);
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
});

// Delete single response
router.delete('/responses/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM responses WHERE id = ?', [id]);
    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ message: 'Failed to delete response' });
  }
});

// Delete responses by date
router.delete('/responses/by-date/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const [result] = await db.query('DELETE FROM responses WHERE DATE(submitted_at) = ?', [date]);
    res.json({ message: `Deleted ${result.affectedRows} responses` });
  } catch (error) {
    console.error('Delete by date error:', error);
    res.status(500).json({ message: 'Failed to delete responses' });
  }
});

module.exports = router;
