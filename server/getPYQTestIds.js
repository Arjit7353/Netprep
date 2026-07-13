const mongoose = require('mongoose');
const Test = require('./models/Test');

async function findPYQTest() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Arjit7353:Om%23%23735303@cluster0.zuunzra.mongodb.net/netprep?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);

    const tests = await Test.find({ hasPYQ: true }).select('_id title').limit(3);
    
    console.log('\n📋 PYQ Tests Found:');
    tests.forEach((t, i) => {
      console.log(`\n${i+1}. ${t.title}`);
      console.log(`   URL: http://localhost:5173/test/${t._id}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

findPYQTest();
