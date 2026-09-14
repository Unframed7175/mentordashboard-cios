#!/usr/bin/env bash
# PostToolUse hook: run Vitest tests related to an edited .ts/.tsx file.
# `related` runs only the test files that import the changed file (fast feedback).
# Exit 2 feeds failures back to Claude. --passWithNoTests avoids false failures
# when the edited file has no covering test.
input=$(cat)
file=$(printf '%s' "$input" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).tool_input.file_path||"")}catch{process.stdout.write("")}})')
case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
out=$(npx vitest related --run --passWithNoTests "$file" 2>&1)
if [ $? -ne 0 ]; then
  printf 'Vitest failures related to %s:\n%s\n' "$file" "$out" >&2
  exit 2
fi
exit 0
