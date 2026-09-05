# Hint approval log

One table per batch. A row is approved by setting its status in the batch file; `pnpm hints:approve <n>` writes approved hints to the bank.

## Batch 1 — proposed (200 rows, gpt-5.6-terra, 2026-09-05)

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | 6a51ef | CK1 | Recognises that $gf(x)=g(f(x))$ | Interpret $gf(x)$ as $g(f(x))$, so you apply $f$ first and then apply $g$. |
| 2 | 6a51ef | AK1 | Substitutes $2x+4$ into $g$ | Replace the input of $g$ with $2x+4$ before carrying out the calculation. |
| 3 | 6a51ef | AK2 | Simplifies to $1.8x+3.6$ | Expand and simplify the expression after substituting into $g$. |
| 4 | 6a51ef | CK2 | Identifies the intersection as the point where the retained amounts are equal | Find where the two lines cross, because this is where the retained amounts are equal. |
| 5 | 6a51ef | AK3 | Reads the intersection as $x=8$, $y=18$ | Read both coordinates of the crossing point from the graph: the horizontal value and the retained amount. |
| 6 | 6a51ef | R1 | States $(8,18)$ as the solution of the simultaneous equations | State the intersection coordinate as the solution to the simultaneous equations. |
| 7 | 6a51ef | R2 | Uses 10 being greater than "their" intersection value to identify Plan B as higher | Compare 10 with your intersection value; since it is greater, use the graph to identify which plan is higher. |
| 8 | 6a51ef | CK3 | Forms the condition $h(x)\ge20$ for retaining at least \$20 | Write the condition for Plan B retaining at least $20$ as $h(x)\ge20$. |
| 9 | 6a51ef | R3 | Solves $3x-6\ge20$ to obtain $x\ge\frac{26}{3}$ | Solve $3x-6\ge20$ step by step to obtain $x\ge\frac{26}{3}$. |
| 10 | 6a51ef | R4 | Justifies that 8 trays give only \$18, which is less than \$20 | Substitute 8 into Plan B's function and state that the retained amount is less than $20$. |
| 11 | 6a5256 | CK1 | Writes $\overrightarrow{OA}$ as the column vector $\begin{pmatrix}2\\-1\end{pmatrix}$ | Write \overrightarrow{OA} as a column vector \begin{pmatrix}\cdots\\\cdots\end{pmatrix} by using A's coordinates in order. |
| 12 | 6a5256 | CK2 | Writes $\overrightarrow{OB}$ as the column vector $\begin{pmatrix}8\\5\end{pmatrix}$ | Write \overrightarrow{OB} as a column vector \begin{pmatrix}\cdots\\\cdots\end{pmatrix} by using B's coordinates in order. |
| 13 | 6a5256 | AK1 | Subtracts position vectors to obtain $\overrightarrow{AB}=\begin{pmatrix}8-2\\5-(-1)\end{pmatrix}$ | Subtract corresponding components of \overrightarrow{OA} from \overrightarrow{OB} to form \overrightarrow{AB}=\begin{pmatrix}\cdots\\\cdots\end{pmatrix}. |
| 14 | 6a5256 | CK3 | Forms $\overrightarrow{OC}=\overrightarrow{OA}+\dfrac{3}{2}\overrightarrow{AB}$ | Form \overrightarrow{OC}=\overrightarrow{OA}+\dfrac{3}{2}\overrightarrow{AB} before calculating the components. |
| 15 | 6a5256 | AK2 | Finds $\dfrac{3}{2}$ of “their” $\overrightarrow{AB}$ | Find \dfrac{3}{2} of your \overrightarrow{AB} by multiplying each component by \dfrac{3}{2}. |
| 16 | 6a5256 | CK4 | Identifies $\overrightarrow{AD}=\overrightarrow{OD}-\overrightarrow{OA}$ and $\overrightarrow{DC}=\overrightarrow{OC}-\overrightarrow{OD}$ | Identify \overrightarrow{AD}=\overrightarrow{OD}-\overrightarrow{OA} and \overrightarrow{DC}=\overrightarrow{OC}-\overrightarrow{OD}. |
| 17 | 6a5256 | R1 | Obtains $\overrightarrow{AD}=\begin{pmatrix}3\\3\end{pmatrix}$ | Calculate \overrightarrow{AD} and write the result as \begin{pmatrix}\cdots\\\cdots\end{pmatrix}. |
| 18 | 6a5256 | R2 | Obtains $\overrightarrow{DC}=\begin{pmatrix}6\\6\end{pmatrix}$ using “their” $\overrightarrow{OC}$ | Use your \overrightarrow{OC} to calculate \overrightarrow{DC}=\overrightarrow{OC}-\overrightarrow{OD} and write it as \begin{pmatrix}\cdots\\\cdots\end{pmatrix}. |
| 19 | 6a5256 | R3 | Compares corresponding components to derive $AD:DC=1:2$ | Compare corresponding components of overrightarrow{AD} and overrightarrow{DC}, then simplify the scale factor to get the segment ratio. |
| 20 | 6a5256 | CK5 | States that a midpoint divides a line segment in the ratio $1:1$ | State that a midpoint splits a line segment into two equal lengths, so the ratio is frac{1}{1}. |
| 21 | 6a5256 | R4 | Concludes that $D$ is not the midpoint because “their” ratio is not $1:1$ | Compare your earlier ratio with frac{1}{1} and conclude whether D is the midpoint. |
| 22 | 6a525e | CK1 | Recognises that $OA = OB$ as radii of the circle. | Use the fact that $OA$ and $OB$ are radii of the same circle, so they are equal. |
| 23 | 6a525e | AK1 | Finds the remaining two angles: $180° - 110° = 70°$. | Subtract the angle at the centre from a straight angle to find the two base angles together. |
| 24 | 6a525e | AK2 | Divides the remaining angle equally to obtain $35°$. | Divide the remaining total equally between the two base angles of the isosceles triangle. |
| 25 | 6a525e | CK2 | Uses the fact that a tangent is perpendicular to the radius at the point of contact. | Use the fact that the tangent at $A$ meets radius $OA$ at a right angle. |
| 26 | 6a525e | R1 | Calculates $90° -$ "their" angle $OAB$, giving $55°$. | Subtract your angle $OAB$ from a right angle to find the acute angle between the tangent and $AB$. |
| 27 | 6a525e | CK3 | Recognises that the angle between a tangent and a chord equals the angle in the alternate segment. | Use the alternate-segment theorem to equate the angle between the tangent and chord $AB$ with the angle at $C$. |
| 28 | 6a525e | R2 | Uses opposite angles of cyclic quadrilateral $ACBD$ to form $180° -$ "their" angle $ACB$. | Subtract your angle $ACB$ from a straight angle using the opposite angles of cyclic quadrilateral $ACBD$. |
| 29 | 6a525e | R3 | Concludes that angle $ADB = 125°$. | State the angle $ADB$ obtained from the supplementary opposite angles. |
| 30 | 6a525e | CK4 | States that opposite angles of a cyclic quadrilateral are supplementary. | State that opposite angles in a cyclic quadrilateral are supplementary. |
| 31 | 6a5266 | CK1 | Counts 16 dots in Figure 4 | Count every dot in Figure 4 carefully. |
| 32 | 6a5266 | CK2 | Recognises the square-dot rule as $n^2$ | Write the number of dots in Figure $n$ using the square-number rule. |
| 33 | 6a5266 | AK1 | Adds $5n+6$ to "their" expression for Figure $n$ | Add the extra-dot expression to your expression for Figure $n$. |
| 34 | 6a5266 | CK3 | Identifies factors whose product is 6 and whose sum is 5 | Find two numbers that multiply to the constant term and add to the coefficient of $n$. |
| 35 | 6a5266 | AK2 | Factorises $n^2+5n+6$ as $(n+2)(n+3)$ | Factorise $n^2+5n+6$ into two brackets. |
| 36 | 6a5266 | R1 | Equates "their" factorised total to 132 | Set your factorised total equal to the given number of dots. |
| 37 | 6a5266 | CK4 | Identifies 11 and 12 as consecutive factors of 132 | Find the consecutive factor pair of the given total. |
| 38 | 6a5266 | AK3 | Uses $n+2=11$ and calculates $n=9$ | Set the smaller factor equal to $n+2$ and solve for $n$. |
| 39 | 6a5266 | R2 | Uses the order $n+2<n+3$ to select the consistent consecutive factors | Check that your chosen factors match the order $n+2<n+3$. |
| 40 | 6a5266 | AK4 | Determines the factor pairs of 130 | List all the factor pairs of the stated number of dots. |
| 41 | 6a5266 | R3 | Establishes that no factor pair of 130 is consecutive | Check whether any factor pair differs by exactly one. |
| 42 | 6a5266 | R4 | Concludes that 130 cannot have the form "their" $(n+2)(n+3)$ | Use the absence of consecutive factors to state that the total cannot be written in your form $(n+2)(n+3)$. |
| 43 | 6a5278 | CK1 | Recognises that $fg(x)=f(g(x))$ | Write $fg(x)$ as $f(g(x))$, so you apply $g$ first and then $f$. |
| 44 | 6a5278 | AK1 | Substitutes $x^2$ into $f$ | Replace the input of $f$ with $x^2$ and simplify the resulting expression. |
| 45 | 6a5278 | CK2 | Forms $x^2+1=5$ using "their" composite function | Set your composite function equal to the required final score by writing $x^2+1=5$. |
| 46 | 6a5278 | AK3 | Solves to obtain $x=\pm2$ | Solve the equation for x and include both positive and negative solutions. |
| 47 | 6a5278 | CK3 | Recognises that $gf(x)=g(f(x))$ | Write $gf(x)$ as $g(f(x))$, so you apply $f$ first and then $g$. |
| 48 | 6a5278 | R2 | Applies $f$ and then $g$ to "their" raw score | Use your raw score as the input to $f$, then use that result as the input to $g$. |
| 49 | 6a5278 | R4 | States that the adjustments cannot be applied in either order because "their" $gf(x)$ is not $5$ | Compare your $gf(x)$ with $5$ and state that the adjustments cannot be applied in either order if it is not equal to $5$. |
| 50 | 6a528f | CK1 | Uses $-3$ as the first component of $\overrightarrow{OA}$ | Read station A’s horizontal coordinate from the graph and use it as the first component of \overrightarrow{OA}. |
| 51 | 6a528f | CK2 | Uses $2$ as the second component of $\overrightarrow{OA}$ | Read station A’s vertical coordinate from the graph and use it as the second component of \overrightarrow{OA}. |
| 52 | 6a528f | CK3 | Uses $2$ as the first component of $\overrightarrow{OB}$ | Read station B’s horizontal coordinate from the graph and use it as the first component of \overrightarrow{OB}. |
| 53 | 6a528f | CK4 | Uses $4$ as the second component of $\overrightarrow{OB}$ | Read station B’s vertical coordinate from the graph and use it as the second component of \overrightarrow{OB}. |
| 54 | 6a528f | R1 | Forms $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Find the displacement from A to B by subtracting \overrightarrow{OA} from \overrightarrow{OB}: \overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}. |
| 55 | 6a528f | AK1 | Subtracts the first components of "their" position vectors | Subtract the first component of your $overrightarrow{OA}$ from the first component of your $overrightarrow{OB}$. |
| 56 | 6a528f | AK2 | Subtracts the second components of "their" position vectors | Subtract the second component of your $overrightarrow{OA}$ from the second component of your $overrightarrow{OB}$. |
| 57 | 6a528f | R2 | Forms $\overrightarrow{OC}=\overrightarrow{OB}+2\overrightarrow{AB}$ using "their" $\overrightarrow{AB}$ | Form \overrightarrow{OC}=\overrightarrow{OB}+2\overrightarrow{AB} using your \overrightarrow{AB}. |
| 58 | 6a528f | AK3 | Finds twice "their" $\overrightarrow{AB}$ | Multiply each component of your \overrightarrow{AB} by 2 to find twice your \overrightarrow{AB}. |
| 59 | 6a528f | R3 | Adds "their" doubled displacement to "their" $\overrightarrow{OB}$ | Add your doubled displacement component by component to your \overrightarrow{OB}. |
| 60 | 6a52ab | CK1 | Recognises that the angle subtended by diameter $PQ$ at the circumference is a right angle | Use the fact that an angle subtended by a diameter at the circumference is a right angle. |
| 61 | 6a52ab | CK2 | Recognises from the coordinates that $PA=AQ$ | Calculate the distances $PA$ and $AQ$ from the coordinates and show that they are equal. |
| 62 | 6a52ab | AK2 | Uses $\left(180°-\text{their }\angle PAQ\right)\div2$ to find each base angle | Find each base \angle by calculating \(\left(180°-\text{your }\angle PAQ\right)\div2\). |
| 63 | 6a52ab | CK3 | Identifies the angle between tangent $AT$ and chord $AQ$ with the angle in the alternate segment | Use the alternate-segment theorem to match the angle between tangent $AT$ and chord $AQ$ to the angle in the opposite segment. |
| 64 | 6a52ab | AK3 | Uses $P$, $O$ and $Q$ collinear to equate $\angle APQ$ and $\angle QPA$ | Use the fact that \(P\), \(O\), and \(Q\) are collinear to set \(\angle APQ\) equal to \(\angle QPA\). |
| 65 | 6a52ab | CK4 | Recognises that $TQ\perp OQ$, so $TQ$ is a tangent at $Q$ | Show that \(TQ\perp OQ\), then state that \(TQ\) is a tangent at \(Q\). |
| 66 | 6a52ab | R3 | Uses the alternate-segment angle to obtain $\angle TQA=\text{their }\angle APQ$ | Use the alternate-segment \angle to set \(\angle TQA=\text{your }\angle APQ\). |
| 67 | 6a52ab | AK4 | Uses angle sum of triangle $ATQ$: $180°-\text{their }\angle TAQ-\text{their }\angle TQA$ | Find \(\angle ATQ\) using the triangle \angle sum: \(180°-\text{your }\angle TAQ-\text{your }\angle TQA\). |
| 68 | 6a52b3 | CK1 | States $\vec{PQ}=\vec{OQ}-\vec{OP}$ | Find the vector from P to Q by subtracting \vec{OP} from \vec{OQ}: \vec{PQ}=\vec{OQ}-\vec{OP}. |
| 69 | 6a52b3 | CK2 | Recognises that each term in $\vec{PQ}$ is multiplied by $2$ | Multiply every component of \vec{PQ} by 2 to obtain \vec{QR}. |
| 70 | 6a52b3 | CK3 | States $\vec{OR}=\vec{OQ}+\vec{QR}$ | Travel from O to R through Q, so write \vec{OR}=\vec{OQ}+\vec{QR}. |
| 71 | 6a52b3 | AK3 | Adds corresponding components of $\vec{OQ}$ and "their" $\vec{QR}$ | Add the corresponding \vec{a} and \vec{b} components in \vec{OQ} and your \vec{QR}. |
| 72 | 6a52b3 | R2 | Uses "their" $\vec{OR}$ to obtain $\vec{OS}$ and forms $\vec{PS}=\vec{OS}-\vec{OP}$ | Use your \vec{OR} to find \vec{OS}, then subtract \vec{OP} by writing \vec{PS}=\vec{OS}-\vec{OP}. |
| 73 | 6a52b3 | R3 | Concludes parallelogram since "their" $\vec{PS}$ equals "their" $\vec{QR}$ | Compare your \vec{PS} with your \vec{QR} and conclude that PQRS is a parallelogram when these vectors are equal. |
| 74 | 6a52bb | AK1 | Calculates $6 \times 2 = 12$ | Multiply 6 by 2 to find the first fx value. |
| 75 | 6a52bb | AK2 | Calculates $7 \times 3 = 21$ | Multiply 7 by 3 to find the second fx value. |
| 76 | 6a52bb | AK3 | Calculates $8 \times 4 = 32$ | Multiply 8 by 4 to find the third fx value. |
| 77 | 6a52bb | AK4 | Calculates $9 \times 1 = 9$ | Multiply 9 by 1 to find the fourth fx value. |
| 78 | 6a52bb | CK3 | Recognises that a sample statistic estimates a population parameter | State that the sample statistic is used to estimate the population parameter. |
| 79 | 6a52bb | R2 | States that the sample does not support the claim | State whether the sample supports the claim. |
| 80 | 6a52bb | R3 | Compares "their" sample mean with 8 hours to justify the decision | Compare your sample mean with 8 hours and use the comparison to justify your decision. |
| 81 | 6a52c8 | CK1 | Recognises that $r^3$ must be isolated | Rearrange the formula so that \(r^3\) is isolated on one side. |
| 82 | 6a52c8 | AK1 | Multiplies both sides by $\frac{3}{4\pi}$ to obtain $r^3=\frac{3V}{4\pi}$ | Multiply both sides of the volume equation by \frac{3}{4\pi} to make \(r^3=\frac{3V}{4\pi}\). |
| 83 | 6a52c8 | R1 | Takes the cube root of both sides to show the required result | Take the cube root of both sides to write \(r\) in the required form. |
| 84 | 6a52c8 | CK2 | Substitutes $V=36\pi$ into the expression for $r$ | Substitute \(V=36\pi\) into \(r=\sqrt[3]{\frac{3V}{4\pi}}\). |
| 85 | 6a52c8 | AK2 | Simplifies $\frac{3(36\pi)}{4\pi}$ to $27$ | Simplify \(\frac{3(36\pi)}{4\pi}\) by cancelling \(\pi\) and dividing the remaining factors. |
| 86 | 6a52c8 | CK3 | Reads the permitted radius interval as from $2$ m to $4$ m from the number line | Read the lower and upper permitted radius limits directly from the number line. |
| 87 | 6a52c8 | R2 | Compares "their" radius with the interval from $2$ m to $4$ m | Compare your radius with the interval shown on the number line. |
| 88 | 6a52c8 | R3 | Concludes that the tank meets the requirement with a valid reason | State whether the tank meets the requirement and support your conclusion by showing that your radius is inside the permitted interval. |
| 89 | fe84a7 | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Write $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ before calculating the displacement. |
| 90 | fe84a7 | AK1 | Subtracts components to obtain $\begin{pmatrix}5\\3\end{pmatrix}$ | Subtract the corresponding components and write the displacement as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 91 | fe84a7 | CK2 | Uses $\overrightarrow{BC}=2\times$ "their" $\overrightarrow{AB}$ | Use $\overrightarrow{BC}=2\times\overrightarrow{AB}$, multiplying your earlier $\overrightarrow{AB}$ by $2$. |
| 92 | fe84a7 | AK2 | Calculates $\overrightarrow{BC}=\begin{pmatrix}10\\6\end{pmatrix}$, or equivalent follow-through value | Multiply each component of your $\overrightarrow{AB}$ by $2$ and write $\overrightarrow{BC}$ as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 93 | fe84a7 | CK3 | Uses $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{BC}$ | Write $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{BC}$ to find the position vector of $C$. |
| 94 | fe84a7 | AK3 | Adds vectors to obtain $\begin{pmatrix}12\\11\end{pmatrix}$, or correct follow-through from "their" $\overrightarrow{BC}$ | Add the corresponding components of $\overrightarrow{OB}$ and your $\overrightarrow{BC}$, writing $\overrightarrow{OC}$ as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 95 | fe84a7 | CK4 | Recognises that the boundary point with ordinate $11$ has abscissa $10$ | Keep C at the same ordinate and move its abscissa to the permitted boundary. |
| 96 | fe84a7 | R1 | Identifies that "their" point $C$ is outside the permitted area because its abscissa exceeds $10$ | Check whether your point C lies outside the permitted area because its abscissa is too large. |
| 97 | fe84a7 | R2 | Selects $(10,11)$, or the corresponding nearest point from "their" position vector, as the target point | Choose the nearest point on the permitted boundary that has the same ordinate as your point C. |
| 98 | fe84a7 | R3 | Finds target position minus "their" $\overrightarrow{OC}$ to obtain $\begin{pmatrix}-2\\0\end{pmatrix}$ | Subtract your $\overrightarrow{OC}$ from the target position and write the required displacement as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 99 | fe84af | CK1 | Identifies gradient $2$ and $y$-intercept $1$ from the graph | Read the rise over run to find the gradient, then read where the line crosses the $y$-axis for the intercept. |
| 100 | fe84af | CK2 | Recognises that $fg(x)=f(g(x))$ | Interpret $fg(x)$ as applying $g$ to $x$ first, then using that result as the input to $f$. |
| 101 | fe84af | AK2 | Substitutes $x^2$ into "their" rule for $f$ | Replace the input $x$ in your rule for $f$ with $x^2$. |
| 102 | fe84af | CK3 | Recognises that $gf(x)=g(f(x))$ | Interpret $gf(x)$ as applying $f$ to $x$ first, then using that result as the input to $g$. |
| 103 | fe84af | AK4 | Substitutes "their" $f(x)$ into $g$, giving $(2x+1)^2$ | Put your expression for $f(x)$ into $g(x)=x^2$ and square the whole expression. |
| 104 | fe84af | R1 | Compares "their" composite expressions and states $fg\ne gf$ | Compare your two composite expressions and state \(fg\ne gf\) because they are not the same. |
| 105 | fe84af | R2 | Uses $gf(3)$ for $f$ followed by $g$ and $fg(3)$ for $g$ followed by $f$, follow-through on "their" composites | For $f$ followed by $g$, calculate $gf(3)$, and for $g$ followed by $f$, calculate $fg(3)$ using your composite expressions. |
| 106 | fe84b7 | R1 | Determines an increase of 3 tiles between consecutive figures | Subtract the number of tiles in one figure from the next to find the constant increase. |
| 107 | fe84b7 | CK1 | Recognises that $3n$ represents the increase in tiles for Figure $n$ | Use the increase of 3 tiles per figure to write the growing part as $3n$. |
| 108 | fe84b7 | CK2 | Determines the constant adjustment of 2 tiles | Compare $3n$ with a figure’s tile total to find the fixed amount that must be added. |
| 109 | fe84b7 | R2 | Forms $T=3n+2$ using "their" increase | Write the rule as $T=3n+2$, using your increase in place of 3 if you found a different one. |
| 110 | fe84b7 | CK3 | Forms $3n+2=35$ using "their" rule | Set your rule equal to 35 tiles to form an equation. |
| 111 | fe84b7 | AK1 | Subtracts 2 from both sides, giving $3n=33$ | Subtract 2 from both sides of $3n+2=35$ before solving for $n$. |
| 112 | fe84b7 | AK2 | Divides "their" 33 by "their" 3 | Divide your result after subtracting by your coefficient of $n$. |
| 113 | fe84b7 | R3 | Interprets the solution as the number of the tile figure | State the value of $n$ as the figure number, not as a number of tiles. |
| 114 | fe84c4 | CK1 | Identifies that radii $OA$ and $OB$ are perpendicular to tangents $PA$ and $PB$. | Use the fact that a radius meets a tangent at a right angle, so identify the right angles at $A$ and $B$. |
| 115 | fe84c4 | AK1 | Uses the angle sum of quadrilateral $OAPB$: $360-90-90-48$. | Find $ngle AOB$ by subtracting the two right angles and the given angle from the angle sum of quadrilateral $OAPB$. |
| 116 | fe84c4 | CK2 | Recognises that the angle at the centre is twice the angle at the circumference on arc $AB$. | Use the circle theorem that the angle at the centre is twice the angle at the circumference on the same arc $AB$. |
| 117 | fe84c4 | AK2 | Halves "their" $\angle AOB$. | Halve "your" \angle AOB to find \angle ACB. |
| 118 | fe84c4 | CK3 | Recognises that the angles in triangle $ABC$ sum to $180°$. | Use the fact that the three interior angles of triangle $ABC$ add to $180°$. |
| 119 | fe84c4 | AK3 | Calculates $180-42-\text{"their" }\angle ACB$. | Calculate 180-42-\text{"your" }\angle ACB to find \angle CBA. |
| 120 | fe84c4 | CK4 | Identifies $\angle CBA$ as the angle in the alternate segment for chord $CA$. | Identify \angle CBA as the \angle in the alternate segment for chord $CA$. |
| 121 | fe84c4 | AK4 | States "their" $\angle CBA$ as the required angle between a tangent at $C$ and chord $CA$. | State "your" \angle CBA as the required \angle between a tangent at $C$ and chord $CA$. |
| 122 | fe84c4 | R3 | Compares $66°$ with "their" required angle and decides that they are unequal. | Compare $66°$ with your required tangent angle and decide whether they are equal. |
| 123 | fe84c4 | R4 | Justifies that the proposed line is not a tangent using the alternate-segment theorem. | Conclude that the proposed line is not a tangent because it does not give the equal alternate-segment angle. |
| 124 | fe84cc | CK1 | Identifies $QR$ as opposite the $30^\circ$ angle | Identify $QR$ as the side opposite the $30^\circ$ angle. |
| 125 | fe84cc | CK2 | Selects the tangent ratio | Choose the tangent ratio, using opposite divided by adjacent. |
| 126 | fe84cc | AK1 | Substitutes into $\tan 30^\circ=\frac{QR}{45}$ | Substitute the triangle sides into $\tan 30^\circ=\frac{QR}{45}$. |
| 127 | fe84cc | AK2 | Evaluates $QR=45\tan30^\circ$ | Calculate $QR=45\tan30^\circ$. |
| 128 | fe84cc | R1 | Gives $26.0\text{ m}$ correct to 1 decimal place | State the mast height to 1 decimal place in $\text{ m}$. |
| 129 | fe84cc | CK3 | Identifies $PR$ as the hypotenuse of the right-angled triangle | Identify $PR$ as the hypotenuse, the side opposite the right angle. |
| 130 | fe84cc | AK3 | Uses $\frac{\text{their }QR}{\sin30^\circ}$ to find $PR$ | Use $\frac{\text{your }QR}{\sin30^\circ}$ to calculate $PR$. |
| 131 | fe84cc | AK4 | Evaluates $PR=\frac{25.980\ldots}{\sin30^\circ}=51.961\ldots$ | Evaluate $PR=\frac{25.980\ldots}{\sin30^\circ}=51.961\ldots$. |
| 132 | fe84cc | R2 | Gives $52.0\text{ m}$ correct to 1 decimal place | State the support-cable length to 1 decimal place in $\text{ m}$. |
| 133 | fe84cc | R3 | Concludes that the cable is not long enough since "their" $PR>51\text{ m}$ | Conclude that the cable is not long enough because your $PR>51\text{ m}$. |
| 134 | fe84d4 | CK1 | Identifies the damaged frequency as $20$ out of $100$ | Use the damaged frequency out of the total number of bags. |
| 135 | fe84d4 | CK2 | Selects the joint frequency $8$ out of $100$ | Use the frequency in the table for bags that are both damaged and underweight, out of the total. |
| 136 | fe84d4 | CK3 | Identifies $P(\text{underweight}) = \frac{30}{100} = 0.3$ | Find the probability of an underweight bag by dividing the number of underweight bags by the total number of bags, then write it as $P(\text{underweight}) = \frac{30}{100} = 0.3$. |
| 137 | fe84d4 | R1 | Multiplies probabilities for the independent events using $0.2 \times 0.3$ | Multiply the probabilities for the independent events using $0.2 \times 0.3$. |
| 138 | fe84d4 | R2 | Finds the difference between “their” experimental and theoretical probabilities | Subtract your theoretical probability from your experimental probability to find the difference. |
| 139 | fe84d4 | CK4 | States that “their” difference is greater than $0.01$ | Compare your difference with $0.01$ and state that it is greater. |
| 140 | fe84d4 | R3 | Concludes that the shopkeeper should not use the model | Use the comparison with $0.01$ to conclude that the shopkeeper should not use the independent-events model. |
| 141 | d9c1e8 | CK1 | Recognises that $\overrightarrow{AB}$ is found by subtracting the coordinates of $A$ from those of $B$. | Find \overrightarrow{AB} by subtracting each coordinate of A from the corresponding coordinate of B. |
| 142 | d9c1e8 | AK1 | Subtracts correctly to obtain $\begin{pmatrix}3\\4\end{pmatrix}$. | Carry out the coordinate subtraction carefully to obtain \begin{pmatrix}3\\4\end{pmatrix}. |
| 143 | d9c1e8 | CK2 | Uses $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$. | Use \left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2} to find the magnitude of the vector. |
| 144 | d9c1e8 | AK2 | Evaluates $\sqrt{3^2+4^2}$. | Evaluate \sqrt{3^2+4^2} step by step. |
| 145 | d9c1e8 | CK3 | Recognises that a point on the $x$-axis has second coordinate $0$. | Write the second coordinate as $0$ because $C$ lies on the $x$-axis. |
| 146 | d9c1e8 | AK3 | Uses $\|x-1\|=$ 'their' magnitude of $\overrightarrow{AB}$ to obtain $x=6$ or $x=-4$. | Set \|x-1\| equal to your magnitude of \overrightarrow{AB} and solve for both possible values of x. |
| 147 | d9c1e8 | R2 | Uses the condition $AC=AB$ with 'their' magnitude from part (b). | Use the condition $AC=AB$ and your magnitude from part (b) to form the equation for $C$. |
| 148 | d9c1e8 | R3 | Selects $x=6$, since $C$ is to the right of $A$, and gives $(6,0)$. | Choose the possible $x$-coordinate that places $C$ to the right of $A$, then write the coordinate pair with second coordinate $0$. |
| 149 | d9c1f0 | CK1 | Recognises that $1$ tonne $= 1 000 000$ g | Use the conversion \(1\text{ tonne}=1\,000\,000\text{ g}\). |
| 150 | d9c1f0 | AK1 | Multiplies $1.274$ by $1 000 000$ | Multiply the mass in tonnes by \(1\,000\,000\) to express it in grams. |
| 151 | d9c1f0 | CK2 | Divides "their" mass in grams by $350$ | Divide your mass in grams by \(350\) to find the number of bags. |
| 152 | d9c1f0 | CK3 | Recognises that each carton holds $18$ bags | Use \(18\) bags as the number that fits in each carton. |
| 153 | d9c1f0 | AK3 | Obtains quotient $202$ on dividing "their" number of bags by $18$ | Divide your number of bags by \(18\) and take the whole-number quotient as the number of full cartons. |
| 154 | d9c1f0 | R1 | Interprets the remainder as $4$ bags left after full cartons are packed | State that the remainder represents the bags left after packing as many full cartons as possible. |
| 155 | d9c1f0 | CK4 | Establishes that "their" number of full cartons is sufficient for the $200$-carton order | Compare your number of full cartons with the \(200\) cartons required to decide whether there are enough. |
| 156 | d9c1f0 | CK5 | Recognises that the load masses must be compared in the same unit | Convert the load masses to the same unit before comparing them. |
| 157 | d9c1f0 | R2 | Forms the mass of the order as $200 \times 18 \times 350$ g | Multiply the number of cartons by the bags per carton and the mass per bag to form the order mass: $200 \times 18 \times 350$ g. |
| 158 | d9c1f0 | R3 | Converts "their" mass of the order to tonnes | Convert your order mass from grams to tonnes before comparing it with the trip limit. |
| 159 | d9c1f0 | R4 | Concludes that one trip is not possible since "their" order mass exceeds $1.20$ tonnes | Conclude that one trip is not possible if your order mass in tonnes is greater than \(1.20\) tonnes. |
| 160 | d9c1f8 | CK1 | Divides both sides by $2\pi$ to isolate the square root | Divide both sides by $2\pi$ so that the square root \sqrt{\frac{l}{g}} is isolated. |
| 161 | d9c1f8 | AK1 | Squares both sides correctly | Square both sides of the equation, squaring the denominator on the left as well. |
| 162 | d9c1f8 | CK2 | Selects $T = 2.20$ and $g = 9.8$ for substitution into the expression for $l$ | Use $T = 2.20$ and $g = 9.8$ when substituting into the expression for $l$. |
| 163 | d9c1f8 | AK3 | Substitutes into $l = \frac{gT^2}{4\pi^2}$ using "their" expression from part (a) | Substitute the given measurements into $l = \frac{gT^2}{4\pi^2}$ using your expression from part (a). |
| 164 | d9c1f8 | AK4 | Evaluates "their" expression, giving $1.201\ldots\text{ m}$ | Evaluate your expression to find the length in \text{m}, keeping extra decimal places with \ldots before rounding. |
| 165 | d9c1f8 | R1 | Expresses "their" length correct to 3 significant figures | Write your length to 3 significant figures, keeping the unit metres. |
| 166 | d9c1f8 | CK3 | Identifies $1.15\text{ m}$ as the limiting height of the case | Use the stated height of the case, in \text{m}, as the limiting height. |
| 167 | d9c1f8 | R2 | Compares "their" pendulum length with $1.15\text{ m}$ | Compare your calculated pendulum length in \text{m} with the limiting height of the case to decide whether it fits. |
| 168 | d9c1f8 | R3 | Concludes that the pendulum will not fit | State that the pendulum will not fit in the case. |
| 169 | d9c205 | CK1 | Forms products of each number of goals and its corresponding frequency | Multiply each number of goals by its matching frequency from the bar chart before adding the products. |
| 170 | d9c205 | R1 | Uses 20, the number of selected players, as the denominator | Divide the total number of goals by the number of selected players. |
| 171 | d9c205 | R2 | Identifies 13 selected players who scored at least 2 goals and uses the scale factor $80\div20$ | Add the frequencies for 2, 3 and 4 goals, then use the scale factor $80\div20$ to estimate the number of all players who scored at least 2 goals. |
| 172 | d9c205 | CK2 | Identifies the mean from the selected players as a sample statistic | State that the mean calculated from the selected players is a sample statistic. |
| 173 | d9c205 | CK3 | Identifies a mean calculated from all 80 players as a population parameter | State that a mean calculated from all 80 players is a population parameter. |
| 174 | d9c205 | R3 | Explains that the selected players may not represent the full population | Explain that the selected players may not represent the full population, so the means can differ. |
| 175 | d9c20d | R1 | Reads $g(\text{their }7)=3$ correctly from the graph | Find your value of \(f(3)\) on the input axis, then read the corresponding output on the graph to write \(g(\text{your }7)=3\). |
| 176 | d9c20d | CK1 | Identifies $f$ and $g$ as inverse functions | Compare the two graphs and identify f and g as inverse functions. |
| 177 | d9c20d | CK2 | Recognises that the inverse reverses the input and output | Remember that an inverse function reverses each input and output pair. |
| 178 | d9c20d | AK2 | Interchanges the variables and rearranges $y=2x+1$ to make $y$ the subject | Interchange x and y in $y=2x+1$, then rearrange to make y the subject. |
| 179 | d9c20d | R2 | States $g:x\to \frac{x-1}{2}$ | Interchange \(x\) and \(y\) in \(y=2x+1\), then rearrange \to state \(g:x\to \frac{x-1}{2}\). |
| 180 | d9c20d | CK3 | Forms the composition $g(f(x))$ | Form the composite function by writing g with f(x) as its input. |
| 181 | d9c20d | AK3 | Substitutes $f(x)=2x+1$ into $g$ | Substitute $f(x)=2x+1$ into the rule for g before simplifying. |
| 182 | d9c20d | R3 | Simplifies to conclude $g(f(x))=x$ | Simplify the composite expression fully and state that it is the identity function. |
| 183 | d9c215 | CK1 | Identifies 3 as the number added for each successive figure | Compare consecutive figures and count the same number of extra plants each time. |
| 184 | d9c215 | CK2 | Identifies 1 as the fixed number of plants in the pattern | Use the first figure to find the fixed plants left after accounting for the repeating increase. |
| 185 | d9c215 | R1 | Combines the repeating and fixed parts to form $3n+1$ | Combine the repeated increase and the fixed plants to write the rule in terms of the figure number. |
| 186 | d9c215 | CK3 | Selects "their" expression for the number of plants in Figure $n$ | Use your earlier rule for the number of plants in Figure \(n\). |
| 187 | d9c215 | CK4 | Forms $3n+1=52$ | Set your pattern rule equal to the required number of plants. |
| 188 | d9c215 | AK2 | Subtracts 1 from both sides | Subtract the fixed part from both sides of the equation. |
| 189 | d9c215 | AK3 | Divides by 3 to obtain $n=17$ | Divide both sides by the coefficient of \(n\) to isolate \(n\). |
| 190 | d9c215 | R2 | Interprets "their" value as a valid figure number | State the figure number represented by your value of \(n\). |
| 191 | d9c215 | CK5 | Forms $3n+1=50$ for the remaining plants | First remove the plants that are taken away, then set your pattern rule equal to the number remaining. |
| 192 | d9c215 | R3 | Solves to obtain $n=\frac{49}{3}$ | Rearrange the equation step by step and divide by the coefficient of n to obtain n=\frac{49}{3}. |
| 193 | d9c215 | R4 | Concludes that no complete display is possible because a figure number must be a whole number | Explain that a complete display needs a whole-number figure number, so reject a fractional figure number. |
| 194 | d9c21d | CK1 | Recognises that angle $PHQ$ is the difference between the two bearings from $H$: $090°-035°$. | Subtract the smaller bearing from the larger bearing at $H$ to find $ angle PHQ$. |
| 195 | d9c21d | CK2 | Selects the cosine rule using the included angle at $H$. | Use the cosine rule with the two known sides and the included angle at $H$ to find $PQ$. |
| 196 | d9c21d | AK2 | Substitutes correctly into $PQ^2=10^2+14^2-2(10)(14)\cos(\text{their }55°)$. | Substitute the two given side lengths and \cos(\text{your }55°) into \(PQ^2=10^2+14^2-2(10)(14)\cos(\text{your }55°)\). |
| 197 | d9c21d | AK3 | Processes to obtain $PQ\approx11.6369$ km. | Evaluate your expression for \(PQ^2\) and take the positive square root to obtain \(PQ\) in km. |
| 198 | d9c21d | R1 | Expresses the distance as $11.6$ km, correct to 3 significant figures. | Round your distance for $PQ$ to 3 significant figures and include km. |
| 199 | d9c21d | CK3 | States the bearing of $H$ from $P$ as $215°$. | Reverse the bearing from $H$ to $P$ by adding $180°$, writing the result as a three-figure bearing. |
| 200 | d9c21d | AK4 | Calculates angle $HPQ\approx80.3°$ using "their" value of $PQ$. | Use the cosine rule with your value of \(PQ\) to calculate \(\angle HPQ\), then find the angle to one decimal place. |
