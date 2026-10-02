import 'package:flutter/material.dart';

class CodeController extends TextEditingController {
  CodeController({super.text});
  void insert(String value) {
    final s = selection.isValid
        ? selection
        : TextSelection.collapsed(offset: text.length);
    this.value = TextEditingValue(
      text: text.replaceRange(s.start, s.end, value),
      selection: TextSelection.collapsed(offset: s.start + value.length),
    );
  }

  void indent(bool outdent) {
    final pos = selection.isValid ? selection.start : 0;
    final start = pos == 0 ? 0 : text.lastIndexOf('\n', pos - 1) + 1;
    final count = outdent
        ? (text.substring(start).startsWith('    ')
              ? 4
              : text.substring(start).startsWith('  ')
              ? 2
              : 0)
        : 0;
    value = TextEditingValue(
      text: outdent
          ? text.replaceRange(start, start + count, '')
          : text.replaceRange(start, start, '    '),
      selection: TextSelection.collapsed(
        offset: (pos + (outdent ? -count : 4)).clamp(
          start,
          text.length + (outdent ? 0 : 4),
        ),
      ),
    );
  }

  @override
  TextSpan buildTextSpan({
    required BuildContext context,
    TextStyle? style,
    required bool withComposing,
  }) {
    if (value.composing.isValid && !value.composing.isCollapsed)
      return super.buildTextSpan(
        context: context,
        style: style,
        withComposing: withComposing,
      );
    final pattern = RegExp(
      r'''(//[^\n]*|\#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b(?:int|float|double|char|void|return|if|else|for|while|def|class|import|from|print|include|auto|const|struct|public|new|delete)\b|\b\d+\b)''',
    );
    final spans = <TextSpan>[];
    var end = 0;
    for (final m in pattern.allMatches(text)) {
      spans.add(TextSpan(text: text.substring(end, m.start)));
      final t = m.group(0)!;
      spans.add(
        TextSpan(
          text: t,
          style: TextStyle(
            color: t.startsWith('//') || t.startsWith('#')
                ? const Color(0xFF71829A)
                : t.startsWith('"') || t.startsWith("'")
                ? const Color(0xFF9DFF52)
                : const Color(0xFFAA99FF),
          ),
        ),
      );
      end = m.end;
    }
    spans.add(TextSpan(text: text.substring(end)));
    return TextSpan(style: style, children: spans);
  }
}
