#!/usr/bin/env bash
# PostToolUse hook: run `npm run typecheck` after Claude edits a .ts/.tsx file.
# Exit 2 feeds the tsc output back to Claude so it can fix type errors immediately.
input=$(cat)
file=$(printf '%s' "$input" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{process.stdout.write(JSON.parse(d).tool_input.file_path||"")}catch{process.stdout.write("")}})')
case "$file" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
out=$(npm run --silent typecheck 2>&1)
if [ $? -ne 0 ]; then
  printf 'TypeScript errors after editing %s:\n%s\n' "$file" "$out" >&2
  exit 2
fi
exit 0
