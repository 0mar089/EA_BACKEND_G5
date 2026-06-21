import mongoose from 'mongoose';
import { config } from '../config/config';
import Grado from '../models/Grado';
import Universidad from '../models/Universidad';

const run = async () => {
    await mongoose.connect(config.mongo.url);
    console.log('Connected to MongoDB');
    
    const universities = await Universidad.find();
    console.log('Universities:');
    for (const u of universities) {
        console.log(`- ${u.nombre} (${u._id})`);
    }
    
    const grados = await Grado.find();
    console.log('\nGrados:');
    for (const g of grados) {
        console.log(`- ${g.nombre} (ID: ${g._id}, Universidad: ${g.universidad})`);
    }
    
    process.exit(0);
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
