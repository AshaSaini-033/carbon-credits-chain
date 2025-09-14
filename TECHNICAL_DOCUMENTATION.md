# Blue Carbon Registry & MRV System - Technical Documentation

## Technologies Used

### Programming Languages & Frameworks

#### Frontend Technologies
- **React 18.3.1** - Modern UI library for building interactive user interfaces
- **TypeScript** - Type-safe JavaScript for better code reliability and developer experience
- **Vite** - Fast build tool and development server
- **React Router DOM 6.30.1** - Client-side routing for single-page application navigation

#### Styling & UI Components
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Shadcn/UI Components** - Pre-built, customizable React components
- **Radix UI Primitives** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful SVG icon library
- **Custom Design System** - Ocean-themed color palette with semantic tokens

#### Backend Technologies
- **Node.js** - JavaScript runtime for server-side development
- **Express.js** - Web framework for building REST APIs
- **TypeScript** - Type-safe backend development
- **PostgreSQL** - Relational database for data persistence
- **Docker & Docker Compose** - Containerization for consistent development environment

#### Blockchain & Smart Contracts
- **Solidity** - Smart contract programming language
- **Hardhat** - Ethereum development framework
- **OpenZeppelin** - Security-focused smart contract library
- **Ethers.js 6.15.0** - Ethereum interaction library
- **Polygon Mumbai Testnet** - Layer 2 blockchain for testing

#### Storage & File Management
- **IPFS (InterPlanetary File System)** - Decentralized storage protocol
- **Web3.Storage** - IPFS pinning service for reliable file storage
- **React Dropzone** - File upload component with drag-and-drop

#### Maps & Geospatial
- **Leaflet 1.9.4** - Interactive maps library
- **React Leaflet 4.2.1** - React integration for Leaflet maps
- **GeoJSON** - Geographic data format for project boundaries

#### Data Management & Validation
- **React Hook Form 7.61.1** - Performant forms with easy validation
- **Zod 3.25.76** - TypeScript-first schema validation
- **TanStack React Query 5.83.0** - Data fetching and caching library
- **Axios 1.12.1** - HTTP client for API requests

#### Additional Tools & Libraries
- **Date-fns 3.6.0** - Date manipulation library
- **Recharts 2.15.4** - Composable charting library
- **Class Variance Authority** - Utility for creating component variants
- **Python** - Carbon estimation algorithms (mech/estimate_carbon.py)

### Hardware & Infrastructure Requirements
- **Development Environment**: Node.js 18+, Docker, Git
- **Blockchain Network**: Polygon Mumbai Testnet access
- **IPFS Storage**: Web3.Storage API token
- **Database**: PostgreSQL 15+ (or in-memory fallback)
- **Mobile Devices**: Camera access for field data collection (via web browser)

---

## Methodology and Process for Implementation

### System Architecture Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   NGO Frontend  │    │   Backend API    │    │  Smart Contract │
│                 │    │                  │    │                 │
│ • Project Reg   │◄──►│ • IPFS Service   │◄──►│ • Token Minting │
│ • MRV Upload    │    │ • Chain Relayer  │    │ • Registry      │
│ • File Upload   │    │ • Database       │    │ • Role Control  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│Verifier Frontend│    │   IPFS Network   │    │ Polygon Mumbai  │
│                 │    │                  │    │                 │
│ • Review MRV    │    │ • File Storage   │    │ • Transaction   │
│ • Approve/Reject│    │ • CID Generation │    │   History       │
│ • View Evidence │    │ • Metadata       │    │ • Token Ledger  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│Market Frontend  │
│                 │
│ • Token Trading │
│ • Retirement    │
│ • Balance View  │
└─────────────────┘
```

### Implementation Process Flow

#### Phase 1: Smart Contract Development
1. **Contract Design**
   - BlueCarbonToken (ERC20) with mint/burn functionality
   - Registry contract with role-based access control
   - Integration between contracts for automated minting

2. **Security Implementation**
   - OpenZeppelin role-based access (DEFAULT_ADMIN_ROLE, VERIFIER_ROLE)
   - Only verified MRV submissions trigger token minting
   - Burn mechanism for carbon credit retirement

3. **Testing & Deployment**
   - Comprehensive unit tests with Hardhat
   - Mumbai testnet deployment scripts
   - Contract verification on Polygonscan

#### Phase 2: Backend API Development
1. **Core Services**
   - IPFS integration with Web3.Storage
   - Blockchain relayer with ethers.js
   - PostgreSQL database with fallback support

2. **API Endpoints**
   ```
   GET    /api/projects              - List all projects
   POST   /api/projects              - Create new project
   GET    /api/projects/:id          - Get project details
   POST   /api/mrv/submit            - Submit MRV package
   POST   /api/mrv/:id/approve       - Approve MRV (Verifier only)
   POST   /api/market/buy            - Transfer tokens
   POST   /api/market/retire         - Burn/retire tokens
   POST   /api/ipfs/pin              - Pin file to IPFS
   ```

3. **Data Flow**
   - File uploads → IPFS pinning → CID storage
   - MRV approval → Smart contract interaction → Token minting
   - Error handling and logging throughout

#### Phase 3: Frontend Development
1. **NGO Dashboard**
   - Project registration with map integration
   - File upload (images, documents, GeoJSON)
   - MRV submission form with validation
   - Progress tracking and status updates

2. **Verifier Dashboard**
   - MRV package review interface
   - IPFS file viewer for evidence
   - Approval/rejection workflow
   - Audit trail and history

3. **Marketplace Dashboard**
   - Token balance display
   - Transfer functionality
   - Retirement (burning) mechanism
   - Transaction history and leaderboard

#### Phase 4: Integration & Testing
1. **End-to-End Testing**
   - Complete workflow from registration to retirement
   - IPFS file retrieval and display
   - Smart contract integration testing
   - Role-based access validation

2. **Security Testing**
   - Input validation and sanitization
   - Authentication and authorization
   - Smart contract security audit
   - IPFS data integrity checks

### Data Flow Methodology

#### Carbon Credit Lifecycle
1. **Project Registration** (NGO)
   - Upload project metadata and GeoJSON boundaries
   - Pin data to IPFS, store CID in database
   - Create project record with PENDING status

2. **Evidence Collection** (NGO)
   - Upload field photos and drone imagery
   - Submit MRV (Monitoring, Reporting, Verification) package
   - Include carbon estimation data from Python algorithms
   - Pin complete package to IPFS

3. **Verification Process** (Verifier)
   - Review submitted evidence via IPFS
   - Validate carbon calculations and methodology
   - Approve/reject MRV submission
   - Trigger smart contract interaction on approval

4. **Token Minting** (Automated)
   - Backend relayer calls Registry.approveMRV()
   - Smart contract validates verifier role
   - BlueCarbonToken.mint() creates new tokens
   - Tokens transferred to project owner

5. **Market Operations** (Buyers)
   - View available tokens and project details
   - Transfer tokens between addresses
   - Retire (burn) tokens to claim carbon offset
   - Record retirement on blockchain for transparency

### Quality Assurance & Security Measures
- **Type Safety**: Full TypeScript implementation
- **Input Validation**: Zod schemas and React Hook Form
- **Access Control**: Smart contract roles and API middleware
- **Data Integrity**: IPFS content addressing and blockchain immutability
- **Error Handling**: Comprehensive try-catch blocks and user feedback
- **Testing**: Unit tests for contracts, integration tests for APIs
- **Documentation**: Comprehensive README and inline code comments

This methodology ensures a robust, secure, and transparent system for managing blue carbon credits from initial project registration through final carbon credit retirement.