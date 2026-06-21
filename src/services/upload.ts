import cloudinary from '../config/cloudinary';

const uploadImage = async (
  fileBuffer: Buffer,
): Promise<{ public_id: string; secure_url: string; [key: string]: unknown }> => {
  return new Promise<{ public_id: string; secure_url: string; [key: string]: unknown }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'univy_uploads',
          resource_type: 'auto',
          transformation: [
            { width: 720, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { public_id: string; secure_url: string; [key: string]: unknown });
        },
      );
      uploadStream.end(fileBuffer);
    },
  );
};

export default { uploadImage };
