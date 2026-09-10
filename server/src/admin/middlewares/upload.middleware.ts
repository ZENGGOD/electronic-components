import fs from 'node:fs'
import path from 'node:path'

import multer from 'multer'

// ─────────────────────────────────────────────
// Upload Directory
// ─────────────────────────────────────────────

const uploadDirectory = path.resolve(
  process.cwd(),
  'uploads',
  'products',
)

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    },
  )
}

// ─────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    callback,
  ) => {
    callback(
      null,
      uploadDirectory,
    )
  },

  filename: (
    _req,
    file,
    callback,
  ) => {
    const extension =
      path.extname(
        file.originalname,
      ).toLowerCase()

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1_000_000_000,
      )}${extension}`

    callback(
      null,
      uniqueName,
    )
  },
})

// ─────────────────────────────────────────────
// Allowed Image Types
// ─────────────────────────────────────────────

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const allowedExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]

// Some clients may send images as
// application/octet-stream.
// We allow it only when the file extension
// is a supported image extension.
const genericMimeType =
  'application/octet-stream'

// ─────────────────────────────────────────────
// File Filter
// ─────────────────────────────────────────────

const fileFilter: multer.Options['fileFilter'] =
  (
    _req,
    file,
    callback,
  ) => {
    const extension =
      path.extname(
        file.originalname,
      ).toLowerCase()

    const isValidExtension =
      allowedExtensions.includes(
        extension,
      )

    const isValidMimeType =
      allowedMimeTypes.includes(
        file.mimetype,
      )

    const isGenericMimeType =
      file.mimetype ===
      genericMimeType

    console.log(
      'Product image upload:',
      {
        originalname:
          file.originalname,

        mimetype:
          file.mimetype,

        extension,
      },
    )

    // Standard browser MIME type
    if (
      isValidExtension &&
      isValidMimeType
    ) {
      callback(
        null,
        true,
      )

      return
    }

    // Some upload clients use
    // application/octet-stream.
    // In this case, trust the extension
    // for this development upload flow.
    if (
      isValidExtension &&
      isGenericMimeType
    ) {
      callback(
        null,
        true,
      )

      return
    }

    callback(
      new Error(
        '仅支持 JPG、JPEG、PNG、WEBP 格式的图片',
      ),
    )
  }

// ─────────────────────────────────────────────
// Multer Upload
// Maximum: 10MB
// ─────────────────────────────────────────────

export const uploadProductImageMiddleware =
  multer({
    storage,

    fileFilter,

    limits: {
      fileSize:
        10 * 1024 * 1024,
    },
  })
