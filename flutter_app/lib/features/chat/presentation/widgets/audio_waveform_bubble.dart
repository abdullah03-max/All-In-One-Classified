import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AudioWaveformBubble extends StatelessWidget {
  final String audioUrl;
  final List<double> waveform;
  final bool isMine;
  final bool isPlaying;
  final Duration currentPosition;
  final Duration totalDuration;
  final VoidCallback onPlayPause;
  final ValueChanged<Duration> onSeek;
  final double playbackRate;
  final VoidCallback onToggleSpeed;

  const AudioWaveformBubble({
    super.key,
    required this.audioUrl,
    required this.waveform,
    required this.isMine,
    required this.isPlaying,
    required this.currentPosition,
    required this.totalDuration,
    required this.onPlayPause,
    required this.onSeek,
    this.playbackRate = 1.0,
    required this.onToggleSpeed,
  });

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes;
    final seconds = d.inSeconds % 60;
    return '$minutes:${seconds < 10 ? '0' : ''}$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final progress = (totalDuration.inMilliseconds > 0)
        ? (currentPosition.inMilliseconds / totalDuration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;

    final displayTime = isPlaying
        ? _formatDuration(currentPosition)
        : _formatDuration(totalDuration.inMilliseconds > 0 ? totalDuration : currentPosition);

    final bars = waveform.isNotEmpty ? waveform : List.filled(30, 0.35);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      constraints: const BoxConstraints(minWidth: 190, maxWidth: 250),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              // Play/Pause Button
              GestureDetector(
                onTap: onPlayPause,
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isMine ? Colors.white : AppTheme.primaryColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.12),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                    color: isMine ? AppTheme.primaryColor : Colors.white,
                    size: 24,
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Interactive Waveform Bars
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTapDown: (details) {
                    final box = context.findRenderObject() as RenderBox?;
                    if (box != null && totalDuration.inMilliseconds > 0) {
                      final totalW = box.size.width - 90;
                      if (totalW > 0) {
                        final localX = details.localPosition.dx.clamp(0.0, totalW);
                        final pct = localX / totalW;
                        final seekMs = (pct * totalDuration.inMilliseconds).toInt();
                        onSeek(Duration(milliseconds: seekMs));
                      }
                    }
                  },
                  child: SizedBox(
                    height: 36,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: List.generate(bars.length, (idx) {
                        final barProgress = idx / bars.length;
                        final isPlayed = barProgress <= progress;
                        final height = (bars[idx] * 32.0).clamp(5.0, 32.0);

                        final barColor = isMine
                            ? (isPlayed ? Colors.white : Colors.white.withOpacity(0.38))
                            : (isPlayed ? AppTheme.primaryColor : Colors.grey.shade400);

                        return Container(
                          width: 2.8,
                          height: height,
                          decoration: BoxDecoration(
                            color: barColor,
                            borderRadius: BorderRadius.circular(2.0),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),

              // Speed toggle pill (1x, 1.5x, 2x)
              GestureDetector(
                onTap: onToggleSpeed,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: isMine ? Colors.white.withOpacity(0.2) : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${playbackRate.toStringAsFixed(playbackRate == 1.0 ? 0 : 1)}x',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isMine ? Colors.white : Colors.black87,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),

          // Duration display & Voice Note label
          Padding(
            padding: const EdgeInsets.only(left: 46, right: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  displayTime,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isMine ? Colors.white.withOpacity(0.85) : Colors.grey.shade700,
                  ),
                ),
                Text(
                  'Voice Note',
                  style: TextStyle(
                    fontSize: 10,
                    color: isMine ? Colors.white60 : Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
