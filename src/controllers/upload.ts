import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UploadService from '../services/upload';

const uploadImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
        }

        const result: any = await UploadService.uploadImage(req.file.buffer);

        return res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error('Error en UploadController:', error);
        return res.status(500).json({ error: 'Error al procesar la imagen' });
    }
};

export default { uploadImage };
