import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from 'fs';
import { Request } from "express";
import { HttpError } from "../errors/http-error";

// ── Upload directories ──────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../../uploads");
const hlsDir    = path.join(__dirname, "../../uploads/hls");

[uploadDir, hlsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Generic disk storage (reused by both middlewares) ───────────────────────
const createStorage = (dest: string) =>
    multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, dest),
        filename:    (_req, file, cb) => {
            const ext      = path.extname(file.originalname);
            const filename = `${uuidv4()}${ext}`;
            cb(null, filename);
        },
    });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1.  PROFILE / IMAGE  upload  (images only, 5 MB)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const imageFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new HttpError(400, "Only image files are allowed!"));
    }
    cb(null, true);
};

const imageUpload = multer({
    storage:    createStorage(uploadDir),
    fileFilter: imageFilter,
    limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploads = {
    single: (fieldName: string) => imageUpload.single(fieldName),
    array:  (fieldName: string, maxCount: number) => imageUpload.array(fieldName, maxCount),
    fields: (fieldsArray: { name: string; maxCount?: number }[]) => imageUpload.fields(fieldsArray),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2.  MOVIE  upload  (image thumbnail + video, large limit)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const movieFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    const allowed = [
        "image/jpeg", "image/jpg", "image/png", "image/webp",   // thumbnails
        "video/mp4", "video/mpeg", "video/quicktime",            // videos
        "video/x-msvideo", "video/webm",
    ];
    if (!allowed.includes(file.mimetype)) {
        return cb(new HttpError(400, "Only image and video files are allowed!"));
    }
    cb(null, true);
};

const movieUpload = multer({
    storage:    createStorage(uploadDir),
    fileFilter: movieFilter,
    limits:     { fileSize: 5 * 1024 * 1024 * 1024 }, // 5 GB
});

// Use this in movie routes
export const movieUploads = {
    // expects two fields: "thumbnail" (image) and "video" (mp4)
    fields: movieUpload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "video",     maxCount: 1 },
    ]),
};