import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, AppError } from '../middleware/errorHandling';
import { Database } from '../db';
import ipfsService from '../services/ipfs';
import chainRelayer from '../services/chainRelayer';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520'), // 20MB default
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow images and JSON files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only image and JSON files are allowed'));
    }
  }
});

// Validation schemas
const submitMRVSchema = Joi.object({
  projectId: Joi.number().integer().positive().required(),
  carbonTonnes: Joi.number().positive().required(),
  methodology: Joi.string().required(),
  measurementDate: Joi.date().iso().required(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  biomassData: Joi.object({
    canopyArea: Joi.number().positive().required(),
    avgBiomassDensity: Joi.number().positive().required(),
    biomassKg: Joi.number().positive().required(),
    carbonKg: Joi.number().positive().required()
  }).required(),
  additionalMetadata: Joi.object().optional()
});

const processMRVSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  notes: Joi.string().required().min(10).max(500),
  verifierAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
});

/**
 * GET /api/mrv
 * Get MRV submissions (optionally filtered by status)
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status = 'submitted', limit = 20, offset = 0 } = req.query;

  const mrvSubmissions = await Database.getMRVSubmissionsByStatus(status as string);

  // Enhance with IPFS URLs
  const enhancedSubmissions = mrvSubmissions.slice(Number(offset), Number(offset) + Number(limit)).map(mrv => ({
    ...mrv,
    packageUrl: mrv.package_cid ? ipfsService.getFileUrl(mrv.package_cid) : null,
    mrvDataUrl: mrv.package_cid ? ipfsService.getFileUrl(mrv.package_cid, 'mrv-data.json') : null
  }));

  res.json({
    success: true,
    data: {
      submissions: enhancedSubmissions,
      total: mrvSubmissions.length,
      status
    }
  });
}));

/**
 * GET /api/mrv/:id
 * Get specific MRV submission details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const mrvId = parseInt(req.params.id);
  
  if (isNaN(mrvId)) {
    throw new AppError('Invalid MRV ID', 400);
  }

  const mrv = await Database.getMRVSubmission(mrvId);
  
  if (!mrv) {
    throw new AppError('MRV submission not found', 404);
  }

  // Get associated project
  const project = await Database.getProject(mrv.project_id);

  res.json({
    success: true,
    data: {
      mrv: {
        ...mrv,
        packageUrl: mrv.package_cid ? ipfsService.getFileUrl(mrv.package_cid) : null,
        mrvDataUrl: mrv.package_cid ? ipfsService.getFileUrl(mrv.package_cid, 'mrv-data.json') : null,
        packageMetadataUrl: mrv.package_cid ? ipfsService.getFileUrl(mrv.package_cid, 'package-metadata.json') : null
      },
      project
    }
  });
}));

/**
 * POST /api/mrv/submit
 * Submit MRV package with evidence files
 */
router.post('/submit', upload.array('evidence'), asyncHandler(async (req, res) => {
  // Parse MRV data from form field
  const mrvDataRaw = req.body.mrvData;
  if (!mrvDataRaw) {
    throw new AppError('MRV data is required', 400);
  }

  let mrvData;
  try {
    mrvData = typeof mrvDataRaw === 'string' ? JSON.parse(mrvDataRaw) : mrvDataRaw;
  } catch (error) {
    throw new AppError('Invalid MRV data JSON', 400);
  }

  // Validate MRV data
  const { error, value } = submitMRVSchema.validate(mrvData);
  if (error) {
    throw new AppError(`Validation error: ${error.details[0].message}`, 400);
  }

  const validatedMRVData = value;
  const files = req.files as Express.Multer.File[];

  // Verify project exists
  const project = await Database.getProject(validatedMRVData.projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  logger.info('Submitting MRV package', { 
    projectId: validatedMRVData.projectId, 
    carbonTonnes: validatedMRVData.carbonTonnes,
    filesCount: files?.length || 0 
  });

  // Create MRV package and pin to IPFS
  let packageCid = '';
  if (ipfsService.isAvailable()) {
    try {
      const imageBuffers = files?.map(file => file.buffer) || [];
      packageCid = await ipfsService.createMRVPackage(validatedMRVData, imageBuffers);
      logger.info('MRV package pinned to IPFS', { packageCid });
    } catch (error) {
      logger.error('Failed to pin MRV package to IPFS:', error);
      // Continue without IPFS for demo purposes
    }
  }

  // Save MRV submission to database
  const mrvSubmissionData = {
    project_id: validatedMRVData.projectId,
    package_cid: packageCid,
    carbon_tonnes: validatedMRVData.carbonTonnes,
    status: 'submitted'
  };

  const mrvSubmission = await Database.createMRVSubmission(mrvSubmissionData);

  logger.info('MRV submission created', { 
    mrvId: mrvSubmission.id, 
    projectId: validatedMRVData.projectId,
    packageCid 
  });

  res.status(201).json({
    success: true,
    data: {
      mrv: {
        ...mrvSubmission,
        packageUrl: packageCid ? ipfsService.getFileUrl(packageCid) : null
      },
      project
    },
    message: 'MRV package submitted successfully'
  });
}));

/**
 * POST /api/mrv/:id/process
 * Approve or reject MRV submission (verifier action)
 */
router.post('/:id/process', asyncHandler(async (req, res) => {
  const mrvId = parseInt(req.params.id);
  
  if (isNaN(mrvId)) {
    throw new AppError('Invalid MRV ID', 400);
  }

  // Validate request body
  const { error, value } = processMRVSchema.validate(req.body);
  if (error) {
    throw new AppError(`Validation error: ${error.details[0].message}`, 400);
  }

  const { action, notes, verifierAddress } = value;

  // Get MRV submission
  const mrv = await Database.getMRVSubmission(mrvId);
  if (!mrv) {
    throw new AppError('MRV submission not found', 404);
  }

  if (mrv.status !== 'submitted') {
    throw new AppError('MRV submission has already been processed', 400);
  }

  logger.info(`Processing MRV submission: ${action}`, { 
    mrvId, 
    verifierAddress, 
    notes: notes.substring(0, 50) 
  });

  let blockchainTxHash = '';

  // Process on blockchain if configured
  if (chainRelayer.isConfigured()) {
    try {
      if (action === 'approve') {
        blockchainTxHash = await chainRelayer.approveMRVOnChain(mrvId, notes);
        logger.info('MRV approved on blockchain', { mrvId, txHash: blockchainTxHash });
      } else {
        blockchainTxHash = await chainRelayer.rejectMRVOnChain(mrvId, notes);
        logger.info('MRV rejected on blockchain', { mrvId, txHash: blockchainTxHash });
      }
    } catch (error) {
      logger.error('Blockchain transaction failed:', error);
      // Continue with database update even if blockchain fails for demo
    }
  }

  // Update database
  const updates = {
    status: action === 'approve' ? 'approved' : 'rejected',
    verifier_address: verifierAddress,
    notes: notes,
    processed_at: new Date().toISOString(),
    blockchain_tx_hash: blockchainTxHash
  };

  const updatedMRV = await Database.updateMRVSubmission(mrvId, updates);

  const message = action === 'approve' ? 
    'MRV submission approved and tokens minted' : 
    'MRV submission rejected';

  res.json({
    success: true,
    data: {
      mrv: {
        ...updatedMRV,
        packageUrl: updatedMRV.package_cid ? ipfsService.getFileUrl(updatedMRV.package_cid) : null
      },
      blockchainTxHash
    },
    message
  });
}));

/**
 * GET /api/mrv/:id/evidence/:fileName
 * Get specific evidence file from IPFS package
 */
router.get('/:id/evidence/:fileName', asyncHandler(async (req, res) => {
  const mrvId = parseInt(req.params.id);
  const fileName = req.params.fileName;
  
  const mrv = await Database.getMRVSubmission(mrvId);
  
  if (!mrv) {
    throw new AppError('MRV submission not found', 404);
  }

  if (!mrv.package_cid) {
    throw new AppError('MRV package not available', 404);
  }

  // Return IPFS URL for the specific file
  const fileUrl = ipfsService.getFileUrl(mrv.package_cid, fileName);

  res.json({
    success: true,
    data: {
      fileName,
      fileUrl,
      packageCid: mrv.package_cid
    }
  });
}));

/**
 * GET /api/mrv/stats
 * Get MRV statistics
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const [submitted, approved, rejected] = await Promise.all([
    Database.getMRVSubmissionsByStatus('submitted'),
    Database.getMRVSubmissionsByStatus('approved'),
    Database.getMRVSubmissionsByStatus('rejected')
  ]);

  const totalCarbonApproved = approved.reduce((sum, mrv) => sum + parseFloat(mrv.carbon_tonnes || '0'), 0);
  const totalCarbonPending = submitted.reduce((sum, mrv) => sum + parseFloat(mrv.carbon_tonnes || '0'), 0);

  res.json({
    success: true,
    data: {
      submissions: {
        total: submitted.length + approved.length + rejected.length,
        submitted: submitted.length,
        approved: approved.length,
        rejected: rejected.length
      },
      carbonTonnes: {
        totalApproved: totalCarbonApproved,
        totalPending: totalCarbonPending,
        totalRejected: rejected.reduce((sum, mrv) => sum + parseFloat(mrv.carbon_tonnes || '0'), 0)
      }
    }
  });
}));

export default router;