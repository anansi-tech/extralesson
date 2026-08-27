"""Per-topic context distribution, measured from the reference papers.

WHY PER TOPIC. A bank-wide target would push banking settings onto Vectors,
where they are artificial — the R1.8 stapling failure in a new costume.
Consumer Arithmetic is naturally banking-heavy; Geometry is not. So each topic
gets its own target, sliced from the same corpus.

HOW. The papers carry no topic field, so attribution is by MATHEMATICAL
vocabulary in a window around each context marker. That is prose-matching, and
it is only acceptable because the papers have no declared structure to read
instead — unlike our own bank, where the rule is to read the declared field.
Attribution is reported with its confidence: a topic whose sample is too thin
gets the bank-wide figure and is marked as a fallback in the output.

Local calibration. Page text is counted in memory and discarded.
Run: python3 scripts/calibration/topic-contexts.py
"""
import base64, collections, glob, io, json, os, re, sys
from concurrent.futures import ThreadPoolExecutor
import urllib.request
import pypdf
from PIL import Image

KEY = [l.split("=", 1)[1].strip() for l in open(".env") if l.startswith("AI_API_KEY=")][0]
MIN_SAMPLE = 12  # below this a topic's own distribution is noise

CONTEXTS = {
    "banking":       r"\b(interest|compound|principal|loan|credit union|hire purchase|instal?ment|deposit|mortgage|per annum|down payment)\w*",
    "retail":        r"\b(shop|store|supermarket|discount|marked price|selling price|cost price|profit|sales tax|receipt|invoice|customer|vat)\w*",
    "transport":     r"\b(fare|taxi|bus|ferry|journey|petrol|fuel|minibus|km/h|speed)\w*",
    "household":     r"\b(electricity|utility|water bill|telephone|phone bill|meter reading|kilowatt|units used|monthly bill|rental)\w*",
    "wages":         r"\b(salar|wage|hourly rate|fortnight|overtime|basic pay|gross pay|net pay|commission|deduction|income tax)\w*",
    "manufacturing": r"\b(refrigerator|freezer|stove|television|laptop|machine|produc(e|tion)|packag|factory)\w*",
    "tourism":       r"\b(restaurant|menu|meal|service charge|caterer|catering|hotel|guest|tourist)\w*",
    "agriculture":   r"\b(farm|crop|harvest|acre|hectare|livestock|goat|chicken|cattle|banana|mango|coconut|sugar ?cane|yam|plantain|nutmeg|cocoa)\w*",
    "fishing":       r"\b(fisher|fishing|boat|net|saltfish)\w*",
    "construction":  r"\b(mason|cement|concrete|tile|paving|fence|roof|brick|contractor|carpenter)\w*",
    "sport":         r"\b(cricket|football|athlet|team|match|tournament|race)\w*",
    "school":        r"\b(pupils in|students in the class|class of \d|test score|school fair|school trip)\w*",
}

TOPIC_WORDS = {
    "M1-NTC":    r"\b(fraction|decimal|percent|ratio|proportion|standard form|significant figure|square root|integer|hcf|lcm|estimat)\w*",
    "M1-CONS":   r"\b(profit|loss|discount|interest|hire purchase|salar|wage|tax|bill|budget|invoice|depreciat|mark(ed|up))\w*",
    "M1-SETS":   r"\b(venn|universal set|subset|intersection|union|element of|complement)\w*",
    "M1-MEAS":   r"\b(perimeter|area of|volume|capacity|litre|kilogram|circumference|cylinder|prism|surface area|scale drawing)\w*",
    "M1-ALG1":   r"\b(simplify|substitut|expand|factoris|solve for|linear equation|inequalit|algebraic)\w*",
    "M1-GRAPHS": r"\b(coordinate|plot the point|gradient|straight line|axes|intercept)\w*",
    "M2-STAT1":  r"\b(mean|median|mode|range|frequency table|bar chart|pie chart|pictograph)\w*",
    "M2-ALG2":   r"\b(quadratic|simultaneous|formula|change the subject|indices|surd)\w*",
    "M2-RFG1":   r"\b(function|f\(x\)|mapping|domain|range of the function|inverse function|composite)\w*",
    "M2-GEO1":   r"\b(angle|triangle|parallel|polygon|congruen|similar|pythagoras|bearing)\w*",
    "M2-VM1":    r"\b(vector|matrix|matrices|column vector|determinant|scalar)\w*",
    "M3-STAT2":  r"\b(cumulative frequency|ogive|quartile|histogram|probability|class interval|grouped data|standard deviation)\w*",
    "M3-RFG2":  r"\b(inequalit|feasible region|linear programming|non-linear|distance-time|speed-time|graph of y)\w*",
    "M3-GEO2":   r"\b(circle theorem|transformation|enlargement|rotation|reflection|translation|trigonometric|sine rule|cosine rule)\w*",
    "M3-VM2":    r"\b(matrix|inverse matrix|singular|transformation matrix|position vector|resultant)\w*",
}
WINDOW = 260


def read_page(args):
    jpeg, label = args
    for _ in range(2):
        try:
            img = Image.open(io.BytesIO(jpeg)).convert("RGB"); img.thumbnail((1400, 1400))
            buf = io.BytesIO(); img.save(buf, "JPEG", quality=75)
            body = json.dumps({"model": "gpt-5.6-luna", "messages": [{"role": "user", "content": [
                {"type": "text", "text": "Transcribe every word of this exam page as plain text, including question stems and wording around tables or diagrams. No commentary."},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()}}]}]}).encode()
            req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=body,
                  headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=180) as r:
                out = json.load(r)["choices"][0]["message"]["content"] or ""
            if len(out.strip()) >= 120:
                return out
        except Exception as e:
            print(f"    ! {label}: {e.__class__.__name__}", file=sys.stderr)
    return ""


def corpus_text():
    for f in sorted(glob.glob("design/reference/CSEC*.pdf")):
        name = os.path.basename(f)
        try:
            r = pypdf.PdfReader(f)
        except Exception:
            continue
        t = " ".join((p.extract_text() or "") for p in r.pages)
        if len(t) / max(1, len(r.pages)) < 200:
            jobs = []
            for i, page in enumerate(r.pages):
                for im in page.images:
                    jobs.append((im.data, f"{name} p{i+1}")); break
            with ThreadPoolExecutor(max_workers=6) as ex:
                t = " ".join(ex.map(read_page, jobs))
        if len(t) / max(1, len(r.pages)) >= 200:
            print(f"  read {name[:44]:<46}{len(t):>7} chars", file=sys.stderr)
            yield t


def main():
    per_topic = collections.defaultdict(collections.Counter)
    overall = collections.Counter()
    for text in corpus_text():
        low = re.sub(r"\s+", " ", text.lower())
        for ctx, pat in CONTEXTS.items():
            for m in re.finditer(pat, low):
                overall[ctx] += 1
                w = low[max(0, m.start() - WINDOW): m.end() + WINDOW]
                scores = {t: len(re.findall(p, w)) for t, p in TOPIC_WORDS.items()}
                best = max(scores, key=lambda k: scores[k])
                if scores[best] > 0:
                    per_topic[best][ctx] += 1

    total = sum(overall.values())
    print(f"\n{'='*70}\nBANK-WIDE, {total} markers")
    for c, n in overall.most_common():
        print(f"  {c:<16}{n:>5}{n/total*100:>7.1f}%")

    print(f"\nPER TOPIC (fallback below {MIN_SAMPLE} markers)")
    out = {}
    for t in TOPIC_WORDS:
        c = per_topic[t]; n = sum(c.values())
        if n < MIN_SAMPLE:
            out[t] = {"source": "bank-wide fallback", "sample": n,
                      "shares": {k: round(v / total, 3) for k, v in overall.items()}}
            print(f"  {t:<12} sample {n:>3}  -> FALLBACK to bank-wide")
        else:
            out[t] = {"source": "own sample", "sample": n,
                      "shares": {k: round(v / n, 3) for k, v in c.items()}}
            top = ", ".join(f"{k} {v/n*100:.0f}%" for k, v in c.most_common(4))
            print(f"  {t:<12} sample {n:>3}  {top}")
    json.dump(out, open("lib/generation/context-targets.json", "w"), indent=1, sort_keys=True)
    print("\nwritten: lib/generation/context-targets.json (shares only — no paper text)")


if __name__ == "__main__":
    main()
