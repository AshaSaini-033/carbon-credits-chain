import { ethers } from "hardhat";

async function main() {
  console.log("🌊 Deploying Blue Carbon Registry Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy BlueCarbonToken
  console.log("\n📍 Deploying BlueCarbonToken...");
  const BlueCarbonToken = await ethers.getContractFactory("BlueCarbonToken");
  const token = await BlueCarbonToken.deploy(
    "Blue Carbon Credit",
    "BCC",
    deployer.address
  );
  
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ BlueCarbonToken deployed to:", tokenAddress);

  // Deploy Registry
  console.log("\n📍 Deploying Registry...");
  const Registry = await ethers.getContractFactory("Registry");
  const registry = await Registry.deploy(tokenAddress, deployer.address);
  
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("✅ Registry deployed to:", registryAddress);

  // Grant MINTER_ROLE to Registry contract
  console.log("\n🔐 Setting up permissions...");
  const MINTER_ROLE = await token.MINTER_ROLE();
  await token.grantRole(MINTER_ROLE, registryAddress);
  console.log("✅ Granted MINTER_ROLE to Registry contract");

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const hasRole = await token.hasRole(MINTER_ROLE, registryAddress);
  console.log("Registry has MINTER_ROLE:", hasRole);

  // Output deployment info
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("====================");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("BlueCarbonToken:", tokenAddress);
  console.log("Registry:", registryAddress);
  console.log("Deployer:", deployer.address);
  
  // Save addresses to file for frontend
  const fs = require('fs');
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contracts: {
      BlueCarbonToken: tokenAddress,
      Registry: registryAddress
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('../frontend/src/contracts/deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Contract addresses saved to frontend/src/contracts/deployment.json");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update your backend .env with these contract addresses");
  console.log("2. Fund your deployer account with test MATIC");
  console.log("3. Start the backend server: cd backend && npm run dev");
  console.log("4. Start the frontend: cd frontend && npm start");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});