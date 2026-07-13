const mongoose = require('mongoose');
const Test = require('./models/Test');

async function activateTests() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Arjit7353:Om%23%23735303@cluster0.zuunzra.mongodb.net/netprep?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);

    // Activate all PYQ tests
    const result = await Test.updateMany({ hasPYQ: true }, { status: 'active' });
    
    console.log(`\n✅ Updated ${result.modifiedCount} tests to status: active\n`);

    // Show updated tests
    const tests = await Test.find({ hasPYQ: true }).select('_id title status').limit(3);
    tests.forEach((t, i) => {
      console.log(`${i+1}. ${t.title}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   URL: http://localhost:5173/test/${t._id}\n`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

activateTests();
