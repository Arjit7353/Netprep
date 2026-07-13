const mongoose = require('mongoose');

async function checkPYQData() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Arjit7353:Om%23%23735303@cluster0.zuunzra.mongodb.net/netprep?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000
    });

    console.log('\n📊 === PYQ Database Analysis ===\n');

    // Check PYQAnalysis collection
    const db = mongoose.connection.db;
    
    // 1. PYQAnalysis documents
    console.log('🔍 Checking PYQAnalysis collection...');
    const pyqCount = await db.collection('pyqanalyses').countDocuments();
    console.log(`   ✓ Total PYQ Documents: ${pyqCount}`);
    
    if (pyqCount > 0) {
      const pyqDocs = await db.collection('pyqanalyses')
        .find({}, { projection: { year: 1, session: 1, shift: 1, paper: 1, 'overview.totalQuestions': 1 } })
        .limit(10)
        .toArray();
      
      console.log('\n   PYQ Documents Details:');
      pyqDocs.forEach((doc, i) => {
        const qCount = doc.overview?.totalQuestions || 'N/A';
        console.log(`   ${i+1}. Year: ${doc.year}, Session: ${doc.session}, Shift: ${doc.shift}, Paper: ${doc.paper}, Q: ${qCount}`);
      });
    }

    // 2. Question collection - isPYQ flag
    console.log('\n🔍 Checking Questions collection for isPYQ flag...');
    const isPYQCount = await db.collection('questions').countDocuments({ isPYQ: true });
    console.log(`   ✓ Questions with isPYQ: true = ${isPYQCount}`);

    // 3. Tests with hasPYQ
    console.log('\n🔍 Checking Tests collection for hasPYQ...');
    const testsWithPYQ = await db.collection('tests').countDocuments({ hasPYQ: true });
    console.log(`   ✓ Tests with hasPYQ: true = ${testsWithPYQ}`);

    if (testsWithPYQ > 0) {
      const pyqTests = await db.collection('tests')
        .find({ hasPYQ: true }, { projection: { title: 1, questions: 1, hasPYQ: 1 } })
        .limit(5)
        .toArray();
      
      console.log('\n   Tests with PYQ:');
      pyqTests.forEach((t, i) => {
        const qCount = Array.isArray(t.questions) ? t.questions.length : 0;
        const pyqCount = Array.isArray(t.questions) ? t.questions.filter(q => String(q).startsWith('pyq_')).length : 0;
        console.log(`   ${i+1}. ${t.title} (Total: ${qCount}, PYQ: ${pyqCount})`);
      });
    }

    // 4. Total questions in database
    console.log('\n🔍 Overall Statistics:');
    const totalQuestions = await db.collection('questions').countDocuments();
    const totalTests = await db.collection('tests').countDocuments();
    console.log(`   ✓ Total Questions in DB: ${totalQuestions}`);
    console.log(`   ✓ Total Tests in DB: ${totalTests}`);

    console.log('\n✅ Database check complete!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

checkPYQData();
