
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary directory for uploaded profile images
const uploadDirectory = path.resolve(
    __dirname,
    "../../uploads"
);

// Create the directory if it doesn't exist
fs.mkdirSync(uploadDirectory, { recursive: true });

// Configure temporary file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const uniqueSuffix =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        cb(
            null,
            `profile-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`
        );
    },
});

// Validate uploaded file types
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error("Only JPEG, PNG, WebP, and GIF images are allowed"),
            false
        );
    }
};

// Configure Multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024 , // 500kb
        files: 1,
    },
});

export { upload }