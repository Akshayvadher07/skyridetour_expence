const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' }); // Load .env file

async function seedMongo() {
  const uri = process.env.MONGODB_URL || "mongodb://localhost:27017/booking";
  console.log('Connecting to:', uri);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "booking");
    const usersCollection = db.collection('users');

    // 1. Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const existingAdmin = await usersCollection.findOne({ email: 'admin@bharatgodam.com' });
    
    if (!existingAdmin) {
      await usersCollection.insertOne({
        email: 'admin@bharatgodam.com',
        name: 'Super Admin',
        password: adminPassword,
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin user inserted into MongoDB: admin@bharatgodam.com (password: admin123)');
    } else {
      await usersCollection.updateOne(
        { email: 'admin@bharatgodam.com' },
        { $set: { password: adminPassword, approvalStatus: 'APPROVED' } }
      );
      console.log('✅ Admin user updated in MongoDB: admin@bharatgodam.com (password: admin123)');
    }

  } catch (error) {
    console.error('❌ Error seeding MongoDB:', error);
  } finally {
    await client.close();
  }
}

seedMongo();
