#!/bin/sh
# Notify IndexNow (Bing, Yandex, Seznam, Naver) about changed URLs.
#   sh _ops/indexnow.sh https://habitforever.app/guides/x.html [more urls...]
KEY=fbf34efe49e9b29317d30a1b5d0918ad
[ $# -gt 0 ] || { echo "usage: $0 <url>..." >&2; exit 1; }
LIST=$(printf '"%s",' "$@" | sed 's/,$//')
curl -s -o /dev/null -w "IndexNow HTTP %{http_code}\n" -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{\"host\":\"habitforever.app\",\"key\":\"$KEY\",\"keyLocation\":\"https://habitforever.app/$KEY.txt\",\"urlList\":[$LIST]}"
