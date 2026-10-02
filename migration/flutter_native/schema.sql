PRAGMA foreign_keys = ON;

CREATE TABLE settings (
  singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
  locale TEXT NOT NULL CHECK(locale IN ('en','ur','zh-Hans')),
  onboarding_step TEXT NOT NULL DEFAULT 'language'
    CHECK(onboarding_step IN ('language','track','experience','first_run','done')),
  track TEXT NOT NULL DEFAULT 'python' CHECK(track IN ('c','cpp','python')),
  font_size REAL NOT NULL DEFAULT 15 CHECK(font_size BETWEEN 11 AND 28),
  reduced_motion INTEGER NOT NULL DEFAULT 0 CHECK(reduced_motion IN (0,1)),
  sound_enabled INTEGER NOT NULL DEFAULT 0 CHECK(sound_enabled IN (0,1))
);
INSERT INTO settings(singleton, locale) VALUES(1,'en');

CREATE TABLE stages (
  id TEXT PRIMARY KEY,
  track TEXT NOT NULL CHECK(track IN ('c','cpp','python')),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  title_key TEXT NOT NULL,
  content_version INTEGER NOT NULL CHECK(content_version > 0),
  retired INTEGER NOT NULL DEFAULT 0 CHECK(retired IN (0,1)),
  UNIQUE(track, ordinal)
);
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES stages(id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  kind TEXT NOT NULL CHECK(kind IN ('lesson','quiz','practice','memory_boss','python_boss')),
  title_key TEXT NOT NULL,
  content_asset TEXT NOT NULL,
  grading_asset TEXT NOT NULL,
  content_version INTEGER NOT NULL CHECK(content_version > 0),
  retired INTEGER NOT NULL DEFAULT 0 CHECK(retired IN (0,1)),
  UNIQUE(stage_id, ordinal)
);
CREATE TABLE prerequisites (
  node_id TEXT NOT NULL REFERENCES nodes(id),
  prerequisite_id TEXT NOT NULL REFERENCES nodes(id),
  PRIMARY KEY(node_id, prerequisite_id),
  CHECK(node_id <> prerequisite_id)
);
CREATE TABLE progression (
  node_id TEXT PRIMARY KEY REFERENCES nodes(id),
  state TEXT NOT NULL CHECK(state IN ('locked','unlocked','mastered')),
  unlocked_at_ms INTEGER,
  mastered_at_ms INTEGER,
  mastered_content_version INTEGER,
  CHECK(
    (state='locked' AND unlocked_at_ms IS NULL AND mastered_at_ms IS NULL
      AND mastered_content_version IS NULL) OR
    (state='unlocked' AND unlocked_at_ms IS NOT NULL AND mastered_at_ms IS NULL
      AND mastered_content_version IS NULL) OR
    (state='mastered' AND unlocked_at_ms IS NOT NULL AND mastered_at_ms IS NOT NULL
      AND mastered_content_version IS NOT NULL AND mastered_content_version > 0)
  )
);
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES nodes(id),
  content_version INTEGER NOT NULL,
  grader_version INTEGER NOT NULL,
  runtime_manifest TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('passed','failed','cancelled','tool_error')),
  score INTEGER CHECK(score BETWEEN 0 AND 100),
  elapsed_us INTEGER CHECK(elapsed_us >= 0),
  created_at_ms INTEGER NOT NULL
);
CREATE INDEX attempts_node ON attempts(node_id, created_at_ms);
CREATE TABLE map_resume (
  track TEXT PRIMARY KEY CHECK(track IN ('c','cpp','python')),
  node_id TEXT REFERENCES nodes(id),
  offset_dp REAL NOT NULL DEFAULT 0
);

CREATE TABLE store_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('bit_skin','terminal_theme','syntax_palette')),
  name_key TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price >= 0),
  rarity TEXT NOT NULL CHECK(rarity IN ('common','rare','epic')),
  asset_ref TEXT NOT NULL,
  requires_node_id TEXT REFERENCES nodes(id),
  catalog_version INTEGER NOT NULL CHECK(catalog_version > 0),
  retired INTEGER NOT NULL DEFAULT 0 CHECK(retired IN (0,1))
);
CREATE TABLE ledger (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('migration','daily','node_reward','purchase')),
  source_id TEXT NOT NULL,
  coins_delta INTEGER NOT NULL,
  xp_delta INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  CHECK(
    (kind='purchase' AND coins_delta <= 0 AND xp_delta=0) OR
    (kind<>'purchase' AND coins_delta >= 0 AND xp_delta >= 0)
  )
);
CREATE TRIGGER ledger_immutable_update BEFORE UPDATE ON ledger
BEGIN SELECT RAISE(ABORT,'ledger is append only'); END;
CREATE TRIGGER ledger_immutable_delete BEFORE DELETE ON ledger
BEGIN SELECT RAISE(ABORT,'ledger is append only'); END;
CREATE TRIGGER ledger_nonnegative BEFORE INSERT ON ledger
WHEN (SELECT COALESCE(SUM(coins_delta),0) FROM ledger) + NEW.coins_delta < 0
BEGIN SELECT RAISE(ABORT,'insufficient coins'); END;
CREATE VIEW wallet AS
  SELECT COALESCE(SUM(coins_delta),0) AS coins,
         COALESCE(SUM(xp_delta),0) AS xp FROM ledger;
CREATE TABLE ownership (
  item_id TEXT PRIMARY KEY REFERENCES store_items(id),
  transaction_id TEXT NOT NULL REFERENCES ledger(id),
  acquired_at_ms INTEGER NOT NULL
);
CREATE TABLE equipped (
  type TEXT PRIMARY KEY CHECK(type IN ('bit_skin','terminal_theme','syntax_palette')),
  item_id TEXT NOT NULL REFERENCES ownership(item_id)
);
CREATE TRIGGER equipped_type_insert BEFORE INSERT ON equipped
WHEN NEW.type <> (SELECT type FROM store_items WHERE id=NEW.item_id)
BEGIN SELECT RAISE(ABORT,'cosmetic category mismatch'); END;
CREATE TRIGGER equipped_type_update BEFORE UPDATE ON equipped
WHEN NEW.type <> (SELECT type FROM store_items WHERE id=NEW.item_id)
BEGIN SELECT RAISE(ABORT,'cosmetic category mismatch'); END;

CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name_key TEXT NOT NULL,
  asset_ref TEXT NOT NULL,
  requires_node_id TEXT NOT NULL REFERENCES nodes(id)
);
CREATE TABLE earned_badges (
  badge_id TEXT PRIMARY KEY REFERENCES badges(id),
  attempt_id TEXT NOT NULL REFERENCES attempts(id),
  earned_at_ms INTEGER NOT NULL
);
CREATE TABLE daily_clock (
  singleton INTEGER PRIMARY KEY CHECK(singleton=1),
  boot_id TEXT NOT NULL,
  last_elapsed_ms INTEGER NOT NULL CHECK(last_elapsed_ms >= 0),
  last_wall_ms INTEGER NOT NULL,
  accrued_ms INTEGER NOT NULL DEFAULT 0 CHECK(accrued_ms BETWEEN 0 AND 86400000),
  claim_sequence INTEGER NOT NULL DEFAULT 0 CHECK(claim_sequence >= 0),
  clock_suspect INTEGER NOT NULL DEFAULT 0 CHECK(clock_suspect IN (0,1))
);
CREATE TABLE daily_claims (
  sequence INTEGER PRIMARY KEY CHECK(sequence >= 1),
  transaction_id TEXT NOT NULL UNIQUE REFERENCES ledger(id)
);
CREATE TABLE dialogue_history (
  locale TEXT NOT NULL CHECK(locale IN ('en','ur','zh-Hans')),
  state TEXT NOT NULL,
  line_id TEXT NOT NULL,
  PRIMARY KEY(locale,state)
);
CREATE TABLE visual_events (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL CHECK(event IN ('unlock','mastery','boss_chest','purchase')),
  source_id TEXT NOT NULL,
  consumed INTEGER NOT NULL DEFAULT 0 CHECK(consumed IN (0,1)),
  UNIQUE(event,source_id)
);
CREATE TABLE migration_log (
  id TEXT PRIMARY KEY,
  source_sha256 TEXT NOT NULL,
  applied_at_ms INTEGER NOT NULL
);
