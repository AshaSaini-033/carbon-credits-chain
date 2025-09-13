import { expect } from "chai";
import { ethers } from "hardhat";
import { BlueCarbonToken, Registry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Registry", function () {
  let token: BlueCarbonToken;
  let registry: Registry;
  let owner: SignerWithAddress;
  let verifier: SignerWithAddress;
  let projectOwner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, verifier, projectOwner, user] = await ethers.getSigners();
    
    // Deploy token
    const BlueCarbonToken = await ethers.getContractFactory("BlueCarbonToken");
    token = await BlueCarbonToken.deploy("Blue Carbon Credit", "BCC", owner.address);
    await token.waitForDeployment();
    
    // Deploy registry
    const Registry = await ethers.getContractFactory("Registry");
    registry = await Registry.deploy(await token.getAddress(), owner.address);
    await registry.waitForDeployment();
    
    // Grant roles
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, await registry.getAddress());
    
    const VERIFIER_ROLE = await registry.VERIFIER_ROLE();
    await registry.grantRole(VERIFIER_ROLE, verifier.address);
  });

  describe("Project Registration", function () {
    it("Should register a new project", async function () {
      const name = "Mangrove Restoration Project";
      const description = "Restoring 100 hectares of mangroves";
      const geojsonCid = "QmGeojsonCID123";
      const metadataCid = "QmMetadataCID123";
      
      await expect(registry.connect(projectOwner).registerProject(
        name, description, geojsonCid, metadataCid
      )).to.emit(registry, "ProjectRegistered")
        .withArgs(1, projectOwner.address, name);
      
      const project = await registry.getProject(1);
      expect(project.name).to.equal(name);
      expect(project.owner).to.equal(projectOwner.address);
      expect(project.active).to.be.true;
    });
  });

  describe("MRV Submission", function () {
    let projectId: number;

    beforeEach(async function () {
      // Register a project first
      await registry.connect(projectOwner).registerProject(
        "Test Project", "Description", "geoCid", "metaCid"
      );
      projectId = 1;
    });

    it("Should submit MRV package", async function () {
      const packageCid = "QmMRVPackageCID123";
      const carbonTonnes = 50;
      
      await expect(registry.connect(projectOwner).submitMRV(
        projectId, packageCid, carbonTonnes
      )).to.emit(registry, "MRVSubmitted")
        .withArgs(1, projectId, carbonTonnes);
      
      const mrv = await registry.getMRVSubmission(1);
      expect(mrv.projectId).to.equal(projectId);
      expect(mrv.packageCid).to.equal(packageCid);
      expect(mrv.carbonTonnes).to.equal(carbonTonnes);
      expect(mrv.status).to.equal(0); // Submitted
    });

    it("Should not allow non-project-owner to submit MRV", async function () {
      await expect(registry.connect(user).submitMRV(
        projectId, "packageCid", 50
      )).to.be.revertedWith("Not project owner");
    });
  });

  describe("MRV Approval", function () {
    let projectId: number;
    let mrvId: number;

    beforeEach(async function () {
      // Register project and submit MRV
      await registry.connect(projectOwner).registerProject(
        "Test Project", "Description", "geoCid", "metaCid"
      );
      projectId = 1;
      
      await registry.connect(projectOwner).submitMRV(
        projectId, "packageCid", 100
      );
      mrvId = 1;
    });

    it("Should allow verifier to approve MRV and mint tokens", async function () {
      const notes = "Verification completed successfully";
      
      await expect(registry.connect(verifier).approveMRV(mrvId, notes))
        .to.emit(registry, "MRVApproved")
        .withArgs(mrvId, verifier.address, ethers.parseEther("100"));
      
      // Check MRV status
      const mrv = await registry.getMRVSubmission(mrvId);
      expect(mrv.status).to.equal(1); // Approved
      expect(mrv.verifier).to.equal(verifier.address);
      
      // Check tokens were minted
      expect(await token.balanceOf(projectOwner.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow verifier to reject MRV", async function () {
      const reason = "Insufficient evidence provided";
      
      await expect(registry.connect(verifier).rejectMRV(mrvId, reason))
        .to.emit(registry, "MRVRejected")
        .withArgs(mrvId, verifier.address, reason);
      
      const mrv = await registry.getMRVSubmission(mrvId);
      expect(mrv.status).to.equal(2); // Rejected
      expect(mrv.notes).to.equal(reason);
      
      // No tokens should be minted
      expect(await token.balanceOf(projectOwner.address)).to.equal(0);
    });

    it("Should not allow non-verifier to approve MRV", async function () {
      await expect(registry.connect(user).approveMRV(mrvId, "notes"))
        .to.be.revertedWith("AccessControl:");
    });

    it("Should not allow double processing", async function () {
      await registry.connect(verifier).approveMRV(mrvId, "notes");
      
      await expect(registry.connect(verifier).approveMRV(mrvId, "notes"))
        .to.be.revertedWith("MRV already processed");
    });
  });

  describe("Project MRV History", function () {
    it("Should return project MRVs", async function () {
      // Register project
      await registry.connect(projectOwner).registerProject(
        "Test Project", "Description", "geoCid", "metaCid"
      );
      
      // Submit multiple MRVs
      await registry.connect(projectOwner).submitMRV(1, "package1", 50);
      await registry.connect(projectOwner).submitMRV(1, "package2", 75);
      
      const projectMRVs = await registry.getProjectMRVs(1);
      expect(projectMRVs.length).to.equal(2);
      expect(projectMRVs[0]).to.equal(1);
      expect(projectMRVs[1]).to.equal(2);
    });
  });
});