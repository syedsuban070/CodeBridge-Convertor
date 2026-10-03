import 'dart:async';
import 'package:flutter/services.dart';

class RunResult {
  final String stdout, stderr;
  final int code;
  const RunResult(this.stdout, this.stderr, this.code);
}

class Runtime {
  static const method = MethodChannel('codebridge/runtime');
  static final events = const EventChannel(
    'codebridge/events',
  ).receiveBroadcastStream().asBroadcastStream();
  static Future<RunResult> run({
    required String source,
    required String language,
    String input = '',
    String mode = 'run',
    void Function(String, String)? onOutput,
  }) async {
    final done = Completer<RunResult>();
    final out = StringBuffer(), err = StringBuffer();
    final sub = events.listen(
      (event) {
        final kind = event['type'] as String, text = event['text'] as String;
        if (kind == 'stdout') out.write(text);
        if (kind == 'stderr') err.write(text);
        onOutput?.call(kind, text);
        if (kind == 'exit' && !done.isCompleted)
          done.complete(
            RunResult(
              out.toString(),
              err.toString() + text,
              event['code'] as int,
            ),
          );
      },
      onError: (Object error) {
        if (!done.isCompleted) done.completeError(error);
      },
    );
    try {
      await method.invokeMethod('run', {
        'source': source,
        'language': language,
        'stdin': input,
        'mode': mode,
      });
      return await done.future.timeout(const Duration(seconds: 75));
    } finally {
      await sub.cancel();
    }
  }

  static Future<void> stop() => method.invokeMethod('stop');
}
