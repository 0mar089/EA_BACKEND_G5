import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UploadService from '../services/upload';
import Logging from '../library/Logging';

const uploadImage = async (req: AuthRequest, res: Response) => {
    try {

        if (!req.file) {
            Logging.warning(`[400] [upload] No File Provided | userId=${req.user?.id}`);
            return res.status(400).json({
                message: 'No se ha proporcionado ninguna imagen'
            });
        }

        const result: any =
            await UploadService.uploadImage(req.file.buffer);

        Logging.info(`[200] [upload] Image Uploaded | userId=${req.user?.id} public_id=${result.public_id}`);

        return res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error: any) {

        // Cloud / multer / file validation errors
        if (error?.http_code === 413 || error?.message?.includes('too large')) {
            Logging.warning(`[413] [upload] File Too Large | userId=${req.user?.id}`);
            return res.status(413).json({
                message: 'Archivo demasiado grande'
            });
        }

        if (error?.message?.includes('invalid') || error?.message?.includes('format')) {
            Logging.warning(`[422] [upload] Invalid Image Format | userId=${req.user?.id}`);
            return res.status(422).json({
                message: 'Formato de imagen no válido'
            });
        }

        Logging.error(`[500] [upload] Image Upload Failed | userId=${req.user?.id} error=${error}`);
        return res.status(500).json({
            message: 'Error al procesar la imagen'
        });
    }
};

export default { uploadImage };