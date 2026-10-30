
import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUploader = async (localFilePath) => {
    if (!localFilePath) {
        throw new Error("Local file path is required");
    }

    try {
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "image",
                folder: "FlowForge/profile-images",
            }
        );

        return response;
    } catch (error) {
        console.error("Cloudinary upload failed:", error.message);
        throw error;
    } finally {
        try {
            await fs.unlink(localFilePath);
        } catch (error) {
            if (error.code !== "ENOENT") {
                console.error(
                    "Failed to remove temporary file:",
                    error.message
                );
            }
        }
    }
};

export { cloudinaryUploader, cloudinary };
