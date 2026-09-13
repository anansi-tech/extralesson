# Review of 84 explanation-mode cloze questions

Reviewed 2026-09-13 on `fix/structured-photo-prefill`. **Recommendations only; no database writes.**

## Outcome

All 84 approved questions matching the flag were reviewed: 95 explanation-mode slots. This is a response-contract review of stored statements, canonical answers, accepted alternatives and attached rubric criteria, not an independent mathematical re-solve of every diagram or a visual/browser validation.

| Recommendation | Questions |
| --- | ---: |
| A — short-answer conversion candidates | 30 |
| E — retain photo-assessed explanation; fix its presentation | 31 |
| H — hold for a specific content/representation decision | 21 |
| M — mixed: short answer plus genuine explanation | 2 |
| Total | 84 |

“A” is a content recommendation, **not certification that a mode flip is ready to deploy**. Wording/alternative changes noted below still need approval and focused checker/render tests. The two mixed questions each contain one conversion candidate and one explanation. No mass update is proposed.

## Minimal contract

- A visible answer blank should accept an answer and participate in photo prefill and typed marking.
- A genuine explanation should have a clear separate instruction, “Write your reason on paper”, and remain photo-assessed. Do not render it as an apparently fillable but disabled blank. Preserve existing slot references and rubric associations when restructuring content; review the complete resulting part before applying.
- Do not substitute exact phrase matching for reasoning assessment. Several slots have multiple criteria; a theorem name or generic phrase does not prove an application/calculation criterion.
- Typed word blanks use the branch's narrow canonical/declared-alternative matcher. Add synonyms to the question only where meaning is equivalent in that sentence. No global “will = should” rule.
- Correct canonical entries may receive the existing slot's typed marks. Follow-through on a student's different earlier values still depends on the existing photo-method route; these proposals do not implement a new dependency-aware checker.
- Do not expose the number of factors/roots through answer-box counts unless the question already specifies it. Current `showsBoxCount` treats lists of up to four values as displayable: factor-list conversions need particular care.

## Priority findings

1. **d0dccb:** the prepared three-mode repair addresses the missing prefill. The trial's “will” is a reasonable additional accepted alternative for this sentence, subject to approval. Deploy the word-blank safeguard before applying the bank repair. The existing repair script does not add “will”.
2. **d0dc8f / d0dc87:** their verdict blanks are short-answer candidates; there is no need to invent special OCR matching for these questions.
3. **Malformed canonical completions:** 8049da (“Anisa is Yes”), 9e8825 (“Nia is No”), d16f89 (“statement ... is Yes”), d17067 (“claim ... is No”). Correct the content, not the student's phrasing.
4. **Over-awarding risk:** d9c254, 9e87e7, d1704a, a9f53f and c75c61 attach multiple distinct criteria to a short/general accepted phrase. Keep photo assessment until wording and required evidence agree.
5. **Separate mathematical/content hold:** 797be2 infers approximate symmetry from mean/median; inspect the full histogram before endorsing that conclusion. No claim is made here that the answer is mathematically wrong.

## Per-question review

Links identify the original approved-bank records. Every affected slot's current canonical answer is included for traceability. A/H/E/M are defined above. Alternatives in the recommendation are proposed, not applied. “Retain photo assessment” does not mean retaining today's misleading blank UI.

| # | Question | Current explanation-mode slots | Decision | Recommended correction / reason |
| --- | --- | --- | --- | --- |
| 1 | [6a525e](https://www.extralesson.app/admin/review?id=6a83b5c111edd390f46a525e) | d.ii: Opposite angles of a cyclic quadrilateral are supplementary. | E | Keep d.ii photo-assessed; ask separately: State the circle theorem used for angle ADB. |
| 2 | [6a52b3](https://www.extralesson.app/admin/review?id=6a83b99311edd390f46a52b3) | d.ii: parallelogram | A | d.ii → answer: parallelogram. The equality is already stated in the sentence. |
| 3 | [d9c1f8](https://www.extralesson.app/admin/review?id=6a83be95c24c2d59f4d9c1f8) | c.ii: 1.20\text{ m} > 1.15\text{ m} | E | Keep c.ii photo-assessed; ask: Compare the pendulum length with the limiting case height and explain your decision. Bare 'longer' must not earn both criteria automatically. |
| 4 | [d9c205](https://www.extralesson.app/admin/review?id=6a83bf02c24c2d59f4d9c205) | d.iii: the selected players may not represent all 80 players | E | Keep d.iii photo-assessed; ask: Explain why the sample and population means need not be equal. |
| 5 | [d9c237](https://www.extralesson.app/admin/review?id=6a83c096c24c2d59f4d9c237) | c.verdict: incorrect | A | c.verdict → answer: incorrect / not correct. Proposed additional alternative: false. Do not use 'No' as the exemplar after 'is'. |
| 6 | [d9c254](https://www.extralesson.app/admin/review?id=6a83c18fc24c2d59f4d9c254) | b.ii: magnitude and direction<br>c.iii: both pairs of opposite sides are equal and parallel | H | Keep b.ii and c.iii photo-assessed with separate prompts. Their criteria require both stating a property and applying earlier vector results; matching a property phrase cannot establish all of that. |
| 7 | [d9c290](https://www.extralesson.app/admin/review?id=6a83c3d6c24c2d59f4d9c290) | b.ii: a radius cannot be negative | E | Keep b.ii photo-assessed; ask: Explain why the negative radius is rejected. Allow equivalent explanations without an exhaustive phrase list. |
| 8 | [d9c2a2](https://www.extralesson.app/admin/review?id=6a83c49cc24c2d59f4d9c2a2) | d.iii: $75 = 7 \times 10 + 5$, so 75 is not divisible by 7 | E | Keep d.iii photo-assessed; ask: Explain why the full boxes cannot be shared equally among seven shops. |
| 9 | [d9c30d](https://www.extralesson.app/admin/review?id=6a83c866c24c2d59f4d9c30d) | c.reason: less than | A | c.reason → answer: less than / less than or equal to. Completed sentence supplies comparison and range condition. Add tests for both; never accept greater than. |
| 10 | [d9c322](https://www.extralesson.app/admin/review?id=6a83c8f7c24c2d59f4d9c322) | c.ii: \$140 = 14 tens of dollars and $3(4) + 2 = 14$; 4 is a whole number | H | Keep c.ii photo-assessed; explicitly request both whole-number feasibility and substitution verification. The two criteria cannot be replaced by a generic 'whole number' answer. |
| 11 | [d9c35e](https://www.extralesson.app/admin/review?id=6a83cb29c24c2d59f4d9c35e) | d.ii: (q,p) | H | d.ii is a short coordinate result, but (q,p) is symbolic. Confirm the current coordinate reader/checker handles symbols before conversion; test swapped (p,q) as wrong. |
| 12 | [d9c3ac](https://www.extralesson.app/admin/review?id=6a83ce3ac24c2d59f4d9c3ac) | c.ii: a different number of rows and columns | E | Keep c.ii photo-assessed; ask: Explain your matrix classification using its numbers of rows and columns. |
| 13 | [d9c40e](https://www.extralesson.app/admin/review?id=6a83d1c6c24c2d59f4d9c40e) | d.iii: the \$5 transport charge is \$1 more than the \$4 charge at which 7 bags gives no profit or loss | E | Keep d.iii photo-assessed; ask: Explain the loss by comparing the transport charge with the break-even charge. |
| 14 | [804975](https://www.extralesson.app/admin/review?id=6a83d79ff8a49010ad804975) | b.ii: the factor $2x+3$ occurs in both factorizations | E | Keep b.ii photo-assessed; ask: Explain how both factorisations identify the common dimension. |
| 15 | [80498a](https://www.extralesson.app/admin/review?id=6a83d825f8a49010ad80498a) | d.ii: 5 | A | d.ii → answer: 5. This number completes the stated non-zero intersection justification. |
| 16 | [8049b8](https://www.extralesson.app/admin/review?id=6a83da29f8a49010ad8049b8) | c.ii: less than 25° | H | c.ii combines an inequality, units and prose alternatives. Keep photo reasoning with an explicit comparison prompt until numeric-angle-versus-phrase handling is verified; not a plain mode flip. |
| 17 | [8049c8](https://www.extralesson.app/admin/review?id=6a83da96f8a49010ad8049c8) | d.reason: $\frac{5}{6}$ | A | d.reason → answer: 5/6 m/s (unit already printed). Verify rounded decimal acceptance under existing numeric policy; do not add a new global tolerance. |
| 18 | [8049da](https://www.extralesson.app/admin/review?id=6a83db98f8a49010ad8049da) | d.ii: the reward outcomes are $(P,1)$, $(G,2)$ and $(M,2)$; card $2$ occurs in two outcomes while $P$ occurs in one outcome | H | Canonical d.i produces 'Anisa is Yes'. Propose correct, accepting true/correct as appropriate. Keep d.ii photo-assessed and explicitly request the two outcome counts. |
| 19 | [8049f4](https://www.extralesson.app/admin/review?id=6a83dc8af8a49010ad8049f4) | d.reason: 8 is multiplied by both 15 and 3 | E | Keep d.reason photo-assessed; ask: Explain how the distributive property is used in this equality. |
| 20 | [804a04](https://www.extralesson.app/admin/review?id=6a83dcf2f8a49010ad804a04) | d.reason: $2.8\text{ m}$ is at least $2.5\text{ m}$ | E | Keep d.reason photo-assessed; ask: Compare the bob height with the minimum permitted height. |
| 21 | [804a64](https://www.extralesson.app/admin/review?id=6a83e045f8a49010ad804a64) | c.ii: no profit or loss | A | c.ii → answer: no profit or loss; retain declared equivalents. Canonical fits the sentence; 'break-even' is useful shorthand, not the exemplar. Completed zero-net context supports the conclusion. |
| 22 | [804a99](https://www.extralesson.app/admin/review?id=6a83e1f0f8a49010ad804a99) | d.ii: \$493.28 | A | d.ii → answer: $493.28. Keep currency handling. Existing d.i canonical 'not' fits; remove or reconsider grammatically awkward accepted shorthand separately, not as a prerequisite for this numeric fix. |
| 23 | [804ada](https://www.extralesson.app/admin/review?id=6a83e3e5f8a49010ad804ada) | d.reason: $\pi^2<10$, so $\frac{90}{\pi^2}>9$ | H | Keep d.reason photo-assessed; explicitly require use of pi² < 10. Existing acceptance of only 90/pi² > 9 omits that justification; do not turn acceptance text into full-mark automation. |
| 24 | [8210c0](https://www.extralesson.app/admin/review?id=6a83f1a39aba6d73cb8210c0) | d.reason: positive whole number | A | d.reason → answer: positive whole number / positive integer, with existing equivalents. This named property fully supplies the single criterion. |
| 25 | [8210c8](https://www.extralesson.app/admin/review?id=6a83f1e09aba6d73cb8210c8) | a.iii: 1 and 17 | H | a.iii is a factor list. Before conversion verify '1 and 17' and '1, 17' map to the same shape; do not reveal the required count through generated boxes. |
| 26 | [8210d0](https://www.extralesson.app/admin/review?id=6a83f2149aba6d73cb8210d0) | c.ii: outside all three sets | E | Keep c.ii photo-assessed with an explicit region-description prompt; equivalent region descriptions and notation should not require exact wording. |
| 27 | [821132](https://www.extralesson.app/admin/review?id=6a83f5419aba6d73cb821132) | b.reason: alternate segment theorem | A | b.reason → answer: alternate segment theorem, with existing theorem-name/statement alternatives. Only the theorem-name criterion is attached to this slot. |
| 28 | [82119a](https://www.extralesson.app/admin/review?id=6a83f9af9aba6d73cb82119a) | d.ii: both values are positive integers | E | Keep d.ii photo-assessed; ask: Explain why both amounts belong to the chosen smallest set. |
| 29 | [8211a2](https://www.extralesson.app/admin/review?id=6a83f9f69aba6d73cb8211a2) | b.reason: a random sample of 12 balls | H | Keep b.reason photo-assessed. Reconcile criterion requiring the random sample of 12 with accepted generic 'sample data'; decide intended evidence before automation. |
| 30 | [8211c1](https://www.extralesson.app/admin/review?id=6a83fb989aba6d73cb8211c1) | c.ii: both are horizontal<br>d.ii: opposite sides are parallel and adjacent sides are perpendicular | H | Keep c.ii/d.ii photo-assessed with separate justification prompts. 'They do not meet' is not enough to establish same gradient from a drawn segment; remove it as a full-credit exemplar. |
| 31 | [9e878b](https://www.extralesson.app/admin/review?id=6a83ff560676ebb26b9e878b) | c.ii: angle in the alternate segment theorem | A | c.ii → answer: alternate segment theorem, retaining existing names. Slot carries only the theorem statement mark. |
| 32 | [9e87ad](https://www.extralesson.app/admin/review?id=6a8400a00676ebb26b9e87ad) | c.factors: 1, 7, 13, 91 | H | c.factors is a four-member list. Do not flip until rendered input count is checked: current showsBoxCount reveals lists of up to four members. Use a count-neutral existing representation if feasible; retain photo assessment meanwhile. |
| 33 | [9e87bd](https://www.extralesson.app/admin/review?id=6a8401480676ebb26b9e87bd) | c.reason: greater than $90°$ and less than $180°$ | E | Keep c.reason photo-assessed; ask: State the angle bounds which justify this classification. |
| 34 | [9e87e7](https://www.extralesson.app/admin/review?id=6a8402d10676ebb26b9e87e7) | c.ii: equal and parallel | H | Keep c.ii photo-assessed; explicitly request the property and the vector equality. 'Equal and parallel' alone cannot automatically earn the separate application criterion. |
| 35 | [9e8825](https://www.extralesson.app/admin/review?id=6a8405b20676ebb26b9e8825) | d.reason: dividing the total distance travelled by the total time taken | H | Fix exemplar 'Nia is No' to 'Nia is incorrect'. Keep d.reason photo-assessed; ask why the arithmetic mean of the three speeds is not the whole-journey average. |
| 36 | [9e8832](https://www.extralesson.app/admin/review?id=6a8406360676ebb26b9e8832) | d.ii: the taxi driver's net earnings are zero | E | Keep d.ii photo-assessed; ask: Interpret the x-intercept in the taxi-earnings context. |
| 37 | [9e889a](https://www.extralesson.app/admin/review?id=6a840a4f0676ebb26b9e889a) | d.iii: 5 | A | d.iii → answer: 5. The sentence already supplies the affordability comparison. |
| 38 | [9e88e3](https://www.extralesson.app/admin/review?id=6a840da70676ebb26b9e88e3) | c.reason: 80\% \ge 75\% | E | Keep c.reason photo-assessed; explicitly compare the calculated percentage with the at-least threshold. Preserve equivalent inequalities and prose. |
| 39 | [9e88f0](https://www.extralesson.app/admin/review?id=6a840e250676ebb26b9e88f0) | a.ii: angle in the alternate segment | A | a.ii → answer: alternate segment theorem / tangent-chord theorem, retaining accepted statement. Improve lead-in to 'using the {}' if needed; canonical 'because angle in...' is awkward. |
| 40 | [9e893a](https://www.extralesson.app/admin/review?id=6a8410ad0676ebb26b9e893a) | c.iii: less than | A | c.iii → answer: less than / smaller than / <. Test all declared alternatives with the word-blank safeguard. |
| 41 | [9e894a](https://www.extralesson.app/admin/review?id=6a84112a0676ebb26b9e894a) | d.midpoint: not | A | d.midpoint → answer: not. The preceding ratio supplies the unequal-length context; blank and 'is' must not match. |
| 42 | [9e8957](https://www.extralesson.app/admin/review?id=6a8411a40676ebb26b9e8957) | c.ii: not every ferry departure was included in the sample<br>d.iii: representative | M | c.ii stays photo-assessed: explain why a sample gives an estimate. d.iii → answer: representative / typical; the completed sentence supplies its meaning. |
| 43 | [d16f32](https://www.extralesson.app/admin/review?id=6a84161c5222177bc0d16f32) | d.verdict: exceeded | A | d.verdict → answer: exceeded / did exceed. Add exceeds as a contextual alternative; 'yes' is shorthand, not a grammatical exemplar. |
| 44 | [d16f7c](https://www.extralesson.app/admin/review?id=6a8418ad5222177bc0d16f7c) | d.reason: its diameter is 12 cm, which is greater than the 10 cm width of the opening | E | Keep d.reason photo-assessed; explicitly compare ball diameter with the shorter opening dimension. Both limiting-dimension and comparison criteria remain photo assessed. |
| 45 | [d16f89](https://www.extralesson.app/admin/review?id=6a8419395222177bc0d16f89) | c.iii: $\overrightarrow{DA}=\begin{pmatrix}4\\3\end{pmatrix}=\overrightarrow{AB}$ and $\overrightarrow{BC}=2\overrightarrow{AB}$, so the vectors are in the same direction. | H | Canonical c.ii 'statement ... is Yes' should be correct. Keep c.iii photo-assessed: require DA and scalar-multiple/direction comparison, not merely a collinear verdict. |
| 46 | [d16fb5](https://www.extralesson.app/admin/review?id=6a841b355222177bc0d16fb5) | d.reason: $PA=PB$ because tangents from an external point are equal | E | Keep d.reason photo-assessed; ask: Explain why the base angles are equal, using the tangent lengths. |
| 47 | [d16ffc](https://www.extralesson.app/admin/review?id=6a841d9b5222177bc0d16ffc) | c.iii: \overrightarrow{AB}=\overrightarrow{BC} | E | Keep c.iii photo-assessed; ask: Justify the midpoint using displacement vectors. Equivalent symbolic and verbal justifications should remain supported. |
| 48 | [d17038](https://www.extralesson.app/admin/review?id=6a8420045222177bc0d17038) | d.reason: the magnitude of -3 is greater than the magnitude of -2 | E | Keep d.reason photo-assessed; ask: Justify which line is steeper using gradient magnitudes or repayment duration. |
| 49 | [d1704a](https://www.extralesson.app/admin/review?id=6a8420e75222177bc0d1704a) | c.ii: The angle between a tangent and a chord equals the angle in the alternate segment. | H | Keep c.ii photo-assessed; ask for the theorem and its application to DA, AB and ACB. Bare 'tangent-chord theorem' cannot automatically earn both attached criteria. |
| 50 | [d17067](https://www.extralesson.app/admin/review?id=6a8421dd5222177bc0d17067) | d.ii: No<br>d.iii: the \$49.50 includes the \$25.50 sales tax, which must be remitted | H | d.ii can become a typed verdict only after replacing canonical No with incorrect. d.iii stays photo-assessed: explain why tax is excluded from profit and how the claimed amount arose. |
| 51 | [d1706f](https://www.extralesson.app/admin/review?id=6a84221b5222177bc0d1706f) | c.verdict: not | A | c.verdict → answer: not. The total/target comparison is already expressed by the completed part. |
| 52 | [0ab945](https://www.extralesson.app/admin/review?id=6a85272ebd8b8cbd670ab945) | d.reason: $gf(t)=0$ when $f(t)=5$, at $t=1$ and $t=5$. | E | Keep d.reason photo-assessed; ask: Justify the number of roots using the two times at which f(t)=5. |
| 53 | [d0dc6a](https://www.extralesson.app/admin/review?id=6a852887ed771942b6d0dc6a) | d.ii: $\frac{16.8}{341.4}\text{ m}<0.050\text{ m}$ | E | Keep d.ii photo-assessed; ask: Calculate a possible thickness at the greatest area and compare it with 0.050 m. It is calculation plus inequality, not one number. |
| 54 | [d0dc87](https://www.extralesson.app/admin/review?id=6a852996ed771942b6d0dc87) | d.ii: not parallel | A | d.ii → answer: not parallel / non-parallel. Determinant context is already printed. |
| 55 | [d0dc8f](https://www.extralesson.app/admin/review?id=6a8529eeed771942b6d0dc8f) | d.ii: insufficient | A | d.ii → answer: insufficient / not enough / not sufficient. Completed sentence supplies the timber comparison. Separate b(ii) prompt issue is outside this 84-flag scope. |
| 56 | [d0dccb](https://www.extralesson.app/admin/review?id=6a852cc0ed771942b6d0dccb) | c.days: 7<br>c.comparison: more<br>c.decision: should | A | c.days, c.comparison, c.decision → answer, as in prepared repair. Propose adding will to c.decision.accept for this sentence only; no global will/should synonym. Keep 7, more/greater, should and test opposite decisions. |
| 57 | [d0dd12](https://www.extralesson.app/admin/review?id=6a852f6fed771942b6d0dd12) | b.iii: downwards<br>d.ii: increasing | A | b.iii → answer: downwards/downward; d.ii → answer: increasing/rising. Also reconcile b(i) rubric x=3 with question variable t=3; no new solving mechanism. |
| 58 | [d0dd1a](https://www.extralesson.app/admin/review?id=6a852fcaed771942b6d0dd1a) | d.claim: false | A | d.claim → answer: false/incorrect/not valid/untrue. Preserve the quartile context. Check existing IQR rounding/form rubric separately before wider marking cleanup. |
| 59 | [d0ddb8](https://www.extralesson.app/admin/review?id=6a8539f8ed771942b6d0ddb8) | c.iii: any other line would not divide the triangle into matching halves | E | Keep c.iii photo-assessed; ask: Explain why there is no other line of symmetry. |
| 60 | [797bb6](https://www.extralesson.app/admin/review?id=6a853dafe7fc40f429797bb6) | c.iii: $-15$ is not in the allowable interval $0\leq x\leq5$ | E | Keep c.iii photo-assessed; ask: Explain why the other root is inadmissible in the stated interval. |
| 61 | [797bbe](https://www.extralesson.app/admin/review?id=6a853df3e7fc40f429797bbe) | d.ii: suitable<br>d.iii: greater | A | d.ii and d.iii → answer: suitable/appropriate and greater/more/higher. Both are short contextual conclusions. |
| 62 | [797be2](https://www.extralesson.app/admin/review?id=6a854012e7fc40f429797be2) | c.iii: approximately symmetrical<br>d.iii: not acceptable | H | c.iii symmetry inference needs the histogram/full data reviewed: close mean and median alone do not establish symmetry. d.iii may become a verdict only after checking the stated acceptance interval and requiring any independently marked comparison evidence. |
| 63 | [797bf4](https://www.extralesson.app/admin/review?id=6a8540dbe7fc40f429797bf4) | c.orientation: reversed | A | c.orientation → answer: reversed/opposite and existing equivalents. Reconsider broad 'changed' as full-credit alternative; it is weaker than naming reversal. |
| 64 | [797bfc](https://www.extralesson.app/admin/review?id=6a854129e7fc40f429797bfc) | d.conclusion: are in a straight line because $\vec{AB}$ and $\vec{AC}$ are parallel | H | d.conclusion embeds an extra 'because' inside its canonical answer. Prefer a short collinearity blank plus a separately prompted photo justification, or keep the whole conclusion photo-assessed. Approve wording/rubric allocation first. |
| 65 | [797c67](https://www.extralesson.app/admin/review?id=6a854697e7fc40f429797c67) | d.ii: not | A | d.ii → answer: not. 'No' and 'unacceptable' are shorthand that do not fit before acceptable; canonical must remain not. Test affirmative/negative distinction. |
| 66 | [797cba](https://www.extralesson.app/admin/review?id=6a854a6be7fc40f429797cba) | c.ii: $R\ge3200$ only when $16\le p\le20$, and $p$ must be a whole number | E | Keep c.ii photo-assessed; ask: Explain both the revenue interval and whole-dollar restriction. |
| 67 | [797cc2](https://www.extralesson.app/admin/review?id=6a854aa9e7fc40f429797cc2) | b.iii: $37.5\%$ is at least $35\%$ | E | Keep b.iii photo-assessed; ask: Compare the calculated percentage with the target. |
| 68 | [797cca](https://www.extralesson.app/admin/review?id=6a854afde7fc40f429797cca) | d.iii: the graph crosses the $x$-axis at two points | E | Keep d.iii photo-assessed; ask: Explain the number of roots using graph intersections with the x-axis. |
| 69 | [a9f4d0](https://www.extralesson.app/admin/review?id=6a854d92c99a188733a9f4d0) | d.iv: twice | A | d.iv → answer: twice / two times. This is a specific scale relationship, not an open explanation. |
| 70 | [a9f4e0](https://www.extralesson.app/admin/review?id=6a854e3ec99a188733a9f4e0) | c.i: bisects | A | c.i → answer: bisects, retaining declared equivalent. Proposed additional alternative: divides equally. Completed sentence identifies the segment. |
| 71 | [a9f53f](https://www.extralesson.app/admin/review?id=6a855228c99a188733a9f53f) | d.ii: $\vec{BD}=\vec{AB}=\binom{4}{3}$ | H | Keep d.ii photo-assessed; explicitly require calculating BD using k and comparing it with AB. Mere same-direction prose does not demonstrate the separate calculation criterion. |
| 72 | [a9f592](https://www.extralesson.app/admin/review?id=6a85563ec99a188733a9f592) | d.iii: false<br>d.iv: 3 occurs most often | M | d.iii → answer: false/not true/incorrect. d.iv stays photo-assessed with a clear prompt to justify using the greatest frequency. Do not require one exact prose sentence. |
| 73 | [a9f59f](https://www.extralesson.app/admin/review?id=6a8556dec99a188733a9f59f) | d.ii: corresponding angles are equal and corresponding sides are in the ratio $2:1$<br>d.iv: corresponding sides are not equal in length | E | Keep d.ii/d.iv photo-assessed; provide separate prompts for similarity and non-congruency, retaining the typed classifications and orientation. |
| 74 | [c75c59](https://www.extralesson.app/admin/review?id=6a862d781ab164e441c75c59) | d.reason: $18$ is an extreme value | H | The sentence 'Its value is 2 because 18 is extreme' gives a reason for choosing the median, not its value. Reword: Explain your choice of average. Keep photo assessment; ensure explanation connects the outlier to the mean. |
| 75 | [c75c61](https://www.extralesson.app/admin/review?id=6a862dcc1ab164e441c75c61) | d.reason: 2 trays is the most frequently required number | H | Keep d.reason photo-assessed; explicitly request modal value and why mode suits the task. Generic 'most frequently required' does not alone supply the separate value-2 criterion. |
| 76 | [c75c69](https://www.extralesson.app/admin/review?id=6a862e0c1ab164e441c75c69) | d.reason: $12$ is an extreme value which would distort the mean | E | Keep d.reason photo-assessed; ask: Explain your choice of average using the extreme value and its effect on the mean. |
| 77 | [037c80](https://www.extralesson.app/admin/review?id=6a866626274ccc2bbe037c80) | c.ii: $-1$ and $5$ | H | c.ii is a two-root list; check representation and list parsing before conversion. Clarify that these are inputs of f / outputs of its inverse; do not accidentally invert the roles in the explanatory text. |
| 78 | [037d47](https://www.extralesson.app/admin/review?id=6a866d39274ccc2bbe037d47) | d.decision: qualifies | A | d.decision → answer: qualifies/is accepted/will be accepted. Percentage and threshold context supply the decision. |
| 79 | [037e5d](https://www.extralesson.app/admin/review?id=6a867895274ccc2bbe037e5d) | d.iii: $YB=BT$ and $\angle YBT=90^\circ$ | E | Keep d.iii photo-assessed; ask: Justify the triangle classification using equal sides and the right angle. |
| 80 | [9cc675](https://www.extralesson.app/admin/review?id=6a867f0c519aa120d69cc675) | c.iii: accept | A | c.iii → answer: accept/sell and existing alternative. Completed offer-minus-value comparison supplies the decision. |
| 81 | [2ee7b5](https://www.extralesson.app/admin/review?id=6a8790c1c9e9c423972ee7b5) | d.iii: agrees | A | d.iii → answer: agrees/is consistent. Preserve the graph comparison; follow-through for differing earlier results must stay on the existing photo path. |
| 82 | [5cb2fb](https://www.extralesson.app/admin/review?id=6a8795ce63d03456fd5cb2fb) | d.iii: $39.25\text{ cm}^2$ is half of $78.5\text{ cm}^2$, so the sector is half of a circle | E | Keep d.iii photo-assessed; ask: Explain how the sector-area fraction determines the central angle. |
| 83 | [b7709e](https://www.extralesson.app/admin/review?id=6a8faf5a0b810d6232b7709e) | c.ii: accept | A | c.ii → answer: accept. Completed sentence supplies the cost condition; retain existing alternative. |
| 84 | [d586da](https://www.extralesson.app/admin/review?id=6aa48c515625745f9ed586da) | a.reason: the score of 15 is an extreme value which would distort the mean | E | Keep a.reason photo-assessed; ask: Explain why the extreme score affects the choice of average. |

## Applying later

### Prepared patch after approval

`scripts/done/repair-reviewed-cloze.ts` now prepares **31 questions / 35 slots** from the A/M candidates. Full-bank preview found that d0dd1a already fails the current schema: its lower/upper-quartile formats have no corresponding form-mark rows. That question is explicitly excluded; its rubric is not silently repaired. The original review classifications above are preserved as the audit record.

The patch changes only the reviewed response modes and adds `will` to d0dccb's declared decision alternatives. Other suggested wording/alternative improvements remain recommendations. It does not rewrite explanation parts. The JSON inventory contains reviewed part/rubric fixtures and full-content fingerprints, allowing refusal if source content changes. All records are schema-validated before the first write; each write also checks the original content. Repeated application of exactly this patch is a no-op. This is not a multi-record transaction: a concurrent edit can stop a run after earlier records were applied; the output identifies records and a repeat preview is safe.

Preview (read-only):

```sh
pnpm exec tsx scripts/done/repair-reviewed-cloze.ts
```

Only after this branch's word-blank safeguard is deployed and verified:

```sh
pnpm exec tsx scripts/done/repair-reviewed-cloze.ts --apply --code-deployed
```

Use this combined repair instead of the older standalone d0dccb repair. The flag acknowledges deployment; it does not automatically verify the deployed version. Neither command deploys code. No bank corrections have been applied during preparation.

Focused tests cover all 35 candidates' canonical/declared alternatives, empty/wrong answers, single-field prefill from supplied structured reads, unchanged non-target content, source-change refusal and idempotence. These are deterministic tests, not new OCR/handwriting evaluations.

Verification after preparation: 175 unit test files / 2,281 tests passed; the focused correction and script-entry rerun passed 193 tests. Type checking and whitespace checks passed. Read-only full-bank preview passed for all 31 included questions. No new paid model calls were made.

1. Approve the short-answer candidates and their explicit alternative/wording changes; resolve held rows separately.
2. Before each correction, exercise canonical, declared alternatives, an opposite/wrong entry and an empty entry against the real checker; verify field shape and rendered blank count. Exercise partial-credit/photo follow-through when multiple criteria attach to a slot.
3. Run branch tests and a small fresh-photo holdout including a matrix and mixed blanks. The user's successful d0dccb trial is useful evidence, not proof for every representation.
4. Deploy the matching/word-blank code before modifying shared-bank response modes.
5. Apply narrowly scoped, schema-validated, compare-and-set content patches against the reviewed original records. Preview diffs first; do not rewrite past attempts or recalculate historical grades.

## Reproducibility and limitations

Read-only selection: approved questions with at least one part having a truthy `statement` and at least one slot whose `response_mode === "explain"`; sorted by MongoDB `_id`. Reviewed every matched part's full statement, all slot answers/accepted alternatives, and its rubric criteria/marks. No student records, photos or external AI calls were needed for this review. The 84 original record IDs above are the review inventory; the retired test copy is excluded.

This inventory can change as the bank changes. Re-read affected records and compare the full content before applying any proposed correction. This artifact is not an executable migration. The separate 45-question missing-explanation-prompt flag was not reviewed in full here.
