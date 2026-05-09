const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Project = require('../models/Project');
const config = require('../config');

// Ensure uploads/messages exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'messages');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// Allow only images and videos
const fileFilter = (req, file, cb) => {
  const mime = file.mimetype;
  if (mime.startsWith('image/') || mime.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter });

// Create or get conversation between two users
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ success: false, message: 'participantId is required' });
    // Ensure participant exists
    const participant = await User.findById(participantId);
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });

    // Find existing one-to-one conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    });

    if (!conversation) {
      conversation = new Conversation({ participants: [userId, participantId] });
      await conversation.save();
    }

    const populated = await Conversation.findById(conversation._id).populate('participants', 'email name profilePicture');
    return res.json({ success: true, conversation: populated });
  } catch (err) {
    console.error('createConversation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create conversation', error: err.message });
  }
};

// List conversations for current user
const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'email name profilePicture')
      .lean();

    // Attach last message (if exists)
    const convWithLast = await Promise.all(conversations.map(async (c) => {
      const last = await Message.findOne({ conversation: c._id }).sort({ createdAt: -1 }).limit(1).lean();
      // count unread messages for current user (messages sent by others and not read by user)
      const unreadCount = await Message.countDocuments({ conversation: c._id, sender: { $ne: userId }, readBy: { $ne: userId } });
      return { ...c, lastMessage: last ? last : null, unreadCount };
    }));

    return res.json({ success: true, conversations: convWithLast });
  } catch (err) {
    console.error('listConversations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list conversations', error: err.message });
  }
};

// Get messages for a conversation
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // conversation id
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    // ensure user is a participant
    if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const skip = (page - 1) * limit;
    const messages = await Message.find({ conversation: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('sender', 'email name profilePicture');
    return res.json({ success: true, messages: messages.reverse() }); // return ascending order
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages', error: err.message });
  }
};

// Send message (text + attachments)
const sendMessage = async (req, res) => {
  try {
    // This route uses multer single/array parsing middleware when mounted
    const userId = req.user.id;
    const { conversationId, content } = req.body;

    if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId is required' });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        attachments.push({ url: `/uploads/messages/${f.filename}`, mimeType: f.mimetype });
      });
    }

    const message = new Message({ conversation: conversationId, sender: userId, content: content || '', attachments, readBy: [userId] });
    await message.save();

    // Update conversation lastMessage and updatedAt
    conversation.lastMessage = content || (attachments.length ? 'Attachment' : '');
    conversation.updatedAt = new Date();
    await conversation.save();

    // Emit socket event to clients; socket.io instance available on app
    try {
      const io = req.app.get('socketIO');
      io.emit('message:new', { message });
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    return res.json({ success: true, message });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message', error: err.message });
  }
};

// Mark conversation messages as read by current user
const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // conversation id
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    await Message.updateMany({ conversation: id, readBy: { $ne: userId } }, { $push: { readBy: userId } });
    return res.json({ success: true });
  } catch (err) {
    console.error('markRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to mark read', error: err.message });
  }
};

// Create or update group conversation for project
const createOrUpdateGroupChat = async (projectId, projectTitle, participantIds) => {
  try {
    // Find existing group chat for this project
    let conversation = await Conversation.findOne({ projectId });

    if (conversation) {
      // Keep the group name synced to the project title
      if (conversation.name !== projectTitle) {
        conversation.name = projectTitle;
      }

      // Update existing conversation - add new participants
      const existingParticipants = conversation.participants.map(p => p.toString());
      const newParticipants = participantIds.filter(id => !existingParticipants.includes(id.toString()));
      
      if (newParticipants.length > 0 || conversation.isModified('name')) {
        conversation.participants = [...conversation.participants, ...newParticipants];
        conversation.updatedAt = new Date();
        await conversation.save();
      }
    } else {
      // Create new group conversation
      conversation = new Conversation({
        name: projectTitle,
        isGroupChat: true,
        projectId,
        participants: participantIds
      });
      await conversation.save();
    }

    // Populate and return
    const populated = await Conversation.findById(conversation._id).populate('participants', 'email name profilePicture');
    return populated;
  } catch (err) {
    console.error('createOrUpdateGroupChat error:', err);
    throw err;
  }
};

const createProjectGroupConversation = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const project = await Project.findById(projectId).populate('team.userId', 'name email skills profilePicture');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.user.id;
    const isOwner = project.owner?.toString() === userId;
    const isTeamMember = project.team.some(member => {
      const memberId = member.userId?._id?.toString() || member.userId?.toString();
      return memberId === userId;
    });
    if (!isOwner && !isTeamMember && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to open this project group chat' });
    }

    const participantIds = [project.owner?.toString()].filter(Boolean);
    project.team.forEach(member => {
      if (member.userId) {
        participantIds.push(member.userId._id ? member.userId._id.toString() : member.userId.toString());
      }
    });

    const uniqueParticipantIds = [...new Set(participantIds)];
    if (uniqueParticipantIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Project must include at least one team member to open group chat' });
    }

    const conversation = await createOrUpdateGroupChat(project._id, project.title, uniqueParticipantIds);
    return res.status(200).json({ success: true, conversation });
  } catch (err) {
    console.error('createProjectGroupConversation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create or load project group chat', error: err.message });
  }
};

module.exports = {
  uploadMiddleware: upload.array('attachments', 5),
  createConversation,
  listConversations,
  getMessages,
  sendMessage,
  markRead,
  createOrUpdateGroupChat,
  createProjectGroupConversation,
};