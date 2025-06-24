const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../config/aws');
const File = require('../models/File');
const apiResponse = require('../utils/apiResponse');
const path = require('path');

exports.uploadFile = async (req, res, next) => {
  try {
    let files = [];
    if (req.file) {
      files = [req.file];
    } else if (req.files && Array.isArray(req.files)) {
      files = req.files;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No file(s) uploaded',
          code: 'NO_FILE',
          statusCode: 400,
          details: {},
        },
      });
    }

    const uploadedFiles = [];
    for (const file of files) {
      const { originalname, mimetype, size, buffer, fieldname } = file;
      const ext = path.extname(originalname);
      const key = `${Date.now()}-${fieldname || 'file'}${ext}`;

      // Upload to S3
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/${key}`,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read',
      };
      await s3.send(new PutObjectCommand(uploadParams));

      const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${key}`;

      const dbFile = await File.create({
        originalName: originalname,
        mimeType: mimetype,
        size,
        url: fileUrl,
        s3Key: key,
        uploadedBy: req.user ? req.user._id : null,
      });
      uploadedFiles.push(dbFile);
    }

    return res.status(201).json(apiResponse.success(uploadedFiles, 'File(s) uploaded successfully'));
  } catch (err) {
    next(err);
  }
};
