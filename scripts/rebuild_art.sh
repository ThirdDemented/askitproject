#!/usr/bin/env bash
set -euo pipefail

python "$(dirname "$0")/rebuild_art.py"
python "$(dirname "$0")/launcher.py"
