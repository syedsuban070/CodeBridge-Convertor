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
  Future<List<Map<String,dynamic>>> catalog() async {
    final catalog=jsonDecode(await rootBundle.loadString('assets/data/store.json'));
    final items=(catalog['items'] as List).cast<Map<String,dynamic>>();
    await transaction(()async {
      for(final item in items){
        await customStatement('INSERT OR IGNORE INTO store_items(id,type,name_key,price,rarity,asset_ref,catalog_version) VALUES(?,?,?,?,?,?,1)',[item['id'],item['type'],item['name_key'],item['price'],item['rarity'],item['asset_ref']]);
      }
    });
    final owned=(await customSelect('SELECT item_id FROM ownership').get()).map((r)=>r.read<String>('item_id')).toSet();
    final equippedItems=(await customSelect('SELECT item_id FROM equipped').get()).map((r)=>r.read<String>('item_id')).toSet();
    return items.map((item)=>{...item,'owned':owned.contains(item['id']),'equipped':equippedItems.contains(item['id'])}).toList();
  }
  Future<void> buy(String id)=>transaction(()async {
    final item=await customSelect('SELECT * FROM store_items WHERE id=?',variables:[Variable(id)]).getSingle();
    final owned=await customSelect('SELECT item_id FROM ownership WHERE item_id=?',variables:[Variable(id)]).getSingleOrNull();
    if(owned==null){
      final key='purchase:$id';final now=DateTime.now().millisecondsSinceEpoch;
      await customStatement("INSERT INTO ledger VALUES(?,?,'purchase',?, ?,0,?)",[key,key,id,-item.read<int>('price'),now]);
      await customStatement('INSERT INTO ownership VALUES(?,?,?)',[id,key,now]);
    }
    await customStatement('INSERT INTO equipped VALUES(?,?) ON CONFLICT(type) DO UPDATE SET item_id=excluded.item_id',[item.read<String>('type'),id]);
  });
  Future<Map<String,String>> cosmetics()async {
    final rows=await customSelect('SELECT store_items.type,store_items.asset_ref FROM equipped JOIN store_items ON store_items.id=equipped.item_id').get();
    return {for(final r in rows)r.read<String>('type'):r.read<String>('asset_ref')};
  }

  Future<void> seedProgression(List courses)=>transaction(()async{
    for(final course in courses){
      final track=course['id']=='py'?'python':course['id'];
      final stageNames=<String>[];String? previous;
      final ordinals=<String,int>{};
      for(final lesson in course['lessons']){
        final stage=lesson['stage'] as String;
        if(!stageNames.contains(stage))stageNames.add(stage);
        final stageId='$track:${stageNames.indexOf(stage)}';
        await customStatement('INSERT OR IGNORE INTO stages(id,track,ordinal,title_key,content_version) VALUES(?,?,?,?,1)',[stageId,track,stageNames.indexOf(stage),stage]);
        final id=lesson['id'] as String,kind=lesson['kind'] as String? ?? 'lesson';
        final ordinal=ordinals[stageId]??0;ordinals[stageId]=ordinal+1;
        await customStatement('INSERT OR IGNORE INTO nodes(id,stage_id,ordinal,kind,title_key,content_asset,grading_asset,content_version) VALUES(?,?,?,?,?,?,?,1)',[id,stageId,ordinal,kind,lesson['title'],'assets/data/courses.json','assets/data/courses.json']);
        await customStatement('INSERT OR IGNORE INTO progression(node_id,state,unlocked_at_ms) VALUES(?,?,?)',[id,previous==null?'unlocked':'locked',previous==null?DateTime.now().millisecondsSinceEpoch:null]);
        if(previous!=null)await customStatement('INSERT OR IGNORE INTO prerequisites VALUES(?,?)',[id,previous]);
        if(kind=='memory_boss')await customStatement('INSERT OR IGNORE INTO badges VALUES(?,?,?,?)',['badge:$id','Arena keeper','assets/data/badge.svg',id]);
        previous=id;
      }
    }
  });
  Future<void> recordAttempt(String id,{required bool passed,required bool boss})=>transaction(()async{
    final now=DateTime.now().millisecondsSinceEpoch,attempt='$id:$now';
    await customStatement('INSERT INTO attempts VALUES(?,?,1,1,?,?,?,NULL,?)',[attempt,id,'Bundled native runtime; checked arena v1',passed?'passed':'failed',passed?100:0,now]);
    if(passed){
      await customStatement("UPDATE progression SET state='mastered',unlocked_at_ms=COALESCE(unlocked_at_ms,?),mastered_at_ms=?,mastered_content_version=1 WHERE node_id=?",[now,now,id]);
      await customStatement("UPDATE progression SET state='unlocked',unlocked_at_ms=? WHERE state='locked' AND node_id IN (SELECT node_id FROM prerequisites WHERE prerequisite_id=?)",[now,id]);
      if(boss)await customStatement('INSERT OR IGNORE INTO earned_badges VALUES(?,?,?)',['badge:$id',attempt,now]);
    }
  });

}
