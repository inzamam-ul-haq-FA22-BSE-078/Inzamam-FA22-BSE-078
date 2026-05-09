const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: null, // For group conversations (project chats)
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', ConversationSchema);