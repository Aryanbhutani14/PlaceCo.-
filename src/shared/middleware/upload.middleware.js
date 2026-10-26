const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (!isExtAllowed || !isMimeAllowed) {
    const error = new Error('File type not supported. Allowed types: PDF, DOC, DOCX, PNG, JPG.');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_BYTES
  },
  fileFilter
});

function handleUpload(fieldName) {
  const uploadSingle = upload.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds the allowed limit of 5MB.'
          });
        }
        if (err.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error occurred while uploading the file.'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded. Please select a document.'
        });
      }

      // Check for empty file
      if (req.file.size === 0) {
        // Delete the empty file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Uploaded file is empty (0 bytes). Please upload a valid document.'
        });
      }

      next();
    });
  };
}

module.exports = {
  handleUpload,
  uploadDir
};
