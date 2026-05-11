import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// El SDK de Cloudinary detecta automáticamente la variable de entorno CLOUDINARY_URL
if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
}

export default cloudinary;
