#!/usr/bin/env python3
"""Update goal state file: mark step as done and update StepsDone."""

import json
import re
import sys


def mark_step_done(goal_file, step_num):
    """Mark a step as done by updating StepsDone in frontmatter."""
    with open(goal_file, 'r') as f:
        raw = f.read()

    # Extract frontmatter between the first pair of --- markers
    # Supports both "---\n...\n---\n" and "---\n...\n---\n" (no trailing newline after ---)
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.DOTALL)
    if not m:
        # Try alternative: closing --- followed directly by body (no trailing newline after ---)
        m = re.match(r'^---\n(.*?)\n---(.*)$', raw, re.DOTALL)
    if not m:
        print(f"[update-goal-state] No frontmatter found in {goal_file}")
        return

    fm = m.group(1)
    body = m.group(2) if m.lastindex >= 2 else ""
    # Ensure body starts with newline if we used the alternative pattern
    if not body.startswith('\n') and body and not body.startswith('#'):
        body = '\n' + body

    # Update StepsDone: merge step_num into existing list
    done_match = re.search(r'^StepsDone:\s*(.+)$', fm, re.MULTILINE)
    if done_match:
        try:
            done = json.loads(done_match.group(1))
        except Exception:
            done = []
        if not isinstance(done, list):
            done = []
        if step_num not in done:
            done.append(step_num)
            done.sort()
        new_done = json.dumps(done)
        fm = fm[:done_match.start()] + 'StepsDone: ' + new_done + fm[done_match.end():]
    else:
        fm = fm.rstrip() + '\nStepsDone: ' + json.dumps([step_num]) + '\n'

    # Write back — ensure proper format
    result = '---\n' + fm
    # Ensure closing --- is on its own line
    if not result.endswith('\n---\n'):
        result = result.rstrip() + '\n---\n'
    result += body.lstrip('\n')
    with open(goal_file, 'w') as f:
        f.write(result)

    print(f"[update-goal-state] Updated StepsDone in {goal_file}")


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: update-goal-state.py <goal_file> <step_num>")
        sys.exit(1)
    mark_step_done(sys.argv[1], int(sys.argv[2]))
