// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BlueCarbonToken.sol";

/**
 * @title Registry
 * @dev Central registry for blue carbon projects and MRV submissions
 * Manages the verification workflow and token minting process
 */
contract Registry is AccessControl, Pausable {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PROJECT_OWNER_ROLE = keccak256("PROJECT_OWNER_ROLE");
    
    BlueCarbonToken public immutable token;
    
    enum MRVStatus { Submitted, Approved, Rejected }
    
    struct Project {
        string name;
        string description;
        address owner;
        string geojsonCid; // IPFS CID of the project boundaries
        string metadataCid; // IPFS CID of additional project metadata
        bool active;
        uint256 createdAt;
    }
    
    struct MRVSubmission {
        uint256 projectId;
        string packageCid; // IPFS CID of the complete MRV package
        uint256 carbonTonnes; // Amount of CO2 tonnes claimed
        MRVStatus status;
        address verifier; // Who approved/rejected
        uint256 submittedAt;
        uint256 processedAt;
        string notes; // Verifier notes
    }
    
    // Storage
    mapping(uint256 => Project) public projects;
    mapping(uint256 => MRVSubmission) public mrvSubmissions;
    
    uint256 public nextProjectId = 1;
    uint256 public nextMrvId = 1;
    
    // Events
    event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name);
    event MRVSubmitted(uint256 indexed mrvId, uint256 indexed projectId, uint256 carbonTonnes);
    event MRVApproved(uint256 indexed mrvId, address indexed verifier, uint256 tokensMinted);
    event MRVRejected(uint256 indexed mrvId, address indexed verifier, string reason);
    
    constructor(address _token, address defaultAdmin) {
        token = BlueCarbonToken(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(VERIFIER_ROLE, defaultAdmin);
    }
    
    /**
     * @dev Register a new blue carbon project
     * @param name Project name
     * @param description Project description
     * @param geojsonCid IPFS CID of project boundary geojson
     * @param metadataCid IPFS CID of additional metadata
     */
    function registerProject(
        string memory name,
        string memory description,
        string memory geojsonCid,
        string memory metadataCid
    ) public whenNotPaused returns (uint256) {
        uint256 projectId = nextProjectId++;
        
        projects[projectId] = Project({
            name: name,
            description: description,
            owner: msg.sender,
            geojsonCid: geojsonCid,
            metadataCid: metadataCid,
            active: true,
            createdAt: block.timestamp
        });
        
        // Grant project owner role
        _grantRole(PROJECT_OWNER_ROLE, msg.sender);
        
        emit ProjectRegistered(projectId, msg.sender, name);
        return projectId;
    }
    
    /**
     * @dev Submit MRV package for verification
     * @param projectId ID of the project
     * @param packageCid IPFS CID of the MRV package (images + JSON data)
     * @param carbonTonnes Amount of CO2 tonnes being claimed
     */
    function submitMRV(
        uint256 projectId,
        string memory packageCid,
        uint256 carbonTonnes
    ) public whenNotPaused returns (uint256) {
        require(projects[projectId].active, "Project not active");
        require(projects[projectId].owner == msg.sender, "Not project owner");
        require(carbonTonnes > 0, "Carbon tonnes must be positive");
        
        uint256 mrvId = nextMrvId++;
        
        mrvSubmissions[mrvId] = MRVSubmission({
            projectId: projectId,
            packageCid: packageCid,
            carbonTonnes: carbonTonnes,
            status: MRVStatus.Submitted,
            verifier: address(0),
            submittedAt: block.timestamp,
            processedAt: 0,
            notes: ""
        });
        
        emit MRVSubmitted(mrvId, projectId, carbonTonnes);
        return mrvId;
    }
    
    /**
     * @dev Approve MRV submission and mint tokens
     * @param mrvId ID of the MRV submission
     * @param notes Verifier notes
     */
    function approveMRV(uint256 mrvId, string memory notes) 
        public 
        onlyRole(VERIFIER_ROLE) 
        whenNotPaused 
    {
        MRVSubmission storage submission = mrvSubmissions[mrvId];
        require(submission.status == MRVStatus.Submitted, "MRV already processed");
        
        Project storage project = projects[submission.projectId];
        require(project.active, "Project not active");
        
        // Update submission status
        submission.status = MRVStatus.Approved;
        submission.verifier = msg.sender;
        submission.processedAt = block.timestamp;
        submission.notes = notes;
        
        // Mint tokens to project owner
        token.mint(project.owner, submission.carbonTonnes * 1e18, submission.packageCid);
        
        emit MRVApproved(mrvId, msg.sender, submission.carbonTonnes * 1e18);
    }
    
    /**
     * @dev Reject MRV submission
     * @param mrvId ID of the MRV submission
     * @param reason Rejection reason
     */
    function rejectMRV(uint256 mrvId, string memory reason) 
        public 
        onlyRole(VERIFIER_ROLE) 
        whenNotPaused 
    {
        MRVSubmission storage submission = mrvSubmissions[mrvId];
        require(submission.status == MRVStatus.Submitted, "MRV already processed");
        
        submission.status = MRVStatus.Rejected;
        submission.verifier = msg.sender;
        submission.processedAt = block.timestamp;
        submission.notes = reason;
        
        emit MRVRejected(mrvId, msg.sender, reason);
    }
    
    /**
     * @dev Get project details
     */
    function getProject(uint256 projectId) public view returns (Project memory) {
        return projects[projectId];
    }
    
    /**
     * @dev Get MRV submission details
     */
    function getMRVSubmission(uint256 mrvId) public view returns (MRVSubmission memory) {
        return mrvSubmissions[mrvId];
    }
    
    /**
     * @dev Get all MRV submissions for a project
     */
    function getProjectMRVs(uint256 projectId) public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](nextMrvId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextMrvId; i++) {
            if (mrvSubmissions[i].projectId == projectId) {
                result[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory resizedResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            resizedResult[i] = result[i];
        }
        
        return resizedResult;
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}