import multer from 'multer';

// Usamos memoria para no guardar archivos temporales en el servidor,
// los enviaremos directamente a Cloudinary desde el buffer.
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes') as any, false);
        }
    }
});

export default upload;
