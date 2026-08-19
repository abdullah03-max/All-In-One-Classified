import 'package:flutter/material.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages & Voice Notes'),
      ),
      body: const Center(
        child: Text('Chat & Voice Notes - Phase 2'),
      ),
    );
  }
}
