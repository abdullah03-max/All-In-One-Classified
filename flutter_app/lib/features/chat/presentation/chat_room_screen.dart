import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../listings/data/listing_model.dart';
import '../../listings/presentation/listing_detail_screen.dart';
import '../data/chat_models.dart';
import '../data/chat_repository.dart';
import '../services/presence_service.dart';
import '../services/audio_cache_service.dart';
import 'widgets/audio_waveform_bubble.dart';

enum VoiceRecordingState {
  idle,
  recording,
  preview,
  sending,
}

class ChatRoomScreen extends StatefulWidget {
  final String conversationId;
  final String? otherUserId;
  final String listingTitle;
  final String otherUserName;
  final String? otherUserAvatarUrl;
  final String? otherUserRole;
  final ListingModel? listing;
  final String? listingImage;
  final double? listingPrice;

  const ChatRoomScreen({
    super.key,
    required this.conversationId,
    this.otherUserId,
    required this.listingTitle,
    required this.otherUserName,
    this.otherUserAvatarUrl,
    this.otherUserRole,
    this.listing,
    this.listingImage,
    this.listingPrice,
  });

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final ChatRepository _repository = ChatRepository();
  final SupabaseClient _client = Supabase.instance.client;
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ChatMessageModel> _messages = [];
  final Set<String> _localMessageIds = {};
  bool _isLoading = true;
  RealtimeChannel? _realtimeChannel;

  // ── VOICE RECORDING STATE MACHINE ──
  VoiceRecordingState _recordingState = VoiceRecordingState.idle;
  final AudioRecorder _audioRecorder = AudioRecorder();
  StreamSubscription<Amplitude>? _amplitudeSub;
  Timer? _recordTimer;
  int _recordSeconds = 0;
  final List<double> _liveAmplitudes = [];
  String? _recordedFilePath;
  List<double> _previewWaveform = [];

  // ── IN-CHAT & PREVIEW AUDIO PLAYBACK ──
  final AudioPlayer _audioPlayer = AudioPlayer();
  String? _currentlyPlayingAudioUrl;
  bool _isPlayingAudio = false;
  Duration _audioPosition = Duration.zero;
  Duration _audioTotalDuration = Duration.zero;
  double _playbackRate = 1.0;

  // ── REPLY FEATURE ──
  ChatMessageModel? _replyingToMessage;

  // ── LISTING CONTEXT ──
  ListingModel? _listing;

  Timer? _liveSyncTimer;

  @override
  void initState() {
    super.initState();
    _listing = widget.listing;
    _initAudioListeners();
    _loadMessages();
    _subscribeToRealtimeMessages();
    _startLiveSync();
  }

  void _startLiveSync() {
    _liveSyncTimer?.cancel();
    _liveSyncTimer = Timer.periodic(const Duration(milliseconds: 2500), (_) {
      _silentSyncMessages();
    });
  }

  Future<void> _silentSyncMessages() async {
    if (!mounted) return;
    try {
      final msgs = await _repository.getMessages(widget.conversationId);
      if (!mounted) return;

      if (msgs.length != _messages.length ||
          (msgs.isNotEmpty && _messages.isNotEmpty && msgs.last.id != _messages.last.id)) {
        final wasAtBottom = _scrollController.hasClients &&
            (_scrollController.position.maxScrollExtent - _scrollController.offset).abs() < 120;

        setState(() {
          _messages = msgs;
        });

        // Prefetch voice notes in background for instant playback
        for (final m in msgs) {
          if (m.isAudioVoiceNote && m.audioUrl != null) {
            AudioCacheService.prefetch(m.audioUrl!);
          }
        }

        final user = _client.auth.currentUser;
        if (user != null) {
          _repository.markMessagesRead(widget.conversationId, user.id);
        }

        if (wasAtBottom) {
          _scrollToBottom();
        }
      }
    } catch (_) {}
  }

  void _initAudioListeners() {
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlayingAudio = state == PlayerState.playing;
        });
      }
    });

    _audioPlayer.onPositionChanged.listen((pos) {
      if (mounted) {
        setState(() => _audioPosition = pos);
      }
    });

    _audioPlayer.onDurationChanged.listen((dur) {
      if (mounted) {
        setState(() => _audioTotalDuration = dur);
      }
    });

    _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlayingAudio = false;
          _audioPosition = Duration.zero;
          _currentlyPlayingAudioUrl = null;
        });
      }
    });
  }

  @override
  void dispose() {
    _msgController.dispose();
    _scrollController.dispose();
    _liveSyncTimer?.cancel();
    _recordTimer?.cancel();
    _amplitudeSub?.cancel();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    _realtimeChannel?.unsubscribe();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    final msgs = await _repository.getMessages(widget.conversationId);
    if (mounted) {
      setState(() {
        _messages = msgs;
        _isLoading = false;
      });

      // Background prefetch all audio voice notes for 0-delay instant playback
      for (final m in msgs) {
        if (m.isAudioVoiceNote && m.audioUrl != null) {
          AudioCacheService.prefetch(m.audioUrl!);
        }
      }

      _repository.markMessagesRead(widget.conversationId, user.id);
      _scrollToBottom();
    }
  }

  void _subscribeToRealtimeMessages() {
    _realtimeChannel?.unsubscribe();
    _realtimeChannel = _client
        .channel('messages:conv:${widget.conversationId}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'messages',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'conversation_id',
            value: widget.conversationId,
          ),
          callback: (payload) {
            final user = _client.auth.currentUser;
            final record = payload.newRecord;
            if (record.isEmpty) return;

            final newMsg = ChatMessageModel.fromJson(record);

            if (newMsg.isAudioVoiceNote && newMsg.audioUrl != null) {
              AudioCacheService.prefetch(newMsg.audioUrl!);
            }

            if (mounted) {
              setState(() {
                final existingIdx = _messages.indexWhere((m) => m.id == newMsg.id);
                if (existingIdx != -1) {
                  _messages[existingIdx] = newMsg;
                } else if (!_localMessageIds.contains(newMsg.id)) {
                  _messages.add(newMsg);
                }
              });

              if (user != null && newMsg.senderId != user.id) {
                _repository.markMessagesRead(widget.conversationId, user.id);
              }

              _scrollToBottom();
            }
          },
        )
        .subscribe();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendTextMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty) return;

    final user = _client.auth.currentUser;
    if (user == null) return;

    String content = text;
    if (_replyingToMessage != null) {
      final safeSender = _replyingToMessage!.senderId == user.id ? 'You' : widget.otherUserName;
      final safePreview = _replyingToMessage!.previewText.replaceAll('|', ' ').replaceAll(']', ' ');
      content = '[reply:${_replyingToMessage!.id}|$safeSender|$safePreview]:$text';
    }

    _msgController.clear();
    setState(() {
      _replyingToMessage = null;
    });

    final sent = await _repository.sendMessage(
      conversationId: widget.conversationId,
      senderId: user.id,
      content: content,
    );

    if (sent != null) {
      _localMessageIds.add(sent.id);
      if (mounted) {
        setState(() {
          if (!_messages.any((m) => m.id == sent.id)) {
            _messages.add(sent);
          }
        });
        _scrollToBottom();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ── VOICE RECORDING STATE HANDLERS ──
  // ─────────────────────────────────────────────────────────────

  List<double> _generateWaveformBars(List<double> rawSamples, int targetBars) {
    if (rawSamples.isEmpty) return List.filled(targetBars, 0.25);
    final List<double> result = [];
    final blockSize = rawSamples.length / targetBars;

    for (int i = 0; i < targetBars; i++) {
      final start = (i * blockSize).floor();
      final end = ((i + 1) * blockSize).ceil().clamp(0, rawSamples.length);
      if (start >= rawSamples.length) {
        result.add(0.12);
        continue;
      }
      double sum = 0;
      int count = 0;
      for (int j = start; j < end; j++) {
        sum += rawSamples[j];
        count++;
      }
      final avg = count > 0 ? sum / count : 0.12;
      result.add(avg);
    }

    final maxVal = result.reduce((a, b) => a > b ? a : b);
    final scale = maxVal > 0.05 ? maxVal : 1.0;
    return result.map((v) => (v / scale).clamp(0.12, 1.0)).toList();
  }

  // 1. IDLE -> RECORDING
  Future<void> _startRecording() async {
    if (_currentlyPlayingAudioUrl != null) {
      await _audioPlayer.stop();
      setState(() {
        _isPlayingAudio = false;
        _currentlyPlayingAudioUrl = null;
      });
    }

    if (await _audioRecorder.hasPermission()) {
      final dir = await getTemporaryDirectory();
      final path = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

      _liveAmplitudes.clear();
      _recordSeconds = 0;

      await _audioRecorder.start(
        const RecordConfig(encoder: AudioEncoder.aacLc, bitRate: 64000, sampleRate: 44100),
        path: path,
      );

      _amplitudeSub = _audioRecorder.onAmplitudeChanged(const Duration(milliseconds: 80)).listen((amp) {
        final normalized = ((amp.current + 50.0) / 50.0).clamp(0.08, 1.0);
        _liveAmplitudes.add(normalized);
      });

      _recordTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() => _recordSeconds++);
      });

      setState(() {
        _recordingState = VoiceRecordingState.recording;
        _recordedFilePath = path;
      });
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Microphone permission is required to record voice notes.')),
        );
      }
    }
  }

  // 2. RECORDING -> PREVIEW (STOP button only stops and prepares preview)
  Future<void> _stopRecordingAndPreview() async {
    _recordTimer?.cancel();
    await _amplitudeSub?.cancel();

    final path = await _audioRecorder.stop();
    if (path != null && mounted) {
      final bars = _generateWaveformBars(_liveAmplitudes, 30);

      setState(() {
        _recordedFilePath = path;
        _previewWaveform = bars;
        _recordingState = VoiceRecordingState.preview;
      });
    } else {
      setState(() {
        _recordingState = VoiceRecordingState.idle;
      });
    }
  }

  // 3. PREVIEW -> IDLE (DELETE / TRASH button discards recording)
  void _deleteRecordingPreview() {
    _audioPlayer.stop();
    if (_recordedFilePath != null) {
      try {
        final f = File(_recordedFilePath!);
        if (f.existsSync()) f.deleteSync();
      } catch (_) {}
    }
    setState(() {
      _recordingState = VoiceRecordingState.idle;
      _recordedFilePath = null;
      _previewWaveform = [];
      _recordSeconds = 0;
      _isPlayingAudio = false;
      _currentlyPlayingAudioUrl = null;
    });
  }

  // 4. PREVIEW -> SENDING -> SENT -> IDLE (SEND button uploads and sends)
  Future<void> _sendRecordingPreview() async {
    final user = _client.auth.currentUser;
    if (user == null || _recordedFilePath == null) return;

    final audioFile = File(_recordedFilePath!);
    if (!audioFile.existsSync()) return;

    setState(() {
      _recordingState = VoiceRecordingState.sending;
    });

    if (_currentlyPlayingAudioUrl == _recordedFilePath) {
      await _audioPlayer.stop();
    }

    try {
      final rawAudioUrl = await _repository.uploadVoiceNote(
        conversationId: widget.conversationId,
        userId: user.id,
        audioFile: audioFile,
      );

      if (rawAudioUrl != null) {
        AudioCacheService.registerLocalRecording(rawAudioUrl, _recordedFilePath!);

        final wfString = _previewWaveform.map((v) => (v * 100).round()).join(',');
        final audioUrlWithWf = rawAudioUrl.contains('?')
            ? '$rawAudioUrl&wf=$wfString'
            : '$rawAudioUrl?wf=$wfString';

        String finalContent = audioUrlWithWf;
        if (_replyingToMessage != null) {
          final safeSender = _replyingToMessage!.senderId == user.id ? 'You' : widget.otherUserName;
          final safePreview = _replyingToMessage!.previewText.replaceAll('|', ' ').replaceAll(']', ' ');
          finalContent = '[reply:${_replyingToMessage!.id}|$safeSender|$safePreview]:$audioUrlWithWf';
        }

        setState(() => _replyingToMessage = null);

        final sent = await _repository.sendMessage(
          conversationId: widget.conversationId,
          senderId: user.id,
          content: finalContent,
        );

        if (sent != null) {
          _localMessageIds.add(sent.id);
          if (mounted) {
            setState(() {
              if (!_messages.any((m) => m.id == sent.id)) {
                _messages.add(sent);
              }
            });
            _scrollToBottom();
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send voice note: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _recordingState = VoiceRecordingState.idle;
          _recordedFilePath = null;
          _previewWaveform = [];
          _recordSeconds = 0;
          _isPlayingAudio = false;
          _currentlyPlayingAudioUrl = null;
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // ── AUDIO PLAYBACK HANDLERS ──
  // ─────────────────────────────────────────────────────────────

  void _playAudioUrl(String url) async {
    if (_currentlyPlayingAudioUrl == url && _isPlayingAudio) {
      await _audioPlayer.pause();
      setState(() => _isPlayingAudio = false);
    } else {
      await _audioPlayer.stop();
      _audioPlayer.setPlaybackRate(_playbackRate);

      // Instant 0-delay playback from local cached file
      final localOrCachedPath = await AudioCacheService.getAudioPath(url);

      if (localOrCachedPath.startsWith('http')) {
        await _audioPlayer.play(UrlSource(localOrCachedPath));
      } else {
        await _audioPlayer.play(DeviceFileSource(localOrCachedPath));
      }

      setState(() {
        _currentlyPlayingAudioUrl = url;
        _isPlayingAudio = true;
      });
    }
  }

  void _seekAudio(Duration pos) async {
    await _audioPlayer.seek(pos);
    setState(() => _audioPosition = pos);
  }

  void _togglePlaybackSpeed() {
    double newRate = 1.0;
    if (_playbackRate == 1.0) {
      newRate = 1.5;
    } else if (_playbackRate == 1.5) {
      newRate = 2.0;
    } else {
      newRate = 1.0;
    }
    _audioPlayer.setPlaybackRate(newRate);
    setState(() => _playbackRate = newRate);
  }

  String _formatTimer(int totalSecs) {
    final m = totalSecs ~/ 60;
    final s = totalSecs % 60;
    return '$m:${s < 10 ? '0' : ''}$s';
  }

  @override
  Widget build(BuildContext context) {
    final user = _client.auth.currentUser;
    final timeFormat = DateFormat('hh:mm a');
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);

    final isAdmin = widget.otherUserRole == 'moderator' || widget.otherUserRole == 'admin' || widget.otherUserRole == 'super_admin';

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: ValueListenableBuilder<Set<String>>(
          valueListenable: PresenceService().onlineUserIdsNotifier,
          builder: (context, onlineIds, _) {
            final isOnline = PresenceService().isUserOnline(widget.otherUserId, role: widget.otherUserRole);

            return Row(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    if (isAdmin)
                      const CircleAvatar(
                        radius: 18,
                        backgroundColor: Color(0xFF3B82F6),
                        child: Icon(Icons.shield, color: Colors.white, size: 20),
                      )
                    else if (widget.otherUserAvatarUrl != null && widget.otherUserAvatarUrl!.trim().isNotEmpty)
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.primaryLight,
                        child: ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: widget.otherUserAvatarUrl!,
                            width: 36,
                            height: 36,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const CircularProgressIndicator(strokeWidth: 2),
                            errorWidget: (_, __, ___) => Text(
                              widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : 'U',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                            ),
                          ),
                        ),
                      )
                    else
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.primaryLight,
                        child: Text(
                          widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : 'U',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                        ),
                      ),
                    if (isOnline)
                      Positioned(
                        bottom: -1,
                        right: -1,
                        child: Container(
                          width: 11,
                          height: 11,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              isAdmin ? 'All in One (System)' : widget.otherUserName,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isAdmin) ...[
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade700,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text('ADMIN', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ],
                      ),
                      Row(
                        children: [
                          if (isOnline) ...[
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Online',
                              style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                            ),
                            const Text('  •  ', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          ] else ...[
                            const Text(
                              'Offline',
                              style: TextStyle(fontSize: 11, color: Colors.grey),
                            ),
                            const Text('  •  ', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          ],
                          Flexible(
                            child: Text(
                              'Re: ${widget.listingTitle}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
      body: Column(
        children: [
          // ── STICKY PRODUCT CONTEXT BANNER ──
          if (widget.listingTitle.isNotEmpty && widget.listingTitle != 'All in One System')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              child: InkWell(
                onTap: () {
                  if (_listing != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => ListingDetailScreen(listing: _listing!)),
                    );
                  }
                },
                child: Row(
                  children: [
                    if (widget.listingImage != null && widget.listingImage!.isNotEmpty)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                          imageUrl: widget.listingImage!,
                          width: 46,
                          height: 46,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: Colors.grey.shade200),
                          errorWidget: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.image, size: 24)),
                        ),
                      )
                    else
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.storefront, color: Colors.grey),
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.listingTitle,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          if (widget.listingPrice != null)
                            Text(
                              currencyFormatter.format(widget.listingPrice),
                              style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
                  ],
                ),
              ),
            ),

          // ── MESSAGES STREAM LIST ──
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            const Text('No messages yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            const Text('Send a message to start the conversation!', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = msg.senderId == user?.id;

                          return Dismissible(
                            key: ValueKey('msg_${msg.id}'),
                            direction: DismissDirection.startToEnd,
                            confirmDismiss: (direction) async {
                              setState(() => _replyingToMessage = msg);
                              return false; // WhatsApp style: do not remove message, just trigger reply composer
                            },
                            background: Container(
                              alignment: Alignment.centerLeft,
                              padding: const EdgeInsets.only(left: 8),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor.withOpacity(0.18),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.reply_rounded, color: AppTheme.primaryColor, size: 20),
                              ),
                            ),
                            child: Align(
                              alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                              child: GestureDetector(
                                onLongPress: () {
                                  setState(() => _replyingToMessage = msg);
                                },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isMe ? AppTheme.primaryColor : Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
                                    bottomRight: isMe ? Radius.zero : const Radius.circular(16),
                                  ),
                                  boxShadow: [
                                    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2)),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // ── Quoted Reply Preview (if message is a reply) ──
                                    if (msg.replyInfo != null)
                                      Container(
                                        margin: const EdgeInsets.only(bottom: 6),
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isMe ? Colors.white.withOpacity(0.15) : Colors.grey.shade100,
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border(left: BorderSide(color: isMe ? Colors.white : AppTheme.primaryColor, width: 3)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              msg.replyInfo!.replyToSender,
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: isMe ? Colors.white : AppTheme.primaryColor,
                                              ),
                                            ),
                                            Text(
                                              msg.replyInfo!.replyToText,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: isMe ? Colors.white70 : Colors.black87,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                    // ── Voice Message Waveform Visualizer Bubble ──
                                    if (msg.isAudioVoiceNote && msg.audioUrl != null)
                                      AudioWaveformBubble(
                                        audioUrl: msg.audioUrl!,
                                        waveform: msg.waveformBars,
                                        isMine: isMe,
                                        isPlaying: _currentlyPlayingAudioUrl == msg.audioUrl && _isPlayingAudio,
                                        currentPosition: _currentlyPlayingAudioUrl == msg.audioUrl ? _audioPosition : Duration.zero,
                                        totalDuration: _currentlyPlayingAudioUrl == msg.audioUrl ? _audioTotalDuration : Duration.zero,
                                        playbackRate: _playbackRate,
                                        onPlayPause: () => _playAudioUrl(msg.audioUrl!),
                                        onSeek: _seekAudio,
                                        onToggleSpeed: _togglePlaybackSpeed,
                                      )
                                    else
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                        child: Text(
                                          msg.cleanContent,
                                          style: TextStyle(
                                            color: isMe ? Colors.white : (Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87),
                                            fontSize: 14,
                                            height: 1.35,
                                          ),
                                        ),
                                      ),
                                    const SizedBox(height: 2),

                                    // ── Timestamp & Ticks ──
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      mainAxisAlignment: MainAxisAlignment.end,
                                      children: [
                                        Text(
                                          timeFormat.format(msg.createdAt),
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: isMe ? Colors.white70 : Colors.grey,
                                          ),
                                        ),
                                        if (isMe) ...[
                                          const SizedBox(width: 4),
                                          Icon(
                                            msg.isRead ? Icons.done_all : Icons.done,
                                            size: 14,
                                            color: msg.isRead ? Colors.lightBlueAccent : Colors.white70,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                      ),
          ),

          // ── ACTIVE REPLY QUOTE BAR ──
          if (_replyingToMessage != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              color: Theme.of(context).brightness == Brightness.dark ? Colors.grey.shade900 : Colors.grey.shade100,
              child: Row(
                children: [
                  const Icon(Icons.reply, size: 18, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Replying to ${_replyingToMessage!.senderId == user?.id ? "Yourself" : widget.otherUserName}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.primaryColor),
                        ),
                        Text(
                          _replyingToMessage!.previewText,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => setState(() => _replyingToMessage = null),
                  ),
                ],
              ),
            ),

          // ── MESSAGE INPUT & VOICE RECORDING STATE MACHINE CONTROLS ──
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              border: Border(top: BorderSide(color: Theme.of(context).brightness == Brightness.dark ? Colors.white12 : Colors.grey.shade300)),
            ),
            child: SafeArea(
              child: _buildInputBottomBar(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBottomBar() {
    switch (_recordingState) {
      // ── STATE: RECORDING ──
      case VoiceRecordingState.recording:
        return Row(
          children: [
            // Trash / Cancel button
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 24),
              onPressed: () async {
                _recordTimer?.cancel();
                await _amplitudeSub?.cancel();
                await _audioRecorder.stop();
                _deleteRecordingPreview();
              },
            ),
            const SizedBox(width: 6),

            // Pulsing recording indicator + Duration
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: Colors.redAccent,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              _formatTimer(_recordSeconds),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.redAccent),
            ),
            const SizedBox(width: 12),

            const Expanded(
              child: Text(
                'Recording voice note...',
                style: TextStyle(fontSize: 13, color: Colors.grey),
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // Stop / Finish recording button (Square / Stop icon in Red)
            IconButton.filled(
              icon: const Icon(Icons.stop_rounded, size: 22, color: Colors.white),
              style: IconButton.styleFrom(backgroundColor: Colors.redAccent),
              onPressed: _stopRecordingAndPreview,
            ),
          ],
        );

      // ── STATE: PREVIEW (After stopping recording) ──
      case VoiceRecordingState.preview:
        return Row(
          children: [
            // Delete recording button
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 24),
              onPressed: _deleteRecordingPreview,
            ),
            const SizedBox(width: 4),

            // Play / Pause preview button
            IconButton(
              icon: Icon(
                (_currentlyPlayingAudioUrl == _recordedFilePath && _isPlayingAudio)
                    ? Icons.pause_circle_filled
                    : Icons.play_circle_fill,
                color: AppTheme.primaryColor,
                size: 32,
              ),
              onPressed: () {
                if (_recordedFilePath != null) {
                  _playAudioUrl(_recordedFilePath!);
                }
              },
            ),

            // Waveform preview
            Expanded(
              child: SizedBox(
                height: 28,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: List.generate(_previewWaveform.length, (idx) {
                    final height = (_previewWaveform[idx] * 26.0).clamp(4.0, 26.0);
                    return Container(
                      width: 2.0,
                      height: height,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(width: 6),

            // Recorded duration
            Text(
              _formatTimer(_recordSeconds),
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(width: 6),

            // SEND recorded voice message button
            IconButton.filled(
              icon: const Icon(Icons.send_rounded, size: 18, color: Colors.white),
              style: IconButton.styleFrom(backgroundColor: AppTheme.primaryColor),
              onPressed: _sendRecordingPreview,
            ),
          ],
        );

      // ── STATE: SENDING ──
      case VoiceRecordingState.sending:
        return const SizedBox(
          height: 44,
          child: Center(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                SizedBox(width: 10),
                Text('Sending voice message...', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
          ),
        );

      // ── STATE: IDLE ──
      case VoiceRecordingState.idle:
      default:
        return Row(
          children: [
            // Mic button to start recording
            IconButton(
              icon: const Icon(Icons.mic, color: AppTheme.primaryColor, size: 26),
              onPressed: _startRecording,
            ),
            Expanded(
              child: TextField(
                controller: _msgController,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  hintText: 'Type a message...',
                  contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
                onSubmitted: (_) => _sendTextMessage(),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              icon: const Icon(Icons.send, size: 18),
              style: IconButton.styleFrom(backgroundColor: AppTheme.primaryColor),
              onPressed: _sendTextMessage,
            ),
          ],
        );
    }
  }
}
