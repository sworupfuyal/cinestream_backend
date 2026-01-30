import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from 'fs';
import { Request } from "express";
import { HttpError } from "../errors/http-error";

const uploadDir = path.join(__dirname,"../../uploads");
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive :true});
}


const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,uploadDir);
    },
    filename: function(req:Request,file,cb){
        const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
        cb(null,filename)
    }
})

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new HttpError(400, "Only image files are allowed!"));
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});


export const uploads = {
  single: (fieldName: string) => upload.single(fieldName),
  array: (fieldName: string, maxCount: number) =>
    upload.array(fieldName, maxCount),
  fields: (fieldsArray: { name: string; maxCount?: number }[]) =>
    upload.fields(fieldsArray),
};




