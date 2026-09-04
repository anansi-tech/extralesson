# Rubric template audit — 4 September 2026

From `pnpm tsx scripts/backfill-rubric-template.ts --yes` against the live bank (ROUND_5 Task 1).
Ambiguous rows keep the literal criterion as their template and are listed here for a glance.

```
questions: 552 · rubric rows: 5771
templated (≥1 reference): 809  ·  unchanged (no value in scope): 4389  ·  ambiguous (literal kept): 573
references per templated row: 1→781  2→28
```

| question | status | row | slot | why ambiguous | criterion |
|---|---|---|---|---|---|
| 257e4b | retired | AK5 | b.i | 50 is a question constant and the value of b.i | Rearranges a correct equation to the form $3x+4y=50$. |
| 257e4b | retired | AK6 | c.i | 50 is a question constant and the value of b.i | Substitutes $O(0,0)$ into “their” boundary expression to obtain $0<50$. |
| 257e4b | retired | R2 | c.i | 50 is a question constant and the value of b.i | Identifies that $O$ lies in the half-plane $3x+4y<50$. |
| 257e4b | retired | R4 | c.i | 50 is a question constant and the value of b.i | Includes the boundary and states $3x+4y\ge50$ CAO. |
| 257ef3 | retired | CK1 | b.i | 30 is a question constant and the value of b.i | Identifies $30$ mm as the value with the greatest frequency |
| 257ef3 | retired | AK5 | c.i | 2 matches a.i and a.iv | Divides 'their' angle $AOB$ by $2$ to obtain angle $ACB$ |
| 257f35 | retired | CK1 | a.number | 2 is a question constant and the value of a.number | Reads $P \cap E$ as $\{2\}$ |
| 257f35 | retired | CK2 | a.type | 2 is a question constant and the value of a.number | Identifies $2$ as prime |
| 257f35 | retired | AK1 | b.boxes | 10 is a question constant and the value of b.boxes | Finds $n(P \cup E)=10$ |
| 257f35 | retired | AK2 | b.marked_price | 10 is a question constant and the value of b.boxes | Multiplies $10$ by \$25 |
| 257f35 | retired | AK4 | c.discount | 4 is a question constant and the value of c.rate | Finds $4\%$ of "their" marked price |
| 257f3d | retired | CK1 | a.ii | 30 is a question constant and the value of a.ii | Converts "their" volume from cubic centimetres to litres; CAO $30\text{ L}$ |
| 257f94 | retired | AK3 | b.i | 22 is a question constant and the value of b.i | CAO 22 |
| 257fcf | retired | CK4 | c.faces | 5 is a question constant and the value of c.faces | States 5 faces for a triangular prism, CAO |
| 257fcf | retired | CK5 | c.edges | 9 is a question constant and the value of c.edges | States 9 edges for a triangular prism, CAO |
| 257fcf | retired | AK3 | d.image_of_4 | 9 is a question constant and the value of d.image_of_4 | Finds the image of 4 as 9, CAO |
| 257fdc | retired | AK6 | d.i | 2 is a question constant and the value of d.i | Substitutes $x=2$ into $2x+y \leq$ 'their' number of viewing intervals |
| 257fdc | retired | R3 | d.i | 2 is a question constant and the value of d.i | Determines the greatest whole-number value, $y=2$, or follows through with 'their' maximum |
| 257ff8 | retired | AK2 | c.figure_number | 9 is a question constant and the value of c.figure_number | Solves to obtain $n = 9$ |
| 257ff8 | retired | CK1 | c.set | 9 is a question constant and the value of c.figure_number | Identifies 9 as a natural number |
| 109916 | retired | CK1 | b.i | 32 is a question constant and the value of b.i | CAO $32°$, the modal angle. |
| 109916 | retired | AK5 | c.i | 2 matches a.r30 and a.r34 | Calculates $2 \times 32° = 64°$. |
| 109916 | retired | R2 | d.i | 2 matches a.r30 and a.r34 | Finds each base angle of isosceles triangle $AOB$ as $(180° -$ "their" $\angle AOB)/2$. |
| 109916 | retired | AK6 | d.i | 32 matches d.i and b.i | CAO $90° -$ "their" $\angle OAB$, giving $32°$ for the correct earlier value. |
| 10991e | retired | CK1 | a.faces | 5 is a question constant and the value of a.faces | CAO 5 faces |
| 10991e | retired | AK1 | b.i | 5 is a question constant and the value of a.faces | Simplifies "their" expression to $5x^2+45x+90$ |
| 10991e | retired | AK2 | b.i | 5 is a question constant and the value of a.faces | Takes out the common factor 5 from "their" expression |
| 10991e | retired | AK4 | b.i | 5 is a question constant and the value of a.faces | CAO $5(x+3)(x+6)$ |
| 109926 | retired | R1 | b.i | 4 is a question constant and the value of b.i | States the valid whole-number figure number, CAO 4 |
| 109933 | retired | CK1 | a.i | 90 is a question constant and the value of a.i | CAO $90°$ |
| 1161f8 | retired | AK1 | b.i | \frac{4}{5} is a question constant and the value of b.i | Finds gradient $\frac{4}{5}$ using $(5,\text{their }4)$ and the origin |
| 116200 | retired | AK2 | a.i | 3 is a question constant and the value of a.i | CAO $3\text{ m}^3$ |
| 116200 | retired | CK1 | b.i | 3 is a question constant and the value of a.i | Uses $1\text{ m}^3=1000\text{ L}$ |
| 116208 | retired | R4 | d.i | 8 is a question constant and the value of c.i | Justifies $8$ as the next natural number above $7.09$ |
| 116210 | retired | CK1 | a.i | 12 is a question constant and the value of a.i | CAO $12$ for $n(J \cap R)$ |
| 116210 | retired | CK2 | a.ii | 15 is a question constant and the value of a.ii | CAO $15$ for $n((J \cup R)')$ |
| 116237 | retired | R3 | c.ii | 38 is a question constant and the value of c.ii | Uses the tangent-chord theorem to obtain $\angle TPQ=38°$. |
| 116237 | retired | AK6 | c.iii | 38 is a question constant and the value of c.ii | Calculates $90°-\text{their }38°=52°$. |
| 11624f | retired | AK1 | a.i | 8 is a question constant and the value of a.i | Reads frequency $8$ for groups of $1$ passenger. |
| 11624f | retired | AK2 | a.ii | 14 is a question constant and the value of a.ii | Reads frequency $14$ for groups of $2$ passengers. |
| 11624f | retired | AK3 | a.iii | 22 is a question constant and the value of a.iii | Reads frequency $22$ for groups of $3$ passengers. |
| 11624f | retired | AK4 | a.iv | 6 is a question constant and the value of a.iv | Reads frequency $6$ for groups of $4$ passengers. |
| 11624f | retired | CK1 | b.i | 3 is a question constant and the value of b.i | States modal group size $3$ passengers. |
| 116269 | retired | AK2 | b.i | 12 is a question constant and the value of b.i | Multiplies "their" number of pairs per sign by 12, CAO 12 |
| 116271 | retired | AK4 | b.i | 3 is a question constant and the value of b.i | CAO $x=3$ |
| 116271 | retired | AK5 | c.i | 3 is a question constant and the value of b.i | Uses "their" value of $x$ to obtain side lengths $x+4$ and $x+3$ |
| 116279 | retired | CK1 | b.f_image | 5 is a question constant and the value of b.f_image | States $f(2)=5$, CAO |
| 116279 | retired | CK2 | b.g_image | 5 is a question constant and the value of b.g_image | States $g(2)=5$, CAO |
| 116279 | retired | AK3 | d.gradient_MP | 2 is a question constant and the value of d.gradient_MP | Calculates the gradient of $MP$ using $M$ and $P(\text{their }g(2),\text{ their }fg(2))$, CAO $2$ |
| 116281 | retired | AK4 | b.ii | 0 is a question constant and the value of b.ii | Calculates $\vec{AB}\cdot\vec{BC}=0$ using "their" vectors |
| 116281 | retired | AK6 | c.i | 0 matches c.i and b.ii | Simplifies correctly to $k^2-2k-3=0$ |
| 116281 | retired | R3 | d.ii | 3 is a question constant and the value of d.ii | Selects $k=3$ from roots $3$ and $-1$ |
| 116291 | retired | AK1 | b.i | 6 is a question constant and the value of b.i | Finds the magnitude of $\binom{0}{6}$ |
| 116291 | retired | AK2 | b.i | 6 is a question constant and the value of b.i | CAO $6$ m |
| 1162a1 | retired | R3 | c.i | 5 is a question constant and the value of c.i | CAO $n = 5$; follow-through from "their" correctly solved equation |
| 1162a1 | retired | R4 | d.ii | 5 is a question constant and the value of c.i | Gives $1$ and $5$ as the only factors; follow-through from "their" number |
| 1162a9 | retired | AK1 | a.i | 64 is a question constant and the value of a.i | CAO $64°$. |
| 1162a9 | retired | AK5 | c.i | 32 is a question constant and the value of c.i | CAO $32°$. |
| 1162b9 | retired | AK1 | a.i | 2 is a question constant and the value of a.i | Counts the frequency for 2 laps as 2. |
| 1162b9 | retired | AK2 | a.ii | 5 is a question constant and the value of a.ii | Counts the frequency for 3 laps as 5. |
| 1162b9 | retired | AK3 | a.iii | 3 is a question constant and the value of a.iii | Counts the frequency for 4 laps as 3. |
| 1162b9 | retired | AK4 | a.iv | 2 is a question constant and the value of a.iv | Counts the frequency for 5 laps as 2. |
| 1162b9 | retired | CK1 | b.i | 3 matches b.i and a.iii | CAO 3. |
| 1162ce | retired | CK2 | a.ii | 40 is a question constant and the value of a.ii | Identifies the complement of $C \cup S$ as the outside region; CAO $40$ |
| 1162d6 | retired | R3 | b.i | 1 035 is a question constant and the value of b.i | Applies sales tax using a factor of $1.15$ and equates to $1 035$ |
| 1162de | retired | CK2 | a.ii | 12 is a question constant and the value of a.ii | CAO 12 edges |
| 1162eb | retired | R1 | a.x | 16 is a question constant and the value of a.x | Reads the modal frequency from the bar chart, CAO 16 |
| 1162f3 | retired | CK1 | c.i | 5 matches c.i and b.i | States Figure 5 |
| 1162fb | retired | R1 | a.meeting_point | 5 matches a.f_value and a.g_value | Forms $(2,\text{their common image})$, CAO $(2,5)$ |
| 1162fb | retired | AK5 | c.gradient_f | 2 is a question constant and the value of c.gradient_f | States the gradient of $f$ as $2$ |
| 116310 | retired | AK5 | c.i | 5 is a question constant and the value of c.i | CAO $5\text{ m}$. |
| 116328 | retired | CK1 | a.i | 2 is a question constant and the value of a.i | CAO 2 for the first frequency. |
| 116328 | retired | AK3 | a.iv | 3 is a question constant and the value of a.iv | Subtracts $15$ from $18$ to obtain 3. |
| 116328 | retired | AK4 | c.i | 2 is a question constant and the value of a.i | Forms $0\times2+1\times7+2\times6+3\times3$, using 'their' frequencies. |
| 8ff107 | retired | CK1 | a.i | 4 is a question constant and the value of a.i | CAO $4$ |
| 8ff10f | retired | CK5 | d.i | 1 is a question constant and the value of b.i | Determines required spending as \$20 minus \$1 |
| 8ff117 | retired | AK2 | b.i | 40 is a question constant and the value of b.i | Calculates $\dfrac{\text{their }16}{40}\times100$, CAO $40\%$ |
| 6a525e | approved | AK3 | c.i | 55 matches c.i and b.i | CAO $55°$. |
| 6a5266 | approved | CK1 | a.i | 16 is a question constant and the value of a.i | Counts 16 dots in Figure 4 |
| 6a5266 | approved | AK3 | c.i | 9 is a question constant and the value of c.i | Uses $n+2=11$ and calculates $n=9$ |
| 6a5278 | approved | CK2 | b.i | 2 is a question constant and the value of b.i | Forms $x^2+1=5$ using "their" composite function |
| 6a5278 | approved | AK3 | b.i | 2 is a question constant and the value of b.i | Solves to obtain $x=\pm2$ |
| 6a5278 | approved | R1 | b.i | 2 is a question constant and the value of b.i | Selects $2$ as the non-negative raw score, CAO |
| 6a5278 | approved | R3 | c.i | 2 is a question constant and the value of b.i | CAO $9$ when the raw score is $2$ |
| 6a52ab | approved | R2 | c.i | 45 matches c.i and b.i | CAO $45°$, following through from their angle in part (b) |
| 6a52ab | approved | R4 | d.i | 90 matches d.i and a.i | CAO $90°$, following through from their previous angles |
| 6a52bb | approved | AK4 | a.iv | 9 is a question constant and the value of a.iv | Calculates $9 \times 1 = 9$ |
| 6a52c8 | approved | AK2 | b.i | 3 is a question constant and the value of b.i | Simplifies $\frac{3(36\pi)}{4\pi}$ to $27$ |
| 6a52c8 | approved | AK3 | b.i | 3 is a question constant and the value of b.i | Evaluates $\sqrt[3]{27}$, CAO $3$ |
| fe84b7 | approved | R1 | a.i | 3 is a question constant and the value of a.i | Determines an increase of 3 tiles between consecutive figures |
| fe84b7 | approved | CK1 | b.i | 3 is a question constant and the value of a.i | Recognises that $3n$ represents the increase in tiles for Figure $n$ |
| fe84b7 | approved | R2 | b.i | 3 is a question constant and the value of a.i | Forms $T=3n+2$ using "their" increase |
| fe84b7 | approved | CK3 | c.i | 3 is a question constant and the value of a.i | Forms $3n+2=35$ using "their" rule |
| fe84b7 | approved | AK1 | c.i | 3 is a question constant and the value of a.i | Subtracts 2 from both sides, giving $3n=33$ |
| fe84b7 | approved | AK2 | c.i | 3 is a question constant and the value of a.i | Divides "their" 33 by "their" 3 |
| fe84b7 | approved | CK4 | c.i | 11 is a question constant and the value of c.i | CAO 11 |
| fe84c4 | approved | R3 | d.verdict | 66 is a question constant and the value of b.i | Compares $66°$ with "their" required angle and decides that they are unequal. |
| d9c20d | approved | R1 | b.i | 3 is a question constant and the value of b.i | Reads $g(\text{their }7)=3$ correctly from the graph |
| d9c215 | approved | AK1 | a.i | 3 is a question constant and the value of a.i | CAO 3 |
| d9c215 | approved | CK1 | b.i | 3 is a question constant and the value of a.i | Identifies 3 as the number added for each successive figure |
| d9c215 | approved | R1 | b.i | 3 is a question constant and the value of a.i | Combines the repeating and fixed parts to form $3n+1$ |
| d9c215 | approved | CK4 | c.i | 3 is a question constant and the value of a.i | Forms $3n+1=52$ |
| d9c215 | approved | AK3 | c.i | 3 is a question constant and the value of a.i | Divides by 3 to obtain $n=17$ |
| d9c215 | approved | CK5 | d.i | 3 is a question constant and the value of a.i | Forms $3n+1=50$ for the remaining plants |
| d9c25c | approved | AK1 | a.i | 22 is a question constant and the value of a.i | Adds $12 + 10$, giving $22$ |
| d9c25c | approved | AK2 | b.i | 22 is a question constant and the value of a.i | Adds $22 + 18$, giving $40$ |
| d9c25c | approved | CK3 | c.i | 22 is a question constant and the value of a.i | Identifies $22$ girls as the favourable outcomes |
| d9c25c | approved | AK3 | c.i | 22 is a question constant and the value of a.i | Forms $22$ divided by "their" total and obtains $\frac{11}{20}$ |
| d9c290 | approved | AK2 | b.i | 3 is a question constant and the value of b.i | Evaluates "their" expression, CAO $3$ |
| d9c2aa | approved | AK1 | b.i | 6 is a question constant and the value of b.i | Calculates $\frac{3}{26}\times$ "their" total cards, CAO $6$ |
| d9c2aa | approved | R2 | c.i | 10 is a question constant and the value of c.i | CAO $p=10$ |
| d9c2c1 | approved | R3 | d.i | 210 is a question constant and the value of d.i | Uses "their" value from (b) to justify $f(f^{-1}(210))=210$ |
| d9c2c9 | approved | AK3 | b.i | 5 is a question constant and the value of b.i | Substitutes and evaluates $\sqrt{3^2+4^2}=5$, or equivalent follow-through using 'their' components |
| d9c2c9 | approved | R1 | b.i | 5 is a question constant and the value of b.i | Interprets the magnitude as the direct distance $AB$, giving $5$ m |
| d9c2d1 | retired | CK1 | b.i | 4 is a question constant and the value of b.i | Recognises $fg(4)=f(g(4))$ |
| d9c2d1 | retired | AK2 | b.i | 4 is a question constant and the value of b.i | Substitutes “their” value of $g(4)$ into $f$ |
| d9c2d1 | retired | AK3 | b.i | 4 is a question constant and the value of b.i | CAO 4 |
| d9c2d1 | retired | CK2 | c.i | 4 is a question constant and the value of b.i | Identifies 4 as the number of juice trays and 4 as the number of snack plates |
| d9c2d1 | retired | R3 | d.ii | 4 is a question constant and the value of b.i | Identifies $(5,4)$ as outside the shaded region |
| d9c2d1 | retired | R4 | d.ii | 4 is a question constant and the value of b.i | Justifies that four snack plates require $5+2(4)=13$ spaces, exceeding 12 |
| d9c2fd | approved | R2 | b.i | 145 is a question constant and the value of b.i | States 145° as a three-digit bearing. |
| d9c315 | approved | AK1 | a.i | 3 is a question constant and the value of a.i | CAO 3 |
| d9c315 | approved | CK2 | b.i | 3 is a question constant and the value of a.i | Uses 3 as the coefficient of $n$ from "their" common increase. |
| d9c35e | approved | R1 | b.i | 3 is a question constant and the value of b.i | Uses $2(4)+k=$ "their" $f(4)$ to obtain $k=3$ |
| d9c35e | approved | R2 | b.ii | 3 is a question constant and the value of b.i | Forms and solves $2x+3=$ "their" 17, or equivalent |
| d9c35e | approved | CK2 | c.i | 3 is a question constant and the value of b.i | Interchanges input and output to obtain $x=2y+3$ |
| d9c35e | approved | AK4 | c.i | 3 is a question constant and the value of b.i | Subtracts 3 to obtain $x-3=2y$ |
| d9c380 | approved | R1 | b.i | 90 is a question constant and the value of b.i | Forms an equation equating the total number of fruits to $90$. |
| d9c380 | approved | AK2 | c.i | 90 is a question constant and the value of b.i | Calculates $90 - 24 = 66$, or subtracts "their" plantain total correctly. |
| d9c388 | approved | CK3 | c.i | 1 is a question constant and the value of c.i | Uses the criterion that a unit vector has magnitude $1$. |
| d9c388 | approved | AK4 | c.i | 1 is a question constant and the value of c.i | Calculates $\sqrt{\left(\frac{3}{\sqrt{13}}\right)^2+\left(\frac{2}{\sqrt{13}}\right)^2}=1$. |
| d9c388 | approved | R1 | c.i | 1 is a question constant and the value of c.i | Relates the stated vector to “their” $\overrightarrow{AB}$ as $\dfrac{1}{2\sqrt{13}}\overrightarrow{AB}$. |
| d9c390 | retired | AK3 | d.i | 3 is a question constant and the value of d.i | Substitutes $x=5$ into “their” servings inequality to obtain $y\ge3$. |
| d9c390 | retired | AK4 | d.i | 3 is a question constant and the value of d.i | Applies the storage restriction to obtain $5+y\le8$, giving $y\le3$. |
| d9c390 | retired | R3 | d.i | 3 is a question constant and the value of d.i | Reconciles both restrictions and concludes $y=3$ only. |
| d9c3c1 | approved | AK2 | b.i | 30 is a question constant and the value of b.i | Calculates $48-18=30$ |
| d9c3c1 | approved | AK3 | c.experimental | \frac{30}{80} is a question constant and the value of c.experimental | Calculates experimental probability $\frac{30}{80}=\frac{3}{8}$ using "their" completed table |
| d9c3c1 | approved | CK3 | c.theoretical | \frac{3}{8} is a question constant and the value of c.theoretical | Obtains theoretical probability of unblemished as $1-\frac{3}{8}=\frac{5}{8}$ |
| d9c3c1 | approved | AK4 | c.theoretical | \frac{3}{8} is a question constant and the value of c.theoretical | Calculates $\frac{3}{5}\times\frac{5}{8}=\frac{3}{8}$ |
| d9c40e | approved | AK1 | b.ii | 2 is a question constant and the value of b.ii | Calculates $10 \div 5$ to obtain \$2 per bag |
| d9c40e | approved | AK2 | c.i | 2 is a question constant and the value of b.ii | Forms $0=2x-14$ for the new $x$-intercept |
| d9c41e | approved | R1 | a.i | 4 is a question constant and the value of a.i | Reads $T=4\text{ s}$ from the graph when $\sqrt{l}=2$ |
| d9c41e | approved | AK3 | c.i | 4 is a question constant and the value of a.i | Evaluates $\frac{9.8(4)^2}{4\pi^2}$, following through on "their" value of $T$ |
| d9c41e | approved | R3 | d.i | 4.00 is a question constant and the value of a.i | Correctly compares $4.00\text{ m}$ with "their" calculated length and makes a valid decision |
| d9c426 | approved | CK1 | a.i | 5 is a question constant and the value of a.i | Recognises that Figure 5 has 5 circles |
| d9c426 | approved | CK3 | b.i | 5 is a question constant and the value of a.i | Forms $5\times$ "their" number of dots in Figure 5 |
| d9c426 | approved | AK2 | b.i | 5 is a question constant and the value of a.i | Multiplies 5 by "their" Figure 5 total |
| d9c426 | approved | R2 | c.i | 5 is a question constant and the value of a.i | Forms $5\times20+5\times1$ for five copies |
| 804982 | approved | CK2 | c.i | 2 is a question constant and the value of c.i | Identifies that $g(2)$ is the input to $f^{-1}$ |
| 804982 | approved | AK3 | c.i | 2 is a question constant and the value of c.i | Substitutes "their" value of $g(2)$ into "their" inverse function |
| 804982 | approved | AK4 | c.i | 2 is a question constant and the value of c.i | CAO $2$, following through from "their" earlier values |
| 80498a | approved | R1 | b.i | 5 is a question constant and the value of b.i | CAO $x=5$ |
| 80498a | approved | R3 | d.ii | 5 matches d.ii and b.i | Gives a non-zero intersection, $n(A \cap B)=5$ |
| 8049c0 | approved | AK1 | a.i | 260 is a question constant and the value of a.i | Calculates $040°-140°+360°=260°$. |
| 8049c0 | approved | R1 | a.i | 260 is a question constant and the value of a.i | Selects $260°$, consistent with $H$ southwest of $F$. |
| 8049c0 | approved | AK2 | b.i | 260 is a question constant and the value of a.i | Finds $260°-180°=080°$ using “their” bearing of $H$ from $F$. |
| 8049e7 | approved | AK3 | b.i | 10 is a question constant and the value of b.i | Finds $\sqrt{100}=10$ |
| 8049e7 | approved | AK4 | c.sections | 10 is a question constant and the value of b.i | Calculates $10\div3=3.\overline{3}$, or equivalent using "their" length |
| 8049e7 | approved | R3 | c.unused | 2 is a question constant and the value of c.unused | States $2$ m as the unused guttering |
| 8049f4 | approved | AK1 | a.i | 4 is a question constant and the value of a.i | CAO $4$ |
| 8049f4 | approved | R1 | c.i | 4 is a question constant and the value of a.i | Determines the number needed for one bed as "their" Figure 4 total plus $3$ |
| 8049f4 | approved | AK4 | c.i | 4 is a question constant and the value of a.i | CAO $144$, following through from "their" Figure 4 total |
| 804a11 | approved | AK2 | b.i | \frac{1}{4} is a question constant and the value of b.i | Simplifies $\frac{\text{their }30}{120}$ to $\frac{1}{4}$ |
| 804a11 | approved | R3 | d.ii | \frac{1}{4} is a question constant and the value of b.i | Compares $\frac{7}{16}$ with $\frac{1}{4}$ and states that the batch is rejected |
| 804a29 | approved | R1 | b.i | -5 is a question constant and the value of b.i | Reads $gf(3)=-5$ from the graph, CAO |
| 804a29 | approved | CK3 | c.axis | 1 is a question constant and the value of c.axis | States the axis of symmetry as the equation $x=1$, CAO |
| 804a29 | approved | R3 | d.image_claim | 1 is a question constant and the value of c.axis | Uses symmetry about $x=1$ and "their" $gf(3)$ to identify $x=-1$ as another index with image $-5$ |
| 804a39 | approved | AK4 | c.remaining | 2 is a question constant and the value of c.complete | Subtracts $2\times$ "their" Figure $5$ total from $180$ |
| 804a84 | approved | R2 | b.i | 140 is a question constant and the value of b.i | Uses the clockwise position of $C$ to obtain $140°$. |
| 804ab6 | approved | R2 | d.i | 3 is a question constant and the value of d.i | Uses 3 red tokens and a total of $6+x$ tokens after adding $x$ blue tokens |
| 804ab6 | approved | R3 | d.i | 3 is a question constant and the value of d.i | Forms $\frac{3}{2(6+x)} =$ "their" required new probability |
| 804ab6 | approved | AK5 | d.i | 3 is a question constant and the value of d.i | Solves the equation to obtain $x=3$ |
| 804ab6 | approved | R4 | d.i | 3 is a question constant and the value of d.i | Interprets $x=3$ as 3 blue tokens to be added |
| 804ad2 | approved | R2 | d.i | 0.4 matches d.i and a.i and b.i | CAO $0.4\text{ h}$ |
| 804af7 | approved | R1 | b.minimum | -4 is a question constant and the value of b.minimum | Reads the minimum value $-4$ from the turning point |
| 804af7 | approved | CK2 | b.axis | 1 is a question constant and the value of b.axis | States the axis as the equation $x=1$, CAO |
| 804b0f | approved | AK3 | c.i | 2 is a question constant and the value of c.i | Solves "their" equation to obtain $x=2$ |
| 804b0f | approved | R3 | c.i | 2 is a question constant and the value of c.i | Concludes that $x=2$ satisfies the positive whole-number condition |
| 804b24 | retired | AK4 | d.i | 6 is a question constant and the value of d.i | CAO $6$ boxes |
| 8210b0 | approved | CK1 | a.i | 20 is a question constant and the value of a.i | Recognises that the total for Fortnight 1 is $5 \times 20$ |
| 8210b0 | approved | AK2 | a.i | 20 is a question constant and the value of a.i | Subtracts the four known values from $100$ to obtain $20$ |
| 8210d8 | approved | AK2 | c.i | 30\,000 is a question constant and the value of a.i | Calculates the return time from "their" outward distance at $30\,000\text{ m/h}$ |
| 821105 | approved | AK2 | a.i | 14 is a question constant and the value of a.i | Divides $70$ by $5$, CAO $14$ |
| 821105 | approved | R2 | c.i | 3 is a question constant and the value of c.i | Uses the midpoint of "their" two day numbers to obtain $3$ |
| 821105 | approved | R3 | c.i | 3 is a question constant and the value of c.i | States the axis as the equation $x=3$ |
| 821125 | approved | AK2 | a.i | 12 is a question constant and the value of a.i | CAO $x = 12$ |
| 821125 | approved | R3 | c.i | 6 is a question constant and the value of c.i | Rounds up to whole sheets; CAO 6 |
| 821132 | approved | AK3 | c.i | 50 matches b.angle and a.i | Uses the angle sum of triangle PAB$: $180°-"their"50°-"their"50°. |
| 82119a | approved | AK1 | b.i | 360 is a question constant and the value of a.i | Divides $360$ by $0.75$ |
| 8211a2 | approved | CK1 | a.i | 9 is a question constant and the value of a.i | Identifies the greatest and least mean heights as $9$ m and $0$ m |
| 8211a2 | approved | AK1 | a.i | 9 is a question constant and the value of a.i | Calculates $9-0$, CAO $9$ m |
| 8211a2 | approved | AK2 | c.i | 3 is a question constant and the value of c.i | Reads the corresponding time, CAO $3$ s |
| 8211a2 | approved | R2 | d.axis | 3 matches d.axis and c.i | Writes the axis of symmetry as the equation $t=3$ using "their" time from (c) |
| 8211a2 | approved | AK4 | d.roots | 3 is a question constant and the value of c.i | Uses symmetry about $t=3$ to obtain the second root, $6$ |
| 8211c1 | approved | AK3 | a.ii | 3 is a question constant and the value of a.ii | Evaluates the cube root, CAO $3\text{ m}$ |
| 8211c1 | approved | AK4 | b.i | 3 is a question constant and the value of a.ii | States $A(3,0)$ and $B(3,4)$, CAO |
| 9e877e | approved | CK1 | a.i | 12 is a question constant and the value of a.i | Reads 12 as the greatest whole-number value from the number line |
| 9e877e | approved | CK2 | b.i | 12 is a question constant and the value of a.i | Forms $d+35(\text{their }12)=600$ |
| 9e877e | approved | AK1 | b.i | 12 is a question constant and the value of a.i | Calculates $35\times\text{their }12$ |
| 9e877e | approved | R1 | c.i | 12 matches c.i and a.i | Uses the whole-number condition to give 12 bags |
| 9e878b | approved | R2 | c.i | 32 is a question constant and the value of c.i | Concludes that the tangent-chord angle is $32°$, consistent with $\angle PRQ$ |
| 9e87b5 | approved | AK3 | b.i | 5 is a question constant and the value of b.i | CAO $5$ cm |
| 9e87b5 | approved | CK3 | d.ii | 9 is a question constant and the value of d.ii | Identifies the maximum value of the quadratic profile, CAO $9$ cm |
| 9e87b5 | approved | R1 | d.iii | 3 is a question constant and the value of d.iii | States $x=3$ as the equation of the axis of symmetry using the midpoint of "their" pair of values |
| 9e87b5 | approved | R2 | d.iv | 3 is a question constant and the value of d.iii | Identifies equal-depth positions equidistant on opposite sides of $x=3$ |
| 9e87b5 | approved | R3 | d.iv | 3 is a question constant and the value of d.iii | Links the maximum depth at $x=3$ to the midpoint conclusion |
| 9e87bd | approved | AK2 | b.i | 108 matches b.i and a.i | CAO $y = 108°$, using "their" value of $x$ |
| 9e87ef | approved | AK4 | b.i | 35 is a question constant and the value of b.i | CAO $35$ |
| 9e87ef | approved | CK3 | c.i | 35 is a question constant and the value of b.i | Reads that setting B is at $35$ on the diagram |
| 9e87f7 | approved | AK3 | b.i | 78 is a question constant and the value of b.i | Divides "their" total by 5 to obtain $78$. |
| 9e87f7 | approved | R4 | d.year | 2025 is a question constant and the value of d.year | Chooses 2025 because it has the smaller range. |
| 9e881d | approved | R2 | b.i | 5 is a question constant and the value of b.i | Uses the same image to identify the other preimage, CAO $5$ |
| 9e881d | approved | CK1 | b.ii | 4 is a question constant and the value of b.ii | States the axis of symmetry as an equation, CAO $x=4$ |
| 9e8825 | approved | AK3 | b.i | 1 is a question constant and the value of b.i | Adds $0.5$ minute to "their" time for $PQ$ to obtain $1$ minute |
| 9e8832 | approved | AK2 | b.i | \dfrac{12}{4} is a question constant and the value of b.i | CAO $\dfrac{12}{4}=3$ |
| 9e8832 | approved | AK3 | c.i | 3 is a question constant and the value of b.i | CAO $y=3x-12$, using "their" gradient and "their" y-intercept |
| 9e883f | retired | AK5 | d.amount | 6 is a question constant and the value of d.amount | Finds the increase: $23-17=6$, or correct follow-through using "their" value. |
| 9e8847 | approved | R2 | d.packets | 3 matches d.packets and a.i | Selects 3 whole packets as the minimum number required |
| 9e8847 | approved | R3 | d.left_over | 3 matches d.left_over and d.packets and a.i | Finds unused straws from $3 \times 4 -$ "their" 9, CAO 3 |
| 9e888a | approved | CK2 | b.i | 200 is a question constant and the value of b.i | Uses $200\text{ cm}^3$ as the volume for each mango-drink tray |
| 9e888a | approved | AK2 | b.i | 200 is a question constant and the value of b.i | Solves the equation for $x$, CAO $200$ |
| 9e88a2 | approved | AK4 | b.i | 7.4 is a question constant and the value of b.i | CAO 7.4 |
| 9e88a2 | approved | CK3 | d.ii | 7.4 is a question constant and the value of b.i | Identifies 7.4 minutes as a sample statistic |
| 9e88aa | approved | R1 | c.i | 4 is a question constant and the value of c.i | Reads a correct gradient of 4 from the graph |
| 9e88aa | approved | AK3 | c.ii | 4 is a question constant and the value of c.i | Substitutes "their" gradient into $g=\frac{4\pi^2}{m}$ |
| 9e88aa | approved | AK4 | c.ii | 4 is a question constant and the value of c.i | Evaluates $\frac{4\pi^2}{4}$, CAO 9.87 |
| 9e88c1 | approved | CK1 | b.axis | 3 is a question constant and the value of b.axis | States the axis of symmetry as the equation $x=3$ |
| 9e88c1 | approved | R2 | b.element | 3 is a question constant and the value of b.axis | Uses symmetry about $x=3$ and “their” image from (a) to obtain $4$ |
| 9e88c1 | approved | AK2 | c.i | 0 is a question constant and the value of c.i | Evaluates $g(-3)$, CAO $0$ |
| 9e88c1 | approved | CK3 | d.roots | 0 is a question constant and the value of c.i | Recognises that $gf(x)=0$ when $f(x)=-3$ |
| 9e88ce | approved | AK1 | a.i | 65 is a question constant and the value of a.i | CAO $65°$ |
| 9e88ce | approved | AK2 | b.i | 65 is a question constant and the value of a.i | Adds $65°$ and "their" $\angle PRQ$ |
| 9e88f0 | approved | AK1 | a.i | 37 is a question constant and the value of a.i | CAO $37°$ |
| 9e8915 | approved | AK4 | c.i | 29 is a question constant and the value of b.i | Forms the probability $\frac{\text{their }29}{80}$ |
| 9e891d | approved | AK4 | c.i | 1 500 matches c.i and b.i | Subtracts \$12 000 from "their" selling price to obtain 1 500 |
| 9e8942 | approved | AK2 | b.i | 60 matches b.i and a.i | Gives $\angle TAB = 60°$ using “their” $\angle ACB$ |
| 9e8942 | approved | AK3 | c.i | 60 matches c.i and b.i and a.i | Obtains $\angle TBA = 60°$ from “their” $\angle TAB$ |
| 9e8942 | approved | AK4 | c.i | 60 matches c.i and b.i and a.i | Calculates $\angle ATB = 180° - 60° - 60° = 60°$ |
| 9e895f | approved | AK1 | a.i | 5 is a question constant and the value of a.i | Substitutes $x=0$ into $f$, CAO $5$ |
| 9e895f | approved | R1 | b.i | 6 is a question constant and the value of b.i | Reads the other corresponding input from the graph, CAO $6$ |
| 9e895f | approved | R2 | c.i | 3 is a question constant and the value of c.i | States the axis of symmetry as an equation, CAO $x=3$ |
| 9e895f | approved | AK4 | e.i | 5 is a question constant and the value of a.i | Reads both roots from the graph, CAO $1$ and $5$ |
| 9e8967 | approved | AK1 | a.i | 3 is a question constant and the value of a.i | Subtracts the known frequencies from 12 to obtain 3. |
| 9e8974 | approved | AK1 | a.i | 3 is a question constant and the value of a.i | CAO 3. |
| 9e8974 | approved | CK2 | b.i | 3 is a question constant and the value of a.i | Identifies $3n$ as the variable part of the relationship. |
| 9e8974 | approved | AK2 | b.i | 3 is a question constant and the value of a.i | CAO $M=3n+1$. |
| 9e899b | approved | AK1 | a.i | 68 is a question constant and the value of a.i | CAO $68°$. |
| d16f10 | approved | AK3 | c.i | 750 is a question constant and the value of c.i | CAO $750\text{ m}$ |
| d16f10 | approved | R2 | d.i | 750 is a question constant and the value of c.i | Calculates $750+2\times$ "their" $BC$ |
| d16f5f | approved | AK2 | b.i | 55 is a question constant and the value of b.i | Uses $\bigl(180 - \text{their }\angle AOB\bigr) \div 2$ to obtain $55°$ |
| d16f5f | approved | AK3 | c.i | 35 is a question constant and the value of c.i | Calculates $90 - \text{their }\angle OAB = 35°$ |
| d16f6c | approved | R3 | d.i | 2 is a question constant and the value of d.i | Finds the difference between "their" limiting times, CAO $2\text{ s}$ |
| d16f91 | approved | AK2 | b.i | 2 is a question constant and the value of b.i | Substitutes "their" value of $f(3)$ into $g$, giving $7k+2=16$ |
| d16f91 | approved | AK3 | b.i | 2 is a question constant and the value of b.i | Solves for $k=2$ |
| d16f91 | approved | AK4 | c.i | 2 is a question constant and the value of b.i | Evaluates $g(f(x))=2(2x+1)+2=4x+4$ |
| d16f91 | approved | R3 | d.i | 2 is a question constant and the value of b.i | States the allowable discrete values as $\{0,1,2,3\}$ |
| d16fb5 | approved | AK4 | c.i | 58 is a question constant and the value of c.i | CAO $58°$ |
| d16fb5 | approved | R3 | d.angle | 58 is a question constant and the value of c.i | Applies the angle sum of triangle $PAB$: $180°-2(\text{their }58°)$ |
| d17011 | approved | R3 | d.axis | 3 is a question constant and the value of d.axis | Uses the midpoint of "their" boundary values to state the axis, CAO $x=3$ |
| d17011 | approved | CK3 | d.minimum | 0 is a question constant and the value of d.minimum | Identifies the minimum value of $gf$, CAO $0$ |
| d1707c | approved | CK1 | a.i | 12 is a question constant and the value of a.i | CAO $12$ |
| d1707c | approved | AK3 | d.maximum | 16 is a question constant and the value of d.maximum | Identifies the maximum predicted mass as $16$ |
| d1707c | approved | AK4 | d.week | 4 is a question constant and the value of d.week | Identifies week $4$ as the week of maximum predicted mass |
| d1707c | approved | R3 | d.axis | 4 is a question constant and the value of d.axis | States the axis of symmetry as the equation $x = 4$ |
| 0ab945 | approved | AK1 | a.i | 5 is a question constant and the value of a.i | CAO $5$ |
| 0ab945 | approved | AK2 | b.maximum | 9 is a question constant and the value of b.maximum | Obtains the turning-point height $9$ |
| 0ab945 | approved | R1 | b.maximum | 9 is a question constant and the value of b.maximum | States that $9$ is a maximum, using the negative coefficient of the squared term |
| 0ab945 | approved | AK3 | c.i | 5 matches c.i and a.i | Locates the other time as $5$ seconds from the graph or by calculation |
| 0ab945 | approved | R3 | c.ii | 3 matches c.ii and b.axis | Justifies the answer using symmetry about $t=3$ |
| d0dc6a | approved | AK4 | c.i | 0.050 is a question constant and the value of c.i | Divides $16.8$ by "their" slab area, CAO $0.050\text{ m}$ |
| d0dc72 | approved | CK1 | a.width | 10 is a question constant and the value of a.width | States class width $10$ kg. |
| d0dc72 | approved | AK2 | b.i | 34.5 matches b.i and a.midpoint | Divides $1207.5$ by $35$ to obtain $34.5$ kg. |
| d0dc8f | approved | CK1 | a.i | 1 is a question constant and the value of a.i | CAO 1 line of symmetry |
| d0dc8f | approved | CK2 | a.ii | 1 is a question constant and the value of a.ii | CAO rotational symmetry of order 1 |
| d0dca9 | retired | R1 | a.i | 10 is a question constant and the value of a.i | CAO $t = 10$ |
| d0dca9 | retired | R2 | c.i | 8 is a question constant and the value of c.i | CAO 8 subsets |
| d0dcb1 | approved | AK2 | b.i | -6 is a question constant and the value of b.i | CAO $-6$ dollars |
| d0dcb1 | approved | CK3 | d.i | -6 is a question constant and the value of b.i | Recognises from "their" $3(n-6)$ that each additional tray increases net change by $3$ dollars |
| d0dcb1 | approved | R2 | d.i | -6 is a question constant and the value of b.i | Forms an inequality using "their" net change for four trays, for example $-6+3k\ge0$ |
| d0dccb | approved | AK1 | a.i | 3 is a question constant and the value of a.i | Counts the frequencies for 2 and 3 baskets correctly |
| d0dccb | approved | AK5 | b.median | 4 matches b.median and a.iv | Locates both middle values from "their" frequency table, CAO $4$ |
| d0dccb | approved | CK3 | b.mode | 4 matches b.mode and a.iv | Identifies the value with the greatest frequency, CAO $4$ |
| d0dccb | approved | R2 | c.days | 7 matches c.days and a.iii | States that "their" modal value occurred on 7 of the 20 days |
| d0dd05 | approved | AK1 | a.i | -3 is a question constant and the value of a.i | Calculates gradient $= -3$. |
| d0dd05 | approved | AK3 | b.i | -3 is a question constant and the value of a.i | CAO $y = -3x + 36$. |
| d0dd05 | approved | AK5 | c.i | 15 is a question constant and the value of c.i | CAO $15$ m, or correct follow-through from "their" equation. |
| d0dd05 | approved | CK3 | d.number | 15 is a question constant and the value of c.i | Recognises that retaining exactly $15$ m satisfies the condition "at least 15 m". |
| d0dd05 | approved | R2 | d.number | 7 is a question constant and the value of d.number | Uses "their" result from part (c) to identify 7 costumes as meeting the requirement. |
| d0dd05 | approved | R4 | d.reason | 7 is a question constant and the value of d.number | Concludes that 7 is the greatest possible whole number of costumes, with a valid comparison to the 15 m requirement. |
| d0dd12 | approved | CK2 | b.i | 3 is a question constant and the value of b.i | Identifies the axis from the vertex form, CAO $x=3$ |
| d0dd12 | approved | CK3 | b.ii | 12 is a question constant and the value of b.ii | Identifies the vertex value, CAO $12$ |
| d0dd12 | approved | AK5 | d.i | 2 is a question constant and the value of d.i | Calculates the gradient of the tangent as $2$ |
| d0dd86 | retired | CK1 | a.i | 2 is a question constant and the value of a.i | Recognises that $fg(2)=f(g(2))$. |
| d0dd86 | retired | AK1 | a.i | 2 is a question constant and the value of a.i | Evaluates $g(2)=10$. |
| d0dd86 | retired | AK2 | a.i | 2 is a question constant and the value of a.i | Evaluates $f(10)=2$ CAO. |
| d0dd86 | retired | AK4 | c.i | 2 is a question constant and the value of a.i | Obtains the intersection $(2,10)$, following through from “their” trial display where appropriate. |
| d0dd86 | retired | CK3 | d.i | 2 is a question constant and the value of a.i | Selects the handling condition $2x+y\leq16$ for testing the displays. |
| d0dd86 | retired | R3 | d.i | 2 is a question constant and the value of a.i | Tests “their” second display and obtains $2(5)+7=17>16$, or equivalent follow-through. |
| d0dd86 | retired | R4 | d.i | 2 is a question constant and the value of a.i | Concludes that only $(2,10)$ can be stocked, with a valid reason. |
| d0dd9b | approved | CK1 | a.x | 2 is a question constant and the value of a.x | Equates corresponding upper entries and obtains $x=2$ |
| d0dd9b | approved | AK1 | a.y | 2 is a question constant and the value of a.y | Solves $2y-1=3$, CAO $y=2$ |
| d0dd9b | approved | AK3 | b.i | 2 matches a.x and a.y | Adds corresponding components, CAO $\begin{pmatrix}9\\2\end{pmatrix}$ |
| d0dd9b | approved | AK4 | c.i | 2 matches a.x and a.y | Determines $\overrightarrow{QR}=\begin{pmatrix}2\\5\end{pmatrix}$ from "their" vectors |
| d0ddb8 | approved | R3 | c.iv | 1 is a question constant and the value of c.iv | Concludes that no non-trivial rotation maps the cloth onto itself, giving order $1$ |
| 797b9e | approved | AK5 | b.median | 6 is a question constant and the value of b.median | Uses "their" frequency table to identify the fifth and sixth values, CAO median $6$ |
| 797b9e | approved | CK3 | b.mode | 6 is a question constant and the value of b.mode | Identifies the modal value, not its frequency, CAO $6$ |
| 797bb6 | approved | R2 | c.ii | 1 is a question constant and the value of c.ii | Selects $x=1$ using the allowable interval |
| 797bbe | approved | AK1 | a.i | 6 is a question constant and the value of a.i | CAO 6 |
| 797bbe | approved | AK5 | d.i | 6 is a question constant and the value of a.i | Converts "their" number of flashes to $8.5 \times 10^6$ |
| 797bda | approved | CK1 | a.axis | 4 is a question constant and the value of a.axis | Identifies the vertical axis of symmetry, CAO $x=4$ |
| 797bda | approved | CK2 | a.minimum | -9 is a question constant and the value of a.minimum | Identifies the minimum value, CAO $-9$ |
| 797bda | approved | AK1 | b.root | 4 is a question constant and the value of a.axis | Uses symmetry about $x=4$ to obtain the other root, CAO $1$ |
| 797bda | approved | R1 | b.underfilled_interval | 1 is a question constant and the value of b.root | States the strict interval between the roots, CAO $1<x<7$ |
| 797bda | approved | R3 | c.number_of_roots | 2 is a question constant and the value of c.number_of_roots | Concludes that $fg(x)=0$ has two roots, CAO $2$ |
| 797bda | approved | AK5 | d.original_setting | 6 is a question constant and the value of d.original_setting | Evaluates $g(5)$, CAO $6$ |
| 797bda | approved | R4 | d.gradient | 6 is a question constant and the value of d.original_setting | Reads the gradient of the tangent at $x=6$, CAO $4$ |
| 797bfc | approved | AK2 | b.magnitude | 10 is a question constant and the value of b.magnitude | Finds $\|\vec{AB}\|=\sqrt{6^2+8^2}=10$ m |
| 797bfc | approved | R2 | c.i | 10 is a question constant and the value of b.magnitude | Uses the scale factor $15/(\text{their }10)$ to obtain a displacement in the same direction as $\vec{AB}$ |
| 797c2a | retired | AK4 | c.i | 1 is a question constant and the value of c.i | Locates the points $(1,9)$ and $(7,9)$ on the graph. |
| 797c2a | retired | R1 | c.i | 1 is a question constant and the value of c.i | Selects $x=1$ because $(1,9)$ is in the allowable region while $(7,9)$ is outside it. |
| 797c2a | retired | R3 | d.i | 6 is a question constant and the value of d.i | Restricts $x$ to a whole number and gives $6$. |
| 797c2a | retired | R4 | d.ii | 6 is a question constant and the value of d.i | Subtracts 'their' value in part (c) from $6$ to obtain $5$. |
| 797c5f | approved | AK2 | b.i | 3 is a question constant and the value of b.i | CAO $m=3$. |
| 797c5f | approved | AK3 | b.ii | 3 is a question constant and the value of b.i | Forms $y=3x-18$ using the gradient and their $y$-intercept. |
| 797c5f | approved | AK4 | c.i | 3 is a question constant and the value of b.i | Solves $0=3x-18$ to obtain $x=6$. |
| 797c5f | approved | CK4 | d.i | 3 is a question constant and the value of b.i | Forms the order size as "their" break-even number plus 3. |
| 797c83 | approved | AK1 | a.ii | 1 is a question constant and the value of a.ii | Records frequencies $1$ and $5$ for $3$ and $4$ passengers respectively |
| 797c83 | approved | AK2 | a.iv | 4 is a question constant and the value of a.iv | Records frequencies $4$, $3$ and $2$ for $5$, $6$ and $7$ passengers respectively |
| 797c83 | approved | AK4 | b.i | 5 matches b.i and a.iii | Divides "their" total by $15$, CAO $5$ |
| 797c83 | approved | AK5 | c.i | 5 matches c.i and a.iii | Determines the eighth value from "their" frequency table, CAO $5$ |
| 797c83 | approved | CK3 | c.ii | 4 matches c.ii and a.iv | Identifies the modal value, not the modal frequency, CAO $4$ |
| 797c83 | approved | R3 | d.i | 5 matches b.i and a.iii and c.i | Uses "their" mean and median to support that $5$ can describe a typical trip |
| 797c83 | approved | R4 | d.i | 4 matches a.iv and c.ii | Uses "their" mode to show that $4$, not $5$, is the most common number |
| 797cb2 | approved | CK1 | a.i | 1 is a question constant and the value of a.i | States 1 line of symmetry, CAO |
| 797cb2 | approved | CK2 | a.ii | 1 is a question constant and the value of a.ii | States rotational symmetry of order 1, CAO |
| 797cc2 | approved | AK3 | b.i | 37.5 is a question constant and the value of b.i | CAO $37.5\%$. |
| 797cca | approved | AK1 | a.i | 9 is a question constant and the value of a.i | Evaluates $f(2)$, CAO $9$ |
| 797cca | approved | AK2 | b.ii | 5 is a question constant and the value of b.i | Solves $f(g(p))=5$ to obtain the corresponding horizontal coordinates $0$ and $4$ |
| 797cca | approved | AK4 | c.i | 2 is a question constant and the value of c.i | States the axis of symmetry as $x=2$ |
| 797cca | approved | AK5 | c.ii | 9 matches c.ii and a.i | Obtains the maximum height, CAO $9$ |
| 797cca | approved | CK4 | d.ii | 2 matches d.ii and c.i | States that $f(x)=0$ has 2 roots |
| 797ce7 | approved | R3 | d.i | 4 is a question constant and the value of d.i | Solves "their" non-negative balance condition to obtain $x\geq4$ |
| 797ce7 | approved | R4 | d.i | 4 is a question constant and the value of d.i | Selects $4$ as the least whole number of supporters |
| a9f4c8 | approved | CK1 | a.x | 4 is a question constant and the value of a.x | Equates corresponding entries to obtain $x=4$ |
| a9f4c8 | approved | AK1 | a.y | 3 is a question constant and the value of a.y | Obtains $y=3$ from corresponding entries |
| a9f4c8 | approved | AK3 | b.ii | 10 is a question constant and the value of b.ii | Calculates $\|\vec{AB}\|=10$ |
| a9f4c8 | approved | R3 | d.ii | 3 is a question constant and the value of a.y | Expresses "their" distance correct to 3 significant figures |
| a9f4e0 | approved | CK2 | a.ii | 1 is a question constant and the value of a.ii | CAO rotational symmetry of order $1$ |
| a9f4e8 | approved | AK1 | a.i | 2 is a question constant and the value of a.i | CAO gradient $2$. |
| a9f4e8 | approved | R1 | b.i | 2 is a question constant and the value of a.i | Expresses the equation in the required form, CAO $y=2x-6$. |
| a9f4e8 | approved | AK4 | d.ii | 2 matches a.i and d.i | Uses the new intercept to form and solve $0=2m-6$. |
| a9f4fd | approved | AK1 | a.i | 20 is a question constant and the value of a.i | Adds the frequencies, CAO 20 |
| a9f4fd | approved | AK2 | b.i | 20 is a question constant and the value of a.i | Records all frequencies correctly and includes total 20 |
| a9f4fd | approved | AK5 | c.median | 2 is a question constant and the value of c.median | Locates the 10th and 11th values, CAO median 2 |
| a9f4fd | approved | CK3 | c.mode | 2 is a question constant and the value of c.mode | Identifies the modal value, CAO 2 |
| a9f4fd | approved | R2 | d.i | 20 is a question constant and the value of a.i | Determines that 12 of "their" 20 crates have no more than 2 bruised mangoes |
| a9f515 | approved | AK3 | c.i | 8 is a question constant and the value of c.i | Obtains axis value $8$ from "their" completed-square expression |
| a9f515 | approved | R1 | c.i | 8 is a question constant and the value of c.i | States the axis as the equation $x=8$, CAO |
| a9f515 | approved | AK4 | c.ii | 9 is a question constant and the value of c.ii | Obtains maximum value $9$ from "their" completed-square expression |
| a9f515 | approved | AK5 | d.ii | 5 is a question constant and the value of d.ii | Solves "their" equation to obtain the root $x=5$ |
| a9f515 | approved | R4 | d.iv | 6 is a question constant and the value of d.iv | Finds the positive interval length from "their" roots, $11-5=6$ weeks |
| a9f55e | retired | R2 | c.i | 2 is a question constant and the value of c.i | Selects 2 as the greatest whole number not exceeding the limiting value. |
| a9f55e | retired | R3 | c.ii | 16 matches c.ii and a.i | Uses "their" greatest whole number of long trips with $y=gf(x)$ to obtain 16 short trips. |
| a9f592 | approved | R1 | b.i | 4 is a question constant and the value of b.i | Infers the missing morning value, CAO $x=4$ |
| a9f592 | approved | AK4 | c.i | 4 is a question constant and the value of b.i | Tallies frequencies for 3 and 4 patients correctly |
| a9f592 | approved | AK5 | d.i | 3 is a question constant and the value of d.i | Uses "their" frequency table to locate the 6th and 7th values, giving median $3$ |
| a9f592 | approved | R2 | d.ii | 3 is a question constant and the value of d.ii | Uses "their" frequency table to identify the modal value as $3$ |
| c75c59 | approved | AK3 | c.i | 0 is a question constant and the value of c.i | Evaluates $f$ at "their" value of $g(1)$, CAO $0$ |
| c75c59 | approved | AK4 | d.value | 2 is a question constant and the value of d.value | Uses "their" value of $fg(1)$ and determines the median, CAO $2$ |
| c75c61 | approved | AK3 | c.i | 1 is a question constant and the value of c.i | Evaluates $f(3)$, using "their" ordinate at $x=3$, to obtain 1 |
| c75c69 | approved | AK4 | c.i | -1 is a question constant and the value of c.i | Evaluates $f(g(\text{their }r))$ using their smaller root, CAO $-1$ |
| b1a547 | approved | CK2 | c.i | 1 is a question constant and the value of c.i | States the axis as the vertical-line equation $x = 1$ |
| b1a54f | approved | R1 | c.i | 2 is a question constant and the value of c.i | Finds the midpoint of “their” roots to obtain $x=2$. |
| b1a54f | approved | R2 | c.i | 2 is a question constant and the value of c.i | States the axis as the vertical-line equation $x=2$. |
| b1a54f | approved | AK4 | d.i | 2 is a question constant and the value of c.i | CAO $(2,-1)$. |
| b1a55c | retired | R1 | c.i | 2 is a question constant and the value of c.i | States the axis midway between 'their' roots as $x = 2$. |
| b1a56c | retired | R3 | c.ii | 2 is a question constant and the value of c.ii | States the axis as the equation $x=2$ |
| b1a574 | approved | AK3 | c.i | 3 is a question constant and the value of c.i | Gives $3\text{ s}$ CAO. |
| b1a574 | approved | AK4 | d.i | 3 is a question constant and the value of c.i | Evaluates $f(3)=-3^2+6(3)=9$, or reads $9\text{ m}$ correctly, CAO. |
| b1a57c | approved | AK3 | c.i | 3 is a question constant and the value of c.i | Finds the midpoint of 'their' roots and states the axis as $x=3$ |
| b1a57c | approved | R3 | d.i | 3 is a question constant and the value of c.i | Reads the corresponding minimum value and states $(3,-4)$ |
| b1a584 | approved | CK2 | b.i | 6 is a question constant and the value of b.i | CAO \$6 |
| b1a594 | approved | AK3 | c.i | 4 is a question constant and the value of c.i | Obtains $4\text{ s}$, or the correct duration from 'their' times |
| b1a5ae | approved | CK1 | b.i | 2 is a question constant and the value of b.i | Reads $x=2$ from "their" intersection, CAO \$2 |
| b1a5ae | approved | CK3 | c.i | 2 is a question constant and the value of b.i | Recognises that $\begin{bmatrix}4&2\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}$ represents $4x+2y$ |
| b1a5ae | approved | AK3 | c.i | 2 is a question constant and the value of b.i | Substitutes "their" values of $x$ and $y$ to obtain $4(2)+2(5)$ |
| b1a5d9 | approved | AK4 | d.factor | 2 is a question constant and the value of d.factor | Gives scale factor $2$, or follows through using 'their' multiplier |
| b1a5ee | approved | CK2 | b.i | 8 is a question constant and the value of b.i | Forms $x+y=8$ from the total number of pieces |
| b1a5ee | approved | R1 | b.ii | 72 is a question constant and the value of b.ii | Forms $12x+6y=72$ using "their" length of $QR$ |
| b1a603 | approved | CK1 | a.i | 7 is a question constant and the value of a.i | Identifies the lower quartile, CAO $7$ |
| b1a603 | approved | CK2 | a.ii | 13 is a question constant and the value of a.ii | Identifies the upper quartile, CAO $13$ |
| b1a603 | approved | R1 | b.i | 6 is a question constant and the value of b.i | Establishes the stated interquartile range of $6$ |
| b1a603 | approved | AK2 | c.i | 6 is a question constant and the value of b.i | Calculates $6 \div 2$, CAO $3$ |
| b1a60b | approved | R1 | c.i | 15 is a question constant and the value of c.i | Establishes that the mangoes-only region contains 15 customers |
| b1a620 | approved | R1 | d.i | 4 is a question constant and the value of d.i | Equates the two arrangements as $x^2=4x$ |
| b1a620 | approved | AK5 | d.i | 4 is a question constant and the value of d.i | Solves $x(x-4)=0$ to obtain $x=0$ or $x=4$ |
| b1a620 | approved | R2 | d.i | 4 is a question constant and the value of d.i | Rejects $x=0$ since valid figure numbers begin at 1, CAO 4 |
| b1a620 | approved | R3 | d.ii | 4 is a question constant and the value of d.i | For $x>4$, establishes that $x^2>4x$ |
| b1a642 | approved | R1 | c.i | 600 is a question constant and the value of c.i | States the excess as \$600 |
| b1a668 | approved | AK3 | b.factor | 2 is a question constant and the value of b.factor | Determines scale factor $2$ from corresponding distances or coordinates. |
| b1a668 | approved | R2 | d.i | 2 is a question constant and the value of b.factor | Uses scale factor $2$ to obtain $OA''=OB''=10$ and $A''B''=12$, following through on their factor. |
| b1a682 | approved | CK1 | a.i | 1 is a question constant and the value of a.i | CAO 1 line of symmetry |
| b1a682 | approved | CK2 | a.ii | 1 is a question constant and the value of a.ii | CAO rotational symmetry of order 1 |
| b1a682 | approved | R3 | d.i | 17 is a question constant and the value of c.i | Compares $17\text{ m}$ with "their" unrounded value of $BC$ |
| b1a692 | approved | R1 | b.i | 68 is a question constant and the value of b.i | Reads the total distance as $68$ m from the completed graph |
| b1a692 | approved | AK5 | c.i | 40 is a question constant and the value of c.i | CAO $40$ m |
| b1a69a | approved | AK3 | b.i | 27 600 is a question constant and the value of b.i | Adds the deposit and instalments to obtain \$27 600 |
| b1a6a2 | approved | AK2 | b.lower_quartile | 23 is a question constant and the value of b.lower_quartile | Finds $Q_1=23$ from "their" ordered data |
| b1a6a2 | approved | AK3 | b.upper_quartile | 27 is a question constant and the value of b.upper_quartile | Finds $Q_3=27$ from "their" ordered data |
| b1a6a2 | approved | AK4 | b.interquartile_range | 4 is a question constant and the value of b.interquartile_range | Subtracts "their" $Q_1$ from "their" $Q_3$, CAO $4$ |
| b1a6a2 | approved | AK5 | c.i | 4 is a question constant and the value of b.interquartile_range | Halves "their" interquartile range: $4\div2=2$ |
| 037c66 | approved | R1 | c.i | 5.4 is a question constant and the value of c.i | Shows that the calculated mass is $5.4$ kg |
| 037c6e | approved | R1 | c.i | 12 is a question constant and the value of c.i | Establishes the stated result of 12 bags |
| 037c80 | approved | AK5 | d.i | 0 is a question constant and the value of d.i | Evaluates $f(5)=0$, CAO |
| c0becb | approved | CK1 | b.i | 6 is a question constant and the value of b.i | Reads $f(3)=6$ from the graph, CAO |
| c0becb | approved | AK4 | c.i | 6 is a question constant and the value of b.i | Evaluates $g(6)=\frac{24}{6}=4$, or correct follow-through on "their" input |
| c0becb | approved | R3 | d.i | 6 is a question constant and the value of b.i | Finds the reduction from "their" 3-worker time to the 6-worker time, giving 2 days |
| c0bed3 | approved | CK1 | a.i | 0.375 is a question constant and the value of a.i | Writes $0.375$ as $\frac{375}{1000}$ |
| c0bed3 | approved | AK1 | a.i | \frac{375}{1000} is a question constant and the value of a.i | Simplifies $\frac{375}{1000}$ to $\frac{3}{8}$ |
| c0bed3 | approved | AK2 | b.i | \frac{3}{8} matches b.i and a.i | Evaluates $\frac{3}{8}\times100\%=37.5\%$ |
| c0bed3 | approved | R3 | d.ii | 30 is a question constant and the value of d.ii | Compares "their" required number of bags with 30 and concludes that the bags are sufficient |
| 037c95 | approved | CK1 | a.i | 0.375 is a question constant and the value of a.i | Writes $0.375$ as $\dfrac{375}{1000}$ |
| 037c95 | approved | AK1 | a.i | \dfrac{375}{1000} is a question constant and the value of a.i | Reduces $\dfrac{375}{1000}$ to an equivalent fraction |
| 037c95 | approved | CK2 | b.i | \dfrac{3}{8} is a question constant and the value of a.i | Selects $\dfrac{3}{8}$ of 200 to represent the morning sales |
| 037c95 | approved | AK2 | b.i | \dfrac{3}{8} is a question constant and the value of a.i | Calculates $\dfrac{3}{8}\times 200=75$ |
| 037c95 | approved | AK4 | d.i | 37.5 matches d.i and a.i | Calculates $\dfrac{\text{their remaining mangoes}}{200}\times100$ to obtain $37.5\%$ |
| c0bedb | approved | AK4 | c.i | 29 is a question constant and the value of c.i | Simplifies to show that the result is 29 |
| 037c9d | approved | R1 | b.i | 18 is a question constant and the value of b.i | Shows that the Round 2 code is $18$ |
| 037c9d | approved | R2 | c.i | 18 is a question constant and the value of b.i | Forms $2(18)+n=40$, or equivalent using "their" Round 2 code |
| 037c9d | approved | R3 | c.i | 4 is a question constant and the value of c.i | CAO $n=4$ |
| c0beeb | approved | R2 | c.i | 6 is a question constant and the value of c.i | Selects the only "their" factor fewer than 10, giving 6 |
| c0bf03 | approved | AK3 | b.i | 1 is a question constant and the value of b.i | Calculates rise $4$ over run $4$, giving CAO $1$ |
| c0bf13 | approved | CK1 | a.i | 1 is a question constant and the value of a.i | States determinant as $3(1)-1(2)$ |
| c0bf13 | approved | AK1 | a.i | 1 is a question constant and the value of a.i | CAO $1$ |
| c0bf13 | approved | CK2 | b.i | 1 is a question constant and the value of a.i | Forms the adjoint $\begin{pmatrix}1 & -1 \\ -2 & 3\end{pmatrix}$ |
| c0bf13 | approved | CK3 | b.i | 1 is a question constant and the value of a.i | Uses $A^{-1}=\dfrac{1}{\det(A)}\operatorname{adj}(A)$ |
| 037cc4 | approved | CK3 | d.i | 3 is a question constant and the value of d.i | States the value of the underlined units digit as $3$ |
| 037cc4 | approved | R3 | d.ii | 3 is a question constant and the value of d.i | Interprets $1\underline{3}_4$ as $4+3$ |
| 037ccc | approved | R2 | b.i | 2 is a question constant and the value of b.i | Reads the gradient of the line as $2$ |
| 037ccc | approved | CK1 | b.ii | 5 is a question constant and the value of b.ii | Identifies the ordinate where the line crosses the $y$-axis, CAO $5$ |
| 037ccc | approved | AK4 | d.i | 2 is a question constant and the value of b.i | Substitutes "their" function $f(x)$ into $g$ and simplifies, CAO $2x + 7$ |
| c0bf32 | approved | AK4 | c.i | 20 is a question constant and the value of c.i | CAO $20\%$ |
| 037ce6 | approved | AK2 | b.i | 1155 is a question constant and the value of b.i | Multiplies "their" area by 15 to obtain 1155 |
| 037ce6 | approved | R1 | c.i | 1155 is a question constant and the value of b.i | Forms $0.70P = 1155$, using "their" current quotation |
| 037cfb | approved | CK2 | a.modal_frequency | 14 is a question constant and the value of a.modal_frequency | CAO modal frequency $14$ |
| 037cfb | approved | AK1 | b.i | 40 is a question constant and the value of b.i | Adds the frequencies to obtain $40$ |
| 037cfb | approved | AK2 | c.i | 40 is a question constant and the value of b.i | Forms cumulative frequencies $4$, $12$, $26$, $35$, $40$ |
| 037cfb | approved | R2 | d.i | 14 is a question constant and the value of a.modal_frequency | Selects $400$, $12$, $14$ and $100$ from "their" median interval and the histogram |
| 037cfb | approved | AK3 | d.i | 14 is a question constant and the value of a.modal_frequency | Substitutes correctly in $400+\frac{20-12}{14}\times100$ |
| 037d13 | approved | R2 | c.i | 4 is a question constant and the value of c.i | Forms $n+4=8$ using "their" simplified expression |
| 037d13 | approved | R3 | c.i | 4 is a question constant and the value of c.i | Solves to obtain figure number $4$ |
| c0bf59 | approved | CK2 | b.i | 17 is a question constant and the value of b.i | CAO 17 bead positions. |
| c0bf59 | approved | CK3 | b.ii | 17 is a question constant and the value of b.i | Recognises $17x+17$ as $17(x+1)$. |
| c0bf59 | approved | AK2 | b.ii | 17 is a question constant and the value of b.i | Cancels the common factor 17. |
| c0bf59 | approved | R3 | c.i | 4 is a question constant and the value of c.i | CAO $x=4$, consistent with Figure 4. |
| 037d20 | approved | R2 | b.i | 2 is a question constant and the value of b.i | Reads $x = 2$ from the intersection, CAO |
| 037d20 | approved | AK2 | c.i | 2 is a question constant and the value of b.i | Forms $5 \times (\text{their } x)^2$ |
| 037d20 | approved | AK3 | c.i | 2 is a question constant and the value of b.i | CAO $20$ m$^2$ |
| c0bf69 | approved | R1 | b.i | 441 is a question constant and the value of b.i | Deducts "their" service charge from "their" local-dollar amount to establish \$441 |
| c0bf69 | approved | AK3 | c.i | 441 is a question constant and the value of b.i | Finds the remaining local dollars as "their" \$441 less \$375 |
| 037d32 | retired | CK1 | a.i | 19 is a question constant and the value of a.i | Translates the mangoes row as $2x+3y=19$ |
| 037d32 | retired | CK2 | a.ii | 12 is a question constant and the value of a.ii | Translates the breadfruit row as $x+2y=12$ |
| 037d3a | approved | AK1 | a.i | 12 is a question constant and the value of a.i | Finds the median mass, CAO $12\text{ kg}$ |
| 037d3a | approved | AK3 | b.upper_quartile | 14 is a question constant and the value of b.upper_quartile | Finds the upper quartile, CAO $14\text{ kg}$ |
| 037d3a | approved | AK4 | b.interquartile_range | 3 is a question constant and the value of b.interquartile_range | Subtracts the lower quartile from the upper quartile, CAO $3\text{ kg}$ |
| 037d3a | approved | CK3 | c.i | 12 is a question constant and the value of a.i | Identifies a total of 12 deliveries |
| 037d47 | approved | AK1 | a.i | 80 is a question constant and the value of a.i | Adds the frequencies to obtain $80$. |
| 037d47 | approved | AK3 | b.i | 80 is a question constant and the value of a.i | Calculates $\frac{50}{\text{their }80}\times100=62.5\%$. |
| 037d47 | approved | R1 | c.i | 80 is a question constant and the value of a.i | Uses the complement of the small breadfruit, using $100\%-\text{their }62.5\%$ or $\text{their }80-\text{their }50$. |
| 037d47 | approved | R3 | d.decision | 80 is a question constant and the value of a.i | Compares their percentage with $80\%$ and concludes that the delivery qualifies. |
| c0bf92 | approved | AK3 | b.i | 72 is a question constant and the value of b.i | Calculates $\frac{36}{\text{their }50}\times100$ to show 72%. |
| 037d71 | approved | R3 | d.i | 5 is a question constant and the value of d.i | Interprets the inverse output as the calibration setting, CAO $5$ |
| c0bfba | approved | R3 | d.i | 5 is a question constant and the value of d.i | Interprets "their" inverse output as the mass of the fish, CAO $5\text{ kg}$ |
| c0bfc2 | approved | R3 | c.i | 2 is a question constant and the value of c.i | Uses the midpoint of "their" roots and states the axis as $x=2$ |
| c0bfc2 | approved | AK2 | d.ii | 2 is a question constant and the value of c.i | Evaluates $g(1)=2$ |
| c0bfc2 | approved | AK3 | d.ii | 2 is a question constant and the value of c.i | Uses the ordinate of "their" minimum point to obtain $f(2)=-1$ |
| c0bfd4 | approved | AK2 | b.i | 30 is a question constant and the value of b.i | CAO 30 rolls |
| c0bfd4 | approved | R1 | d.i | 30 is a question constant and the value of b.i | Relates each of "their" shop deliveries to crates of 30 rolls |
| c0bfe1 | approved | R1 | c.i | 0 is a question constant and the value of c.i | Uses $fg(0)=f[g(0)]$ |
| c0bfe1 | approved | AK3 | c.i | 0 is a question constant and the value of c.i | Evaluates $g(0)=1$ |
| c0bfe1 | approved | AK4 | c.i | 0 is a question constant and the value of c.i | Evaluates $f(1)$, CAO $0$ |
| c0bfe1 | approved | R2 | d.i | 0 is a question constant and the value of c.i | Uses $(g(0),fg(0))=(1,0)$ and "their" $y$-intercept as points on the line |
| 037d9d | approved | R2 | b.ii | -5 is a question constant and the value of b.ii | Reads the $y$-coordinate of the intercept, CAO $-5$ |
| 037d9d | approved | AK4 | c.i | 1 is a question constant and the value of c.i | Calculates the gradient using the intercepts, CAO $1$ |
| c0bff1 | approved | R3 | c.i | 14 is a question constant and the value of c.i | Interprets the quotient as the length of one piece of edging, giving $14$ m |
| c0bff9 | approved | AK3 | b.i | 4 is a question constant and the value of b.i | CAO $16^{1/2}=4$ |
| c0bff9 | approved | CK3 | c.i | 4 is a question constant and the value of b.i | Recognises that the dots form a cube with 4 dots along each edge |
| c0bff9 | approved | AK4 | c.i | 4 is a question constant and the value of b.i | CAO $(\text{their }4)^3=64$ |
| c0bff9 | approved | R1 | d.i | 4 is a question constant and the value of b.i | Uses "their" Figure 4 cube total to establish that it is less than 100 |
| c0bff9 | approved | R2 | d.i | 4 is a question constant and the value of b.i | Selects the next whole number of dots along an edge and tests $(\text{their }4+1)^3$ |
| c0c019 | approved | CK3 | c.i | 13 is a question constant and the value of c.i | Recognises that equal sharing among 13 jugs requires division by 13. |
| c0c019 | approved | R3 | c.i | 13 is a question constant and the value of c.i | Forms "their" remaining number of cups $\div 13$. |
| c0c019 | approved | AK3 | c.i | 13 is a question constant and the value of c.i | Divides "their" remaining number of cups by 13 correctly. |
| 037dcf | approved | R2 | b.i | 30 is a question constant and the value of b.i | Uses the tangent value to establish $\angle DAB=30^\circ$, following through from "their" height |
| c0c035 | approved | AK5 | c.ii | 2 is a question constant and the value of c.ii | Substitutes $n=6$ into "their" inverse relationship, CAO $2$ |
| 037de4 | approved | R3 | d.i | 2 is a question constant and the value of d.i | Applies $T=60/D$ to Figure 5, where $D=30$, to obtain 2 minutes |
| 037df1 | approved | AK1 | a.i | 60 is a question constant and the value of a.i | Solves the equation to obtain $x=60$ |
| 037df1 | approved | AK3 | b.i | 60 is a question constant and the value of a.i | Evaluates to show that 60 students selected Mango juice |
| 037df9 | approved | CK2 | b.i | 4 is a question constant and the value of b.i | Recognises that $4^{-1} = \frac{1}{4}$ |
| 037df9 | approved | AK2 | b.i | 4 is a question constant and the value of b.i | Combines the indices to obtain $4^{2-1}$ |
| 037df9 | approved | AK3 | b.i | 4 is a question constant and the value of b.i | CAO $4$ |
| 037df9 | approved | R2 | c.i | 4 is a question constant and the value of b.i | States the total as a single power, CAO $4^4$; follow-through from "their" answer to (b) |
| c0c05d | approved | AK1 | a.i | \frac{37.5}{100} is a question constant and the value of a.i | Reduces $\frac{37.5}{100}$ to $\frac{3}{8}$ |
| 037e09 | approved | AK1 | a.i | \frac{3}{8} is a question constant and the value of a.i | Converts $\frac{3}{8}$ to $0.375$ |
| 037e09 | approved | AK2 | a.ii | 37.5 matches a.ii and a.i | CAO $37.5\%$ |
| 037e09 | approved | AK3 | b.i | 37.5 matches a.ii and a.i | Finds $37.5\%$ of 96, or equivalent process using "their" percentage |
| c0c065 | approved | R2 | d.i | 6 is a question constant and the value of d.i | Reads the intersection abscissae as $-1$ and $6$ |
| c0c065 | approved | R3 | d.i | 6 is a question constant and the value of d.i | Selects $6$ using the stated domain for the number of crates |
| 037e33 | retired | AK5 | c.index | 13 is a question constant and the value of c.index | Obtains $g(6)=13$. |
| 037e33 | retired | R3 | c.comparison | 13 is a question constant and the value of c.index | Justifies the decision by comparing 'their' index with the minimum index of 13. |
| 037e50 | approved | R1 | b.i | 2 is a question constant and the value of b.i | Uses "their" revenue value to identify the lower intersection, $x=2$ |
| c0c09b | approved | AK1 | c.i | 3 is a question constant and the value of c.i | Finds $f(4)=2(4)+3=11$. |
| c0c0ad | approved | AK1 | a.i | 30 is a question constant and the value of a.i | CAO $30^\circ$ |
| c0c0ad | approved | CK2 | b.i | 30 is a question constant and the value of a.i | Recognises from the $30^\circ$-$60^\circ$-$90^\circ$ triangle that $RS=\sqrt{3}QR$ |
| c0c0ad | approved | R1 | b.i | 30 is a question constant and the value of a.i | Forms $\tan30^\circ=RS/(20+QR)$ |
| c0c0ad | approved | AK2 | b.i | 30 is a question constant and the value of a.i | Substitutes $RS=\sqrt{3}QR$ and evaluates $\tan30^\circ$ correctly |
| c0c0ad | approved | AK3 | c.i | 30 is a question constant and the value of a.i | Uses $\sin30^\circ=\dfrac{\text{their }RS}{PS}$ |
| c0c0fa | approved | AK1 | a.i | 18 is a question constant and the value of a.i | Evaluates $QR=18\div\tan45^\circ$, CAO $18\text{ m}$ |
| c0c0fa | approved | AK3 | b.i | 18 is a question constant and the value of a.i | Calculates $\tan \angle TPR=18\div$ "their" $PR$, giving $\dfrac{3}{5}$ |
| c0c0fa | approved | R1 | c.i | 18 is a question constant and the value of a.i | Uses the values at $Q$ to determine $k$ and forms $y=\dfrac{18}{x}$ |
| c0c0fa | approved | AK4 | d.i | 45 is a question constant and the value of d.i | Substitutes $y=0.4$ into "their" inverse-variation equation, CAO $45\text{ m}$ |
| 9cc663 | approved | CK2 | a.factor | 2 is a question constant and the value of a.factor | CAO scale factor $2$. |
| 9cc663 | approved | AK1 | b.centre | 2 is a question constant and the value of a.factor | Enlarges $P(2,3)$ about the origin to obtain $(4,6)$. |
| 9cc663 | approved | AK3 | b.radius | 2 is a question constant and the value of a.factor | Multiplies the original radius by scale factor $2$ to obtain $6$ units. |
| 9cc663 | approved | AK4 | c.i | 6 is a question constant and the value of b.radius | Calculates sector area $\frac{120}{360}\pi(6)^2=12\pi$, follow-through using “their” radius. |
| 9cc663 | approved | AK5 | c.i | 6 is a question constant and the value of b.radius | Calculates triangle area $\frac12(6)^2\sin120°=9\sqrt3$, follow-through using “their” radius. |
| 9cc67d | approved | AK1 | a.i | 4 is a question constant and the value of a.i | CAO $4$. |
| 9cc67d | approved | AK2 | b.i | 4 is a question constant and the value of a.i | CAO $C = 4x + 6$. |
| 9cc695 | approved | AK3 | b.i | 37 is a question constant and the value of b.i | CAO $n(A \cup B)=37$. |
| 9cc6b9 | approved | AK2 | b.i | 1600 is a question constant and the value of b.i | Substitutes $PT=10$ and "their" $y=\frac{3x}{4}$, obtaining $25x^2=1600$ |
| 9cc6d1 | approved | CK2 | b.i | 10 is a question constant and the value of b.i | CAO $c = 10$ |
| 9cc6d1 | approved | CK3 | c.i | 10 is a question constant and the value of b.i | Forms $(\text{their }22 - \text{their }10) \div 4$ |
| 9cc6d1 | approved | R2 | d.i | 10 is a question constant and the value of b.i | Forms $\text{their }10 + \text{their }3d = 31$ |
| 9cc6de | approved | AK2 | b.i | 7 is a question constant and the value of b.i | Subtracts correctly, CAO $7$ |
| 9cc6e6 | approved | CK3 | b.ii | 0 is a question constant and the value of b.ii | CAO $0$ |
| 5cb2de | approved | AK4 | b.i | 38.5 is a question constant and the value of b.i | CAO $38.5\text{ m}^2$. |
| 5cb2de | approved | AK5 | c.i | 38.5 is a question constant and the value of b.i | Calculates $38.5\div20=1.925$. |
| 5cb2f3 | approved | AK4 | b.i | 404 is a question constant and the value of b.i | Adds "their" arc length and $140\text{ cm}$ to obtain $404\text{ cm}$ |
| 5cb2fb | approved | R2 | b.i | 4 is a question constant and the value of b.i | CAO $4$ cm |
| c29c18 | approved | AK1 | a.i | 10 is a question constant and the value of a.i | Adds the frequencies, CAO $10$ |
| c29c18 | approved | CK1 | b.i | 10 is a question constant and the value of a.i | Identifies the 5th and 6th positions as the median positions for "their" total of 10 values |
| c29c18 | approved | CK2 | c.i | 10 is a question constant and the value of a.i | Identifies $Q_1=10$ and $Q_3=14$ |
| c29c18 | approved | R3 | d.i | 2 is a question constant and the value of d.i | Halves "their" interquartile range, CAO $2$ |
| 48641b | approved | AK1 | a.i | 14 is a question constant and the value of a.i | Evaluates $0.35 \times 40 = 14$ |
| 48641b | approved | AK3 | c.i | 14 is a question constant and the value of a.i | Finds $5 +$ "their" $x + 14 = 28$ |
| 266546 | approved | AK3 | b.i | 50 is a question constant and the value of b.i | Multiplies by $100$ to show $50\%$. |
| 266546 | approved | AK4 | d.new_standard_deviation | 0.50 is a question constant and the value of b.i | Calculates the reduced standard deviation as $1.8-(0.50\times1.8)=0.9$ min. |
| 266557 | approved | AK1 | a.i | 4 is a question constant and the value of a.i | Finds the missing frequency: $18-14=4$ |
| 266557 | approved | AK3 | c.upper_quartile | 16 is a question constant and the value of c.upper_quartile | Uses "their" cumulative frequency to obtain upper quartile $16$ |
| b770b2 | approved | CK4 | d.i | 15 is a question constant and the value of d.i | Recognises that an offer of $85\%$ permits a loss of $15\%$ |
| 45e796 | approved | R2 | b.i | 30 is a question constant and the value of b.i | Reads median time as $30$ minutes from their graph |
| 45e796 | approved | CK3 | c.i | 20 is a question constant and the value of c.i | Identifies cumulative frequency $20$ at "their" median time |
| 45e796 | approved | AK3 | c.i | 20 is a question constant and the value of c.i | Calculates $40 - 20$ using "their" cumulative frequency |
| 45e796 | approved | R3 | c.i | 20 is a question constant and the value of c.i | CAO $20$ students |
| 45e7b5 | approved | CK3 | b.i | 35 is a question constant and the value of b.i | CAO 35 patients. |
| 45e7cd | approved | R1 | b.i | 10 is a question constant and the value of b.i | Reads lower quartile as $10$ items from their graph |
| 45e7cd | approved | R2 | b.ii | 20 is a question constant and the value of b.ii | Reads upper quartile as $20$ items from their graph |
| 45e7cd | approved | AK4 | c.i | 10 matches c.i and b.i | Subtracts 'their' lower quartile from 'their' upper quartile to obtain $10$ items |
| 45e7cd | approved | R3 | d.i | 10 matches b.i and c.i | Uses 'their' quartiles to justify that the middle half lies from $10$ to $20$ items |
| 45e7d7 | approved | R1 | b.i | 23 is a question constant and the value of b.i | Reads median delivery time of $23$ minutes CAO |
| 45e7e1 | approved | AK3 | b.i | 4 is a question constant and the value of b.i | Reads the lower quartile as $4$ minutes. |
| 45e7e1 | approved | AK4 | b.ii | 8 is a question constant and the value of b.ii | Reads the upper quartile as $8$ minutes. |
| 45e7e1 | approved | R2 | b.iii | 4 matches b.iii and b.i | Subtracts "their" lower quartile from "their" upper quartile to obtain $4$ minutes. |
| 45e7eb | approved | R2 | b.i | 30 is a question constant and the value of b.i | Reads $30$ from the graph at \$60 |
| 45e7eb | approved | AK3 | c.i | 30 is a question constant and the value of b.i | Calculates $50 - \text{their }30 = 20$, or equivalent follow-through |
| 45e7eb | approved | AK4 | c.i | 40 is a question constant and the value of c.i | CAO $40\%$ |
| 45e806 | approved | R1 | b.i | 20 is a question constant and the value of b.i | Forms the equation $\dfrac{480 + 24.5x}{20 + x} = 24.25$ |
| 45e806 | approved | AK3 | b.i | 20 is a question constant and the value of b.i | Solves the equation to obtain $x = 20$ |
| 45e806 | approved | R2 | b.i | 20 is a question constant and the value of b.i | Accepts $20$ as a feasible whole-number frequency |
| 45e806 | approved | CK2 | c.modal_class | 20 is a question constant and the value of b.i | CAO modal class $20-29$ |
| 45e806 | approved | CK3 | c.median_class | 20 is a question constant and the value of b.i | CAO median class $20-29$ |
| 45e806 | approved | R3 | d.interquartile_range | 19.5 matches d.lower_quartile and a.lower_class_boundary | Finds the interquartile range from 'their' quartiles: $29.5 - 19.5 = 10$ |
| 45e806 | approved | R4 | d.decision | 10 is a question constant and the value of d.interquartile_range | States that the claim is not supported because 'their' interquartile range is not less than $10$ |
