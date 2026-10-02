import 'dart:convert';
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

class Store extends GeneratedDatabase {
  Store(super.executor);
  @override
  int get schemaVersion => 1;
  @override
  Iterable<TableInfo<Table, dynamic>> get allTables => [];
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [];
  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      for (final sql
          in jsonDecode(await rootBundle.loadString('assets/data/schema.json'))
              as List) {
        await customStatement(sql as String);
      }
      await customStatement(
        'CREATE TABLE documents(id TEXT PRIMARY KEY,source TEXT NOT NULL)',
      );
      await customStatement(
        'CREATE TABLE lesson_results(id TEXT PRIMARY KEY,quiz INTEGER NOT NULL DEFAULT 0,run INTEGER NOT NULL DEFAULT 0)',
      );
    },
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys=ON');
    },
  );
  static Future<Store> open() async {
    final dir = await getApplicationSupportDirectory();
    return Store(
      NativeDatabase.createInBackground(File('${dir.path}/codebridge.sqlite')),
    );
  }

  Future<Map<String, dynamic>> settings() async =>
      (await customSelect('SELECT * FROM settings').getSingle()).data;
  Future<void> locale(String value) => customStatement(
    "UPDATE settings SET locale=?,onboarding_step='done' WHERE singleton=1",
    [value],
  );
  Future<void> font(double value) => customStatement(
    'UPDATE settings SET font_size=? WHERE singleton=1',
    [value],
  );
  Future<String?> document(String id) async => (await customSelect(
    'SELECT source FROM documents WHERE id=?',
    variables: [Variable(id)],
  ).getSingleOrNull())?.read<String>('source');
  Future<void> save(String id, String text) => customStatement(
    'INSERT INTO documents(id,source) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET source=excluded.source',
    [id, text],
  );
  Future<Set<String>> mastered() async => (await customSelect(
    'SELECT id FROM lesson_results WHERE quiz=1 AND run=1',
  ).get()).map((r) => r.read<String>('id')).toSet();
  Future<void> quiz(String id) => customStatement(
    'INSERT INTO lesson_results(id,quiz) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET quiz=1',
    [id],
  );
  Future<void> passed(String id, int xp) => transaction(() async {
    await customStatement(
      'INSERT INTO lesson_results(id,run) VALUES(?,1) ON CONFLICT(id) DO UPDATE SET run=1',
      [id],
    );
    final row = await customSelect(
      'SELECT quiz FROM lesson_results WHERE id=?',
      variables: [Variable(id)],
    ).getSingle();
    if (row.read<int>('quiz') == 1) {
      await customStatement(
        "INSERT OR IGNORE INTO ledger VALUES(?,?, 'node_reward',?,10,?,?)",
        [
          'lesson:$id',
          'lesson:$id',
          id,
          xp,
          DateTime.now().millisecondsSinceEpoch,
        ],
      );
    }
  });
  Future<Map<String, dynamic>> wallet() async =>
      (await customSelect('SELECT * FROM wallet').getSingle()).data;
  Future<bool> daily(Map clock) => transaction(() async {
    final row = await customSelect(
      'SELECT * FROM daily_clock',
    ).getSingleOrNull();
    final wall = clock['wall'] as int,
        elapsed = clock['elapsed'] as int,
        boot = '${clock['boot']}';
    if (row == null) {
      await customStatement(
        'INSERT INTO daily_clock VALUES(1,?,?,?,86400000,0,0)',
        [boot, elapsed, wall],
      );
    }
    final r = (await customSelect(
      'SELECT * FROM daily_clock',
    ).getSingle()).data;
    final same =
        r['boot_id'] == boot && elapsed >= (r['last_elapsed_ms'] as int);
    final delta = same ? elapsed - (r['last_elapsed_ms'] as int) : 0;
    final suspect =
        !same ||
        wall < (r['last_wall_ms'] as int) ||
        ((wall - (r['last_wall_ms'] as int)) - delta).abs() > 300000;
    // Across reboot/clock manipulation award only elapsed time subsequently observed.
    final accrued = ((r['accrued_ms'] as int) + delta).clamp(0, 86400000);
    await customStatement(
      'UPDATE daily_clock SET boot_id=?,last_elapsed_ms=?,last_wall_ms=?,accrued_ms=?,clock_suspect=?',
      [boot, elapsed, wall, accrued, suspect ? 1 : 0],
    );
    if (accrued < 86400000) return false;
    final seq = (r['claim_sequence'] as int) + 1, key = 'daily:$seq';
    await customStatement("INSERT INTO ledger VALUES(?,?,'daily',?,20,0,?)", [
      key,
      key,
      '$seq',
      wall,
    ]);
    await customStatement('INSERT INTO daily_claims VALUES(?,?)', [seq, key]);
    await customStatement(
      'UPDATE daily_clock SET accrued_ms=0,claim_sequence=?',
      [seq],
    );
    return true;
  });
  Future<String> dialogue(
    String locale,
    String state,
    List lines,
  ) => transaction(() async {
    final last = await customSelect(
      'SELECT line_id FROM dialogue_history WHERE locale=? AND state=?',
      variables: [Variable(locale), Variable(state)],
    ).getSingleOrNull();
    final choices =
        lines.where((l) => l['id'] != last?.read<String>('line_id')).toList()
          ..shuffle();
    final line = choices.isNotEmpty ? choices.first : lines.first;
    await customStatement(
      'INSERT INTO dialogue_history VALUES(?,?,?) ON CONFLICT(locale,state) DO UPDATE SET line_id=excluded.line_id',
      [locale, state, line['id']],
    );
    return line['text'] as String;
  });
}
