const mongoose = require('mongoose');
const { Schema } = mongoose;

const testSchema = new Schema({
    update: Buffer
});

const TestModel = mongoose.model('Test', testSchema);

async function run() {
    await mongoose.connect('mongodb://localhost:27017/test-sync-space');
    
    await TestModel.deleteMany({});
    
    const doc = new TestModel({ update: Buffer.from([1, 2, 3]) });
    await doc.save();
    
    const found = await TestModel.findOne({}).lean();
    console.log("Constructor:", found.update.constructor.name);
    console.log("IsBuffer:", found.update instanceof Buffer);
    console.log("HasBuffer:", !!found.update.buffer);
    if (! (found.update instanceof Buffer)) {
       console.log("Buffer field in mongodb.Binary:", found.update.buffer instanceof Buffer);
    }
    
    process.exit(0);
}
run();
