"""How often do the real Paper 2 questions name a person, and how?

The generator went 20-for-20 unnamed after prose guidance said not to add a
name merely to use one. Prose produced the over-correction; a measured rate is
what should replace it.

Local calibration: page text is counted in memory and discarded.
Run: python3 scripts/calibration/naming.py
"""
import base64, collections, glob, io, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
import pypdf
from PIL import Image

KEY = [l.split("=", 1)[1].strip() for l in open(".env") if l.startswith("AI_API_KEY=")][0]

# A capitalised token used as a person: preceded by nothing structural and
# followed by a verb, or introduced by an article-free subject position. Names
# are not in a dictionary here, so the test is grammatical rather than a list.
NAME = r"\b([A-Z][a-z]{2,11})\b"
PERSON_VERB = r"(?:buys|sells|earns|saves|invests|borrows|pays|works|walks|drives|runs|travels|deposits|receives|spends|has|is|wants|needs|makes|takes|leaves|records|plans|orders|owns|rents|charges)"
STOP = {
    "The","This","That","These","Those","Table","Figure","Diagram","Graph","Page","Question",
    "Calculate","Determine","Find","State","Show","Give","Write","Draw","Using","Use","Hence",
    "Each","Every","All","Some","Both","Total","Cost","Price","Time","Speed","Distance","Rate",
    "January","February","March","April","May","June","July","August","September","October",
    "November","December","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
    "Mathematics","Paper","Council","Caribbean","Secondary","Education","Certificate","Copyright",
    "Section","Answer","Marks","Total","Note","Test","Candidates","Examination","Council",
}


def read_page(args):
    jpeg, label = args
    for _ in range(2):
        try:
            img = Image.open(io.BytesIO(jpeg)).convert("RGB"); img.thumbnail((1400, 1400))
            buf = io.BytesIO(); img.save(buf, "JPEG", quality=75)
            body = json.dumps({"model": "gpt-5.6-luna", "messages": [{"role": "user", "content": [
                {"type": "text", "text": "Transcribe every word of this exam page as plain text. No commentary."},
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


def paper_text(f):
    r = pypdf.PdfReader(f)
    t = " ".join((p.extract_text() or "") for p in r.pages)
    if len(t) / max(1, len(r.pages)) < 200:
        jobs = []
        for i, page in enumerate(r.pages):
            for im in page.images:
                jobs.append((im.data, f"{os.path.basename(f)} p{i+1}")); break
        with ThreadPoolExecutor(max_workers=6) as ex:
            t = " ".join(ex.map(read_page, jobs))
    return t if len(t) / max(1, len(r.pages)) >= 200 else ""


def main():
    named_q = unnamed_q = 0
    per_q_counts, carried, papers = collections.Counter(), 0, 0

    for f in sorted(glob.glob("design/reference/CSEC_Mathematics_P2_*.pdf")):
        text = paper_text(f)
        if not text:
            print(f"  {os.path.basename(f)}: unreadable", file=sys.stderr); continue
        papers += 1
        # Split into questions on a numbered stem at the start of a line-ish run.
        chunks = re.split(r"(?:(?<=\.)|(?<=\n))\s*(?=\d{1,2}\.\s+[A-Z(])", text)
        chunks = [c for c in chunks if len(c) > 220]
        for c in chunks:
            found = []
            for m in re.finditer(NAME + r"\s+" + PERSON_VERB, c):
                n = m.group(1)
                if n not in STOP and n not in found:
                    found.append(n)
            if found:
                named_q += 1
                per_q_counts[min(len(found), 3)] += 1
                # Carried across parts: the name reappears after a later (b)/(c) marker.
                first = c.find(found[0])
                later = re.search(r"\(\s*[b-f]\s*\)", c[first:])
                if later and found[0] in c[first + later.start():]:
                    carried += 1
            else:
                unnamed_q += 1

    total = named_q + unnamed_q
    print(f"\n{'='*62}\nPAPER 2, {papers} papers, {total} question-sized chunks\n")
    print(f"  name a person   {named_q:>4}  {named_q/total*100:>5.1f}%")
    print(f"  no person named {unnamed_q:>4}  {unnamed_q/total*100:>5.1f}%")
    if named_q:
        print(f"\n  of the named questions:")
        for k in sorted(per_q_counts):
            label = {1: "one person", 2: "two people", 3: "three or more"}[k]
            print(f"    {label:<16}{per_q_counts[k]:>4}  {per_q_counts[k]/named_q*100:>5.1f}%")
        print(f"    name carried across parts {carried:>3}  {carried/named_q*100:.0f}%")


if __name__ == "__main__":
    main()
