import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandling';
import { Database } from '../db';
import ipfsService from '../services/ipfs';
import chainRelayer from '../services/chainRelayer';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(1000),
  ownerAddress: Joi.string().required().pattern(/^0x[a-fA-F0-9]{40}$/),
  geojson: Joi.object().required(),
  metadata: Joi.object().optional()
});

/**
 * GET /api/projects
 * Get all projects or projects by owner
 */
router.get('/', asyncHandler(async (req, res) => {
  const { owner, limit = 20, offset = 0 } = req.query;

  let projects;
  if (owner) {
    projects = await Database.getProjectsByOwner(owner as string);
  } else {
    projects = await Database.getAllProjects(Number(limit), Number(offset));
  }

  // Enhance projects with IPFS URLs
  const enhancedProjects = projects.map(project => ({
    ...project,
    geojsonUrl: project.geojson_cid ? ipfsService.getFileUrl(project.geojson_cid) : null,
    metadataUrl: project.metadata_cid ? ipfsService.getFileUrl(project.metadata_cid) : null
  }));

  res.json({
    success: true,
    data: {
      projects: enhancedProjects,
      total: enhancedProjects.length
    }
  });
}));

/**
 * GET /api/projects/:id
 * Get specific project details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id);
  
  if (isNaN(projectId)) {
    throw new AppError('Invalid project ID', 400);
  }

  const project = await Database.getProject(projectId);
  
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  // Get MRV submissions for this project
  const mrvSubmissions = await Database.getMRVSubmissionsByStatus('submitted');
  const projectMRVs = mrvSubmissions.filter(mrv => mrv.project_id === projectId);

  res.json({
    success: true,
    data: {
      project: {
        ...project,
        geojsonUrl: project.geojson_cid ? ipfsService.getFileUrl(project.geojson_cid) : null,
        metadataUrl: project.metadata_cid ? ipfsService.getFileUrl(project.metadata_cid) : null
      },
      mrvSubmissions: projectMRVs
    }
  });
}));

/**
 * POST /api/projects
 * Create a new blue carbon project
 */
router.post('/', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = createProjectSchema.validate(req.body);
  if (error) {
    throw new AppError(`Validation error: ${error.details[0].message}`, 400);
  }

  const { name, description, ownerAddress, geojson, metadata } = value;

  logger.info('Creating new project', { name, ownerAddress });

  // Pin geojson to IPFS
  let geojsonCid = '';
  if (ipfsService.isAvailable()) {
    try {
      geojsonCid = await ipfsService.pinGeojson(geojson, name);
      logger.info('Geojson pinned to IPFS', { geojsonCid });
    } catch (error) {
      logger.warn('Failed to pin geojson to IPFS:', error);
    }
  }

  // Pin metadata to IPFS if provided
  let metadataCid = '';
  if (metadata && ipfsService.isAvailable()) {
    try {
      metadataCid = await ipfsService.pinJSON(metadata, `${name}-metadata.json`);
      logger.info('Metadata pinned to IPFS', { metadataCid });
    } catch (error) {
      logger.warn('Failed to pin metadata to IPFS:', error);
    }
  }

  // Save to database
  const projectData = {
    name,
    description,
    owner_address: ownerAddress,
    geojson_cid: geojsonCid,
    metadata_cid: metadataCid,
    active: true
  };

  const project = await Database.createProject(projectData);

  logger.info('Project created', { 
    projectId: project.id, 
    name, 
    owner: ownerAddress,
    geojsonCid,
    metadataCid 
  });

  res.status(201).json({
    success: true,
    data: {
      project: {
        ...project,
        geojsonUrl: geojsonCid ? ipfsService.getFileUrl(geojsonCid) : null,
        metadataUrl: metadataCid ? ipfsService.getFileUrl(metadataCid) : null
      }
    },
    message: 'Project created successfully'
  });
}));

/**
 * GET /api/projects/:id/geojson
 * Get project geojson data
 */
router.get('/:id/geojson', asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.id);
  
  const project = await Database.getProject(projectId);
  
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!project.geojson_cid) {
    throw new AppError('Project has no geojson data', 404);
  }

  // Return IPFS URL for geojson
  res.json({
    success: true,
    data: {
      geojsonUrl: ipfsService.getFileUrl(project.geojson_cid),
      cid: project.geojson_cid
    }
  });
}));

/**
 * GET /api/projects/stats
 * Get project statistics
 */
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const allProjects = await Database.getAllProjects(1000, 0); // Get all for stats
  const allMRVs = await Database.getMRVSubmissionsByStatus('approved');

  const stats = {
    totalProjects: allProjects.length,
    activeProjects: allProjects.filter(p => p.active).length,
    totalCarbonClaimed: allMRVs.reduce((sum, mrv) => sum + parseFloat(mrv.carbon_tonnes || '0'), 0),
    avgProjectSize: allProjects.length > 0 ? 
      allMRVs.reduce((sum, mrv) => sum + parseFloat(mrv.carbon_tonnes || '0'), 0) / allProjects.length : 0
  };

  // Get token stats if blockchain is configured
  let tokenStats = null;
  if (chainRelayer.isConfigured()) {
    try {
      tokenStats = await chainRelayer.getTokenStats();
    } catch (error) {
      logger.warn('Could not fetch token stats:', error);
    }
  }

  res.json({
    success: true,
    data: {
      projects: stats,
      tokens: tokenStats,
      blockchain: chainRelayer.getStatus()
    }
  });
}));

export default router;