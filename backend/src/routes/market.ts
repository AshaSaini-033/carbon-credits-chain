import { Router } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandling';
import { Database } from '../db';
import chainRelayer from '../services/chainRelayer';
import logger from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const transferSchema = Joi.object({
  fromAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.string().pattern(/^[0-9]+(\.[0-9]+)?$/).required(),
  reason: Joi.string().optional().max(200)
});

const retireSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  amount: Joi.string().pattern(/^[0-9]+(\.[0-9]+)?$/).required(),
  reason: Joi.string().required().min(5).max(200)
});

/**
 * GET /api/market/balance/:address
 * Get token balance for an address
 */
router.get('/balance/:address', asyncHandler(async (req, res) => {
  const { address } = req.params;

  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new AppError('Invalid Ethereum address', 400);
  }

  if (!chainRelayer.isConfigured()) {
    return res.json({
      success: true,
      data: {
        balance: '0',
        retired: '0',
        address,
        note: 'Blockchain not configured - showing mock data'
      }
    });
  }

  try {
    const balance = await chainRelayer.getTokenBalance(address);
    
    // Get transaction history for this address
    const transactions = await Database.getTransactionsByAddress(address);

    res.json({
      success: true,
      data: {
        balance,
        retired: transactions
          .filter(tx => tx.type === 'retire' && tx.from_address === address)
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
          .toString(),
        address,
        transactions: transactions.slice(0, 10) // Last 10 transactions
      }
    });
  } catch (error) {
    logger.error('Failed to get balance:', error);
    throw new AppError('Failed to retrieve balance from blockchain', 500);
  }
}));

/**
 * POST /api/market/transfer
 * Transfer tokens between addresses (demo purposes - normally user would sign)
 */
router.post('/transfer', asyncHandler(async (req, res) => {
  const { error, value } = transferSchema.validate(req.body);
  if (error) {
    throw new AppError(`Validation error: ${error.details[0].message}`, 400);
  }

  const { fromAddress, toAddress, amount, reason = 'Token transfer' } = value;

  if (!chainRelayer.isConfigured()) {
    // Mock transfer for demo
    const mockTx = await Database.createTransaction({
      tx_hash: `0xmock${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      type: 'transfer',
      from_address: fromAddress,
      to_address: toAddress,
      amount: (parseFloat(amount) * 1e18).toString(), // Convert to wei equivalent
      metadata: JSON.stringify({ reason, demo: true })
    });

    return res.json({
      success: true,
      data: {
        transaction: mockTx,
        message: 'Mock transfer completed (blockchain not configured)'
      }
    });
  }

  logger.info('Processing token transfer', { fromAddress, toAddress, amount, reason });

  try {
    // In a real implementation, the user would sign this transaction
    // For demo purposes, we'll record the intent
    const transaction = await Database.createTransaction({
      tx_hash: `pending-${Date.now()}`, // Will be updated with real hash
      type: 'transfer',
      from_address: fromAddress,
      to_address: toAddress,
      amount: (parseFloat(amount) * 1e18).toString(),
      metadata: JSON.stringify({ reason })
    });

    logger.info('Token transfer recorded', { 
      transactionId: transaction.id, 
      fromAddress, 
      toAddress, 
      amount 
    });

    res.json({
      success: true,
      data: { transaction },
      message: 'Transfer initiated successfully'
    });
  } catch (error) {
    logger.error('Transfer failed:', error);
    throw new AppError('Failed to process transfer', 500);
  }
}));

/**
 * POST /api/market/retire
 * Retire (burn) carbon tokens
 */
router.post('/retire', asyncHandler(async (req, res) => {
  const { error, value } = retireSchema.validate(req.body);
  if (error) {
    throw new AppError(`Validation error: ${error.details[0].message}`, 400);
  }

  const { address, amount, reason } = value;

  logger.info('Processing token retirement', { address, amount, reason });

  if (!chainRelayer.isConfigured()) {
    // Mock retirement for demo
    const mockTx = await Database.createTransaction({
      tx_hash: `0xmockretire${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      type: 'retire',
      from_address: address,
      to_address: '0x0000000000000000000000000000000000000000', // Burn address
      amount: (parseFloat(amount) * 1e18).toString(),
      metadata: JSON.stringify({ reason, demo: true })
    });

    return res.json({
      success: true,
      data: {
        transaction: mockTx,
        retiredAmount: amount,
        message: 'Mock retirement completed (blockchain not configured)'
      }
    });
  }

  try {
    // Execute retirement on blockchain
    const txHash = await chainRelayer.retireTokensOnChain(address, amount, reason);

    // Record transaction
    const transaction = await Database.createTransaction({
      tx_hash: txHash,
      type: 'retire',
      from_address: address,
      to_address: '0x0000000000000000000000000000000000000000', // Burn address
      amount: (parseFloat(amount) * 1e18).toString(),
      metadata: JSON.stringify({ reason })
    });

    logger.info('Tokens retired successfully', { 
      txHash, 
      address, 
      amount, 
      reason 
    });

    res.json({
      success: true,
      data: {
        transaction,
        txHash,
        retiredAmount: amount,
        blockchainUrl: `https://mumbai.polygonscan.com/tx/${txHash}`
      },
      message: 'Carbon tokens retired successfully'
    });
  } catch (error) {
    logger.error('Retirement failed:', error);
    throw new AppError(`Failed to retire tokens: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}));

/**
 * GET /api/market/transactions/:address
 * Get transaction history for an address
 */
router.get('/transactions/:address', asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new AppError('Invalid Ethereum address', 400);
  }

  const transactions = await Database.getTransactionsByAddress(address);
  
  const paginatedTx = transactions.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    data: {
      transactions: paginatedTx.map(tx => ({
        ...tx,
        amountFormatted: (parseFloat(tx.amount) / 1e18).toString(),
        metadata: tx.metadata ? JSON.parse(tx.metadata) : null
      })),
      total: transactions.length,
      address
    }
  });
}));

/**
 * GET /api/market/stats
 * Get overall market statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  let tokenStats = null;
  let blockchainConnected = false;

  if (chainRelayer.isConfigured()) {
    try {
      tokenStats = await chainRelayer.getTokenStats();
      blockchainConnected = true;
    } catch (error) {
      logger.warn('Could not fetch token stats from blockchain:', error);
    }
  }

  // Get transaction stats from database
  const allTransactions = await Database.getTransactionsByAddress(''); // Empty address gets all
  const transactionStats = {
    totalTransactions: allTransactions.length,
    transfers: allTransactions.filter(tx => tx.type === 'transfer').length,
    retirements: allTransactions.filter(tx => tx.type === 'retire').length,
    mints: allTransactions.filter(tx => tx.type === 'mint').length
  };

  // Calculate total retired from our records
  const totalRetiredFromTx = allTransactions
    .filter(tx => tx.type === 'retire')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / 1e18;

  res.json({
    success: true,
    data: {
      blockchain: {
        connected: blockchainConnected,
        tokenStats: tokenStats || {
          totalSupply: '0',
          totalRetired: totalRetiredFromTx.toString(),
          circulating: '0'
        }
      },
      transactions: transactionStats,
      relayerStatus: chainRelayer.getStatus()
    }
  });
}));

/**
 * GET /api/market/leaderboard
 * Get retirement leaderboard
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get all retirement transactions
  const retirements = await Database.getTransactionsByAddress('').then(
    transactions => transactions.filter(tx => tx.type === 'retire')
  );

  // Group by address and sum retirement amounts
  const retirementsByAddress = retirements.reduce((acc: any, tx) => {
    const address = tx.from_address;
    const amount = parseFloat(tx.amount) / 1e18;
    
    if (!acc[address]) {
      acc[address] = {
        address,
        totalRetired: 0,
        retirementCount: 0,
        lastRetirement: tx.created_at
      };
    }
    
    acc[address].totalRetired += amount;
    acc[address].retirementCount++;
    
    if (new Date(tx.created_at) > new Date(acc[address].lastRetirement)) {
      acc[address].lastRetirement = tx.created_at;
    }
    
    return acc;
  }, {});

  // Convert to array and sort by total retired
  const leaderboard = Object.values(retirementsByAddress)
    .sort((a: any, b: any) => b.totalRetired - a.totalRetired)
    .slice(0, Number(limit));

  res.json({
    success: true,
    data: {
      leaderboard,
      totalParticipants: Object.keys(retirementsByAddress).length
    }
  });
}));

export default router;