import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:flutter/services.dart';

class ComplaintTimeline extends StatefulWidget {
  final String complaintId;

  const ComplaintTimeline({super.key, required this.complaintId});

  @override
  State<ComplaintTimeline> createState() => _ComplaintTimelineState();
}

class _ComplaintTimelineState extends State<ComplaintTimeline> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Color Scheme
 

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _copyToClipboard(BuildContext context, String url) async {
    await Clipboard.setData(ClipboardData(text: url));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('URL copied to clipboard'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          backgroundColor: _primaryBlue,
        ),
      );
    }
  }

  
  @override
  Widget build(BuildContext context) {
    final supabase = Supabase.instance.client;
    return Scaffold(
      backgroundColor: _lightBlue,
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
        ),
        title: const Text(
          'Complaint Timeline',
          style: TextStyle(color: Colors.white),
        ),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_primaryBlue, _primaryPurple],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
        ),
        elevation: 10,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder(
        future: supabase.from('complaints').select().eq('id', widget.complaintId).single(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(
              child: SpinKitFadingCircle(
                color: _primaryPurple,
                size: 50.0,
              ),
            );
          }

          final complaint = snapshot.data as Map<String, dynamic>;
          final comments = complaint['comments'] as List<dynamic>? ?? [];
          final attachments = complaint['attachments'] as List<dynamic>? ?? [];

          return AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return ListView(
                padding: const EdgeInsets.only(top: 8.0, bottom: 16.0),
                children: [
                  _buildAnimatedCard(
                    _buildDetailCard(
                      icon: FontAwesomeIcons.file,
                      title: 'Title',
                      content: complaint['title'] ?? 'Untitled',
                    ),
                    0,
                  ),
                  _buildAnimatedCard(
                    _buildDetailCard(
                      icon: FontAwesomeIcons.alignLeft,
                      title: 'Description',
                      content: complaint['description'] ?? 'No description',
                    ),
                    1,
                  ),
                  _buildAnimatedCard(
                    _buildDetailCard(
                      icon: FontAwesomeIcons.list,
                      title: 'Category',
                      content: complaint['category'] ?? 'Unknown',
                    ),
                    2,
                  ),
                  _buildAnimatedCard(
                    _buildDetailCard(
                      icon: FontAwesomeIcons.exclamation,
                      title: 'Priority',
                      content: complaint['priority'] ?? 'Unknown',
                    ),
                    3,
                  ),
                  _buildAnimatedCard(
                    _buildAttachmentCard(attachments),
                    4,
                  ),
                  _buildAnimatedCard(
                    _buildDetailCard(
                      icon: FontAwesomeIcons.infoCircle,
                      title: 'Status',
                      content: complaint['status'] ?? 'Unknown',
                      statusColor: _getStatusColor(complaint['status']),
                    ),
                    5,
                  ),
                  _buildAnimatedCard(
                    _buildDetailCard(
                      icon: FontAwesomeIcons.clock,
                      title: 'Created At',
                      content: complaint['created_at'] ?? 'Unknown',
                    ),
                    6,
                  ),
                  ...comments.asMap().entries.map((entry) => _buildAnimatedCard(
                    _buildCommentCard(entry.value),
                    entry.key + 7,
                  )),
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildDetailCard({
    required IconData icon,
    required String title,
    required String content,
    Color? statusColor,
  }) {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FaIcon(
              icon,
              color: _primaryBlue,
              size: 20,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: _darkBlue,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    content,
                    style: TextStyle(
                      fontSize: 16,
                      color: statusColor ?? Colors.black87,
                      fontWeight: statusColor != null ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentCard(List<dynamic> attachments) {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FaIcon(
              FontAwesomeIcons.paperclip,
              color: _primaryBlue,
              size: 20,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Attachments',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0D47A1),
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (attachments.isEmpty)
                    const Text(
                      'No attachments',
                      style: TextStyle(fontSize: 16),
                    )
                  else
                    ...attachments.map((url) => InkWell(
                      onTap: () => _copyToClipboard(context, url.toString()),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                url.toString(),
                                style: const TextStyle(
                                  color: Colors.blue,
                                  decoration: TextDecoration.underline,
                                  fontSize: 16,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(
                              Icons.content_copy,
                              size: 16,
                              color: Colors.grey,
                            ),
                          ],
                        ),
                      ),
                    )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentCard(dynamic comment) {
    return Card(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: () {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Comment Details'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    comment['text'] ?? 'No comment',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Posted by: ${comment['by'] ?? 'Unknown'}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'At: ${comment['timestamp'] ?? 'Unknown'}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ],
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FaIcon(
                FontAwesomeIcons.comment,
                color: _primaryPurple,
                size: 20,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      comment['text'] ?? 'No comment',
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'By: ${comment['by'] ?? 'Unknown'} at ${comment['timestamp'] ?? 'Unknown'}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'Resolved':
        return Colors.green;
      case 'Rejected':
        return Colors.red;
      case 'Pending':
        return Colors.orange;
      default:
        return Colors.black87;
    }
  }
}