import cloudinary from '../config/cloudinary';

const uploadImage = async (fileBuffer: Buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'univy_uploads',
                resource_type: 'auto',
                transformation: [
                    { width: 720, crop: "limit" },
                    { quality: "auto" },
                    { fetch_format: "auto" }
                ]
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export default { uploadImage };
