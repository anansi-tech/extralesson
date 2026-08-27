"""LOCAL CALIBRATION ONLY — measures the register our reference papers are
written in, so lib/generation/territories.ts and the context targets can match
it rather than guess.

Twenty of the twenty-nine reference documents are scans with no text layer.
Those pages are read with the same vision model the product uses for student
handwriting; a clean printed page is an easier version of that task. This ships
nothing, and is explicitly outside the R2 kill-list entry, which guards what the
PRODUCT contains (ROUND_2_EXAMINER.md §9, amended 2026-08-26).

NOTHING IS KEPT. Page text is held in memory, counted, and discarded. No paper
text is written to disk (CLAUDE.md ground truth: read the papers, keep nothing).

Run: python3 scripts/calibration/read-papers.py
"""
import base64, collections, glob, io, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

import pypdf
from PIL import Image

MODEL = "gpt-5.6-luna"
KEY = None
for line in open(".env"):
    if line.startswith("AI_API_KEY="):
        KEY = line.split("=", 1)[1].strip()

MARKERS = {
    "banking/credit":    r"\b(interest|compound|principal|loan|credit union|hire purchase|instal?ment|deposit|mortgage|per annum|down payment|amount owed)\w*",
    "retail/shopping":   r"\b(shop|store|supermarket|discount|marked price|selling price|cost price|profit|sales tax|receipt|invoice|customer|vat)\w*",
    "transport/fares":   r"\b(fare|taxi|bus|ferry|journey|travel|petrol|fuel|minibus|km/h|speed)\w*",
    "bills/utilities":   r"\b(electricity|utility|water bill|telephone|phone bill|meter reading|kilowatt|units used|monthly bill|rental)\w*",
    "wages/salary":      r"\b(salar|wage|hourly rate|fortnight|overtime|basic pay|gross pay|net pay|commission|deduction|income tax)\w*",
    "appliances/goods":  r"\b(refrigerator|freezer|stove|microwave|television|laptop|computer|cell ?phone|mobile phone|washing machine|furniture)\w*",
    "restaurant/tourism":r"\b(restaurant|menu|meal|waiter|service charge|caterer|catering|hotel|guest|tourist)\w*",
    "agriculture":       r"\b(farm|crop|harvest|acre|hectare|livestock|goat|chicken|cattle|banana|mango|coconut|sugar ?cane|yam|plantain|callaloo|nutmeg|cocoa)\w*",
    "fishing":           r"\b(fisher|fishing|boat|net|saltfish)\w*",
    "construction":      r"\b(mason|cement|concrete|tile|paving|fence|roof|brick|contractor|carpenter)\w*",
    # NB: bare "school", "exam" and "candidate" are page furniture on every
    # paper ("CARIBBEAN EXAMINATIONS COUNCIL", "candidates are advised…") and
    # counting them put school at 48% of the corpus. Only wording that can only
    # come from a question body is counted here.
    "school":            r"\b(pupils in|students in the class|class of \d|test score|the school[' ]s|school fair|school trip)\w*",
    "sport":             r"\b(cricket|football|athlet|team|match|tournament|race)\w*",
}


def read_page(args):
    """One page -> text. Returns '' on failure rather than stopping the run."""
    jpeg, label = args
    try:
        img = Image.open(io.BytesIO(jpeg)).convert("RGB")
        img.thumbnail((1400, 1400))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75)
        b64 = base64.b64encode(buf.getvalue()).decode()
        body = json.dumps({
            "model": MODEL,
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": "Transcribe every word of this exam page as plain text, including question stems and any wording around tables or diagrams. No commentary."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
            ]}],
        }).encode()
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions", data=body,
            headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=180) as r:
            out = json.load(r)
        return out["choices"][0]["message"]["content"] or ""
    except Exception as e:
        print(f"    ! {label}: {e.__class__.__name__}", file=sys.stderr)
        return ""


def read_page_retry(args):
    """A near-empty read means the model refused or timed out, not a blank page.
    Three P1 papers came back at ~24 chars/page on the first run."""
    out = read_page(args)
    if len(out.strip()) < 120:
        out = read_page(args)
    return out


def main():
    docs = sorted(glob.glob(os.path.join(DIRNAME := "design/reference", "CSEC*.pdf")))
    totals, per_doc, vision_pages = collections.Counter(), {}, 0

    for f in docs:
        name = os.path.basename(f).replace("CSEC_Mathematics_", "").replace(".pdf", "")
        try:
            r = pypdf.PdfReader(f)
        except Exception:
            print(f"  {name}: unreadable"); continue

        text = " ".join((p.extract_text() or "") for p in r.pages)
        if len(text) / max(1, len(r.pages)) < 200:
            jobs = []
            for i, page in enumerate(r.pages):
                for im in page.images:
                    jobs.append((im.data, f"{name} p{i+1}"))
                    break
            with ThreadPoolExecutor(max_workers=6) as ex:
                text = " ".join(ex.map(read_page_retry, jobs))
            vision_pages += len(jobs)
            how = f"vision ({len(jobs)}pp)"
        else:
            how = "text layer"

        low = text.lower()
        counts = {k: len(re.findall(p, low)) for k, p in MARKERS.items()}
        per_doc[name] = sum(counts.values())
        totals.update(counts)
        thin = " ← THIN, excluded" if len(text) / max(1, len(r.pages)) < 200 else ""
        if thin:
            per_doc.pop(name, None)
            for k in counts: totals[k] -= counts[k]
        print(f"  {name:<28}{how:<16}{len(text):>7} chars  {sum(counts.values()):>4} markers{thin}")

    grand = sum(totals.values())
    print(f"\n{'='*64}\nFULL CORPUS: {len(per_doc)} documents, {vision_pages} pages read by vision")
    print(f"{grand} context markers\n")
    for k, n in totals.most_common():
        print(f"  {k:<20}{n:>5}  {n/grand*100:>5.1f}%  {'█'*round(n/grand*44)}")
    comm = sum(totals[k] for k in ["banking/credit","retail/shopping","transport/fares","bills/utilities","wages/salary","appliances/goods","restaurant/tourism"])
    print(f"\n  COMMERCIAL/MODERN {comm:>5}  {comm/grand*100:.0f}%")
    print(f"  AGRI/FISHING      {totals['agriculture']+totals['fishing']:>5}  {(totals['agriculture']+totals['fishing'])/grand*100:.0f}%")


if __name__ == "__main__":
    main()
