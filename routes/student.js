const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Check duplicate attempt (same roll number, same day)
router.get('/check-attempt', async (req, res) => {
  try {
    const { rollNumber, department, section } = req.query;

    if (!rollNumber || !department || !section) {
      return res.json({ isDuplicate: false });
    }

    const [rows] = await db.query(
      `SELECT id FROM responses 
       WHERE roll_number = ? 
       AND department = ? 
       AND section = ? 
       AND DATE(submitted_at) = CURDATE()`,
      [rollNumber, department, section]
    );

    res.json({ isDuplicate: rows.length > 0 });
  } catch (error) {
    console.error('Check attempt error:', error);
    res.json({ isDuplicate: false });
  }
});

// Get questions for student
router.get('/questions', async (req, res) => {
  try {
    const { department, section } = req.query;

    if (!department || !section) {
      return res.status(400).json({ message: 'Department and section required' });
    }

    const [questions] = await db.query(
      `SELECT id, department, section, question, option_a, option_b, option_c, option_d 
       FROM questions 
       WHERE department = ? AND section = ?
       ORDER BY RAND()`,
      [department, section]
    );

    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Submit exam
router.post('/submit-exam', async (req, res) => {
  try {
    const { rollNumber, name, department, section, answers, tabSwitched } = req.body;

    if (!rollNumber || !name || !department || !section) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if already submitted today
    const [existing] = await db.query(
      `SELECT id FROM responses 
       WHERE roll_number = ? 
       AND department = ? 
       AND section = ? 
       AND DATE(submitted_at) = CURDATE()`,
      [rollNumber, department, section]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already submitted the exam today' });
    }

    // Get correct answers
    const [questions] = await db.query(
      `SELECT id, correct_option FROM questions 
       WHERE department = ? AND section = ?`,
      [department, section]
    );

    // Calculate score
    let score = 0;
    const totalMarks = questions.length;

    questions.forEach(q => {
      if (answers[q.id] && answers[q.id].toUpperCase() === q.correct_option.toUpperCase()) {
        score++;
      }
    });

    // Insert response
    await db.query(
      `INSERT INTO responses (roll_number, name, department, section, score, total_marks, tab_switched) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [rollNumber, name, department, section, score, totalMarks, tabSwitched ? 1 : 0]
    );

    res.json({ 
      success: true, 
      score, 
      totalMarks,
      message: 'Exam submitted successfully' 
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ message: 'Failed to submit exam' });
  }
});

module.exports = router;
