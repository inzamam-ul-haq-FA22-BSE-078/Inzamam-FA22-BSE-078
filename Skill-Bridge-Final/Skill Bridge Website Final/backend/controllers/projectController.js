const Project = require('../models/Project');
const User = require('../models/User');
const { createOrUpdateGroupChat } = require('./chatController');

// Get all projects (for user, or admin can see all)
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get projects owned by the user or where user is a team member
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'team.userId': userId }
      ]
    })
      .populate('owner', 'name email')
      .populate('category', 'name')
      .populate('team.userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('category', 'name')
      .populate('team.userId', 'name email skills profilePicture');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    const userId = req.user.id;
    const isOwner = project.owner._id.toString() === userId;
    const isTeamMember = project.team.some(member => member.userId && member.userId._id.toString() === userId);

    if (!isOwner && !isTeamMember && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { title, shortDescription, fullDescription, category, status, ownerName, startDate, deadline, team } = req.body;

    // Validate required fields
    if (!title || !shortDescription || !startDate || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate dates
    if (new Date(startDate) > new Date(deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be after start date'
      });
    }

    // Parse team if it's a string
    let parsedTeam = [];
    if (typeof team === 'string') {
      try {
        parsedTeam = JSON.parse(team);
      } catch (e) {
        parsedTeam = [];
      }
    } else {
      parsedTeam = team || [];
    }

    const newProject = new Project({
      title,
      shortDescription,
      fullDescription,
      category: category || undefined,
      status: status || 'Planning',
      owner: req.user.id,
      ownerName: ownerName || req.user.name,
      startDate,
      deadline,
      team: parsedTeam,
      files: []
    });

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      newProject.files = req.files.map(file => ({
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop(),
        fileUrl: `/uploads/projects/${file.filename}`,
        uploadedBy: req.user.id
      }));
    }

    await newProject.save();
    await newProject.populate('owner', 'name email');
    await newProject.populate('category', 'name');

    // Create group chat if team members are added
    if (parsedTeam.length > 0) {
      try {
        // Get all participant IDs: owner + team members
        const participantIds = [req.user.id];
        parsedTeam.forEach(member => {
          if (member.userId) {
            participantIds.push(member.userId);
          }
        });

        // Remove duplicates
        const uniqueParticipantIds = [...new Set(participantIds.map(id => id.toString()))].map(id => id);

        // Create the group chat
        await createOrUpdateGroupChat(newProject._id, newProject.title, uniqueParticipantIds);
      } catch (chatErr) {
        console.error('Error creating group chat for project:', chatErr);
        // Don't fail the project creation if chat creation fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: newProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this project'
      });
    }

    const { title, shortDescription, fullDescription, category, status, ownerName, startDate, deadline, team } = req.body;

    // Update fields
    if (title) project.title = title;
    if (shortDescription) project.shortDescription = shortDescription;
    if (fullDescription) project.fullDescription = fullDescription;
    if (category !== undefined) project.category = category || undefined;
    if (status) project.status = status;
    if (ownerName) project.ownerName = ownerName;
    if (startDate) project.startDate = startDate;
    if (deadline) project.deadline = deadline;

    // Parse team if it's a string
    if (team) {
      let parsedTeam = team;
      if (typeof team === 'string') {
        try {
          parsedTeam = JSON.parse(team);
        } catch (e) {
          parsedTeam = [];
        }
      }
      project.team = parsedTeam;
    }

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(file => ({
        fileName: file.originalname,
        fileType: file.originalname.split('.').pop(),
        fileUrl: `/uploads/projects/${file.filename}`,
        uploadedBy: req.user.id
      }));
      project.files = [...project.files, ...newFiles];
    }

    project.updatedAt = new Date();
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('category', 'name');
    await project.populate('team.userId', 'name email');

    // Create or update group chat if team members exist
    if (project.team && project.team.length > 0) {
      try {
        // Get all participant IDs: owner + team members
        const participantIds = [project.owner._id];
        project.team.forEach(member => {
          if (member.userId) {
            participantIds.push(member.userId._id ? member.userId._id : member.userId);
          }
        });

        // Remove duplicates
        const uniqueParticipantIds = [...new Set(participantIds.map(id => id.toString()))].map(id => id);

        // Create or update the group chat
        await createOrUpdateGroupChat(project._id, project.title, uniqueParticipantIds);
      } catch (chatErr) {
        console.error('Error creating/updating group chat for project:', chatErr);
        // Don't fail the project update if chat creation/update fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this project'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get projects by status
exports.getProjectsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user.id;

    const projects = await Project.find({
      status: status,
      $or: [
        { owner: userId },
        { 'team.userId': userId }
      ]
    })
      .populate('owner', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search projects
exports.searchProjects = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const projects = await Project.find({
      $and: [
        {
          $or: [
            { owner: userId },
            { 'team.userId': userId }
          ]
        },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { shortDescription: { $regex: query, $options: 'i' } },
            { ownerName: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
      .populate('owner', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
