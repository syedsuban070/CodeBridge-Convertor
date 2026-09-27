# Android learning adventure

The Home, Learn, Code, Quests and Profile tabs separate learning from the coding workspace. Lesson editors never overwrite the user's project. Drafts autosave separately from code projects.

## Courses
Each of C, C++ and Python has 11 missions: output, variables, numeric input, conditions, loops, functions, collections, strings, recursion, sorting, and a language-specific capstone (C pointers/structs or C++/Python classes). Three chapters progress from Foundations through Explorer to Advanced.

Complete the conceptual quiz and all execution checks to finish a mission. First completion awards 40–120 XP and 10 coins and unlocks the next mission in that path. Each 250 XP advances the profile level. Completed missions remain replayable. Tests check output, not source structure; read the solution to check that the requested technique was used.

## Daily activity
The device's local date controls resets. Claim 20 coins once per day. Daily quests award 25 XP + 15 coins for one new lesson, two successful exercise checks, or three new lessons. Each quest may be claimed once per date. Replaying an exercise advances practice but never adds mission XP twice. The daily challenge chooses a previously completed mission (or the first C mission for a new learner). Rewards are offline collectibles and are not tamper resistant.

## Saving
Learning records use `codebridge.progress.v1` in local storage; workspace projects keep their original key. Profile offers export and restore of `.cbprogress` files, including lesson drafts. Restore validates the schema and asks before replacing progress. No account or cloud sync. Device reset, clearing data, and uninstall can erase records. Full code projects must be exported separately.

## Validation
`node tests/learning.test.cjs` checks progression, rewards, date rollover, duplicate claims, streaks and backup validation. `python scripts/check_curriculum.py` executes all 78 input/output cases across the 33 reference solutions with host compilers. Browser integration tests check real runtime lesson execution, quiz gating, failed solutions, persistence, quest claims and responsive navigation. Android instrumentation checks the packaged offline C++ and Python runtimes and a C course mission.
