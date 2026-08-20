import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class AudioCacheService {
  static final Map<String, String> _urlToLocalPath = {};
  static final Set<String> _downloadingUrls = {};

  static String _cleanKey(String url) {
    return url.split('?').first.trim();
  }

  /// Returns cached local file path if available, or downloads and caches it instantly
  static Future<String> getAudioPath(String url) async {
    // If it's already a local file path
    if (!url.startsWith('http')) return url;

    final key = _cleanKey(url);
    if (_urlToLocalPath.containsKey(key)) {
      final cachedFile = File(_urlToLocalPath[key]!);
      if (cachedFile.existsSync() && cachedFile.lengthSync() > 0) {
        return cachedFile.path;
      }
    }

    try {
      final tempDir = await getTemporaryDirectory();
      final filename = 'voice_${key.hashCode.abs()}.m4a';
      final file = File('${tempDir.path}/$filename');

      if (file.existsSync() && file.lengthSync() > 0) {
        _urlToLocalPath[key] = file.path;
        return file.path;
      }

      // Download and save to temp storage
      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        await file.writeAsBytes(response.bodyBytes);
        _urlToLocalPath[key] = file.path;
        return file.path;
      }
    } catch (e) {
      debugPrint('[AudioCache] Download error: $e');
    }

    return url;
  }

  /// Preload/prefetch voice notes in background so playback starts with 0 delay
  static void prefetch(String url) async {
    if (!url.startsWith('http')) return;
    final key = _cleanKey(url);
    if (_urlToLocalPath.containsKey(key) || _downloadingUrls.contains(key)) return;

    _downloadingUrls.add(key);
    try {
      final tempDir = await getTemporaryDirectory();
      final filename = 'voice_${key.hashCode.abs()}.m4a';
      final file = File('${tempDir.path}/$filename');

      if (file.existsSync() && file.lengthSync() > 0) {
        _urlToLocalPath[key] = file.path;
        _downloadingUrls.remove(key);
        return;
      }

      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        await file.writeAsBytes(response.bodyBytes);
        _urlToLocalPath[key] = file.path;
      }
    } catch (_) {} finally {
      _downloadingUrls.remove(key);
    }
  }

  /// Register a freshly recorded local audio file mapped to the uploaded URL
  static void registerLocalRecording(String uploadedUrl, String localFilePath) {
    final key = _cleanKey(uploadedUrl);
    _urlToLocalPath[key] = localFilePath;
  }
}
