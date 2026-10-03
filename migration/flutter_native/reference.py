"""Executable reference for future drift transactions, NOT the Flutter app.

Standard-library only. Android execution, drift integration and Rive authoring
are deliberately not simulated here. See README.md for the remaining gates.
"""
from dataclasses import dataclass
import random
import re
import sqlite3

DAY_MS = 86_400_000


def credit(db, key, kind, source, coins, xp, now):
    if kind not in ('migration', 'daily', 'node_reward'):
        raise ValueError('invalid reward kind')
    if type(coins) is not int or type(xp) is not int or min(coins, xp) < 0:
        raise ValueError('invalid reward')
    with db:
        previous = db.execute('SELECT kind,source_id,coins_delta,xp_delta FROM ledger WHERE idempotency_key=?', (key,)).fetchone()
        if previous:
            if tuple(previous) != (kind, source, coins, xp):
                raise ValueError('idempotency key reused for a different transaction')
            return False
        db.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',
                   (key, key, kind, source, coins, xp, now))
    return True


def purchase(db, item_id, now):
    # drift equivalent: transaction(() async { ... }); serialize writers.
    with db:
        db.execute('BEGIN IMMEDIATE')
        if db.execute('SELECT 1 FROM ownership WHERE item_id=?', (item_id,)).fetchone():
            return False
        item = db.execute('SELECT price,requires_node_id,retired FROM store_items WHERE id=?', (item_id,)).fetchone()
        if not item or item[2]:
            raise ValueError('item unavailable')
        if item[1] and not db.execute("SELECT 1 FROM progression WHERE node_id=? AND state='mastered'", (item[1],)).fetchone():
            raise ValueError('item locked')
        key = 'purchase:' + item_id
        db.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',
                   (key, key, 'purchase', item_id, -item[0], 0, now))
        db.execute('INSERT INTO ownership VALUES(?,?,?)', (item_id, key, now))
        db.execute('INSERT INTO visual_events(id,event,source_id) VALUES(?,?,?)',
                   (key, 'purchase', item_id))
    return True


@dataclass(frozen=True)
class Clock:
    boot_id: str
    elapsed_ms: int
    wall_ms: int
    accrued_ms: int = 0
    suspect: bool = False


def advance_clock(previous, boot_id, elapsed_ms, wall_ms):
    """Use a boot-scoped, suspend-inclusive monotonic clock.

    Wall time detects anomalies but NEVER grants eligibility. After reboot,
    preserve already-earned time and discard unverifiable powered-off time.
    """
    if elapsed_ms < 0:
        raise ValueError('negative monotonic sample')
    if previous is None:
        return Clock(boot_id, elapsed_ms, wall_ms)
    same_boot = boot_id == previous.boot_id
    delta = elapsed_ms - previous.elapsed_ms if same_boot else 0
    reset = same_boot and delta < 0
    safe_delta = max(0, delta)
    wall_delta = wall_ms - previous.wall_ms
    anomaly = reset or wall_delta < -120_000 or (same_boot and abs(wall_delta-safe_delta) > 300_000)
    return Clock(boot_id, elapsed_ms, wall_ms,
                 min(DAY_MS, previous.accrued_ms + safe_delta),
                 previous.suspect or anomaly)


def claim_daily(db, sample, now):
    """Caller persists every observation; a claim and clock reset are atomic."""
    with db:
        db.execute('BEGIN IMMEDIATE')
        row = db.execute('SELECT boot_id,last_elapsed_ms,last_wall_ms,accrued_ms,claim_sequence,clock_suspect FROM daily_clock WHERE singleton=1').fetchone()
        prior = Clock(row[0], row[1], row[2], row[3], bool(row[5])) if row else None
        clock = advance_clock(prior, *sample)
        sequence = row[4] if row else 0
        eligible = clock.accrued_ms >= DAY_MS
        if eligible:
            sequence += 1
            key = 'daily:' + str(sequence)
            db.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',
                       (key, key, 'daily', str(sequence), 20, 0, now))
            db.execute('INSERT INTO daily_claims VALUES(?,?)', (sequence, key))
        db.execute('INSERT OR REPLACE INTO daily_clock VALUES(1,?,?,?,?,?,?)',
                   (clock.boot_id, clock.elapsed_ms, clock.wall_ms,
                    0 if eligible else clock.accrued_ms, sequence, int(clock.suspect)))
    return eligible


def classify(phase, language, exit_code, stderr='', signal=None, cancelled=False,
             timed_out=False, tool_error=False, grader_pass=None):
    """Structured process metadata takes priority; stdout is never classified."""
    if cancelled:
        return 'cancelled'
    if tool_error:
        return 'tool_error'
    if timed_out:
        return 'timeout'
    if grader_pass is not None:
        return 'boss_pass' if grader_pass else 'boss_fail'
    if phase == 'run' and signal == 11:
        return 'memory_fault'
    if phase == 'compile' and exit_code != 0:
        return 'cpp_compile_failed' if language in ('c', 'cpp') else 'tool_error'
    if phase == 'run' and exit_code != 0 and language == 'python':
        lines = stderr.rstrip().splitlines()
        # Restrict matching to the final exception summary, not quoted source.
        last = lines[-1] if lines else ''
        if re.match(r'^SyntaxError:\s', last):
            return 'python_colon' if re.search(r"expected\s+['\"]:['\"]", last) else 'python_syntax'
        if re.match(r'^(IndentationError|TabError):\s', last):
            return 'python_indent'
        return 'runtime_error'
    if phase == 'run' and exit_code != 0:
        return 'runtime_error'
    return 'success' if exit_code == 0 else 'tool_error'


def choose_dialogue(lines, previous_id, rng=None):
    if not lines:
        raise ValueError('empty dialogue pool')
    eligible = [line for line in lines if line['id'] != previous_id]
    return (rng or random.SystemRandom()).choice(eligible or lines)
