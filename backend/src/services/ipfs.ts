import { Web3Storage, File } from 'web3.storage';
import logger from '../utils/logger';

class IPFSService {
  private client: Web3Storage | null = null;

  constructor() {
    const token = process.env.WEB3_STORAGE_TOKEN;
    
    if (token) {
      this.client = new Web3Storage({ token });
      logger.info('✅ Web3.Storage client initialized');
    } else {
      logger.warn('⚠️ WEB3_STORAGE_TOKEN not provided, IPFS functionality disabled');
    }
  }

  /**
   * Pin a file to IPFS via web3.storage
   */
  async pinFile(fileName: string, fileContent: Buffer | string): Promise<string> {
    if (!this.client) {
      throw new Error('Web3.Storage not configured. Please set WEB3_STORAGE_TOKEN environment variable.');
    }

    try {
      const file = new File([fileContent], fileName);
      const cid = await this.client.put([file], {
        name: fileName,
        maxRetries: 3
      });

      logger.info('📌 File pinned to IPFS', {
        fileName,
        cid,
        size: fileContent.length
      });

      return cid;
    } catch (error) {
      logger.error('❌ Failed to pin file to IPFS:', error);
      throw new Error(`Failed to pin file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin JSON data to IPFS
   */
  async pinJSON(data: any, fileName?: string): Promise<string> {
    const jsonString = JSON.stringify(data, null, 2);
    const finalFileName = fileName || `data-${Date.now()}.json`;
    
    return this.pinFile(finalFileName, jsonString);
  }

  /**
   * Create MRV package and pin to IPFS
   * Combines images and MRV data into a structured package
   */
  async createMRVPackage(mrvData: any, images: Buffer[] = []): Promise<string> {
    if (!this.client) {
      throw new Error('Web3.Storage not configured');
    }

    try {
      const files: File[] = [];

      // Add MRV data as JSON
      const mrvJson = JSON.stringify(mrvData, null, 2);
      files.push(new File([mrvJson], 'mrv-data.json'));

      // Add images
      images.forEach((imageBuffer, index) => {
        files.push(new File([imageBuffer], `evidence-${index + 1}.jpg`));
      });

      // Create package metadata
      const packageMetadata = {
        packageType: 'MRV_SUBMISSION',
        createdAt: new Date().toISOString(),
        projectId: mrvData.projectId,
        carbonTonnes: mrvData.carbonTonnes,
        evidenceCount: images.length,
        files: files.map(f => f.name)
      };

      files.push(new File([JSON.stringify(packageMetadata, null, 2)], 'package-metadata.json'));

      const cid = await this.client.put(files, {
        name: `mrv-package-${mrvData.projectId}-${Date.now()}`,
        maxRetries: 3
      });

      logger.info('📦 MRV package created and pinned', {
        cid,
        projectId: mrvData.projectId,
        filesCount: files.length,
        carbonTonnes: mrvData.carbonTonnes
      });

      return cid;
    } catch (error) {
      logger.error('❌ Failed to create MRV package:', error);
      throw new Error(`Failed to create MRV package: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file from IPFS (via gateway)
   */
  getFileUrl(cid: string, fileName?: string): string {
    const gateway = 'https://dweb.link/ipfs/';
    return fileName ? `${gateway}${cid}/${fileName}` : `${gateway}${cid}`;
  }

  /**
   * Pin project geojson to IPFS
   */
  async pinGeojson(geojsonData: any, projectName: string): Promise<string> {
    const fileName = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}-boundary.geojson`;
    return this.pinJSON(geojsonData, fileName);
  }

  /**
   * Check if IPFS service is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }
}

export default new IPFSService();