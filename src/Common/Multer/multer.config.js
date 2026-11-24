import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import multer from "multer";
import path from "path";

export const allowedFileformate = {
  img: ["image/png", "image/jpeg", "image/jpg"],
  video: ["video/mp4"],
  pdf: ["application/pdf"],
};

export function localUpload({
  folderName = "GeneralFiles",
  allowedFormate = allowedFileformate.img,
}) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const filePath = path.resolve(`./uploads/${folderName}`);
      if (!existsSync(filePath)) {
        mkdirSync(filePath, { recursive: true });
      }
      cb(null, filePath);
    },

    filename: function (req, file, cb) {
      const fileName = randomUUID() + "_" + file.originalname;

      file.finalPath = `uploads/${folderName}/${fileName}`;

      cb(null, fileName);
    },
  });

  function fileFilter(req, file, cb) {
    if (!allowedFormate.includes(file.mimetype)) {
      return cb(
        new Error("Invalid Format!!", { cause: { statusCode: 400 } }),
        false,
      );
    }

    cb(null, true);
  }

  return multer({
    storage: storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}
