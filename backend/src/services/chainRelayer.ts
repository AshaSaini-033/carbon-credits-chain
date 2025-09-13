import { ethers } from 'ethers';
import logger from '../utils/logger';

// Contract ABIs (simplified for essential functions)
const REGISTRY_ABI = [
  "function registerProject(string name, string description, string geojsonCid, string metadataCid) external returns (uint256)",
  "function submitMRV(uint256 projectId, string packageCid, uint256 carbonTonnes) external returns (uint256)",
  "function approveMRV(uint256 mrvId, string notes) external",
  "function rejectMRV(uint256 mrvId, string reason) external",
  "function getProject(uint256 projectId) external view returns (tuple(string name, string description, address owner, string geojsonCid, string metadataCid, bool active, uint256 createdAt))",
  "function getMRVSubmission(uint256 mrvId) external view returns (tuple(uint256 projectId, string packageCid, uint256 carbonTonnes, uint8 status, address verifier, uint256 submittedAt, uint256 processedAt, string notes))",
  "event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name)",
  "event MRVSubmitted(uint256 indexed mrvId, uint256 indexed projectId, uint256 carbonTonnes)",
  "event MRVApproved(uint256 indexed mrvId, address indexed verifier, uint256 tokensMinted)",
  "event MRVRejected(uint256 indexed mrvId, address indexed verifier, string reason)"
];

const TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function retire(uint256 amount, string reason) external",
  "function totalSupply() external view returns (uint256)",
  "function totalRetired() external view returns (uint256)",
  "function retiredByAccount(address account) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TokensRetired(address indexed account, uint256 amount, string retirementReason)"
];

class ChainRelayerService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Wallet | null = null;
  private registryContract: ethers.Contract | null = null;
  private tokenContract: ethers.Contract | null = null;
  private networkName: string = 'unknown';

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const rpcUrl = process.env.MUMBAI_RPC_URL || process.env.POLYGON_RPC_URL;
      const privateKey = process.env.PRIVATE_KEY;
      const registryAddress = process.env.REGISTRY_CONTRACT_ADDRESS;
      const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;

      if (!rpcUrl || !privateKey) {
        logger.warn('⚠️ Blockchain configuration incomplete, chain relayer disabled');
        return;
      }

      // Initialize provider and signer
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Get network info
      const network = await this.provider.getNetwork();
      this.networkName = network.name === 'unknown' ? `Chain ${network.chainId}` : network.name;

      // Initialize contracts if addresses are provided
      if (registryAddress) {
        this.registryContract = new ethers.Contract(registryAddress, REGISTRY_ABI, this.signer);
      }

      if (tokenAddress) {
        this.tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, this.signer);
      }

      logger.info('🔗 Chain relayer initialized', {
        network: this.networkName,
        chainId: network.chainId.toString(),
        relayerAddress: this.signer.address,
        registryAddress,
        tokenAddress
      });

    } catch (error) {
      logger.error('❌ Failed to initialize chain relayer:', error);
    }
  }

  /**
   * Approve MRV submission on-chain (triggers token minting)
   */
  async approveMRVOnChain(mrvId: number, notes: string): Promise<string> {
    if (!this.registryContract) {
      throw new Error('Registry contract not initialized');
    }

    try {
      logger.info('📝 Approving MRV on-chain', { mrvId, notes });

      const tx = await this.registryContract.approveMRV(mrvId, notes, {
        gasLimit: 300000 // Set reasonable gas limit
      });

      logger.info('⏳ Transaction submitted', {
        txHash: tx.hash,
        mrvId,
        network: this.networkName
      });

      const receipt = await tx.wait();

      logger.info('✅ MRV approved on-chain', {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        mrvId
      });

      return receipt.hash;
    } catch (error) {
      logger.error('❌ Failed to approve MRV on-chain:', error);
      throw new Error(`Failed to approve MRV on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reject MRV submission on-chain
   */
  async rejectMRVOnChain(mrvId: number, reason: string): Promise<string> {
    if (!this.registryContract) {
      throw new Error('Registry contract not initialized');
    }

    try {
      logger.info('📝 Rejecting MRV on-chain', { mrvId, reason });

      const tx = await this.registryContract.rejectMRV(mrvId, reason, {
        gasLimit: 200000
      });

      const receipt = await tx.wait();

      logger.info('✅ MRV rejected on-chain', {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        mrvId
      });

      return receipt.hash;
    } catch (error) {
      logger.error('❌ Failed to reject MRV on-chain:', error);
      throw new Error(`Failed to reject MRV on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(address: string): Promise<string> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const balance = await this.tokenContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error('❌ Failed to get token balance:', error);
      throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retire tokens on-chain
   */
  async retireTokensOnChain(fromAddress: string, amount: string, reason: string): Promise<string> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      // Note: In production, you'd want the user to sign this transaction themselves
      // This is for demo purposes where the relayer handles it
      
      logger.info('🔥 Retiring tokens on-chain', { fromAddress, amount, reason });

      const amountWei = ethers.parseEther(amount);
      const tx = await this.tokenContract.retire(amountWei, reason, {
        gasLimit: 200000
      });

      const receipt = await tx.wait();

      logger.info('✅ Tokens retired on-chain', {
        txHash: receipt.hash,
        amount,
        reason,
        fromAddress
      });

      return receipt.hash;
    } catch (error) {
      logger.error('❌ Failed to retire tokens on-chain:', error);
      throw new Error(`Failed to retire tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project details from blockchain
   */
  async getProjectFromChain(projectId: number): Promise<any> {
    if (!this.registryContract) {
      throw new Error('Registry contract not initialized');
    }

    try {
      const project = await this.registryContract.getProject(projectId);
      return {
        name: project.name,
        description: project.description,
        owner: project.owner,
        geojsonCid: project.geojsonCid,
        metadataCid: project.metadataCid,
        active: project.active,
        createdAt: project.createdAt.toString()
      };
    } catch (error) {
      logger.error('❌ Failed to get project from chain:', error);
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get MRV submission details from blockchain
   */
  async getMRVFromChain(mrvId: number): Promise<any> {
    if (!this.registryContract) {
      throw new Error('Registry contract not initialized');
    }

    try {
      const mrv = await this.registryContract.getMRVSubmission(mrvId);
      return {
        projectId: mrv.projectId.toString(),
        packageCid: mrv.packageCid,
        carbonTonnes: mrv.carbonTonnes.toString(),
        status: mrv.status, // 0=Submitted, 1=Approved, 2=Rejected
        verifier: mrv.verifier,
        submittedAt: mrv.submittedAt.toString(),
        processedAt: mrv.processedAt.toString(),
        notes: mrv.notes
      };
    } catch (error) {
      logger.error('❌ Failed to get MRV from chain:', error);
      throw new Error(`Failed to get MRV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStats(): Promise<any> {
    if (!this.tokenContract) {
      throw new Error('Token contract not initialized');
    }

    try {
      const [totalSupply, totalRetired] = await Promise.all([
        this.tokenContract.totalSupply(),
        this.tokenContract.totalRetired()
      ]);

      return {
        totalSupply: ethers.formatEther(totalSupply),
        totalRetired: ethers.formatEther(totalRetired),
        circulating: ethers.formatEther(totalSupply - totalRetired)
      };
    } catch (error) {
      logger.error('❌ Failed to get token stats:', error);
      throw new Error(`Failed to get token stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if relayer is properly configured
   */
  isConfigured(): boolean {
    return !!(this.provider && this.signer && this.registryContract && this.tokenContract);
  }

  /**
   * Get relayer status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      network: this.networkName,
      relayerAddress: this.signer?.address,
      hasRegistry: !!this.registryContract,
      hasToken: !!this.tokenContract
    };
  }
}

export default new ChainRelayerService();