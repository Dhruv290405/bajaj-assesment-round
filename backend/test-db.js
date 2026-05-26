const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        const TestSchema = new mongoose.Schema({ name: String });
        const TestModel = mongoose.model('Test', TestSchema);
        await TestModel.create({ name: 'test' });
        console.log('Insert success');
        const doc = await TestModel.findOne();
        console.log('Found:', doc);
        await mongoose.connection.db.dropDatabase();
        console.log('Cleanup done');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

test();
