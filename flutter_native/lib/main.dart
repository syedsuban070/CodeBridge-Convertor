import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/store.dart';
import 'core/runtime.dart';
import 'core/editor.dart';
import 'core/bit.dart';
import 'core/shop.dart';
import 'package:rive/rive.dart' show RiveFile;

const green = Color(0xFF9DFF52), background = Color(0xFF080C12);
late Store db;
late List courses;
Map<String, dynamic> words = {};
String locale = 'en';
String tr(String key) => words['strings']?[key] as String? ?? key;
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await RiveFile.initialize();
  try {
    db = await Store.open();
    final settings = await db.settings();
    locale = settings['locale'] as String;
    words = jsonDecode(await rootBundle.loadString('assets/i18n/$locale.json'));
    courses = jsonDecode(
      await rootBundle.loadString('assets/data/courses.json'),
    );
    runApp(CodeBridge(first: settings['onboarding_step'] != 'done'));
  } catch (e) {
    runApp(
      MaterialApp(
        home: Scaffold(
          body: SafeArea(
            child: SelectableText(
              'CodeBridge could not open its saved data. No data was erased.\n$e',
            ),
          ),
        ),
      ),
    );
  }
}

class CodeBridge extends StatefulWidget {
  final bool first;
  const CodeBridge({super.key, required this.first});
  @override
  State<CodeBridge> createState() => _CodeBridgeState();
}

class _CodeBridgeState extends State<CodeBridge> {
  late bool first = widget.first;
  Future<void> choose(String value) async {
    await db.locale(value);
    locale = value;
    words = jsonDecode(await rootBundle.loadString('assets/i18n/$locale.json'));
    setState(() => first = false);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'CodeBridge',
    locale: locale == 'zh-Hans'
        ? const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans')
        : Locale(locale),
    supportedLocales: const [
      Locale('en'),
      Locale('ur'),
      Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans'),
    ],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    theme: ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: green,
        brightness: Brightness.dark,
        primary: green,
        surface: const Color(0xFF141D2A),
      ),
      fontFamily: locale == 'ur' ? 'NotoNastaliqUrdu' : 'NotoSans',
      fontFamilyFallback: const ['NotoSansSC', 'NotoSans'],
      useMaterial3: true,
    ),
    home: first
        ? Scaffold(
            body: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'CODEBRIDGE',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: green,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Choose your language / زبان / 语言'),
                    const SizedBox(height: 32),
                    for (final entry in {
                      'en': 'English',
                      'ur': 'اردو',
                      'zh-Hans': '中文',
                    }.entries)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: FilledButton.tonal(
                          onPressed: () => choose(entry.key),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              entry.value,
                              style: TextStyle(
                                fontSize: 21,
                                fontFamily: entry.key == 'ur'
                                    ? 'NotoNastaliqUrdu'
                                    : 'NotoSansSC',
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          )
        : LevelMap(onLocale: () => setState(() => first = true)),
  );
}

class LevelMap extends StatefulWidget {
  final VoidCallback onLocale;
  const LevelMap({super.key, required this.onLocale});
  @override
  State<LevelMap> createState() => _LevelMapState();
}

class _LevelMapState extends State<LevelMap>
    with SingleTickerProviderStateMixin {
  int track = 0;
  Set<String> mastered = {};
  Map<String, dynamic> wallet = {'coins': 0, 'xp': 0};
  final scroll = ScrollController();
  late final pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  )..repeat(reverse: true);
  Future<void> refresh() async {
    final m = await db.mastered(), w = await db.wallet();
    if (mounted)
      setState(() {
        mastered = m;
        wallet = w;
      });
  }

  @override
  void initState() {
    super.initState();
    refresh();
  }

  @override
  void dispose() {
    scroll.dispose();
    pulse.dispose();
    super.dispose();
  }

  Future<void> open(Map lesson) async {
    final answer = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                lesson['title'],
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(lesson['explanation']),
              const SizedBox(height: 24),
              Text(lesson['question'], style: const TextStyle(color: green)),
              for (var i = 0; i < (lesson['options'] as List).length; i++)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: OutlinedButton(
                    onPressed: () {
                      if (i == lesson['answer']) {
                        Navigator.pop(context, true);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Try again. Read the explanation.'),
                          ),
                        );
                      }
                    },
                    child: Text(lesson['options'][i]),
                  ),
                ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
    if (answer != true) return;
    await db.quiz(lesson['id']);
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Editor(
          language: track == 2 ? 'python' : courses[track]['id'],
          lesson: lesson,
        ),
      ),
    );
    await refresh();
  }

  @override
  Widget build(BuildContext context) {
    final lessons = courses[track]['lessons'] as List;
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: AnimatedBuilder(
                animation: scroll,
                builder: (_, child) => CustomPaint(
                  painter: MapBackground(scroll.hasClients ? scroll.offset : 0),
                ),
              ),
            ),
            Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 16, 12, 8),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'CODEBRIDGE',
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 23,
                            letterSpacing: 2,
                          ),
                        ),
                      ),
                      Text(
                        '${wallet['coins']} ◈  ${wallet['xp']} XP',
                        style: const TextStyle(color: green),
                      ),
                      PopupMenuButton<String>(
                        onSelected: (value) async {
                          if (value == 'shop') {
 await Navigator.push(context,MaterialPageRoute(builder:(_)=>const Shop())); await refresh();
 } else if (value == 'language') {
                            widget.onLocale();
                          } else if (value == 'daily') {
                            final clock = await Runtime.method.invokeMapMethod(
                              'clock',
                            );
                            final won = await db.daily(clock!);
                            await refresh();
                            if (context.mounted)
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    won
                                        ? '+20 coins'
                                        : 'Next reward after 24 verified hours.',
                                  ),
                                ),
                              );
                          }
                        },
                        itemBuilder: (_) => [
                          const PopupMenuItem(value:'shop',child:Text('Cosmetics')),
                          const PopupMenuItem(
                            value: 'daily',
                            child: Text('Daily reward'),
                          ),
                          const PopupMenuItem(
                            value: 'language',
                            child: Text('Language'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(value: 0, label: Text('C')),
                    ButtonSegment(value: 1, label: Text('C++17')),
                    ButtonSegment(value: 2, label: Text('Python 3.12')),
                  ],
                  selected: {track},
                  onSelectionChanged: (s) => setState(() => track = s.first),
                ),
                Expanded(
                  child: CustomScrollView(
                    controller: scroll,
                    slivers: [
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Text(
                            'YOUR NEXT BREAKTHROUGH',
                            style: TextStyle(
                              fontSize: 12,
                              letterSpacing: 2,
                              color: Color(0xFF8293AC),
                            ),
                          ),
                        ),
                      ),
                      SliverList.builder(
                        itemCount: lessons.length,
                        itemBuilder: (context, i) {
                          final l = lessons[i] as Map, id = l['id'] as String;
                          final done = mastered.contains(id),
                              ready =
                                  i == 0 ||
                                  mastered.contains(lessons[i - 1]['id']);
                          return SizedBox(
                            height: 190,
                            child: Stack(
                              children: [
                                Positioned.fill(
                                  child: CustomPaint(painter: PathSegment(i)),
                                ),
                                Align(
                                  alignment: Alignment(
                                    i.isEven ? -.38 : .38,
                                    0,
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        l['stage'],
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFF8293AC),
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      AnimatedBuilder(
                                        animation: pulse,
                                        builder: (_, child) => Transform.scale(
                                          scale:
                                              ready &&
                                                  !done &&
                                                  !MediaQuery.disableAnimationsOf(
                                                    context,
                                                  )
                                              ? 1 + pulse.value * .035
                                              : 1,
                                          child: child,
                                        ),
                                        child: Semantics(
                                          button: true,
                                          label:
                                              '${l['title']}, ${tr(done
                                                  ? 'mastered'
                                                  : ready
                                                  ? 'unlocked'
                                                  : 'locked')}',
                                          child: Container(
                                            decoration: BoxDecoration(
                                              shape: BoxShape.circle,
                                              boxShadow: [
                                                BoxShadow(
                                                  color:
                                                      (done
                                                              ? Colors.amber
                                                              : ready
                                                              ? green
                                                              : Colors
                                                                    .transparent)
                                                          .withValues(
                                                            alpha: .2,
                                                          ),
                                                  blurRadius: 16,
                                                  offset: const Offset(0, 6),
                                                ),
                                              ],
                                            ),
                                            child: SizedBox(
                                              width: 70,
                                              height: 76,
                                              child: ElevatedButton(
                                                style: ElevatedButton.styleFrom(
                                                  shape: const CircleBorder(),
                                                  backgroundColor: done
                                                      ? Colors.amber
                                                      : green,
                                                  foregroundColor: background,
                                                  elevation: 6,
                                                ),
                                                onPressed: ready
                                                    ? () => open(l)
                                                    : null,
                                                child: Icon(
                                                  done
                                                      ? Icons.check_rounded
                                                      : ready
                                                      ? Icons.play_arrow_rounded
                                                      : Icons.lock_rounded,
                                                  size: 30,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        l['title'],
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 100)),
                    ],
                  ),
                ),
              ],
            ),
            Positioned(
              bottom: 14,
              right: 16,
              child: FloatingActionButton.extended(
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => Editor(
                        language: track == 2 ? 'python' : courses[track]['id'],
                      ),
                    ),
                  );
                  refresh();
                },
                icon: const Icon(Icons.code),
                label: const Text('Free code'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PathSegment extends CustomPainter {
  final int index;
  PathSegment(this.index);
  @override
  void paint(Canvas c, Size s) {
    final x = s.width * (index.isEven ? 0.31 : 0.69), next = s.width - x;
    final p = Path()
      ..moveTo(s.width - x, -95)
      ..cubicTo(s.width - x, 0, x, 0, x, 95)
      ..cubicTo(x, 190, next, 190, next, 285);
    c.drawPath(
      p,
      Paint()
        ..color = const Color(0xFF243145)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5,
    );
  }

  @override
  bool shouldRepaint(PathSegment old) => old.index != index;
}

class MapBackground extends CustomPainter {
  final double offset;
  MapBackground(this.offset);
  @override
  void paint(Canvas c, Size s) {
    for (var layer = 0; layer < 3; layer++) {
      final paint = Paint()
        ..color = Color.fromRGBO(116, 161, 208, .035 + layer * .018);
      for (var i = 0; i < 22; i++) {
        final x = (i * 83 + layer * 31) % s.width,
            y =
                ((i * 117 - offset * [.08, .18, .32][layer]) %
                (s.height + 100));
        c.drawCircle(Offset(x, y), layer == 0 ? 2 : 1, paint);
      }
    }
  }

  @override
  bool shouldRepaint(MapBackground old) => old.offset != offset;
}

class Editor extends StatefulWidget {
  final String language;
  final Map? lesson;
  const Editor({super.key, required this.language, this.lesson});
  @override
  State<Editor> createState() => _EditorState();
}

class _EditorState extends State<Editor> {
  final code = CodeController(),
      focus = FocusNode(),
      undo = UndoHistoryController(),
      input = TextEditingController();
  final pointers = <int, Offset>{};
  Timer? saveTimer;
  double font = 15, startFont = 15, startDistance = 1;
  bool tools = false, busy = false;
  Color terminalColor=background,bitTint=Colors.white;
  String reaction = 'idle',
      dialogue = 'The compiler is ready. Is the code?',
      terminal = '';
  String get id => widget.lesson?['id'] as String? ?? 'free:${widget.language}';
  String get starter => widget.language == 'python'
      ? 'print("Hello, CodeBridge!")\n'
      : widget.language == 'cpp'
      ? '#include <iostream>\nint main() {\n    std::cout << "Hello, CodeBridge!\\n";\n    return 0;\n}\n'
      : '#include <stdio.h>\nint main(void) {\n    printf("Hello, CodeBridge!\\n");\n    return 0;\n}\n';
  @override
  void initState() {
    super.initState();
    load();
    focus.addListener(update);
    code.addListener(changed);
  }

  Future<void> load() async {
    final s = await db.settings();
    final saved = await db.document(id);
    final cosmetic=await db.cosmetics();
    if(cosmetic["bit_skin"]!=null){final data=jsonDecode(await rootBundle.loadString(cosmetic["bit_skin"]!));bitTint=Color(data["tint"] as int);}
    if(cosmetic["terminal_theme"]!=null){final data=jsonDecode(await rootBundle.loadString(cosmetic["terminal_theme"]!));terminalColor=Color(data["background"] as int);}
    if(cosmetic["syntax_palette"]!=null){final data=jsonDecode(await rootBundle.loadString(cosmetic["syntax_palette"]!));code.keyword=Color(data["keyword"] as int);code.string=Color(data["string"] as int);code.comment=Color(data["comment"] as int);}
    if (!mounted) return;
    code.text = saved ?? widget.lesson?['starter'] as String? ?? starter;
    setState(() => font = (s['font_size'] as num).toDouble());
  }

  void update() {
    if (mounted) setState(() {});
  }

  void changed() {
    saveTimer?.cancel();
    saveTimer = Timer(
      const Duration(milliseconds: 400),
      () => db.save(id, code.text),
    );
  }

  Future<void> react(String state, String trigger) async {
    final line = await db.dialogue(locale, state, words['dialogue'][state]);
    if (mounted)
      setState(() {
        reaction = trigger;
        dialogue = line;
      });
  }

  @override
  void dispose() {
    saveTimer?.cancel();
    db.save(id, code.text);
    code.removeListener(changed);
    code.dispose();
    focus.dispose();
    undo.dispose();
    input.dispose();
    super.dispose();
  }

  Future<void> run(String mode, {bool grade = false}) async {
    if (busy) return;
    await db.save(id, code.text);
    focus.unfocus();
    setState(() {
      busy = true;
      tools = false;
      terminal = '';
    });
    try {
      final cases = grade
          ? widget.lesson!['cases'] as List
          : [
              {'input': input.text},
            ];
      var passed = true;
      for (var i = 0; i < cases.length; i++) {
        final test = cases[i] as Map;
        final r = await Runtime.run(
          source: code.text,
          language: widget.language,
          input: test['input'] as String? ?? '',
          mode: mode,
          onOutput: (kind, text) {
            if (mounted)
              setState(
                () => terminal = (terminal + text).substring(
                  math.max(0, (terminal + text).length - 100000),
                ),
              );
          },
        );
        final ok =
            r.code == 0 &&
            (!grade ||
                r.stdout.trimRight() == (test['output'] as String).trimRight());
        passed = passed && ok;
        if (grade && mounted)
          setState(
            () => terminal += '\nTest ${i + 1}: ${ok ? 'PASS' : 'FAIL'}\n',
          );
        if (r.code != 0) {
          await react(
            widget.language == 'python' && r.stderr.contains('SyntaxError')
                ? 'PythonSyntaxError'
                : 'CppCompileFailed',
            widget.language == 'python' && r.stderr.contains('SyntaxError')
                ? 'pythonSyntax'
                : 'compileFailed',
          );
          break;
        }
      }
      if (passed) {
        await react('Success', 'success');
        if (grade) {
          await db.passed(id, (widget.lesson!['xp'] as num).toInt());
          if (mounted)
            setState(
              () => terminal += '\nLesson mastered. Rewards saved offline.\n',
            );
        }
      }
    } catch (e) {
      setState(() => terminal += '\nRuntime error: $e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> console() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: .75,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(20),
          children: [
            ColorFiltered(colorFilter:ColorFilter.mode(bitTint,BlendMode.modulate),child:Bit(reaction: reaction, dialogue: dialogue)),
            Text('OUTPUT', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 12),
            Directionality(
              textDirection: TextDirection.ltr,
              child: SelectableText(
                terminal.isEmpty ? 'No output yet.' : terminal,
                style: const TextStyle(
                  fontFamily: 'JetBrainsMono',
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: input,
              maxLines: 4,
              textDirection: TextDirection.ltr,
              decoration: const InputDecoration(
                labelText: 'Standard input for next run',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Input is supplied before execution; EOF follows the final character.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.viewInsetsOf(context).bottom,
        typing = focus.hasFocus && inset > 0;
    return PopScope(
      canPop: !busy,
      child: Scaffold(
        backgroundColor:terminalColor,
        resizeToAvoidBottomInset: false,
        body: SafeArea(
          child: Stack(
            children: [
              Positioned.fill(
                bottom: inset + (typing ? 48 : 0),
                child: Listener(
                  onPointerDown: (e) {
                    pointers[e.pointer] = e.position;
                    if (pointers.length == 2) {
                      startDistance =
                          (pointers.values.first - pointers.values.last)
                              .distance;
                      startFont = font;
                    }
                  },
                  onPointerMove: (e) {
                    pointers[e.pointer] = e.position;
                    if (pointers.length == 2 && startDistance > 0) {
                      setState(
                        () => font =
                            (startFont *
                                    (pointers.values.first -
                                            pointers.values.last)
                                        .distance /
                                    startDistance)
                                .clamp(11, 28),
                      );
                    }
                  },
                  onPointerUp: (e) {
                    pointers.remove(e.pointer);
                    db.font(font);
                  },
                  onPointerCancel: (e) {
                    pointers.remove(e.pointer);
                  },
                  child: Directionality(
                    textDirection: TextDirection.ltr,
                    child: TextField(
                      controller: code,
                      undoController: undo,
                      focusNode: focus,
                      readOnly: busy,
                      maxLines: null,
                      expands: true,
                      keyboardType: TextInputType.multiline,
                      autocorrect: false,
                      enableSuggestions: false,
                      smartDashesType: SmartDashesType.disabled,
                      smartQuotesType: SmartQuotesType.disabled,
                      textAlignVertical: TextAlignVertical.top,
                      style: TextStyle(
                        fontFamily: 'JetBrainsMono',
                        fontSize: font,
                        height: 1.55,
                      ),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.fromLTRB(16, 50, 94, 160),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 0,
                left: 0,
                child: IconButton(
                  onPressed: busy ? null : () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
              ),
              Positioned(
                top: 0,
                right: 0,
                child: PopupMenuButton<String>(
                  onSelected: (value) async {
                    if (value == 'save') {
                      await db.save(id, code.text);
                    }
                    if (value == 'snippets') {
                      code.insert(starter);
                    }
                    if (value == 'console') {
                      await console();
                    }
                  },
                  itemBuilder: (_) => [
                    PopupMenuItem(value: 'save', child: Text(tr('save'))),
                    PopupMenuItem(
                      value: 'snippets',
                      child: Text(tr('snippets')),
                    ),
                    const PopupMenuItem(
                      value: 'console',
                      child: Text('Input / output'),
                    ),
                  ],
                ),
              ),
              AnimatedPositioned(
                duration: const Duration(milliseconds: 160),
                curve: Curves.easeOutCubic,
                bottom: typing ? inset : -60,
                left: 0,
                right: 0,
                child: Material(
                  color: const Color(0xFF182233),
                  child: SizedBox(
                    height: 48,
                    child: Row(
                      children: [
                        IconButton(
                          tooltip: tr('undo'),
                          onPressed: undo.undo,
                          icon: const Icon(Icons.undo),
                        ),
                        IconButton(
                          tooltip: tr('redo'),
                          onPressed: undo.redo,
                          icon: const Icon(Icons.redo),
                        ),
                        IconButton(
                          tooltip: tr('indent'),
                          onPressed: () => code.indent(false),
                          icon: const Icon(Icons.format_indent_increase),
                        ),
                        IconButton(
                          tooltip: tr('outdent'),
                          onPressed: () => code.indent(true),
                          icon: const Icon(Icons.format_indent_decrease),
                        ),
                        for (final s in ['{}', '()', ';', ':'])
                          Expanded(
                            child: InkWell(
                              onTap: () => code.insert(s),
                              child: Center(
                                child: Text(
                                  s,
                                  style: const TextStyle(
                                    fontFamily: 'JetBrainsMono',
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 16,
                bottom: inset + (typing ? 64 : 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (tools) ...[
                      for (final action in [
                        ('build', Icons.build, tr('build')),
                        ('debug', Icons.bug_report, tr('debug')),
                        ('memory', Icons.memory, tr('memoryLab')),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: FloatingActionButton.small(
                            heroTag: action.$1,
                            onPressed: () async {
                              if (action.$1 == 'memory') {
                                await react(
                                  'MemoryLabWarning',
                                  'memoryWarning',
                                );
                                await console();
                              } else {
                                await run(action.$1);
                                await console();
                              }
                            },
                            tooltip: action.$3,
                            child: Icon(action.$2),
                          ),
                        ),
                    ],
                    FloatingActionButton.small(
                      heroTag: 'tools',
                      backgroundColor: const Color(0xFF263449),
                      onPressed: busy
                          ? null
                          : () => setState(() => tools = !tools),
                      child: Icon(tools ? Icons.close : Icons.add),
                    ),
                    const SizedBox(height: 12),
                    FloatingActionButton(
                      heroTag: 'run',
                      backgroundColor: green,
                      foregroundColor: background,
                      onPressed: () async {
                        if (busy) {
                          await Runtime.stop();
                          return;
                        }
                        await run('run');
                        if (mounted) await console();
                      },
                      child: Icon(
                        busy ? Icons.stop_rounded : Icons.play_arrow_rounded,
                        size: 38,
                      ),
                    ),
                    if (widget.lesson != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: FilledButton.tonal(
                          onPressed: busy
                              ? null
                              : () async {
                                  await run('run', grade: true);
                                  if (mounted) await console();
                                },
                          child: const Text('Submit'),
                        ),
                      ),
                  ],
                ),
              ),
              if (busy)
                const Positioned(
                  top: 0,
                  left: 0,
                  right: 48,
                  child: LinearProgressIndicator(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
