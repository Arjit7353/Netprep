// server/debug.js

const mongoose = require('mongoose');
require('dotenv').config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!\n');

    const db = mongoose.connection.db;

    // 1. Total questions
    const total = await db.collection('questions').countDocuments({});
    console.log('Total questions in DB:', total);

    const active = await db.collection('questions').countDocuments({ isActive: true });
    console.log('Active questions:', active);

    const notFalse = await db.collection('questions').countDocuments({ isActive: { $ne: false } });
    console.log('isActive not false:', notFalse);

    // 2. Unique values
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

    // 3. Sample question
    console.log('\n=== FIRST 3 SAMPLE QUESTIONS ===');
    const samples = await db.collection('questions').find({}).limit(3).toArray();
    samples.forEach((q, i) => {
      console.log(`\n--- Question ${i + 1} ---`);
      console.log('paper:', JSON.stringify(q.paper));
      console.log('unit:', JSON.stringify(q.unit));
      console.log('chapter:', JSON.stringify(q.chapter));
      console.log('topic:', JSON.stringify(q.topic));
      console.log('questionType:', q.questionType);
      console.log('isActive:', q.isActive);
    });

    // 4. Test the exact filter
    console.log('\n=== TESTING EXACT FILTER ===');
    const filterResult = await db.collection('questions').countDocuments({
      paper: 'paper1',
      unit: 'UNIT VII: Data Interpretation',
      chapter: 'Graphical Representation',
      topic: 'Types of Charts',
      isActive: { $ne: false }
    });
    console.log('Exact filter match count:', filterResult);

    // 5. Test paper only
    const paperOnly = await db.collection('questions').countDocuments({
      paper: 'paper1'
    });
    console.log('\nPaper1 only count:', paperOnly);

    // 6. Check if unit exists with case-insensitive
    const unitRegex = await db.collection('questions').countDocuments({
      unit: { $regex: 'data interpretation', $options: 'i' }
    });
    console.log('Unit "data interpretation" (case-insensitive):', unitRegex);

    const chapterRegex = await db.collection('questions').countDocuments({
      chapter: { $regex: 'graphical', $options: 'i' }
    });
    console.log('Chapter "graphical" (case-insensitive):', chapterRegex);

    console.log('\n✅ Debug complete!');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDB();