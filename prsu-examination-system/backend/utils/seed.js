const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const College = require('../models/College');
const Subject = require('../models/Subject');
const connectDB = require('../config/database');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await College.deleteMany();
    await Subject.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('Admin@123', salt);
    const hashedControllerPassword = await bcrypt.hash('Controller@123', salt);

    // Create Super Admin
    await User.create({
      userId: 'PRSU-ADMIN-01',
      password: hashedAdminPassword,
      role: 'admin',
      email: 'admin@prsu.ac.in',
      fullName: 'System Administrator'
    });

    // Create Controllers
    await User.create({
      userId: 'PRSU-CTRL-01',
      password: hashedControllerPassword,
      role: 'controller',
      email: 'controller1@prsu.ac.in',
      fullName: 'Exam Controller One'
    });

    await User.create({
      userId: 'PRSU-CTRL-02',
      password: hashedControllerPassword,
      role: 'controller',
      email: 'controller2@prsu.ac.in',
      fullName: 'Exam Controller Two'
    });

    // Create Colleges
    const colleges = [];
    for (let i = 1; i <= 10; i++) {
      const college = await College.create({
        collegeCode: `C00${i}`,
        collegeName: `PRSU Affiliated College ${i}`,
        address: `Prayagraj District, UP, India`,
        principalName: `Dr. Principal ${i}`,
        email: `college${i}@prsu.ac.in`,
        phone: `987654321${i}`,
        coursesOffered: ['BCA', 'B.Sc', 'B.Com']
      });
      colleges.push(college);
      
      // Create College Admin User
      const hashedCollegePassword = await bcrypt.hash(`College${i}@123`, salt);
      await User.create({
        userId: `COLLEGE-ADMIN-${i}`,
        password: hashedCollegePassword,
        role: 'college',
        email: `college${i}@prsu.ac.in`,
        fullName: `Admin of College ${i}`,
        collegeId: college._id
      });
    }

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

seedData();
