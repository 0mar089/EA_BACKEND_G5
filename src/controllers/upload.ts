import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UploadService from '../services/upload';

const uploadImage = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: 'No se ha proporcionado ninguna imagen'
            });
        }

        const result: any =
            await UploadService.uploadImage(req.file.buffer);

        return res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error: any) {
        // Cloud / multer / file validation errors
        if (error?.http_code === 413 || error?.message?.includes('too large')) {
            return res.status(413).json({
                message: 'Archivo demasiado grande'
            });
        }

        if (error?.message?.includes('invalid') || error?.message?.includes('format')) {
            return res.status(422).json({
                message: 'Formato de imagen no válido'
            });
        }

        return res.status(500).json({
            message: 'Error al procesar la imagen'
        });
    }
};

export default { uploadImage };