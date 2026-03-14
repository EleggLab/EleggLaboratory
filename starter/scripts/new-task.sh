#!/usr/bin/env bash
set -euo pipefail

TASK_NAME=${1:-task-$(date +%Y%m%d-%H%M)}
mkdir -p "tasks/$TASK_NAME"
cp prompts/task.template.md "tasks/$TASK_NAME/prompt.md"
echo "Created tasks/$TASK_NAME/prompt.md"
