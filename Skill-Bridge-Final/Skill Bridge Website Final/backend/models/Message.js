const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttachmentSchema = new Schema({
  url: { type: String, required: true },
  mimeType: { type: String },
});

const MessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '' },
    attachments: [AttachmentSchema],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);