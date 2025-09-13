# 🌊 Blue Carbon Registry & MRV System

A blockchain-based system for monitoring, reporting, and verifying blue carbon sequestration in mangroves, seagrass beds, and salt marshes.

## ✨ Features

- **NGO Project Registration**: Register blue carbon projects with geospatial boundaries
- **MRV Submission**: Upload field evidence and drone imagery to IPFS
- **Verification Workflow**: Independent verifiers review and approve carbon credits
- **Token Marketplace**: Trade and retire verified blue carbon credits (ERC20)
- **Blockchain Integration**: Smart contracts on Polygon Mumbai testnet

## 🏗️ Architecture

```
Frontend (React/TypeScript) → Backend API (Node.js) → Smart Contracts (Solidity)
                           ↓
                    IPFS (web3.storage)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (optional - falls back to in-memory)
- MetaMask wallet
- Test MATIC tokens

### 1. Clone & Install

```bash
git clone <repository-url>
cd blue-carbon-registry

# Install all dependencies
npm install
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup

Create `.env` files:

**contracts/.env**:
```env
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_wallet_private_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

**backend/.env**:
```env
PORT=3000
NODE_ENV=development
WEB3_STORAGE_TOKEN=your_web3_storage_token_here
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_relayer_private_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/blue_carbon_db
JWT_SECRET=your_super_secure_jwt_secret
```

### 3. Deploy Smart Contracts

```bash
cd contracts
npm run compile
npm run deploy:mumbai
```

Copy contract addresses to backend `.env`:
```env
REGISTRY_CONTRACT_ADDRESS=0x...
TOKEN_CONTRACT_ADDRESS=0x...
```

### 4. Start Services

```bash
# Terminal 1 - Backend API
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Get API Keys

- **Web3.Storage**: Visit [web3.storage](https://web3.storage) → Create account → Get API token
- **Mumbai RPC**: Use [Alchemy](https://alchemy.com) or [Infura](https://infura.io)
- **Test MATIC**: [Mumbai Faucet](https://faucet.polygon.technology/)

## 🎮 Demo Flow

1. **NGO Dashboard** (`/ngo`):
   - Register new blue carbon project
   - Upload project boundaries (GeoJSON)
   - Submit MRV package with drone imagery

2. **Verifier Dashboard** (`/verifier`):
   - Review submitted MRV packages
   - View evidence files from IPFS
   - Approve/reject submissions

3. **Marketplace** (`/marketplace`):
   - View token balance
   - Transfer carbon credits
   - Retire tokens for offsetting

## 🧪 Testing

```bash
# Smart contract tests
cd contracts
npm test

# Backend API tests  
cd backend
npm test

# Run all tests
npm run test:all
```

## 📁 Project Structure

```
/
├── contracts/           # Solidity smart contracts
│   ├── BlueCarbonToken.sol
│   ├── Registry.sol
│   └── test/
├── backend/            # Node.js API server
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # IPFS & blockchain
│   │   └── db.ts       # Database layer
│   └── package.json
├── frontend/           # React TypeScript app
│   ├── src/
│   │   ├── pages/      # Dashboard pages
│   │   ├── components/ # Reusable components
│   │   └── lib/        # API client
│   └── package.json
├── mech/              # Carbon estimation tools
│   ├── sample_images/
│   └── estimate_carbon.py
└── docker-compose.yaml
```

## 🔐 Security Notes

- **Private Keys**: Never commit private keys. Use environment variables.
- **Relayer Service**: In production, implement proper key management.
- **IPFS**: Files are public. Encrypt sensitive data before upload.
- **Smart Contracts**: Audited for demo purposes only.

## 📊 Key Contracts

- **BlueCarbonToken** (ERC20): Mintable carbon credit tokens with retirement
- **Registry**: Project registration, MRV submissions, verification workflow

## 🌐 Network Info

- **Testnet**: Polygon Mumbai
- **Explorer**: [mumbai.polygonscan.com](https://mumbai.polygonscan.com)
- **Bridge**: [wallet.polygon.technology](https://wallet.polygon.technology/bridge)

## 📚 API Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Register new project
- `POST /api/mrv/submit` - Submit MRV package
- `POST /api/mrv/:id/process` - Approve/reject MRV
- `GET /api/market/balance/:address` - Token balance
- `POST /api/market/retire` - Retire carbon credits

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Discord: [Join our community](https://discord.gg/bluecarbon)

---

Built with ❤️ for ocean conservation and climate action 🌊