const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
  searchProjects
} = require('../controllers/projectController');

// Middleware for file uploads
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/projects/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PPT, and Word files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Protected routes
router.use(authenticateToken);

// Search projects (more specific route should come first)
router.get('/search', searchProjects);

// Get projects by status (more specific route)
router.get('/status/:status', getProjectsByStatus);

// Get all projects
router.get('/', getProjects);

// Get single project
router.get('/:id', getProjectById);

// Create project
router.post('/', upload.array('files'), createProject);

// Update project
router.put('/:id', upload.array('files'), updateProject);

// Delete project
router.delete('/:id', deleteProject);

module.exports = router;
