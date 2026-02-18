// server/debug.js

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Your .env has MONGO_URI (not MONGODB_URI)
const MONGO_URI = process.env.MONGO_URI;

console.log('URI found:', MONGO_URI ? 'Yes' : 'No');

async function checkDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');

    const db = mongoose.connection.db;

    const total = await db.collection('questions').countDocuments({});
    console.log('Total questions:', total);

    const notFalse = await db.collection('questions').countDocuments({ isActive: { $ne: false } });
    console.log('Active (not false):', notFalse);

    console.log('\n=== UNIQUE PAPERS ===');
    const papers = await db.collection('questions').distinct('paper');
    console.log(papers);

    console.log('\n=== UNIQUE UNITS ===');
    const units = await db.collection('questions').distinct('unit');
    units.forEach(u => console.log('  "' + u + '"'));

    console.log('\n=== UNIQUE CHAPTERS ===');
    const chapters = await db.collection('questions').distinct('chapter');
    chapters.forEach(c => console.log('  "' + c + '"'));

    console.log('\n=== UNIQUE TOPICS ===');
    const topics = await db.collection('questions').distinct('topic');
    topics.forEach(t => console.log('  "' + t + '"'));

    console.log('\n=== FIRST 3 QUESTIONS ===');
    const samples = await db.collection('questions').find({}).limit(3).toArray();
    samples.forEach((q, i) => {
      console.log('\n--- Q' + (i + 1) + ' ---');
      console.log('paper:', JSON.stringify(q.paper));
      console.log('unit:', JSON.stringify(q.unit));
      console.log('chapter:', JSON.stringify(q.chapter));
      console.log('topic:', JSON.stringify(q.topic));
      console.log('type:', q.questionType);
      console.log('isActive:', q.isActive);
    });

    console.log('\n=== FILTER TESTS ===');

    const p1 = await db.collection('questions').countDocuments({ paper: 'paper1' });
    console.log('paper=paper1:', p1);

    const unitR = await db.collection('questions').countDocuments({
      unit: { $regex: 'data interpretation', $options: 'i' }
    });
    console.log('unit~"data interpretation":', unitR);

    const chapR = await db.collection('questions').countDocuments({
      chapter: { $regex: 'graphical', $options: 'i' }
    });
    console.log('chapter~"graphical":', chapR);

    const exact = await db.collection('questions').countDocuments({
      paper: 'paper1',
      unit: 'UNIT VII: Data Interpretation',
      chapter: 'Graphical Representation',
      topic: 'Types of Charts',
      isActive: { $ne: false }
    });
    console.log('Exact filter:', exact);

    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDB();