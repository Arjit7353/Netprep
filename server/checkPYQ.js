const mongoose = require('mongoose');
const Test = require('./models/Test');

async function checkPYQ() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://arjitpatel0402:Arjit123@ac-jkkbscx.zuunzra.mongodb.net/netprep?retryWrites=true&w=majority');
    
    // Find tests that have PYQ questions
    const pyqTests = await Test.find({ hasPYQ: true }).select('_id title questions hasPYQ').limit(3);
    
    if (pyqTests.length === 0) {
      console.log('No tests with PYQ found');
    } else {
      console.log(`Found ${pyqTests.length} tests with PYQ:`);
      pyqTests.forEach((t, i) => {
        const pyqCount = (t.questions || []).filter(q => String(q).startsWith('pyq_')).length;
        console.log(`${i+1}. ${t.title} (_id: ${t._id})`);
        console.log(`   Total questions: ${t.questions.length}, PYQ: ${pyqCount}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkPYQ();
