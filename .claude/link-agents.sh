#!/bin/bash
# ~/dotfiles/link-agents.sh

ORIGIN="$HOME/dotfiles/AGENT.origin.md"

# 전역 설정
ln -sf "$ORIGIN" "$HOME/.claude/CLAUDE.md"
ln -sf "$ORIGIN" "$HOME/.cursor/rules/agent.mdc"

# 현재 프로젝트에 적용
link_to_project() {
    ln -sf "$ORIGIN" "./CLAUDE.md"
    ln -sf "$ORIGIN" "./.cursorrules"
    echo "Linked to current project"
}