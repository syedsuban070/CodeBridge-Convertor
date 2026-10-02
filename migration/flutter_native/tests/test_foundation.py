import json
from pathlib import Path
import random
import sqlite3
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from reference import credit, purchase, claim_daily, advance_clock, Clock, DAY_MS, classify, choose_dialogue
from release_gate import check


class FoundationTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.executescript((ROOT / 'schema.sql').read_text())
        self.db.execute("INSERT INTO store_items VALUES('skin','bit_skin','skin',60,'rare','assets/skin.riv',NULL,1,0)")
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def balance(self):
        return self.db.execute('SELECT coins,xp FROM wallet').fetchone()

    def test_purchase_and_duplicate_are_atomic(self):
        credit(self.db, 'opening', 'migration', 'legacy', 100, 40, 0)
        self.assertTrue(purchase(self.db, 'skin', 1))
        self.assertFalse(purchase(self.db, 'skin', 2))
        self.assertEqual((40, 40), self.balance())
        self.assertEqual(1, self.db.execute('SELECT COUNT(*) FROM ownership').fetchone()[0])

    def test_insufficient_funds_never_grants_ownership(self):
        with self.assertRaises(sqlite3.IntegrityError):
            purchase(self.db, 'skin', 1)
        self.assertEqual((0, 0), self.balance())
        self.assertEqual(0, self.db.execute('SELECT COUNT(*) FROM ownership').fetchone()[0])

    def test_failed_ownership_write_rolls_back_debit(self):
        credit(self.db, 'opening', 'migration', 'legacy', 100, 0, 0)
        self.db.executescript("CREATE TRIGGER fail_ownership BEFORE INSERT ON ownership BEGIN SELECT RAISE(ABORT,'disk simulation'); END;")
        with self.assertRaises(sqlite3.IntegrityError):
            purchase(self.db, 'skin', 1)
        self.assertEqual((100, 0), self.balance())

    def test_rewards_idempotent_and_collision_rejected(self):
        self.assertTrue(credit(self.db, 'node:one', 'node_reward', 'one', 20, 50, 0))
        self.assertFalse(credit(self.db, 'node:one', 'node_reward', 'one', 20, 50, 1))
        with self.assertRaises(ValueError):
            credit(self.db, 'node:one', 'node_reward', 'one', 2000, 50, 2)
        self.assertEqual((20, 50), self.balance())

    def test_equipment_requires_ownership_and_category(self):
        with self.assertRaises(sqlite3.IntegrityError), self.db:
            self.db.execute("INSERT INTO equipped VALUES('bit_skin','skin')")
        credit(self.db, 'opening', 'migration', 'legacy', 100, 0, 0)
        purchase(self.db, 'skin', 0)
        with self.assertRaises(sqlite3.IntegrityError), self.db:
            self.db.execute("INSERT INTO equipped VALUES('terminal_theme','skin')")

    def test_ledger_is_immutable(self):
        credit(self.db, 'opening', 'migration', 'legacy', 100, 0, 0)
        with self.assertRaises(sqlite3.IntegrityError), self.db:
            self.db.execute('DELETE FROM ledger')

    def test_clock_forward_and_rollback_do_not_grant_time(self):
        prior = Clock('boot', 100, 1_000_000)
        forward = advance_clock(prior, 'boot', 1100, 1_000_000 + 9*DAY_MS)
        self.assertEqual(1000, forward.accrued_ms)
        self.assertTrue(forward.suspect)
        rollback = advance_clock(forward, 'boot', 2100, 0)
        self.assertEqual(2000, rollback.accrued_ms)

    def test_reboot_preserves_only_verified_time(self):
        previous = Clock('a', 5000, 1000, 40_000)
        next_clock = advance_clock(previous, 'b', 9000, 99*DAY_MS)
        self.assertEqual(40_000, next_clock.accrued_ms)

    def test_daily_no_catchup_or_duplicate(self):
        self.assertFalse(claim_daily(self.db, ('a', 0, 1000), 1000))
        self.assertTrue(claim_daily(self.db, ('a', 5*DAY_MS, 5*DAY_MS+1000), 5*DAY_MS+1000))
        self.assertFalse(claim_daily(self.db, ('a', 5*DAY_MS, 5*DAY_MS+1000), 5*DAY_MS+1000))
        self.assertEqual((20, 0), self.balance())

    def test_diagnostics_use_phase_and_signal(self):
        self.assertEqual('cpp_compile_failed', classify('compile','cpp',1,'error: missing semicolon'))
        self.assertEqual('memory_fault', classify('run','cpp',None,signal=11))
        self.assertEqual('runtime_error', classify('run','cpp',139))
        self.assertEqual('success', classify('run','cpp',0,'segmentation fault'))
        self.assertEqual('python_colon', classify('run','python',1,"SyntaxError: expected ':'"))
        self.assertEqual('python_indent', classify('run','python',1,'IndentationError: unexpected indent'))
        self.assertEqual('tool_error', classify('compile','cpp',1,tool_error=True))
        self.assertEqual('cancelled', classify('run','cpp',1,cancelled=True))

    def test_locales_and_nonrepeating_dialogue(self):
        all_locales = [json.loads((ROOT/'i18n'/f'{locale}.json').read_text()) for locale in ('en','ur','zh-Hans')]
        for locale in all_locales:
            self.assertEqual(set(all_locales[0]['strings']), set(locale['strings']))
            self.assertEqual(set(all_locales[0]['dialogue']), set(locale['dialogue']))
            for pool in locale['dialogue'].values():
                self.assertGreaterEqual(len(pool), 3)
                previous = None
                for _ in range(20):
                    chosen = choose_dialogue(pool, previous, random.Random(42))
                    self.assertNotEqual(previous, chosen['id'])
                    previous = chosen['id']

    def test_catalog_and_machine_contracts(self):
        catalog = json.loads((ROOT/'catalog.json').read_text())
        ids = [item['id'] for item in catalog['items']]
        self.assertEqual(len(ids), len(set(ids)))
        for item in catalog['items']:
            self.assertEqual({'en','ur','zh-Hans'}, set(item['names']))
            self.assertGreaterEqual(item['priceCoins'], 0)
        machine = json.loads((ROOT/'bit.machine.json').read_text())
        for transition in machine['transitions']:
            self.assertIn(transition['to'], machine['states'])
            if 'trigger' in transition:
                self.assertIn(transition['trigger'], machine['inputs'])

    def test_native_release_is_explicitly_blocked(self):
        failures = check(ROOT, json.loads((ROOT/'native-status.json').read_text()))
        self.assertTrue(any('clang' in error for error in failures))
        self.assertTrue(any('python' in error for error in failures))
        self.assertTrue(any('Flutter' in error for error in failures))


if __name__ == '__main__':
    unittest.main()
