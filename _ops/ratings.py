#!/usr/bin/env python3
"""Worldwide App Store rating for Habit Forever: sums every storefront from the public iTunes lookup.

    python3 _ops/ratings.py          # print the total
    python3 _ops/ratings.py --write  # also update RATING/RATING_COUNT/RATING_CHECKED in build.py and FACTS.md

Storefronts that fail are retried; the script refuses to write if any still fail, so a network blip
can never lower the published count. Then run build.py and validate.py.
"""
import concurrent.futures as cf, datetime, json, pathlib, re, sys, time, urllib.request

APP_ID = "6751973572"
CC = sorted(set("""ae ag ai al am ao ar at au az ba bb be bf bg bh bj bm bn bo br bs bt bw by bz ca cd cg ch ci cl cm cn co
cr cv cy cz de dk dm do dz ec ee eg es fi fj fm fr ga gb gd ge gh gm gr gt gw gy hk hn hr hu id ie il in iq is it jm jo jp ke
kg kh kn kr kw ky kz la lb lc lk lr lt lu lv ly ma md me mg mk ml mn mo mr ms mt mu mv mw mx my mz na ne ng ni nl no np nz om
pa pe pg ph pk pl pt pw py qa ro rs ru rw sa sb sc se sg si sk sl sn sr st sv sz tc td th tj tm tn to tr tt tw tz ua ug us uy
uz vc ve vg vn vu xk ye za zm zw""".split()))
ROOT = pathlib.Path(__file__).resolve().parent.parent


def lookup(cc):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(f"https://itunes.apple.com/lookup?id={APP_ID}&country={cc}", timeout=20) as r:
                res = json.load(r)["results"]
            return cc, ((res[0].get("averageUserRating") or 0, res[0].get("userRatingCount") or 0) if res else (0, 0))
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return cc, None


with cf.ThreadPoolExecutor(12) as ex:
    results = dict(ex.map(lookup, CC))
failed = [c for c, v in results.items() if v is None]
ok = {c: v for c, v in results.items() if v and v[1]}
count = sum(n for _, n in ok.values())
avg = round(sum(a * n for a, n in ok.values()) / count, 1) if count else 0
print("by storefront:", {c: v for c, v in sorted(ok.items())})
print(f"worldwide: {avg} from {count} ratings" + (f" (FAILED: {failed})" if failed else ""))

if "--write" in sys.argv:
    if failed or not count:
        sys.exit("not writing: some storefronts failed; run again")
    today = datetime.date.today().isoformat()
    b = ROOT / "_ops/build.py"; s = b.read_text()
    s = re.sub(r'RATING, RATING_COUNT = "[\d.]+", \d+', f'RATING, RATING_COUNT = "{avg}", {count}', s)
    s = re.sub(r'RATING_CHECKED = "[\d-]+"', f'RATING_CHECKED = "{today}"', s)
    b.write_text(s)
    f = ROOT / "_ops/FACTS.md"; t = f.read_text()
    t = re.sub(r"[\d.]+★ on the App Store,\s+from \d+ ratings", f"{avg}★ on the App Store, from {count} ratings", t)
    t = re.sub(r"\(worldwide, all storefronts, checked [\d-]+\)", f"(worldwide, all storefronts, checked {today})", t)
    f.write_text(t)
    print("updated build.py and FACTS.md; now run build.py and validate.py")
