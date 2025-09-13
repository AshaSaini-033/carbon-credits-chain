import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, AppError } from '../middleware/errorHandling';
import ipfsService from '../services/ipfs';
import logger from '../utils/logger';

const router = Router();

// Configure multer for IPFS uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520'), // 20MB default
    files: 1
  }
});

/**
 * POST /api/ipfs/upload
 * Upload a single file to IPFS
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file provided', 400);
  }

  if (!ipfsService.isAvailable()) {
    throw new AppError('IPFS service not available. Please configure WEB3_STORAGE_TOKEN', 503);
  }

  const { originalname, buffer, mimetype, size } = req.file;

  logger.info('Uploading file to IPFS', { 
    fileName: originalname, 
    size, 
    mimeType: mimetype 
  });

  try {
    const cid = await ipfsService.pinFile(originalname, buffer);
    
    res.json({
      success: true,
      data: {
        cid,
        fileName: originalname,
        size,
        mimeType: mimetype,
        ipfsUrl: ipfsService.getFileUrl(cid),
        gatewayUrl: `https://dweb.link/ipfs/${cid}`
      },
      message: 'File uploaded to IPFS successfully'
    });
  } catch (error) {
    logger.error('IPFS upload failed:', error);
    throw new AppError(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}));

/**
 * POST /api/ipfs/upload-json
 * Upload JSON data to IPFS
 */
router.post('/upload-json', asyncHandler(async (req, res) => {
  const { data, fileName } = req.body;

  if (!data) {
    throw new AppError('No data provided', 400);
  }

  if (!ipfsService.isAvailable()) {
    throw new AppError('IPFS service not available. Please configure WEB3_STORAGE_TOKEN', 503);
  }

  logger.info('Uploading JSON data to IPFS', { fileName });

  try {
    const cid = await ipfsService.pinJSON(data, fileName);
    
    res.json({
      success: true,
      data: {
        cid,
        fileName: fileName || 'data.json',
        ipfsUrl: ipfsService.getFileUrl(cid),
        gatewayUrl: `https://dweb.link/ipfs/${cid}`
      },
      message: 'JSON data uploaded to IPFS successfully'
    });
  } catch (error) {
    logger.error('IPFS JSON upload failed:', error);
    throw new AppError(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}));

/**
 * GET /api/ipfs/status
 * Get IPFS service status
 */
router.get('/status', asyncHandler(async (req, res) => {
  const isAvailable = ipfsService.isAvailable();
  
  res.json({
    success: true,
    data: {
      available: isAvailable,
      configured: !!process.env.WEB3_STORAGE_TOKEN,
      gateway: 'https://dweb.link/ipfs/',
      message: isAvailable ? 'IPFS service is available' : 'IPFS service not configured'
    }
  });
}));

/**
 * GET /api/ipfs/:cid
 * Get IPFS file URL and metadata
 */
router.get('/:cid', asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const { fileName } = req.query;

  if (!cid) {
    throw new AppError('CID is required', 400);
  }

  // Basic CID validation (simplified)
  if (!cid.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/) && !cid.match(/^bafy[a-z2-7]{56}$/)) {
    throw new AppError('Invalid IPFS CID format', 400);
  }

  const fileUrl = ipfsService.getFileUrl(cid, fileName as string);
  
  res.json({
    success: true,
    data: {
      cid,
      fileName: fileName || null,
      ipfsUrl: fileUrl,
      gatewayUrl: `https://dweb.link/ipfs/${cid}${fileName ? `/${fileName}` : ''}`
    }
  });
}));

export default router;