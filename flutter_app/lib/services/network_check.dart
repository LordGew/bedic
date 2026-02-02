import 'package:http/http.dart' as http;
import 'dart:convert';
import '../secrets.dart';

class ApiCheckResult {
  final bool ok;
  final int statusCode;
  final String contentType;
  final String bodySnippet;

  ApiCheckResult({required this.ok, required this.statusCode, required this.contentType, required this.bodySnippet});
}

/// Performs a quick GET to the API base URL and returns an [ApiCheckResult].
/// This helps detect wrong host/port or HTML error pages returned by proxies.
Future<ApiCheckResult> checkApiReachable({Duration timeout = const Duration(seconds: 4)}) async {
  try {
    // Prefer pinging the server root first to avoid spamming the console with a
    // 404 for /api when the server does not expose that path. Many backends
    // expose a simple root message (e.g. "BEDIC API is running!") and the real
    // API under /api/*.
    final root = _stripApiSuffix(API_BASE_URL);
    final rootUri = Uri.parse(root);
    final rootResp = await http.get(rootUri).timeout(timeout);
    final rootCt = rootResp.headers['content-type'] ?? '';
    final rootSnippet = rootResp.body.length > 300 ? rootResp.body.substring(0, 300) + '...' : rootResp.body;

    if (rootResp.statusCode >= 200 && rootResp.statusCode < 300) {
      return ApiCheckResult(ok: true, statusCode: rootResp.statusCode, contentType: rootCt, bodySnippet: rootSnippet);
    }

    // If the root didn't indicate a healthy server, try the API base URL
    // itself and require a JSON successful response from the API endpoint.
    final uri = Uri.parse(API_BASE_URL);
    final resp = await http.get(uri).timeout(timeout);
    final ct = resp.headers['content-type'] ?? '';
    final snippet = resp.body.length > 300 ? resp.body.substring(0, 300) + '...' : resp.body;
    final isJson = ct.toLowerCase().contains('application/json');

    if (resp.statusCode >= 200 && resp.statusCode < 300 && isJson) {
      return ApiCheckResult(ok: true, statusCode: resp.statusCode, contentType: ct, bodySnippet: snippet);
    }

    // Otherwise return the API_BASE_URL response details so caller can show diagnostic info.
    return ApiCheckResult(ok: false, statusCode: resp.statusCode, contentType: ct, bodySnippet: snippet);
  } catch (e) {
    return ApiCheckResult(ok: false, statusCode: 0, contentType: '', bodySnippet: e.toString());
  }
}

String _stripApiSuffix(String url) {
  try {
    return url.replaceFirst(RegExp(r'/api/?$'), '');
  } catch (_) {
    // If something goes wrong, return the original URL's origin.
    try {
      final u = Uri.parse(url);
      return '${u.scheme}://${u.host}${u.hasPort ? ':${u.port}' : ''}';
    } catch (_) {
      return url;
    }
  }
}
