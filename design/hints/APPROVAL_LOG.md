# Hint approval log

One table per batch. A row is approved by setting its status in the batch file; `pnpm hints:approve <n>` writes approved hints to the bank.

## Batch 1 — approved (200 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 200 rows. Rows 9, 65, 128, 131, 132, 192 hand-edited; rows 31, 79, 168, 175 set to his sentences.

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | 6a51ef | CK1 | Recognises that $gf(x)=g(f(x))$ | Interpret $gf(x)$ as applying $f$ first and then applying $g$ to the result. |
| 2 | 6a51ef | AK1 | Substitutes $2x+4$ into $g$ | Replace the input of $g$ with $2x+4$ before simplifying. |
| 3 | 6a51ef | AK2 | Simplifies to $1.8x+3.6$ | Expand the expression from $g(2x+4)$ and collect the $x$ terms and constants. |
| 4 | 6a51ef | CK2 | Identifies the intersection as the point where the retained amounts are equal | Use the point where the two graphs cross, since both plans retain the same amount there. |
| 5 | 6a51ef | AK3 | Reads the intersection as $x=8$, $y=18$ | Read the $x$-coordinate and $y$-coordinate directly from the graphs’ intersection. |
| 6 | 6a51ef | R1 | States $(8,18)$ as the solution of the simultaneous equations | Write the intersection coordinate as the solution to the simultaneous equations. |
| 7 | 6a51ef | R2 | Uses 10 being greater than "their" intersection value to identify Plan B as higher | Compare $10$ with your intersection value and use the graph to decide which plan is higher. |
| 8 | 6a51ef | CK3 | Forms the condition $h(x)\ge20$ for retaining at least \$20 | Write the requirement for retaining at least $20$ as $h(x)\ge20$. |
| 9 | 6a51ef | R3 | Solves $3x-6\ge20$ to obtain $x\ge\frac{26}{3}$ | Solve $3x-6\ge20$ step by step, keeping the inequality sign, and leave $x$ as a fraction. |
| 10 | 6a51ef | R4 | Justifies that 8 trays give only \$18, which is less than \$20 | Substitute $8$ into Plan B’s rule and compare the retained amount with $20$ to justify why it is not enough. |
| 11 | 6a5256 | CK1 | Writes $\overrightarrow{OA}$ as the column vector $\begin{pmatrix}2\\-1\end{pmatrix}$ | Write $\overrightarrow{OA}$ as a column vector using A's horizontal component above its vertical component: $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 12 | 6a5256 | CK2 | Writes $\overrightarrow{OB}$ as the column vector $\begin{pmatrix}8\\5\end{pmatrix}$ | Write $\overrightarrow{OB}$ as a column vector using B's horizontal component above its vertical component: $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 13 | 6a5256 | AK1 | Subtracts position vectors to obtain $\overrightarrow{AB}=\begin{pmatrix}8-2\\5-(-1)\end{pmatrix}$ | Subtract A's position vector from B's position vector component by component to form $\overrightarrow{AB}=\begin{pmatrix}x_B-x_A\\y_B-y_A\end{pmatrix}$. |
| 14 | 6a5256 | CK3 | Forms $\overrightarrow{OC}=\overrightarrow{OA}+\dfrac{3}{2}\overrightarrow{AB}$ | Find C's position vector by adding A's position vector to $\dfrac{3}{2}$ of $\overrightarrow{AB}$: $\overrightarrow{OC}=\overrightarrow{OA}+\dfrac{3}{2}\overrightarrow{AB}$. |
| 15 | 6a5256 | AK2 | Finds $\dfrac{3}{2}$ of “their” $\overrightarrow{AB}$ | Multiply each component of your $\overrightarrow{AB}$ by $\dfrac{3}{2}$. |
| 16 | 6a5256 | CK4 | Identifies $\overrightarrow{AD}=\overrightarrow{OD}-\overrightarrow{OA}$ and $\overrightarrow{DC}=\overrightarrow{OC}-\overrightarrow{OD}$ | Find each displacement by subtracting position vectors in travel order: $\overrightarrow{AD}=\overrightarrow{OD}-\overrightarrow{OA}$ and $\overrightarrow{DC}=\overrightarrow{OC}-\overrightarrow{OD}$. |
| 17 | 6a5256 | R1 | Obtains $\overrightarrow{AD}=\begin{pmatrix}3\\3\end{pmatrix}$ | Subtract the components in $\overrightarrow{AD}=\overrightarrow{OD}-\overrightarrow{OA}$ and write the result as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 18 | 6a5256 | R2 | Obtains $\overrightarrow{DC}=\begin{pmatrix}6\\6\end{pmatrix}$ using “their” $\overrightarrow{OC}$ | Use your $\overrightarrow{OC}$ and subtract $\overrightarrow{OD}$ component by component to obtain $\overrightarrow{DC}=\begin{pmatrix}x\\y\end{pmatrix}$. |
| 19 | 6a5256 | R3 | Compares corresponding components to derive $AD:DC=1:2$ | Compare the corresponding components of $\overrightarrow{AD}$ and $\overrightarrow{DC}$, then simplify the scale factor to write $AD:DC$. |
| 20 | 6a5256 | CK5 | States that a midpoint divides a line segment in the ratio $1:1$ | State the ratio that shows a line segment has been divided into two equal parts: $1:1$. |
| 21 | 6a5256 | R4 | Concludes that $D$ is not the midpoint because “their” ratio is not $1:1$ | Compare your $AD:DC$ with $1:1$ and use the difference to conclude whether $D$ is the midpoint. |
| 22 | 6a525e | CK1 | Recognises that $OA = OB$ as radii of the circle. | Use the fact that $OA = OB$ because both are radii of the circle. |
| 23 | 6a525e | AK1 | Finds the remaining two angles: $180° - 110° = 70°$. | Subtract the given central angle from $180°$ to find the two remaining angles together. |
| 24 | 6a525e | AK2 | Divides the remaining angle equally to obtain $35°$. | Divide the remaining angle equally between the two base angles to find angle $OAB$. |
| 25 | 6a525e | CK2 | Uses the fact that a tangent is perpendicular to the radius at the point of contact. | Use the fact that the tangent at $A$ is perpendicular to radius $OA$. |
| 26 | 6a525e | R1 | Calculates $90° -$ "their" angle $OAB$, giving $55°$. | Calculate $90°-$ your angle $OAB$ to find the acute angle between the tangent and $AB$. |
| 27 | 6a525e | CK3 | Recognises that the angle between a tangent and a chord equals the angle in the alternate segment. | Use the alternate-segment theorem to equate the angle between the tangent and chord $AB$ with angle $ACB$. |
| 28 | 6a525e | R2 | Uses opposite angles of cyclic quadrilateral $ACBD$ to form $180° -$ "their" angle $ACB$. | Use opposite angles in cyclic quadrilateral $ACBD$ to calculate $180°-$ your angle $ACB$. |
| 29 | 6a525e | R3 | Concludes that angle $ADB = 125°$. | State the resulting value of angle $ADB$. |
| 30 | 6a525e | CK4 | States that opposite angles of a cyclic quadrilateral are supplementary. | State that opposite angles of a cyclic quadrilateral are supplementary. |
| 31 | 6a5266 | CK1 | Counts 16 dots in Figure 4 | Continue the pattern to find how many dots Figure 4 would have. |
| 32 | 6a5266 | CK2 | Recognises the square-dot rule as $n^2$ | Identify the square-number rule for Figure $n$ as $n^2$. |
| 33 | 6a5266 | AK1 | Adds $5n+6$ to "their" expression for Figure $n$ | Add $5n+6$ to your expression for Figure $n$. |
| 34 | 6a5266 | CK3 | Identifies factors whose product is 6 and whose sum is 5 | Find two factors of the constant term that add to the coefficient of $n$. |
| 35 | 6a5266 | AK2 | Factorises $n^2+5n+6$ as $(n+2)(n+3)$ | Factorise $n^2+5n+6$ into $(n+2)(n+3)$. |
| 36 | 6a5266 | R1 | Equates "their" factorised total to 132 | Equate your factorised total to the stated number of dots. |
| 37 | 6a5266 | CK4 | Identifies 11 and 12 as consecutive factors of 132 | Find the consecutive factor pair of the stated total. |
| 38 | 6a5266 | AK3 | Uses $n+2=11$ and calculates $n=9$ | Use the equation from the smaller factor to solve for $n$. |
| 39 | 6a5266 | R2 | Uses the order $n+2<n+3$ to select the consistent consecutive factors | Use $n+2<n+3$ to choose the factors in the correct order. |
| 40 | 6a5266 | AK4 | Determines the factor pairs of 130 | List all factor pairs of the stated number of dots. |
| 41 | 6a5266 | R3 | Establishes that no factor pair of 130 is consecutive | Check whether any factor pair differs by one. |
| 42 | 6a5266 | R4 | Concludes that 130 cannot have the form "their" $(n+2)(n+3)$ | Conclude that the stated total cannot be written in the form of your $(n+2)(n+3)$. |
| 43 | 6a5278 | CK1 | Recognises that $fg(x)=f(g(x))$ | Recognise that $fg(x)=f(g(x))$. |
| 44 | 6a5278 | AK1 | Substitutes $x^2$ into $f$ | Substitute $x^2$ into $f$. |
| 45 | 6a5278 | CK2 | Forms $x^2+1=5$ using "their" composite function | Use your composite function to form $x^2+1=5$. |
| 46 | 6a5278 | AK3 | Solves to obtain $x=\pm2$ | Solve the equation to obtain $x=\pm2$. |
| 47 | 6a5278 | CK3 | Recognises that $gf(x)=g(f(x))$ | Recognise that $gf(x)=g(f(x))$. |
| 48 | 6a5278 | R2 | Applies $f$ and then $g$ to "their" raw score | Apply $f$ and then $g$ to your raw score. |
| 49 | 6a5278 | R4 | States that the adjustments cannot be applied in either order because "their" $gf(x)$ is not $5$ | State that the adjustments cannot be applied in either order because your $gf(x)$ is not $5$. |
| 50 | 6a528f | CK1 | Uses $-3$ as the first component of $\overrightarrow{OA}$ | Read the horizontal coordinate of station A from the graph and use it as the first component of $\overrightarrow{OA}$. |
| 51 | 6a528f | CK2 | Uses $2$ as the second component of $\overrightarrow{OA}$ | Read the vertical coordinate of station A from the graph and use it as the second component of $\overrightarrow{OA}$. |
| 52 | 6a528f | CK3 | Uses $2$ as the first component of $\overrightarrow{OB}$ | Read the horizontal coordinate of station B from the graph and use it as the first component of $\overrightarrow{OB}$. |
| 53 | 6a528f | CK4 | Uses $4$ as the second component of $\overrightarrow{OB}$ | Read the vertical coordinate of station B from the graph and use it as the second component of $\overrightarrow{OB}$. |
| 54 | 6a528f | R1 | Forms $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Form the displacement by writing $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 55 | 6a528f | AK1 | Subtracts the first components of "their" position vectors | Subtract the first component of your $\overrightarrow{OA}$ from the first component of your $\overrightarrow{OB}$. |
| 56 | 6a528f | AK2 | Subtracts the second components of "their" position vectors | Subtract the second component of your $\overrightarrow{OA}$ from the second component of your $\overrightarrow{OB}$. |
| 57 | 6a528f | R2 | Forms $\overrightarrow{OC}=\overrightarrow{OB}+2\overrightarrow{AB}$ using "their" $\overrightarrow{AB}$ | Use your $\overrightarrow{AB}$ to form $\overrightarrow{OC}=\overrightarrow{OB}+2\overrightarrow{AB}$. |
| 58 | 6a528f | AK3 | Finds twice "their" $\overrightarrow{AB}$ | Multiply each component of your $\overrightarrow{AB}$ by $2$. |
| 59 | 6a528f | R3 | Adds "their" doubled displacement to "their" $\overrightarrow{OB}$ | Add your doubled displacement component by component to your $\overrightarrow{OB}$. |
| 60 | 6a52ab | CK1 | Recognises that the angle subtended by diameter $PQ$ at the circumference is a right angle | Use the fact that a diameter subtends a right angle at the circumference to identify the angle opposite $PQ$. |
| 61 | 6a52ab | CK2 | Recognises from the coordinates that $PA=AQ$ | Calculate the coordinate distances $PA$ and $AQ$ and compare them to show that they are equal. |
| 62 | 6a52ab | AK2 | Uses $\left(180°-\text{their }\angle PAQ\right)\div2$ to find each base angle | Calculate each base angle using $\left(180°-\text{your }\angle PAQ\right)\div2$. |
| 63 | 6a52ab | CK3 | Identifies the angle between tangent $AT$ and chord $AQ$ with the angle in the alternate segment | Use the alternate-segment theorem to match the angle between tangent $AT$ and chord $AQ$ to the angle in the opposite segment. |
| 64 | 6a52ab | AK3 | Uses $P$, $O$ and $Q$ collinear to equate $\angle APQ$ and $\angle QPA$ | Use the collinearity of $P$, $O$ and $Q$ to equate $\angle APQ$ and $\angle QPA$. |
| 65 | 6a52ab | CK4 | Recognises that $TQ\perp OQ$, so $TQ$ is a tangent at $Q$ | Show that $TQ\perp OQ$ from the two gradients, then conclude that $TQ$ is a tangent at $Q$. |
| 66 | 6a52ab | R3 | Uses the alternate-segment angle to obtain $\angle TQA=\text{their }\angle APQ$ | Use the alternate-segment angle to write $\angle TQA=\text{your }\angle APQ$. |
| 67 | 6a52ab | AK4 | Uses angle sum of triangle $ATQ$: $180°-\text{their }\angle TAQ-\text{their }\angle TQA$ | Find the remaining angle in triangle $ATQ$ using $180°-\text{your }\angle TAQ-\text{your }\angle TQA$. |
| 68 | 6a52b3 | CK1 | States $\vec{PQ}=\vec{OQ}-\vec{OP}$ | Find $\vec{PQ}$ by subtracting $\vec{OP}$ from $\vec{OQ}$. |
| 69 | 6a52b3 | CK2 | Recognises that each term in $\vec{PQ}$ is multiplied by $2$ | Multiply each component of your $\vec{PQ}$ by $2$ to obtain $\vec{QR}$. |
| 70 | 6a52b3 | CK3 | States $\vec{OR}=\vec{OQ}+\vec{QR}$ | Find $\vec{OR}$ by adding $\vec{OQ}$ and $\vec{QR}$. |
| 71 | 6a52b3 | AK3 | Adds corresponding components of $\vec{OQ}$ and "their" $\vec{QR}$ | Add the corresponding components of $\vec{OQ}$ and your $\vec{QR}$. |
| 72 | 6a52b3 | R2 | Uses "their" $\vec{OR}$ to obtain $\vec{OS}$ and forms $\vec{PS}=\vec{OS}-\vec{OP}$ | Use your $\vec{OR}$ to find $\vec{OS}$, then form $\vec{PS}=\vec{OS}-\vec{OP}$. |
| 73 | 6a52b3 | R3 | Concludes parallelogram since "their" $\vec{PS}$ equals "their" $\vec{QR}$ | Conclude that $PQRS$ is a parallelogram by showing that your $\vec{PS}$ equals your $\vec{QR}$. |
| 74 | 6a52bb | AK1 | Calculates $6 \times 2 = 12$ | Multiply the frequency by the corresponding value in the first row. |
| 75 | 6a52bb | AK2 | Calculates $7 \times 3 = 21$ | Multiply the frequency by the corresponding value in the second row. |
| 76 | 6a52bb | AK3 | Calculates $8 \times 4 = 32$ | Multiply the frequency by the corresponding value in the third row. |
| 77 | 6a52bb | AK4 | Calculates $9 \times 1 = 9$ | Multiply the frequency by the corresponding value in the fourth row. |
| 78 | 6a52bb | CK3 | Recognises that a sample statistic estimates a population parameter | Identify the sample statistic as an estimate of the population parameter. |
| 79 | 6a52bb | R2 | States that the sample does not support the claim | Compare your sample mean with the claimed 8 hours and say which way it falls. |
| 80 | 6a52bb | R3 | Compares "their" sample mean with 8 hours to justify the decision | Compare your sample mean with 8 hours and use the comparison to justify your decision. |
| 81 | 6a52c8 | CK1 | Recognises that $r^3$ must be isolated | Isolate $r^3$ before you solve for $r$. |
| 82 | 6a52c8 | AK1 | Multiplies both sides by $\frac{3}{4\pi}$ to obtain $r^3=\frac{3V}{4\pi}$ | Multiply both sides by $\frac{3}{4\pi}$ to obtain $r^3=\frac{3V}{4\pi}$. |
| 83 | 6a52c8 | R1 | Takes the cube root of both sides to show the required result | Take the cube root of both sides to write $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 84 | 6a52c8 | CK2 | Substitutes $V=36\pi$ into the expression for $r$ | Substitute the given value of $V$, including its $\pi$ factor, into your expression for $r$. |
| 85 | 6a52c8 | AK2 | Simplifies $\frac{3(36\pi)}{4\pi}$ to $27$ | Cancel the common $\pi$ factor and simplify $\frac{3V}{4\pi}$ after substituting. |
| 86 | 6a52c8 | CK3 | Reads the permitted radius interval as from $2$ m to $4$ m from the number line | Read the two endpoints of the permitted radius interval directly from the number line. |
| 87 | 6a52c8 | R2 | Compares "their" radius with the interval from $2$ m to $4$ m | Compare your radius with the permitted interval you read from the number line. |
| 88 | 6a52c8 | R3 | Concludes that the tank meets the requirement with a valid reason | Conclude that the tank meets the requirement because your radius lies within the permitted interval. |
| 89 | fe84a7 | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Find the displacement by using $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 90 | fe84a7 | AK1 | Subtracts components to obtain $\begin{pmatrix}5\\3\end{pmatrix}$ | Subtract the corresponding components to write $\overrightarrow{AB}$ as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 91 | fe84a7 | CK2 | Uses $\overrightarrow{BC}=2\times$ "their" $\overrightarrow{AB}$ | Multiply your $\overrightarrow{AB}$ by $2\times$ to find $\overrightarrow{BC}$. |
| 92 | fe84a7 | AK2 | Calculates $\overrightarrow{BC}=\begin{pmatrix}10\\6\end{pmatrix}$, or equivalent follow-through value | Double each component of your $\overrightarrow{AB}$ and write $\overrightarrow{BC}$ as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 93 | fe84a7 | CK3 | Uses $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{BC}$ | Find the position vector of $C$ by using $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{BC}$. |
| 94 | fe84a7 | AK3 | Adds vectors to obtain $\begin{pmatrix}12\\11\end{pmatrix}$, or correct follow-through from "their" $\overrightarrow{BC}$ | Add the corresponding components of $\overrightarrow{OB}$ and your $\overrightarrow{BC}$ to write $\overrightarrow{OC}$ as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 95 | fe84a7 | CK4 | Recognises that the boundary point with ordinate $11$ has abscissa $10$ | Keep the ordinate unchanged and use the greatest permitted abscissa on the boundary. |
| 96 | fe84a7 | R1 | Identifies that "their" point $C$ is outside the permitted area because its abscissa exceeds $10$ | Compare the abscissa of your point $C$ with the permitted maximum to decide whether it lies outside the area. |
| 97 | fe84a7 | R2 | Selects $(10,11)$, or the corresponding nearest point from "their" position vector, as the target point | Choose the nearest permitted boundary point with the same ordinate as your point $C$. |
| 98 | fe84a7 | R3 | Finds target position minus "their" $\overrightarrow{OC}$ to obtain $\begin{pmatrix}-2\\0\end{pmatrix}$ | Subtract your $\overrightarrow{OC}$ from the target position vector and express the displacement as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 99 | fe84af | CK1 | Identifies gradient $2$ and $y$-intercept $1$ from the graph | Read the rise over run and the point where the line crosses the $y$-axis directly from the graph. |
| 100 | fe84af | CK2 | Recognises that $fg(x)=f(g(x))$ | Write the composite in the correct order as $fg(x)=f(g(x))$. |
| 101 | fe84af | AK2 | Substitutes $x^2$ into "their" rule for $f$ | Substitute $x^2$ into your rule for $f$. |
| 102 | fe84af | CK3 | Recognises that $gf(x)=g(f(x))$ | Write the composite in the correct order as $gf(x)=g(f(x))$. |
| 103 | fe84af | AK4 | Substitutes "their" $f(x)$ into $g$, giving $(2x+1)^2$ | Put your expression for $f(x)$ into $g$ and square the resulting bracket. |
| 104 | fe84af | R1 | Compares "their" composite expressions and states $fg\ne gf$ | Compare your two composite expressions and state $fg\ne gf$ if they are different. |
| 105 | fe84af | R2 | Uses $gf(3)$ for $f$ followed by $g$ and $fg(3)$ for $g$ followed by $f$, follow-through on "their" composites | For $f$ followed by $g$, use $gf(3)$, and for $g$ followed by $f$, use $fg(3)$ with your own composite expressions. |
| 106 | fe84b7 | R1 | Determines an increase of 3 tiles between consecutive figures | Compare the tile totals in two consecutive figures and find the same increase each time. |
| 107 | fe84b7 | CK1 | Recognises that $3n$ represents the increase in tiles for Figure $n$ | Identify the term that gives the repeated tile increase for Figure $n$. |
| 108 | fe84b7 | CK2 | Determines the constant adjustment of 2 tiles | Find the fixed number of tiles left after accounting for the repeated increase. |
| 109 | fe84b7 | R2 | Forms $T=3n+2$ using "their" increase | Write a rule for $T$ using your increase and your fixed adjustment. |
| 110 | fe84b7 | CK3 | Forms $3n+2=35$ using "their" rule | Set your rule equal to the given number of tiles. |
| 111 | fe84b7 | AK1 | Subtracts 2 from both sides, giving $3n=33$ | Subtract the fixed adjustment from both sides of your equation. |
| 112 | fe84b7 | AK2 | Divides "their" 33 by "their" 3 | Divide your resulting total by your repeated increase. |
| 113 | fe84b7 | R3 | Interprets the solution as the number of the tile figure | State which figure number your solution represents. |
| 114 | fe84c4 | CK1 | Identifies that radii $OA$ and $OB$ are perpendicular to tangents $PA$ and $PB$. | Use the fact that each radius is perpendicular to its tangent, so $OA \perp PA$ and $OB \perp PB$. |
| 115 | fe84c4 | AK1 | Uses the angle sum of quadrilateral $OAPB$: $360-90-90-48$. | Subtract the two right angles and the given angle from $360-90-90-48$ to find the remaining angle in quadrilateral $OAPB$. |
| 116 | fe84c4 | CK2 | Recognises that the angle at the centre is twice the angle at the circumference on arc $AB$. | Use the circle theorem that the angle at the centre is twice the angle at the circumference standing on arc $AB$. |
| 117 | fe84c4 | AK2 | Halves "their" $\angle AOB$. | Divide your earlier $\angle AOB$ by $2$ to find $\angle ACB$. |
| 118 | fe84c4 | CK3 | Recognises that the angles in triangle $ABC$ sum to $180°$. | Use the fact that the angles in triangle $ABC$ add to $180°$. |
| 119 | fe84c4 | AK3 | Calculates $180-42-\text{"their" }\angle ACB$. | Calculate $180-42-\text{your earlier }\angle ACB$ to find $\angle CBA$. |
| 120 | fe84c4 | CK4 | Identifies $\angle CBA$ as the angle in the alternate segment for chord $CA$. | Identify $\angle CBA$ as the angle in the alternate segment made by chord $CA$. |
| 121 | fe84c4 | AK4 | States "their" $\angle CBA$ as the required angle between a tangent at $C$ and chord $CA$. | State your $\angle CBA$ as the angle between a tangent at $C$ and chord $CA$. |
| 122 | fe84c4 | R3 | Compares $66°$ with "their" required angle and decides that they are unequal. | Compare $66°$ with your required angle and conclude that the two angles are unequal. |
| 123 | fe84c4 | R4 | Justifies that the proposed line is not a tangent using the alternate-segment theorem. | Use the alternate-segment theorem to conclude that the proposed line is not a tangent at $C$ because the angles do not match. |
| 124 | fe84cc | CK1 | Identifies $QR$ as opposite the $30^\circ$ angle | Identify $QR$ as the side opposite the $30^\circ$ angle. |
| 125 | fe84cc | CK2 | Selects the tangent ratio | Choose the tangent ratio because it links the opposite side to the adjacent side. |
| 126 | fe84cc | AK1 | Substitutes into $\tan 30^\circ=\frac{QR}{45}$ | Substitute the known adjacent length into $\tan 30^\circ=\frac{QR}{45}$. |
| 127 | fe84cc | AK2 | Evaluates $QR=45\tan30^\circ$ | Rearrange and evaluate $QR=45\tan30^\circ$. |
| 128 | fe84cc | R1 | Gives $26.0\text{ m}$ correct to 1 decimal place | Round your calculated mast height to 1 decimal place and state it in metres. |
| 129 | fe84cc | CK3 | Identifies $PR$ as the hypotenuse of the right-angled triangle | Identify $PR$ as the hypotenuse because it is opposite the right angle. |
| 130 | fe84cc | AK3 | Uses $\frac{\text{their }QR}{\sin30^\circ}$ to find $PR$ | Divide your $QR$ by $\sin30^\circ$ to find $PR$, using $\frac{QR}{\sin30^\circ}$. |
| 131 | fe84cc | AK4 | Evaluates $PR=\frac{25.980\ldots}{\sin30^\circ}=51.961\ldots$ | Divide your height $QR$ by $\sin30^\circ$ to find $PR$. |
| 132 | fe84cc | R2 | Gives $52.0\text{ m}$ correct to 1 decimal place | Round your calculated cable length to 1 decimal place and state it in metres. |
| 133 | fe84cc | R3 | Concludes that the cable is not long enough since "their" $PR>51\text{ m}$ | Compare your $PR$ with $51\text{ m}$ and conclude that the cable is not long enough if your $PR>51\text{ m}$. |
| 134 | fe84d4 | CK1 | Identifies the damaged frequency as $20$ out of $100$ | Use the table to write the damaged frequency as a fraction of the total number of bags. |
| 135 | fe84d4 | CK2 | Selects the joint frequency $8$ out of $100$ | Select the table entry that represents bags which are both damaged and underweight, then write it over the total number of bags. |
| 136 | fe84d4 | CK3 | Identifies $P(\text{underweight}) = \frac{30}{100} = 0.3$ | Calculate $P(\text{underweight})$ by writing $\frac{\text{underweight frequency}}{\text{total frequency}}$ and converting it to a decimal. |
| 137 | fe84d4 | R1 | Multiplies probabilities for the independent events using $0.2 \times 0.3$ | For independent events, multiply $P(\text{damaged}) \times P(\text{underweight})$ to find the theoretical probability. |
| 138 | fe84d4 | R2 | Finds the difference between “their” experimental and theoretical probabilities | Subtract your theoretical probability from your experimental probability to find your difference. |
| 139 | fe84d4 | CK4 | States that “their” difference is greater than $0.01$ | Compare your difference with $0.01$ and state whether it is greater. |
| 140 | fe84d4 | R3 | Concludes that the shopkeeper should not use the model | Use your comparison to decide whether the shopkeeper should use the independent-events model. |
| 141 | d9c1e8 | CK1 | Recognises that $\overrightarrow{AB}$ is found by subtracting the coordinates of $A$ from those of $B$. | You find $\overrightarrow{AB}$ by subtracting each coordinate of $A$ from the corresponding coordinate of $B$. |
| 142 | d9c1e8 | AK1 | Subtracts correctly to obtain $\begin{pmatrix}3\\4\end{pmatrix}$. | You subtract the coordinates carefully and write the resulting vector as $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 143 | d9c1e8 | CK2 | Uses $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$. | You use $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$ to find the magnitude. |
| 144 | d9c1e8 | AK2 | Evaluates $\sqrt{3^2+4^2}$. | You square both vector components, add the results, and evaluate the square root $\sqrt{a^2+b^2}$. |
| 145 | d9c1e8 | CK3 | Recognises that a point on the $x$-axis has second coordinate $0$. | You write the point on the $x$-axis with $0$ as its second coordinate. |
| 146 | d9c1e8 | AK3 | Uses $\|x-1\|=$ 'their' magnitude of $\overrightarrow{AB}$ to obtain $x=6$ or $x=-4$. | You use $\|x-1\|=$ your magnitude of $\overrightarrow{AB}$ and solve for both possible values of $x$. |
| 147 | d9c1e8 | R2 | Uses the condition $AC=AB$ with 'their' magnitude from part (b). | You set $AC=AB$ by using your magnitude of $\overrightarrow{AB}$ as the length of $AC$. |
| 148 | d9c1e8 | R3 | Selects $x=6$, since $C$ is to the right of $A$, and gives $(6,0)$. | You choose the solution to the right of $A$ and write the point with second coordinate $0$. |
| 149 | d9c1f0 | CK1 | Recognises that $1$ tonne $= 1 000 000$ g | Use the tonne-to-gram conversion before calculating the mass in grams. |
| 150 | d9c1f0 | AK1 | Multiplies $1.274$ by $1 000 000$ | Multiply $1.274$ by $1 000 000$ to express the mass in grams. |
| 151 | d9c1f0 | CK2 | Divides "their" mass in grams by $350$ | Divide your mass in grams by $350$ to find the number of bags. |
| 152 | d9c1f0 | CK3 | Recognises that each carton holds $18$ bags | Use $18$ as the number of bags that fit in each carton. |
| 153 | d9c1f0 | AK3 | Obtains quotient $202$ on dividing "their" number of bags by $18$ | Divide your number of bags by $18$ and use the whole-number quotient for the full cartons. |
| 154 | d9c1f0 | R1 | Interprets the remainder as $4$ bags left after full cartons are packed | Interpret the remainder as the number of bags left after packing as many full cartons as possible. |
| 155 | d9c1f0 | CK4 | Establishes that "their" number of full cartons is sufficient for the $200$-carton order | Compare your number of full cartons with the $200$ cartons required to decide whether the order can be packed. |
| 156 | d9c1f0 | CK5 | Recognises that the load masses must be compared in the same unit | Convert or express both load masses in the same unit before comparing them. |
| 157 | d9c1f0 | R2 | Forms the mass of the order as $200 \times 18 \times 350$ g | Calculate the order mass in grams using $200 \times 18 \times 350$. |
| 158 | d9c1f0 | R3 | Converts "their" mass of the order to tonnes | Convert your mass of the order from grams to tonnes. |
| 159 | d9c1f0 | R4 | Concludes that one trip is not possible since "their" order mass exceeds $1.20$ tonnes | Compare your order mass in tonnes with $1.20$ tonnes and state whether one trip is possible. |
| 160 | d9c1f8 | CK1 | Divides both sides by $2\pi$ to isolate the square root | Divide both sides by $2\pi$ so that the square root is isolated. |
| 161 | d9c1f8 | AK1 | Squares both sides correctly | Square both sides of the equation to remove the square root while keeping both sides equal. |
| 162 | d9c1f8 | CK2 | Selects $T = 2.20$ and $g = 9.8$ for substitution into the expression for $l$ | Use $T=2.20$ and $g=9.8$ when substituting into the formula. |
| 163 | d9c1f8 | AK3 | Substitutes into $l = \frac{gT^2}{4\pi^2}$ using "their" expression from part (a) | Substitute $T$ and $g$ into the expression you obtained in part (a), $l = \frac{gT^2}{4\pi^2}$. |
| 164 | d9c1f8 | AK4 | Evaluates "their" expression, giving $1.201\ldots\text{ m}$ | Evaluate the expression you obtained and keep the unrounded result as $\ldots\text{ m}$ before rounding. |
| 165 | d9c1f8 | R1 | Expresses "their" length correct to 3 significant figures | Round your length to 3 significant figures and state it in $\text{m}$. |
| 166 | d9c1f8 | CK3 | Identifies $1.15\text{ m}$ as the limiting height of the case | Use the case's limiting height, $1.15\text{ m}$, for the fit check. |
| 167 | d9c1f8 | R2 | Compares "their" pendulum length with $1.15\text{ m}$ | Compare your pendulum length directly with $1.15\text{ m}$. |
| 168 | d9c1f8 | R3 | Concludes that the pendulum will not fit | Compare your length with the 1.15 m case height and say which is larger. |
| 169 | d9c205 | CK1 | Forms products of each number of goals and its corresponding frequency | Multiply each number of goals by the height of its matching bar, then add the products. |
| 170 | d9c205 | R1 | Uses 20, the number of selected players, as the denominator | Divide the total number of goals by the number of selected players. |
| 171 | d9c205 | R2 | Identifies 13 selected players who scored at least 2 goals and uses the scale factor $80\div20$ | Count the selected players who score at least two goals, then scale this count using $80\div20$. |
| 172 | d9c205 | CK2 | Identifies the mean from the selected players as a sample statistic | State that the mean calculated from the selected players is a sample statistic. |
| 173 | d9c205 | CK3 | Identifies a mean calculated from all 80 players as a population parameter | State that a mean calculated from all players in the population is a population parameter. |
| 174 | d9c205 | R3 | Explains that the selected players may not represent the full population | Explain that the selected players may not be representative of the whole population, so the means can differ. |
| 175 | d9c20d | R1 | Reads $g(\text{their }7)=3$ correctly from the graph | Take your answer from part (a) as the input on g's graph and read the output. |
| 176 | d9c20d | CK1 | Identifies $f$ and $g$ as inverse functions | You use the reflection in $y=x$ to identify the relationship between $f$ and $g$. |
| 177 | d9c20d | CK2 | Recognises that the inverse reverses the input and output | You reverse the input and output when finding the inverse function. |
| 178 | d9c20d | AK2 | Interchanges the variables and rearranges $y=2x+1$ to make $y$ the subject | You interchange $x$ and $y$ in $y=2x+1$ and rearrange to make $y$ the subject. |
| 179 | d9c20d | R2 | States $g:x\to \frac{x-1}{2}$ | You state the inverse rule in the form $g:x\to\frac{\text{expression}}{\text{constant}}$. |
| 180 | d9c20d | CK3 | Forms the composition $g(f(x))$ | You write the composition $g(f(x))$ before simplifying it. |
| 181 | d9c20d | AK3 | Substitutes $f(x)=2x+1$ into $g$ | You replace the input of $g$ with $f(x)$ using the given rule for $f$. |
| 182 | d9c20d | R3 | Simplifies to conclude $g(f(x))=x$ | You simplify the composition fully and state the resulting identity. |
| 183 | d9c215 | CK1 | Identifies 3 as the number added for each successive figure | Compare consecutive figures and identify how many plants are added each time. |
| 184 | d9c215 | CK2 | Identifies 1 as the fixed number of plants in the pattern | Use Figure 1 and remove the repeating contribution to identify the fixed number of plants. |
| 185 | d9c215 | R1 | Combines the repeating and fixed parts to form $3n+1$ | Combine the repeating part and the fixed part into one expression in terms of $n$. |
| 186 | d9c215 | CK3 | Selects "their" expression for the number of plants in Figure $n$ | Use your expression for the number of plants in Figure $n$. |
| 187 | d9c215 | CK4 | Forms $3n+1=52$ | Set the expression for the number of plants equal to the required total. |
| 188 | d9c215 | AK2 | Subtracts 1 from both sides | Subtract the fixed number from both sides of your equation. |
| 189 | d9c215 | AK3 | Divides by 3 to obtain $n=17$ | Divide both sides by the repeating number to isolate $n$. |
| 190 | d9c215 | R2 | Interprets "their" value as a valid figure number | State the figure number represented by your value of $n$. |
| 191 | d9c215 | CK5 | Forms $3n+1=50$ for the remaining plants | First find the remaining plants, then set the pattern expression equal to that amount. |
| 192 | d9c215 | R3 | Solves to obtain $n=\frac{49}{3}$ | Rearrange the equation and divide by the coefficient of $n$, leaving $n$ as a fraction. |
| 193 | d9c215 | R4 | Concludes that no complete display is possible because a figure number must be a whole number | Conclude that the display is incomplete because a figure number must be a whole number. |
| 194 | d9c21d | CK1 | Recognises that angle $PHQ$ is the difference between the two bearings from $H$: $090°-035°$. | Subtract the smaller bearing from the larger bearing to find $\angle PHQ$. |
| 195 | d9c21d | CK2 | Selects the cosine rule using the included angle at $H$. | Use the cosine rule with the included angle at $H$ between the two known sides. |
| 196 | d9c21d | AK2 | Substitutes correctly into $PQ^2=10^2+14^2-2(10)(14)\cos(\text{their }55°)$. | Substitute the given side lengths and your angle at $H$ into $PQ^2=a^2+b^2-2ab\cos(\text{your angle})$. |
| 197 | d9c21d | AK3 | Processes to obtain $PQ\approx11.6369$ km. | Evaluate the cosine-rule expression and take the positive square root to obtain $PQ\approx\text{a decimal distance}$. |
| 198 | d9c21d | R1 | Expresses the distance as $11.6$ km, correct to 3 significant figures. | Round your distance to three significant figures and include the unit km. |
| 199 | d9c21d | CK3 | States the bearing of $H$ from $P$ as $215°$. | Reverse the bearing from $H$ to $P$ by adding $180°$ and write it as a three-figure bearing. |
| 200 | d9c21d | AK4 | Calculates angle $HPQ\approx80.3°$ using "their" value of $PQ$. | Use your value of $PQ$ in the cosine rule and record $\angle HPQ\approx\text{your calculated angle}$. |

## Batch 2 — approved (500 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 500 rows. Rows 303–312 put in the imperative; 334, 335, 337 lose “using $\times$”; 25 says “under the square root”; 318 “keep the decimal before choosing whole units”; 352 “factorisations”.

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | d9c21d | R2 | Uses the correct direction at $P$: $215°-\text{their angle }HPQ$. | Use the direction from $P$ to $H$ as $215°$ and subtract your angle $HPQ$ to find the bearing of $Q$ from $P$. |
| 2 | d9c237 | CK1 | Selects the tangent ratio for triangle $PRT$ | Choose the tangent ratio in triangle $PRT$ by relating the opposite side to the adjacent side. |
| 3 | d9c237 | AK1 | Evaluates $PR=45\div\tan30^\circ$ | Calculate $PR=45\div\tan30^\circ$ using your calculator. |
| 4 | d9c237 | R1 | Expresses $77.9\text{ m}$ correct to 3 significant figures | Round your value for $PR$ to 3 significant figures and write the unit as $\text{m}$. |
| 5 | d9c237 | CK2 | Forms $QR=$ "their" $PR-20$ | Find $QR$ by subtracting $20$ from your $PR$. |
| 6 | d9c237 | AK2 | Uses $\tan\theta=45\div$ "their" $QR$ to calculate $\theta$ | Use $\tan\theta=45\div$ your $QR$ and calculate $\theta$. |
| 7 | d9c237 | R2 | Expresses "their" angle correct to 1 decimal place | Round your angle to 1 decimal place. |
| 8 | d9c237 | CK3 | Forms the increase as "their" angle from (b) minus $30^\circ$ | Find the increase by subtracting $30^\circ$ from your angle from part (b). |
| 9 | d9c237 | R3 | States incorrect because "their" increase is less than $15^\circ$ | Compare your increase with $15^\circ$ and state that the captain is incorrect if it is less. |
| 10 | d9c244 | CK1 | Recognises that the students outside both sets are in $(A \cup B)'$ | Identify the region outside both circles as $(A \cup B)'$. |
| 11 | d9c244 | AK1 | Subtracts 10 from 50 to obtain $n(A \cup B)=40$ | Subtract the number outside both sets from the total to find $n(A \cup B)$. |
| 12 | d9c244 | CK2 | Identifies $A \cup B$ as the three regions inside the circles | Include all three regions inside the circles when you identify $A \cup B$. |
| 13 | d9c244 | R1 | Forms $x+12+8=$ "their" $n(A \cup B)$ | Form an equation by setting $x+12+8$ equal to your value of $n(A \cup B)$. |
| 14 | d9c244 | AK2 | Solves to obtain $x=20$ | Solve your equation for $x$. |
| 15 | d9c244 | CK3 | Identifies that set $A$ includes the patty-only and common regions | Include both the patty-only region and the common region in set $A$. |
| 16 | d9c244 | AK3 | Adds "their" $x$ and 8 to obtain $n(A)=28$ | Add your value of $x$ and 8 to find $n(A)$. |
| 17 | d9c244 | CK5 | Recognises that equal sets must have the same cardinality | Compare cardinalities, because equal sets must contain the same number of elements. |
| 18 | d9c244 | R2 | Uses "their" value of $n(A)$ in the comparison | Use your value of $n(A)$ in the comparison. |
| 19 | d9c244 | R3 | Uses "their" value of $n(B')$ in the comparison | Use your value of $n(B')$ in the comparison. |
| 20 | d9c244 | R4 | Concludes that the sets are not equal because their cardinalities differ | Conclude that the sets are not equal if the cardinalities differ. |
| 21 | d9c24c | CK1 | Forms $\vec{PR}=\vec{PQ}+\vec{QR}$. | Form $\vec{PR}=\vec{PQ}+\vec{QR}$ before calculating the resultant movement. |
| 22 | d9c24c | AK1 | Adds corresponding components to obtain $\begin{pmatrix}5\\3\end{pmatrix}$. | Add the matching components of the two vectors to make one column vector, such as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 23 | d9c24c | CK2 | Uses $\|\vec{PR}\|=\sqrt{x^2+y^2}$ with components of "their" $\vec{PR}$. | Use the components of your earlier $\vec{PR}$ in $\|\vec{PR}\|=\sqrt{x^2+y^2}$. |
| 24 | d9c24c | AK2 | Substitutes components of "their" vector to form $\sqrt{5^2+3^2}$, or equivalent. | Substitute the two components of your earlier vector into the square-root calculation $\sqrt{x^2+y^2}$. |
| 25 | d9c24c | AK3 | Evaluates to $\sqrt{34}$. | Simplify the value under the square root and leave the result exact. |
| 26 | d9c24c | R1 | Expresses the magnitude in surd form. | State the magnitude as a surd rather than changing it to a decimal. |
| 27 | d9c24c | CK3 | Recognises that the additional $0.40$ m must be added to "their" direct distance. | Add the stated extra length to your earlier direct distance because the rail must include both. |
| 28 | d9c24c | AK4 | Adds $0.40$ to "their" magnitude. | Add the stated extra length to your earlier magnitude. |
| 29 | d9c24c | R2 | Gives "their" minimum rail length correct to 2 decimal places. | Write your minimum required rail length rounded to two decimal places. |
| 30 | d9c24c | R3 | Selects the shortest available rail which is at least "their" required length. | Choose the shortest available rail that is at least as long as your required length. |
| 31 | d9c254 | CK1 | Recognises that $\vec{AB}=\vec{OB}-\vec{OA}$ | Find $\vec{AB}$ by subtracting $\vec{OA}$ from $\vec{OB}$. |
| 32 | d9c254 | CK2 | States that equal vectors have the same magnitude and direction | State that equal vectors have the same magnitude and direction. |
| 33 | d9c254 | R1 | Compares "their" $\vec{AB}$ and "their" $\vec{DC}$ to establish that the vectors are equal | Compare your $\vec{AB}$ and your $\vec{DC}$ results to show that they are equal. |
| 34 | d9c254 | CK3 | States the condition that both pairs of opposite sides are equal and parallel | State that both pairs of opposite sides must be equal and parallel. |
| 35 | d9c254 | R2 | Uses "their" vector results to establish $\vec{AB}=\vec{DC}$ and $\vec{AD}=\vec{BC}$ | Use your vector results to show that $\vec{AB}=\vec{DC}$ and $\vec{AD}=\vec{BC}$. |
| 36 | d9c254 | R3 | Concludes that $ABCD$ is a parallelogram | Conclude that $ABCD$ is a parallelogram. |
| 37 | d9c25c | CK1 | Identifies the two frequencies for girls as $12$ and $10$ | Locate the two table frequencies that belong to girls in the two events. |
| 38 | d9c25c | AK1 | Adds $12 + 10$, giving $22$ | Add the two frequencies for girls to find the total number of girls. |
| 39 | d9c25c | CK2 | Uses the totals for girls and boys | Use the total for girls and the total for boys. |
| 40 | d9c25c | AK2 | Adds $22 + 18$, giving $40$ | Add the girls total and the boys total to find the total number of participants. |
| 41 | d9c25c | CK3 | Identifies $22$ girls as the favourable outcomes | Use the total number of girls as the favourable outcomes. |
| 42 | d9c25c | AK3 | Forms $22$ divided by "their" total and obtains $\frac{11}{20}$ | Divide the girls total by your total, writing the probability as a fraction such as $\frac{\text{girls}}{\text{your total}}$, and simplify it. |
| 43 | d9c25c | R1 | Expresses "their" probability in lowest terms | Simplify your probability by dividing the numerator and denominator by a common factor until it is in lowest terms. |
| 44 | d9c25c | R2 | Combines "their" probability of selecting a girl with $\frac{18}{\text{their total}}$ | Add your probability of selecting a girl to the probability of selecting a 200 m participant, written as $\frac{\text{200 m participants}}{\text{your total}}$. |
| 45 | d9c25c | R3 | Subtracts $\frac{10}{\text{their total}}$ for participants counted twice, giving $\frac{3}{4}$ | Subtract the overlap counted twice, written as $\frac{\text{girls in 200 m}}{\text{your total}}$, then simplify the result to lowest terms. |
| 46 | d9c264 | AK1 | Calculates $12 \times 38.50 = 462.00$ | Calculate $12 \times 38.50$ to find the cost of the cement. |
| 47 | d9c264 | AK2 | Calculates $8 \times 72.00 = 576.00$ | Calculate $8 \times 72.00$ to find the cost of the galvanised sheets. |
| 48 | d9c264 | CK2 | Recognises that "their" cost of goods exceeds \$1 000 and qualifies for the discount | Check whether your cost of goods exceeds \$1 000, then decide if you qualify for the discount. |
| 49 | d9c264 | AK3 | Finds $10\%$ of "their" total cost of goods | Find $10\%$ of your total cost of goods to get the discount. |
| 50 | d9c264 | CK3 | Identifies "their" total cost less "their" discount as the discounted cost of goods | Subtract your discount from your total cost of goods to find the discounted cost. |
| 51 | d9c264 | CK4 | Recognises that VAT is charged on discounted goods only | Calculate VAT using only your discounted cost of goods. |
| 52 | d9c264 | CK5 | Recognises that the delivery charge is added separately after VAT | Add the delivery charge separately after calculating VAT. |
| 53 | d9c264 | R1 | Calculates VAT on "their" discounted-goods cost and rounds it to the nearest cent | Calculate VAT on your discounted-goods cost and round the result to the nearest cent. |
| 54 | d9c264 | R2 | Adds "their" discounted-goods cost, VAT and delivery charge | Add your discounted-goods cost, VAT, and delivery charge to find the amount payable. |
| 55 | d9c264 | R3 | Finds the difference between "their" amount payable and \$1 130 | Subtract \$1 130 from your amount payable to find the difference from the budget. |
| 56 | d9c264 | R4 | States cannot pay, based on "their" comparison with the budget | Compare your amount payable with the budget and state whether you can pay. |
| 57 | d9c276 | CK1 | Selects the ratio $\tan 35^\circ=\dfrac{12}{QR}$ | Use the tangent ratio for the right-angled triangle: $\tan 35^\circ=\dfrac{12}{QR}$. |
| 58 | d9c276 | AK1 | Rearranges and substitutes to obtain $QR=\dfrac{12}{\tan 35^\circ}$ | Rearrange the tangent equation and substitute the given height to find $QR=\dfrac{12}{\tan 35^\circ}$. |
| 59 | d9c276 | R1 | Expresses the distance correct to 3 significant figures | Round your distance to 3 significant figures and include the unit m. |
| 60 | d9c276 | AK3 | Adds $16$ to "their" $QR$, giving $PR=33.1\text{ m}$ | Add the given distance to your $QR$ value to find $PR$, and write the result in $\text{m}$. |
| 61 | d9c276 | CK2 | Selects the ratio $\tan \angle SPR=\dfrac{12}{PR}$ | Use tangent with the angle at $P$: $\tan \angle SPR=\dfrac{12}{PR}$. |
| 62 | d9c276 | R2 | Expresses the angle correct to 1 decimal place | Calculate the angle and round your result to 1 decimal place in $^\circ$. |
| 63 | d9c276 | CK3 | Recognises that the calculated angle must be compared with $20^\circ$ | Compare your calculated angle with $20^\circ$ before deciding. |
| 64 | d9c276 | R3 | Justifies the decision using "their" angle as less than $20^\circ$ | State your decision and justify it by showing that your angle is less than $20^\circ$. |
| 65 | d9c283 | CK2 | Recognises that both bearings at $Q$ are measured from the north line at $Q$ | Identify that both directions are measured clockwise from the same north line at $Q$ before comparing them. |
| 66 | d9c283 | AK1 | Calculates $245°-155°=90°$ | Subtract the smaller bearing from the larger bearing to find the angle at $Q$. |
| 67 | d9c283 | CK3 | Selects a suitable relationship for finding $PR$ in triangle $PQR$ | Choose the trigonometric relationship or Pythagoras’ theorem that matches the known sides and angle in triangle $PQR$. |
| 68 | d9c283 | AK2 | Forms a correct expression using $18$, $14$ and “their” angle $PQR$, or uses Pythagoras when “their” angle is $90°$ | Use $18$, $14$ and your earlier $\angle PQR$ in the cosine rule, or use Pythagoras if your earlier $\angle PQR$ is $90°$, to find $PR$. |
| 69 | d9c283 | AK3 | Evaluates the expression to obtain $PR=22.8\ldots$ km | Evaluate your expression and state $PR$ in kilometres to the required decimal precision. |
| 70 | d9c283 | R1 | Expresses the distance correct to $3$ significant figures | Round your distance to $3$ significant figures and include the correct unit. |
| 71 | d9c283 | AK4 | Uses “their” $PR$ to calculate $\angle QPR=37.9\ldots°$ | Use your earlier $PR$ with the appropriate trigonometric ratio to calculate $\angle QPR$. |
| 72 | d9c283 | R2 | Determines that the angle at $P$ is added clockwise to the bearing $065°$ | Add the angle at $P$ clockwise to the starting bearing to obtain the bearing from $P$ to $R$. |
| 73 | d9c290 | CK1 | Recognises that $r^3$ must be isolated before finding $r$ | Rearrange the formula so that $r^3$ stands alone before taking a cube root. |
| 74 | d9c290 | AK1 | Obtains $r^3=\frac{3V}{4\pi}$ | Multiply by the reciprocal of the coefficient of $r^3$ so that $r^3$ is isolated, keeping the result as a fraction such as $\frac{a}{b\pi}$. |
| 75 | d9c290 | R1 | Expresses $r$ in exact cube-root form | Take the cube root after isolating $r^3$ and write $r$ exactly in the form $\sqrt[3]{\frac{a}{b\pi}}$. |
| 76 | d9c290 | CK2 | Identifies $36\pi$ as the value to substitute for $V$ in "their" expression | Identify the given volume containing $\pi$ and substitute it for $V$ in your expression. |
| 77 | d9c290 | R2 | Explains that a radius cannot be negative | Choose the positive root because a radius is a length and cannot be negative. |
| 78 | d9c290 | CK3 | Recognises that the diameter is twice "their" radius | Double your earlier radius to find the diameter. |
| 79 | d9c290 | AK3 | Calculates a diameter of $6$ m from "their" radius | Calculate the diameter by doubling your earlier radius and state the result in metres. |
| 80 | d9c290 | R3 | Matches "their" diameter to model B on the number line | Locate your earlier diameter on the number line and select the model that matches it. |
| 81 | d9c2a2 | CK1 | Selects $18 \times 24$ for the morning delivery | Multiply the morning delivery counts using $18 \times 24$. |
| 82 | d9c2a2 | AK2 | Calculates $7 \times 24$ | Calculate the afternoon packet total using $7 \times 24$. |
| 83 | d9c2a2 | CK2 | Recognises that the total crates are found by adding the two deliveries | Add the numbers of crates in the morning and afternoon deliveries to find the total crates. |
| 84 | d9c2a2 | R1 | Combines “their” two delivery totals to obtain the total number of packets | Add your two delivery totals to obtain the total number of packets. |
| 85 | d9c2a2 | CK3 | Selects division by 8 to find the number of full boxes | Use division by $8$ to find how many full boxes you can make. |
| 86 | d9c2a2 | AK3 | Divides “their” total number of packets by 8 | Divide your total number of packets by $8$. |
| 87 | d9c2a2 | CK5 | Recognises that equal sharing among 7 shops requires division by 7 | Divide the number of full boxes by $7$ to share them equally among the shops. |
| 88 | d9c2a2 | R2 | Obtains 10 full boxes for each shop from “their” number of boxes | Use the whole-number quotient when you divide your number of boxes by $7$ to state how many full boxes each shop receives. |
| 89 | d9c2a2 | R3 | Obtains a remainder of 5 full boxes from “their” number of boxes | Use the remainder when you divide your number of boxes by $7$ to state how many full boxes are left. |
| 90 | d9c2a2 | R4 | Explains that “their” total number of boxes is not divisible by 7 | Explain that your total number of boxes is not divisible by $7$ because the division leaves a non-zero remainder. |
| 91 | d9c2aa | CK2 | States coupon probability as number of coupon cards divided by "their" total number of cards | Write the coupon probability as the number of coupon cards divided by your total number of cards. |
| 92 | d9c2aa | AK2 | Matches "their" six coupon cards to three values with two black cards at each value | Group your coupon cards by value, pairing the two black cards at each value. |
| 93 | d9c2aa | R1 | Identifies $J$, $Q$ and $K$ as the only three values above the cutoff | Check the values above the cutoff and identify $J$, $Q$ and $K$ as the only three. |
| 94 | d9c2aa | CK3 | States the six-card coupon sample space | List every coupon card in the sample space, including each card's value and suit. |
| 95 | d9c2aa | R3 | Uses "their" coupon-card sample space as the outcomes for a coupon winner | Use your coupon-card sample space as the complete set of outcomes for a coupon winner. |
| 96 | d9c2aa | AK3 | Counts three spades in "their" coupon-card sample space | Count the spade cards in your coupon-card sample space. |
| 97 | d9c2c1 | CK1 | Recognises that the input and output must be interchanged to obtain the inverse | Swap the input and output variables before you find the inverse. |
| 98 | d9c2c1 | AK1 | Forms the inverse relation $x=25y+60$ after interchanging variables | After swapping the variables, write the inverse relation as $x=25y+60$. |
| 99 | d9c2c1 | AK2 | Rearranges correctly to obtain $f^{-1}(x)=\frac{x-60}{25}$ | Rearrange the inverse relation to make $y$ the subject, then write $f^{-1}(x)=\frac{x-60}{25}$. |
| 100 | d9c2c1 | CK2 | Selects $f^{-1}$ to convert the bill amount to a number of crates | Use $f^{-1}$ to change the bill amount into a number of crates. |
| 101 | d9c2c1 | CK3 | Recognises that $gf^{-1}(210)$ requires $f^{-1}$ before $g$ | Apply $f^{-1}$ to $210$ first, then apply $g$ to that result. |
| 102 | d9c2c1 | R1 | Uses $f^{-1}$ to translate the bill amount into crates before determining the ice bags | Use $f^{-1}$ to convert the bill amount into crates, then use $g$ to find the number of ice bags. |
| 103 | d9c2c1 | R2 | States that a function and its inverse undo each other | State that a function and its inverse undo each other. |
| 104 | d9c2c1 | R3 | Uses "their" value from (b) to justify $f(f^{-1}(210))=210$ | Use your value from (b) as the input to $f$ to show that $f(f^{-1}(210))=210$. |
| 105 | d9c2c9 | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Form the displacement by using $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 106 | d9c2c9 | AK1 | Subtracts the horizontal components to obtain $1-(-2)=3$ | Subtract the starting horizontal coordinate from the ending horizontal coordinate. |
| 107 | d9c2c9 | AK2 | Subtracts the vertical components to obtain $5-1=4$ | Subtract the starting vertical coordinate from the ending vertical coordinate. |
| 108 | d9c2c9 | CK2 | Applies $\|\mathbf{v}\|=\sqrt{x^2+y^2}$ to 'their' vector | Apply $\|\mathbf{v}\|=\sqrt{x^2+y^2}$ to your displacement vector. |
| 109 | d9c2c9 | AK3 | Substitutes and evaluates $\sqrt{3^2+4^2}=5$, or equivalent follow-through using 'their' components | Substitute your two components into $\sqrt{x^2+y^2}$ and evaluate the result. |
| 110 | d9c2c9 | R1 | Interprets the magnitude as the direct distance $AB$, giving $5$ m | State that the magnitude represents the direct distance from $A$ to $B$, in metres. |
| 111 | d9c2c9 | CK3 | Recognises that acceptance requires a length less than $6$ m | Check whether the rod length is less than the maximum permitted length. |
| 112 | d9c2c9 | R2 | Compares 'their' length with $6$ m correctly | Compare your calculated length correctly with the permitted limit. |
| 113 | d9c2c9 | R3 | Concludes correctly whether the rod is accepted from 'their' comparison | Use your comparison to state whether the rod is accepted. |
| 114 | d9c2ed | CK1 | Selects average speed as distance divided by time | Calculate average speed by dividing the distance travelled by the time taken. |
| 115 | d9c2ed | AK1 | Converts $18\ 000$ m to $18$ km and 45 minutes to $0.75$ h | Convert the first distance from metres to kilometres and the first time from minutes to hours before calculating. |
| 116 | d9c2ed | CK2 | Selects time as distance divided by speed for the second leg | Find the second-leg time by dividing its distance by the average speed. |
| 117 | d9c2ed | AK3 | Divides $30$ by "their" average speed | Divide the second-leg distance by your average speed. |
| 118 | d9c2ed | R1 | Interprets "their" decimal time in hours as hours and minutes | Rewrite your decimal time in hours as whole hours and the equivalent number of minutes. |
| 119 | d9c2ed | CK3 | Recognises that the 10-minute stop at Q must be included | Include the stop at Q when working out the overall journey time. |
| 120 | d9c2ed | CK4 | Identifies that "their" Q-to-R travel time is added after the stop at Q | Add your Q-to-R travel time after the stop at Q using your departure time from Q. |
| 121 | d9c2ed | R2 | Obtains the arrival time using "their" departure time from Q and "their" travel time | Use your departure time from Q and your travel time to work out your arrival time. |
| 122 | d9c2ed | R3 | Compares "their" arrival time with 10:30 a.m. and gives the correct verdict | Compare your arrival time with 10:30 a.m. and state whether it is before that time. |
| 123 | d9c2fd | CK1 | Recognises that reverse bearings differ by 180°. | Use a difference of 180° when you reverse a bearing. |
| 124 | d9c2fd | AK1 | Adds 180° to 055°. | Add 180° to 055° to find the bearing from $W$ to $S$. |
| 125 | d9c2fd | R1 | Uses "their" bearing of $S$ from $W$ as the starting direction for the turn. | Use your bearing of $S$ from $W$ as the direction from which the anticlockwise turn starts. |
| 126 | d9c2fd | CK2 | Recognises that a quarter turn is 90°. | Treat a quarter turn as 90°. |
| 127 | d9c2fd | AK2 | Subtracts 90° from "their" bearing. | Subtract 90° from your bearing to make the anticlockwise quarter turn. |
| 128 | d9c2fd | R2 | States 145° as a three-digit bearing. | Write your resulting bearing in three-digit format. |
| 129 | d9c2fd | CK3 | Recognises that the bearing of $W$ from $C$ is the reverse bearing of $C$ from $W$. | Reverse the bearing from $C$ to $W$ to find the bearing from $W$ to $C$. |
| 130 | d9c2fd | AK3 | Adds 180° to "their" bearing of $C$ from $W$. | Add 180° to your bearing of $C$ from $W$. |
| 131 | d9c2fd | R3 | Concludes that Kemar is incorrect using "their" reverse bearing. | Compare your reverse bearing with Kemar's claim and state whether it agrees. |
| 132 | d9c305 | CK1 | Identifies experimental probability as mango frequency divided by total number of trial spins | Divide the mango frequency by the total number of trial spins to form the experimental probability. |
| 133 | d9c305 | CK2 | Identifies 3 favourable mango sectors from 8 equal sectors | Count the favourable mango sectors and the total number of equal sectors, then write the theoretical probability as favourable sectors over total sectors. |
| 134 | d9c305 | CK3 | Forms the expected-frequency calculation $160\times$ “their” theoretical probability | Calculate the expected mango frequency using $160\times$ your theoretical probability. |
| 135 | d9c305 | R1 | Compares “their” theoretical number with the observed 55 and states greater | Compare your theoretical number with the observed 55 and state whether it is greater. |
| 136 | d9c305 | CK4 | Forms the updated experimental probability as $(55+n)/(160+n)$ | Let $n$ represent further mango results and write the new experimental probability as $(55+n)/(160+n)$. |
| 137 | d9c305 | R2 | Equates $(55+n)/(160+n)$ to “their” theoretical probability | Set $(55+n)/(160+n)$ equal to your theoretical probability. |
| 138 | d9c305 | R3 | Solves the resulting equation to obtain $n=8$ | Multiply through and solve the equation for $n$, then state the least whole number of further spins. |
| 139 | d9c30d | CK1 | Recognises that the displacement $\overrightarrow{HF}$ is the sum of the two displacement vectors | Add the two given displacement vectors to form $\overrightarrow{HF}$. |
| 140 | d9c30d | AK1 | Adds the eastward components: $6+(-2)=4$ | Add the eastward components to find the eastward component of the displacement. |
| 141 | d9c30d | AK2 | Adds the northward components: $8+5=13$ | Add the northward components to find the northward component of the displacement. |
| 142 | d9c30d | CK2 | Selects $\|\mathbf{v}\|=\sqrt{x^2+y^2}$ for the magnitude of a vector | Use $\|\mathbf{v}\|=\sqrt{x^2+y^2}$ to find the magnitude of the displacement vector. |
| 143 | d9c30d | AK3 | Substitutes components from "their" displacement vector: $\sqrt{4^2+13^2}$ | Substitute the components from your displacement vector into $\sqrt{x^2+y^2}$. |
| 144 | d9c30d | AK4 | Calculates $\sqrt{185}$ | Evaluate $\sqrt{x}$ using the value you obtain after adding the squared components. |
| 145 | d9c30d | R1 | Expresses "their" distance correct to 3 significant figures | Round your distance to 3 significant figures. |
| 146 | d9c30d | CK3 | Recognises that the direct distance must not exceed the available fuel range of $14$ km | Check that the direct distance is no greater than the available fuel range of $14$ km. |
| 147 | d9c30d | R2 | Compares "their" distance $HF$ correctly with $14$ km | Compare your distance $HF$ correctly with $14$ km. |
| 148 | d9c30d | R3 | Concludes that the fisherman can make the journey from "their" comparison | Use your comparison to decide whether the fisherman can make the journey. |
| 149 | d9c315 | CK1 | Recognises that the pattern has a constant increase. | Compare consecutive figures and identify the same increase each time. |
| 150 | d9c315 | CK2 | Uses 3 as the coefficient of $n$ from "their" common increase. | Use your common increase as the coefficient of $n$. |
| 151 | d9c315 | CK3 | Identifies 2 as the constant term. | Compare your multiple of $n$ with the first figure to find the constant term. |
| 152 | d9c315 | R1 | Forms a linear rule for the number of seedlings in Figure $n$. | Write a linear rule for the number of seedlings in Figure $n$. |
| 153 | d9c315 | CK4 | Translates “no more than 26” as $D \le 26$. | Translate no more than into an inequality using $D$ and the $\le$ sign. |
| 154 | d9c315 | AK2 | Substitutes "their" expression for $D$ into the inequality. | Substitute your expression for $D$ into the inequality you wrote. |
| 155 | d9c315 | AK3 | Solves "their" linear inequality for $n$. | Solve your linear inequality to make $n$ the subject. |
| 156 | d9c315 | R2 | Restricts the figure number to natural numbers beginning at 1. | Keep only natural-number figure labels, beginning with the first figure. |
| 157 | d9c315 | R3 | States the valid figure numbers in set builder notation using "their" upper bound. | Write the valid figure labels in set-builder notation using $n$, $\in$, $\mathbb{N}$, and $\le$, with your upper bound. |
| 158 | d9c322 | CK1 | Reads $C = 5$ and $C = 8$ from the graph for $n = 1$ and $n = 2$ | Read the charge values from the graph at the first and second bag numbers. |
| 159 | d9c322 | AK1 | Calculates the increase as $3$ tens of dollars, giving \$30 | Subtract the earlier graph charge from the later graph charge, then convert tens of dollars into dollars. |
| 160 | d9c322 | CK2 | Identifies the fixed charge as $C = 2$ when $n = 0$ | Read the fixed charge where the graph crosses the $C$-axis. |
| 161 | d9c322 | AK2 | Uses "their" increase of $3$ tens of dollars per bag with the fixed charge of $2$ | Combine your per-bag increase with the fixed charge to build the relationship. |
| 162 | d9c322 | R1 | Expresses the relationship in the form $C = 3n + 2$ | Write the relationship as an equation for $C$ in terms of $n$. |
| 163 | d9c322 | CK3 | Recognises that \$140 represents $C = 14$ tens of dollars | Convert the given dollar charge into tens of dollars for $C$. |
| 164 | d9c322 | AK3 | Solves "their" equation with $C = 14$ to obtain $n = 4$ | Substitute $C$ into your equation and solve for $n$. |
| 165 | d9c322 | R2 | States that "their" number of bags is a whole number | Check that your number of bags is a whole number. |
| 166 | d9c322 | R3 | Verifies that substituting "their" $n$ into "their" equation gives $C = 14$, representing \$140 | Substitute your $n$ into your equation and check that it gives the stated charge in tens of dollars and in dollars. |
| 167 | d9c32a | CK1 | Recognises that $r^3$ must be isolated before finding $r$ | Isolate $r^3$ before you solve for $r$. |
| 168 | d9c32a | AK1 | Rearranges to obtain $r^3=\frac{3V}{4\pi}$ | Multiply both sides by $\frac{3}{4\pi}$ to isolate $r^3$. |
| 169 | d9c32a | AK2 | Takes the cube root to obtain $r=\sqrt[3]{\frac{3V}{4\pi}}$ | Take the cube root of both sides and write the right-hand side as $\sqrt[3]{\frac{3V}{4\pi}}$. |
| 170 | d9c32a | CK2 | Substitutes $V=288\pi$ into "their" expression for $r$ | Substitute $V=288\pi$ into your expression for $r$. |
| 171 | d9c32a | R1 | Concludes that the float is not accepted using "their" radius | Compare your radius with the acceptance requirement and state whether the float is accepted. |
| 172 | d9c32a | CK3 | States that the acceptance condition requires a radius of at least $7$ cm | State the acceptance condition as a radius of at least $7$ cm. |
| 173 | d9c32a | CK4 | Uses $r=7$ cm as the limiting radius for an accepted float | Use $r=7\text{ cm}$ as the boundary radius when finding the minimum acceptable volume. |
| 174 | d9c32a | AK4 | Calculates the limiting volume as $\frac{4}{3}\pi(7)^3=\frac{1372\pi}{3}$ | Calculate the limiting volume by substituting $r=7\text{ cm}$ into $V=\frac{4}{3}\pi r^3$. |
| 175 | d9c32a | R2 | Subtracts the original volume from the limiting volume | Subtract the original volume from the limiting volume using a common fractional form. |
| 176 | d9c32a | R3 | Obtains $\frac{508\pi}{3}$ using the required minimum volume | Calculate the volume for the minimum acceptable radius, subtract the float’s current volume, and simplify the increase to the form $\frac{k\pi}{3}$. |
| 177 | d9c32a | R4 | Expresses the increase in exact form | State the increase in exact form rather than as a decimal approximation. |
| 178 | d9c337 | CK1 | Identifies the label numbers divisible by 3 in the stated range | Identify every label number in the stated range that is divisible by 3. |
| 179 | d9c337 | AK1 | Lists all members of $A$ correctly | List all the numbers you identify as members of $A$. |
| 180 | d9c337 | AK2 | Lists all members of $B$ correctly | List every number divisible by 4 in the stated range as a member of $B$. |
| 181 | d9c337 | CK2 | Recognises $A \cap B$ as the members common to both sets | Recognise that $A \cap B$ contains only the members that appear in both sets. |
| 182 | d9c337 | R1 | Selects the common members from "their" sets $A$ and $B$ | Select the members common to your sets $A$ and $B$ to form $A \cap B$. |
| 183 | d9c337 | R2 | Removes the members of "their" $A \cap B$ from "their" set $B$ | Remove each member of your $A \cap B$ from your set $B$. |
| 184 | d9c337 | AK3 | Lists the remaining members of "their" set $D$ | List the members left in your set $D$ after the removals. |
| 185 | d9c337 | CK3 | Describes $D$ as multiples of 4 which are not multiples of 3 | Describe $D$ as the multiples of 4 that are not multiples of 3. |
| 186 | d9c337 | R3 | Translates the description into conditions in set-builder notation | Write the description of $D$ in set-builder notation using conditions for divisibility by 4 and non-divisibility by 3. |
| 187 | d9c337 | CK4 | States the natural-number domain and the range from 1 to 36 | State that the values are natural numbers and restrict them to the range from 1 to 36. |
| 188 | d9c33f | CK1 | Recognises that time-and-a-half is $1.5$ times the regular hourly rate | Multiply the regular hourly rate by $1.5$ to find the time-and-a-half overtime rate. |
| 189 | d9c33f | CK2 | Forms gross pay from regular earnings and overtime earnings using "their" overtime rate | Form gross pay by adding regular earnings to overtime earnings calculated using your overtime rate. |
| 190 | d9c33f | AK2 | Evaluates the regular and overtime earnings | Calculate the regular earnings and the overtime earnings separately. |
| 191 | d9c33f | CK3 | Identifies the statutory deduction as $5\%$ of "their" gross pay | Identify the statutory deduction as $5\%$ of your gross pay. |
| 192 | d9c33f | R1 | Calculates $0.05 \times$ "their" gross pay | Calculate $0.05 \times$ your gross pay. |
| 193 | d9c33f | CK4 | Recognises that the \$100 transport cost must be reserved before saving | Reserve the \$100 transport cost before deciding how much you can save. |
| 194 | d9c33f | R2 | Finds amount available for saving by subtracting \$100 and "their" deduction from "their" gross pay | Find the amount available for saving by subtracting \$100 and your deduction from your gross pay. |
| 195 | d9c33f | R3 | Compares "their" available amount with \$1 450 and states a valid conclusion | Compare your available amount with \$1 450 and state whether you can save that amount. |
| 196 | d9c347 | CK2 | Recognises Heads and Tails as the two coin outcomes | Write the two possible coin results: Heads and Tails. |
| 197 | d9c347 | AK1 | Pairs each of "their" wheel outcomes with Heads and Tails | Pair each of your wheel outcomes with both Heads and Tails. |
| 198 | d9c347 | R1 | Gives a complete sample space of eight distinct outcomes | List all eight distinct ordered wheel-and-coin outcomes in one complete sample space. |
| 199 | d9c347 | CK3 | Selects favourable outcomes over total outcomes for the probability | Put the number of favourable outcomes over the total number of equally likely outcomes. |
| 200 | d9c347 | AK2 | Counts 2 favourable outcomes and "their" 8 total outcomes | Count the 2 favourable outcomes and use your 8 total outcomes. |
| 201 | d9c347 | AK3 | Forms the fraction $\frac{2}{8}$ | Form the fraction $\frac{2}{8}$. |
| 202 | d9c347 | R2 | Expresses "their" probability as a fraction in lowest terms | Simplify your probability fraction to lowest terms. |
| 203 | d9c347 | R3 | States that $\frac{1}{4}$ is less than $\frac{1}{2}$ | State that $\frac{1}{4}$ is less than $\frac{1}{2}$. |
| 204 | d9c35e | CK1 | Recognises that $f(4)$ is the display reading at $x=4$ on the graph | Read the display value from the graph where $x=4$ and identify it as $f(4)$. |
| 205 | d9c35e | R1 | Uses $2(4)+k=$ "their" $f(4)$ to obtain $k=3$ | Substitute $2(4)+k=$ your $f(4)$ value, then solve for $k$. |
| 206 | d9c35e | AK2 | Adds 6 to "their" reading in (a) to obtain 17 | Add 6 to your reading from part (a). |
| 207 | d9c35e | R2 | Forms and solves $2x+3=$ "their" 17, or equivalent | Form $2x+3=$ your result after adding 6, then solve the equation for $x$. |
| 208 | d9c35e | CK2 | Interchanges input and output to obtain $x=2y+3$ | Swap the input and output variables in the function equation to form $x=2y+3$. |
| 209 | d9c35e | AK4 | Subtracts 3 to obtain $x-3=2y$ | Subtract 3 from both sides of $x=2y+3$ to obtain $x-3=2y$. |
| 210 | d9c35e | CK3 | States the line of reflection as $y=x$ | State the mirror line for a function and its inverse as $y=x$. |
| 211 | d9c35e | R3 | States that inverse coordinates are interchanged, $(p,q)\to(q,p)$ | Explain that inverse coordinates swap, so $(p,q)\to(q,p)$. |
| 212 | d9c35e | R4 | States $ff^{-1}(x)=f^{-1}f(x)=x$ | State that applying a function and its inverse in either order returns the original input: $ff^{-1}(x)=f^{-1}f(x)=x$. |
| 213 | d9c370 | CK1 | Recognises that $B$ is due north of $A$ | Check that $B$ is vertically above $A$ on the grid, so you identify the correct compass direction. |
| 214 | d9c370 | CK2 | Recognises that the bearing of $A$ from $B$ is the reverse of 'their' bearing of $B$ from $A$ | Reverse your bearing from $A$ to $B$ to obtain the bearing from $B$ to $A$. |
| 215 | d9c370 | AK2 | Finds the reverse bearing as $180°$, or follows through from 'their' bearing | Use a half-turn from your earlier bearing to calculate the reverse bearing. |
| 216 | d9c370 | R1 | Uses the bearing of $BC$, $090°$, and 'their' reverse bearing to obtain the interior angle | Use the given bearing of $BC$ and your reverse bearing to calculate the interior angle at $B$. |
| 217 | d9c370 | AK3 | Obtains the horizontal and vertical distances as $4$ km and $5$ km | Count the grid intervals horizontally and vertically from $A$ to $C$, then label each distance in km. |
| 218 | d9c370 | CK3 | Selects the ratio $\tan \theta = \frac{4}{5}$ using 'their' right-angled triangle | Use your right-angled triangle to set up $\tan \theta = \frac{\text{horizontal distance}}{\text{vertical distance}}$. |
| 219 | d9c370 | AK4 | Evaluates $\theta = \tan^{-1}\left(\frac{4}{5}\right) = 38.659\ldots°$ | Calculate $\theta = \tan^{-1}\left(\frac{\text{horizontal distance}}{\text{vertical distance}}\right)$ and retain the continuing decimal indicated by $\ldots$ before rounding. |
| 220 | d9c370 | R2 | Interprets 'their' angle as clockwise from north and writes the bearing as $039°$ | Measure your angle clockwise from north and write it as a three-figure bearing. |
| 221 | d9c370 | R3 | Expresses 'their' bearing to the nearest degree | Round your bearing to the nearest degree after writing it in three-figure form. |
| 222 | d9c378 | CK1 | Recognises that the tangent ratio relates $CD$ and $BC$ | Choose the tangent ratio because it relates $CD$ and $BC$. |
| 223 | d9c378 | AK1 | Substitutes into $\tan 42^\circ=\frac{12}{BC}$ and solves for $BC$ | Substitute into $\tan 42^\circ=\frac{12}{BC}$ and rearrange to find $BC$. |
| 224 | d9c378 | CK2 | Recognises that $AC=AB+BC$ | Add $AB$ and $BC$ to form $AC=AB+BC$. |
| 225 | d9c378 | CK3 | Recognises that the tangent ratio relates $CD$ and "their" $AC$ | Use the tangent ratio to relate $CD$ to your $AC$. |
| 226 | d9c378 | AK3 | Uses $\tan \angle CAD=\frac{12}{\text{their }AC}$ to calculate the angle | Use $\tan \angle CAD=\frac{12}{\text{your }AC}$ and apply inverse tangent to calculate the angle. |
| 227 | d9c378 | AK4 | Uses $\sin(\text{their }\angle CAD)=\frac{12}{AD}$ to calculate $AD$ | Use $\sin(\text{your }\angle CAD)=\frac{12}{AD}$ and rearrange to calculate $AD$. |
| 228 | d9c380 | CK1 | Selects $6 \times 4$ for the plantains. | Multiply the number of bags by the number of plantains in each bag to find the plantain total. |
| 229 | d9c380 | CK2 | Recognises that the mangoes in 6 bags are represented by $6m$. | Represent the mangoes in all six bags as $6m$. |
| 230 | d9c380 | CK3 | Combines $6m$ with "their" total number of plantains. | Add $6m$ to your total number of plantains to represent all the fruits. |
| 231 | d9c380 | R1 | Forms an equation equating the total number of fruits to $90$. | Set your expression for all the fruits equal to the given total number of fruits. |
| 232 | d9c380 | R2 | Rearranges "their" equation to isolate the term containing $m$. | Move your plantain total to the other side of your equation so that the term containing $m$ is isolated. |
| 233 | d9c380 | AK2 | Calculates $90 - 24 = 66$, or subtracts "their" plantain total correctly. | Subtract your plantain total correctly from the given total number of fruits. |
| 234 | d9c380 | AK3 | Divides "their" mango total by 6. | Divide your mango total by 6 to find $m$. |
| 235 | d9c388 | CK1 | Recognises that $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. | Write the displacement as $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ before calculating its components. |
| 236 | d9c388 | AK1 | Subtracts the coordinates to obtain $\begin{pmatrix}6\\4\end{pmatrix}$. | Subtract the corresponding coordinates in the correct order and write the result as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 237 | d9c388 | CK2 | Selects $\sqrt{x^2+y^2}$ for the magnitude of a vector. | Find the vector length by substituting its components into $\sqrt{x^2+y^2}$. |
| 238 | d9c388 | AK2 | Substitutes “their” vector components to obtain $\sqrt{6^2+4^2}=\sqrt{52}$. | Substitute your vector components into $\sqrt{x^2+y^2}$ and simplify the expression under the square root. |
| 239 | d9c388 | AK3 | Simplifies $\sqrt{52}$ to $2\sqrt{13}$. | Factor the number inside $\sqrt{52}$ to take out any perfect-square factor. |
| 240 | d9c388 | CK3 | Uses the criterion that a unit vector has magnitude $1$. | Check whether the vector is a unit vector by showing that its magnitude is $1$. |
| 241 | d9c388 | AK4 | Calculates $\sqrt{\left(\frac{3}{\sqrt{13}}\right)^2+\left(\frac{2}{\sqrt{13}}\right)^2}=1$. | Square both components, add them, and evaluate $\sqrt{\left(\frac{3}{\sqrt{13}}\right)^2+\left(\frac{2}{\sqrt{13}}\right)^2}$. |
| 242 | d9c388 | R1 | Relates the stated vector to “their” $\overrightarrow{AB}$ as $\dfrac{1}{2\sqrt{13}}\overrightarrow{AB}$. | Express the stated vector as a scalar multiple of your $\overrightarrow{AB}$ in the form $\dfrac{k}{\sqrt{13}}\overrightarrow{AB}$ and determine $k$. |
| 243 | d9c388 | CK4 | Forms $\overrightarrow{O\text{beacon}}=\overrightarrow{OA}+15\mathbf{u}$. | Form the beacon position vector using $\overrightarrow{O\text{beacon}}=\overrightarrow{OA}+15\mathbf{u}$. |
| 244 | d9c388 | R2 | Uses “their” unit vector to find the beacon displacement as $\begin{pmatrix}\frac{45}{\sqrt{13}}\\\frac{30}{\sqrt{13}}\end{pmatrix}$. | Multiply your unit vector by $15$ and write the beacon displacement as $\begin{pmatrix}\frac{x}{\sqrt{13}}\\\frac{y}{\sqrt{13}}\end{pmatrix}$. |
| 245 | d9c388 | R3 | Adds the displacement to $\overrightarrow{OA}$ to obtain “their” beacon position vector. | Add your beacon displacement vector to $\overrightarrow{OA}$ to form your beacon position vector. |
| 246 | d9c388 | R4 | Justifies that the beacon lies on ray $AB$ because its displacement from $A$ is a positive scalar multiple of $\overrightarrow{AB}$. | Show that the beacon displacement from $A$ is a positive scalar multiple of $\overrightarrow{AB}$, so it lies on ray $AB$. |
| 247 | d9c3ac | R1 | Reads the $x$-coordinates of $P, Q, R$ and $S$ from the grid in the stated order | Read the $x$-coordinate of each point from the grid in the order $P$, $Q$, $R$, $S$. |
| 248 | d9c3ac | R2 | Reads the $y$-coordinates of $P, Q, R$ and $S$ from the grid in the stated order | Read the $y$-coordinate of each point from the grid in the order $P$, $Q$, $R$, $S$. |
| 249 | d9c3ac | AK1 | Places the four $x$-coordinates in the first row of the matrix | Write the four $x$-coordinates across the first row of matrix $T$. |
| 250 | d9c3ac | CK1 | Identifies 2 rows in "their" matrix $T$ | Count the horizontal rows in your matrix $T$. |
| 251 | d9c3ac | CK3 | Identifies "their" matrix as rectangular | Classify your matrix as rectangular when its number of rows differs from its number of columns. |
| 252 | d9c3ac | R3 | States that "their" matrix has unequal numbers of rows and columns | Compare the numbers of rows and columns in your matrix and state that they are unequal. |
| 253 | d9c3ac | AK3 | Writes 1 in each main-diagonal position of the identity matrix of order matching "their" number of rows | Put $1$ in every position on the main diagonal of an identity matrix with the same number of rows as your matrix. |
| 254 | d9c3b9 | CK1 | Uses average speed $=$ distance $\div$ time | Divide the distance travelled by the time taken to find the average speed. |
| 255 | d9c3b9 | AK1 | Calculates the distance in the first hour as $\frac{1}{2} \times 1 \times 12 = 6$ km | Find the triangular area under the graph for the first hour using $\frac{1}{2}\times\text{base}\times\text{height}$. |
| 256 | d9c3b9 | CK2 | Recognises that the total distance is the sum of the distances for the stages | Add the distances from each stage of the journey to obtain the total distance. |
| 257 | d9c3b9 | AK2 | Calculates the distance from 1 h to 3 h as $12 \times 2 = 24$ km | Multiply the constant speed between 1 h and 3 h by the time spent travelling at that speed. |
| 258 | d9c3b9 | R2 | Adds $24$ km to "their" first-hour distance | Add the distance from 1 h to 3 h to your first-hour distance. |
| 259 | d9c3b9 | CK3 | Uses average speed $=$ total distance $\div$ total time | Divide the total distance travelled by the full journey time to find the average speed. |
| 260 | d9c3b9 | AK3 | Calculates the distance in the final hour as $\frac{1}{2} \times 1 \times 12 = 6$ km | Find the triangular area under the graph for the final hour using $\frac{1}{2}\times\text{base}\times\text{height}$. |
| 261 | d9c3b9 | R3 | Uses "their" first-3-hour distance and the full 4-hour duration to obtain $9$ km/h | Add your first-3-hour distance to your final-hour distance, then divide by the full 4-hour duration. |
| 262 | d9c3c1 | CK1 | Recognises experimental probability as number of ripe breadfruits divided by total number checked | Write the experimental probability as the number recorded ripe divided by the total checked, using $\frac{r}{80}$. |
| 263 | d9c3c1 | R1 | Forms $\frac{r}{80}=\frac{3}{5}$ | Set the experimental probability equal to the stated probability of selecting a ripe breadfruit using $\frac{r}{80}$. |
| 264 | d9c3c1 | AK1 | Solves to obtain $r=48$ | Rearrange your equation to make $r$ the subject. |
| 265 | d9c3c1 | CK2 | Recognises that the ripe total is the sum of the two ripe-condition entries | Add the two ripe-condition entries to identify the total number recorded as ripe. |
| 266 | d9c3c1 | AK2 | Calculates $48-18=30$ | Subtract the ripe blemished entry from the ripe total to find the missing ripe unblemished entry. |
| 267 | d9c3c1 | AK3 | Calculates experimental probability $\frac{30}{80}=\frac{3}{8}$ using "their" completed table | Divide your ripe unblemished entry by the total checked and simplify $\frac{\text{ripe and unblemished}}{\text{total checked}}$. |
| 268 | d9c3c1 | CK3 | Obtains theoretical probability of unblemished as $1-\frac{3}{8}=\frac{5}{8}$ | Use the complement rule to find the theoretical unblemished probability, calculating $1-\frac{\text{blemished}}{\text{total}}$. |
| 269 | d9c3c1 | CK4 | Recognises multiplication of probabilities for the independent events | Multiply the probability that a breadfruit is ripe by the probability that it is unblemished, since the events are independent. |
| 270 | d9c3c1 | AK4 | Calculates $\frac{3}{5}\times\frac{5}{8}=\frac{3}{8}$ | Multiply the two theoretical probabilities and simplify the product of the fractions $\frac{\text{first probability}}{\text{whole}}\times\frac{\text{second probability}}{\text{whole}}$. |
| 271 | d9c3c1 | R2 | Compares "their" experimental probability with "their" theoretical probability | Compare your experimental probability with your theoretical probability. |
| 272 | d9c3c1 | R3 | States that the two probabilities are equal | State whether the two probabilities are equal. |
| 273 | d9c3c1 | R4 | Concludes that the results support the calibration | Use the comparison to conclude whether the results support the machine calibration. |
| 274 | d9c3c9 | CK1 | Recognises that the bearing of $P$ from $Q$ is the reverse bearing. | Identify the bearing from $Q$ to $P$ as the reverse of the given bearing from $P$ to $Q$. |
| 275 | d9c3c9 | AK1 | Adds $180°$ to $065°$. | Add a half-turn to the given bearing to find the reverse bearing. |
| 276 | d9c3c9 | CK2 | Identifies angle $PQR$ as the difference between the bearings of $QP$ and $QR$. | Subtract the bearing of $QR$ from the bearing of $QP$ to find $\angle PQR$. |
| 277 | d9c3c9 | AK2 | Calculates $245°-155°=90°$, or follows through using “their” bearing from part (a). | Subtract the bearing of $QR$ from your bearing of $QP$, using your answer from part (a). |
| 278 | d9c3c9 | CK3 | Recognises the right-angled triangle and forms $\tan \angle QPR=\frac{5}{12}$. | Use the right-angled triangle and form $\tan \angle QPR=\frac{\text{opposite}}{\text{adjacent}}$. |
| 279 | d9c3c9 | AK3 | Obtains $\angle QPR=22.6°$, or follows through from “their” angle at $Q$. | Use inverse tangent to calculate $\angle QPR$, or follow through consistently using your earlier angle at $Q$. |
| 280 | d9c3c9 | R1 | Determines that the angle at $P$ is measured clockwise from the bearing $065°$. | Check the sketch and measure the angle at $P$ clockwise from the given bearing. |
| 281 | d9c3c9 | AK4 | Adds $22.6°$ to $065°$ to obtain $87.6°$, or follows through using “their” angle. | Add your angle at $P$ to the given bearing, following through from your angle if needed. |
| 282 | d9c3c9 | R2 | Interprets the calculated direction as the bearing of $R$ from $P$. | State that the direction you calculate is the bearing of $R$ from $P$. |
| 283 | d9c3c9 | R3 | Rounds to the nearest degree and writes the bearing in three-digit format: $088°$. | Round your bearing to the nearest degree and write it using three digits. |
| 284 | d9c3db | CK1 | Recognises that each outcome consists of a card number and a coin result | Pair each card number with one coin result to form an outcome. |
| 285 | d9c3db | AK1 | Lists the four outcomes with heads | List one ordered pair with $H$ for each card number. |
| 286 | d9c3db | AK2 | Lists the four outcomes with tails | List one ordered pair with $T$ for each card number. |
| 287 | d9c3db | CK2 | Identifies cards 1 and 2 as the cocoa cards | Use the table to identify the card numbers that represent cocoa. |
| 288 | d9c3db | AK3 | Selects $(1,H)$ and $(2,H)$ from "their" sample space | From your sample space, select the outcomes that combine a cocoa card with $H$. |
| 289 | d9c3db | CK3 | Recognises that the probability is favourable outcomes over total equally likely outcomes | Divide the number of favourable outcomes by the total number of equally likely outcomes. |
| 290 | d9c3db | AK4 | Forms $\frac{2}{8}$ using "their" favourable outcomes and "their" sample space | Use your favourable outcomes and your sample space to form $\frac{2}{8}$. |
| 291 | d9c3db | R1 | Expresses "their" probability in lowest terms | Simplify your probability by dividing the numerator and denominator by a common factor. |
| 292 | d9c3db | R2 | Compares "their" probability with $\frac{1}{3}$ | Compare your probability with $\frac{1}{3}$ using a common denominator or equivalent fractions. |
| 293 | d9c3db | R3 | Concludes that the farmer will use the moisture test, with a valid reason | State whether the farmer uses the moisture test and justify your choice from the comparison. |
| 294 | d9c3e8 | CK1 | Selects the tangent ratio for the angle of depression | Use $\tan$ for the angle of depression, relating the vertical height to the horizontal distance. |
| 295 | d9c3e8 | AK1 | Rearranges and evaluates $18\div\tan 36°$ | Rearrange the tangent relationship and calculate $18\div\tan 36°$. |
| 296 | d9c3e8 | R1 | Expresses the distance correct to $3$ significant figures | Round your calculated distance to $3$ significant figures and include the unit. |
| 297 | d9c3e8 | CK2 | Recognises that the ferry's horizontal distance increases by $25\text{ m}$ | Increase the ferry’s horizontal distance by the stated $25\text{ m}$ because it travels directly away from the tower. |
| 298 | d9c3e8 | AK2 | Adds $25$ to "their" distance from part (a) | Add $25$ to your distance from part (a). |
| 299 | d9c3e8 | R2 | Uses "their" initial distance as the starting position for the ferry | Use your initial horizontal distance as the ferry’s starting position before adding the distance travelled. |
| 300 | d9c3e8 | CK3 | Selects the inverse tangent relationship for the angle of depression | Use $\tan^{-1}$ to find the angle from the vertical height divided by the new horizontal distance. |
| 301 | d9c3e8 | AK3 | Evaluates $\tan^{-1}\left(18\div\text{their distance from part (b)}\right)$ | Calculate $\tan^{-1}\left(18\div\text{your distance from part (b)}\right)$. |
| 302 | d9c3e8 | R3 | Expresses "their" angle correct to $1$ decimal place | Round your angle to $1$ decimal place and include the degree sign. |
| 303 | d9c40e | CK2 | Interprets the magnitude of the negative $y$-intercept as the stall fee | Use the size of the negative $y$-intercept to identify the stall fee. |
| 304 | d9c40e | CK3 | Recognises that the change in net amount is found from the intercepts | Find the change in net amount by comparing the two intercepts on the graph. |
| 305 | d9c40e | AK1 | Calculates $10 \div 5$ to obtain \$2 per bag | Calculate $10 \div 5$ to find the increase in net amount per bag in \$. |
| 306 | d9c40e | CK4 | Recognises that the additional \$4 charge decreases the $y$-intercept by 4 | Decrease the $y$-intercept by the additional transport charge in \$. |
| 307 | d9c40e | AK2 | Forms $0=2x-14$ for the new $x$-intercept | Set the net amount to zero and form an equation for the new $x$-intercept. |
| 308 | d9c40e | R1 | Solves "their" intercept equation to obtain $(7,0)$ | Solve your intercept equation and write the resulting intercept as an ordered pair. |
| 309 | d9c40e | R2 | Interprets $(7,0)$ as no profit or loss after selling 7 bags | Explain that your intercept means there is no profit or loss after selling that number of bags. |
| 310 | d9c40e | R3 | Concludes loss from a negative net amount using "their" earlier break-even result | Use your earlier break-even result to decide whether the negative net amount represents a loss. |
| 311 | d9c40e | AK3 | Substitutes 7 bags and the \$5 transport charge into the net-amount relationship | Substitute the stated number of bags and transport charge in \$ into the net-amount relationship. |
| 312 | d9c40e | R4 | Compares the \$5 charge with "their" \$4 break-even charge for 7 bags | Compare the stated transport charge in \$ with your break-even transport charge for the same number of bags. |
| 313 | d9c416 | CK1 | Recognises that the total bill represents $110\%$ of the charges before tax | Recognise that the total bill is $110\%$ of the charges before tax. |
| 314 | d9c416 | AK1 | Calculates \$363 divided by $1.10$, giving \$330 | Divide the total bill by $1.10$ to find the charges before tax. |
| 315 | d9c416 | CK2 | Identifies the electricity charge as "their" pre-tax charges less the fixed service charge | Subtract the fixed service charge from your pre-tax charges to find your electricity charge. |
| 316 | d9c416 | AK2 | Divides "their" electricity charge by \$0.60 to obtain the number of units | Divide your electricity charge by \$0.60 to find your number of units. |
| 317 | d9c416 | CK3 | Forms the reverse calculation from a total bill of no more than \$300, including tax and the fixed charge | Work backwards from a total bill no more than \$300 by removing tax, then subtracting the fixed charge before dividing by the unit cost. |
| 318 | d9c416 | AK3 | Calculates the limiting electricity use as $379.545\ldots$ units | Calculate the limiting electricity use and keep the decimal before choosing whole units. |
| 319 | d9c416 | R1 | Selects $379$ as the greatest whole number of units and subtracts it from "their" number of units | Choose the greatest whole number of units below the limiting use and subtract it from your number of units. |
| 320 | d9c416 | CK4 | Uses the reduction as a fraction of "their" original number of units | Write the reduction as a fraction of your original number of units. |
| 321 | d9c416 | R2 | Calculates $\dfrac{\text{their reduction}}{\text{their original units}}\times100$ | Calculate $\dfrac{\text{your reduction}}{\text{your original units}}\times100$ to find your percentage reduction. |
| 322 | d9c416 | R3 | Expresses "their" percentage correct to 3 significant figures | Round your percentage to $3$ significant figures. |
| 323 | d9c41e | R1 | Reads $T=4\text{ s}$ from the graph when $\sqrt{l}=2$ | From $\sqrt{l}=2$, trace to the graph and read the corresponding $T$ value in $\text{s}$. |
| 324 | d9c41e | CK1 | Divides both sides by $2\pi$ to isolate the square-root expression | Divide both sides by $2\pi$ so that the square-root expression is isolated. |
| 325 | d9c41e | CK2 | Squares both sides to remove the square root | Square both sides of the equation to remove the square root. |
| 326 | d9c41e | AK1 | Obtains $\frac{T^2}{4\pi^2}=\frac{l}{g}$ | After squaring, write the equation as $\frac{T^2}{4\pi^2}=\frac{l}{g}$. |
| 327 | d9c41e | AK2 | Multiplies by $g$ to obtain $l=\frac{gT^2}{4\pi^2}$ | Multiply both sides by $g$ to make $l$ the subject, giving $l=\frac{gT^2}{4\pi^2}$. |
| 328 | d9c41e | CK3 | Substitutes $g=9.8$ and "their" value of $T$ into "their" formula for $l$ | Substitute $g=9.8$ and your graph value of $T$ into your formula $l=\frac{gT^2}{4\pi^2}$. |
| 329 | d9c41e | AK3 | Evaluates $\frac{9.8(4)^2}{4\pi^2}$, following through on "their" value of $T$ | Evaluate $\frac{9.8(T)^2}{4\pi^2}$ using your value of $T$. |
| 330 | d9c41e | R2 | Expresses "their" length correct to 3 significant figures | Round your calculated length to $3$ significant figures and include $\text{m}$. |
| 331 | d9c41e | R3 | Correctly compares $4.00\text{ m}$ with "their" calculated length and makes a valid decision | Compare $4.00\text{ m}$ with your calculated length and use the comparison to decide whether the cord is long enough. |
| 332 | d9c426 | CK1 | Recognises that Figure 5 has 5 circles | Count the circles in Figure 5. |
| 333 | d9c426 | CK2 | Recognises 4 dots are added for each circle | Compare consecutive figures to find how many dots each additional circle contributes. |
| 334 | d9c426 | CK3 | Forms $5\times$ "their" number of dots in Figure 5 | Form a calculation by multiplying 5 by your Figure 5 dot total. |
| 335 | d9c426 | AK2 | Multiplies 5 by "their" Figure 5 total | Multiply 5 by your Figure 5 total. |
| 336 | d9c426 | R1 | Identifies 20 circle dots and 1 centre dot in each copy | Count the dots on the circles separately from the centre dot in one copy. |
| 337 | d9c426 | R2 | Forms $5\times20+5\times1$ for five copies | Write the five-copy calculation as five times the circle-dot count plus five times the centre-dot count. |
| 338 | d9c426 | R3 | Justifies the equivalent calculations using the distributive property | Explain that multiplying each part of a sum separately uses the distributive property. |
| 339 | d9c42e | CK1 | States $\vec{PQ}=\vec{OQ}-\vec{OP}$ | Find the displacement by writing $\vec{PQ}=\vec{OQ}-\vec{OP}$. |
| 340 | d9c42e | AK1 | Subtracts components to obtain $\begin{pmatrix}6\\8\end{pmatrix}$ | Subtract the corresponding components to obtain a column vector of the form $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 341 | d9c42e | CK2 | Uses $\|\vec{PQ}\|=\sqrt{6^2+8^2}$ | Use $\|\vec{PQ}\|=\sqrt{(\text{horizontal component})^2+(\text{vertical component})^2}$ to calculate the distance. |
| 342 | d9c42e | AK2 | Evaluates $6^2+8^2=100$ | Square the two components and add the results carefully before taking the square root. |
| 343 | d9c42e | CK3 | Recognises that $\|\vec{QR}\|$ equals "their" distance $PQ$ | Set $\|\vec{QR}\|$ equal to your distance $PQ$. |
| 344 | d9c42e | R1 | Forms $x^2+6^2=(\text{their distance }PQ)^2$ | Form $x^2+(\text{vertical component})^2=(\text{your distance }PQ)^2$ from the length of $\vec{QR}$. |
| 345 | d9c42e | R2 | Solves "their" equation for $x$ | Solve your equation for $x$ by isolating $x^2$ and then taking square roots. |
| 346 | d9c42e | R3 | Selects the positive value because $x>0$ | Choose the positive solution because $x>0$. |
| 347 | d9c42e | CK4 | States $\vec{OR}=\vec{OQ}+\vec{QR}$ | Find the position vector by writing $\vec{OR}=\vec{OQ}+\vec{QR}$. |
| 348 | d9c42e | AK4 | Obtains $\begin{pmatrix}12\\5\end{pmatrix}$ | Add the corresponding components to obtain $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 349 | d9c42e | R4 | Uses "their" position vector of $R$ to calculate $\|\vec{OR}\|=13$ km | Use your position vector of $R$ to calculate $\|\vec{OR}\|$ in km. |
| 350 | 804975 | CK1 | Identifies $4x$ as the highest common factor of $8x^2+12x$. | Find the greatest factor shared by both terms in $8x^2+12x$ and write it as the highest common factor. |
| 351 | 804975 | CK2 | Identifies $6x$ as the highest common factor of $12x^2+18x$. | Find the greatest factor shared by both terms in $12x^2+18x$ and write it as the highest common factor. |
| 352 | 804975 | CK3 | States the common factor, $2x+3$, as the common dimension. | Use the factor that appears in both factorisations as the common dimension. |
| 353 | 804975 | R1 | Explains that $2x+3$ occurs as a factor in both area expressions. | Explain that the same factor occurs in both area expressions, so it represents the common dimension. |
| 354 | 804975 | AK3 | Evaluates the small-base area as $56\text{ cm}^2$, using “their” factorisation. | Substitute $x=2$ into your factorisation and multiply the resulting dimensions to find the small-base area in $\text{cm}^2$. |
| 355 | 804975 | AK4 | Evaluates the large-base area as $84\text{ cm}^2$, using “their” factorisation. | Substitute $x=2$ into your factorisation and multiply the resulting dimensions to find the large-base area in $\text{cm}^2$. |
| 356 | 804975 | R2 | Forms the total for 5 small and 3 large bases as $5(\text{their small area})+3(\text{their large area})$. | Form the total as $5(\text{your small area})+3(\text{your large area})$ using your earlier area results. |
| 357 | 804982 | R1 | Reads $g(2)=5$ from the graph | Read the graph at the stated input and record the corresponding value of $g$. |
| 358 | 804982 | CK1 | Uses the inverse relationship by interchanging the input and output | Swap the input and output variables in the function equation to set up the inverse relationship. |
| 359 | 804982 | AK1 | Rearranges $x=2y+1$ to make $y$ the subject | Rearrange the interchanged equation until $y$ is the subject. |
| 360 | 804982 | CK2 | Identifies that $g(2)$ is the input to $f^{-1}$ | Use the value you read for $g(2)$ as the input to $f^{-1}$. |
| 361 | 804982 | AK3 | Substitutes "their" value of $g(2)$ into "their" inverse function | Substitute your value of $g(2)$ into your inverse function. |
| 362 | 804982 | CK3 | Identifies that packing requires a corrected score of at least $2.5$ | Identify the minimum corrected score required for packing. |
| 363 | 804982 | R2 | Compares "their" corrected score with $2.5$ | Compare your corrected score with the required minimum, using $2.5$ as the boundary. |
| 364 | 804982 | R3 | States that the batch is not packed, following through from "their" comparison | State whether the batch is packed by following the result of your comparison. |
| 365 | 80498a | CK1 | Recognises that the 5 students outside both sets are excluded from $n(A \cup B)$ | Exclude the region outside both circles when finding $n(A \cup B)$. |
| 366 | 80498a | CK2 | Forms $12+8+x=$ "their" $n(A \cup B)$ | Form $12+8+x=$ your value for $n(A \cup B)$. |
| 367 | 80498a | AK2 | Solves for $x$ using "their" $n(A \cup B)$ | Rearrange your equation to find $x$ using your value for $n(A \cup B)$. |
| 368 | 80498a | CK3 | Identifies that set $A$ includes the A-only region and the intersection | Include both the A-only region and the overlapping region when finding $n(A)$. |
| 369 | 80498a | AK3 | Adds 12 to "their" intersection value | Add 12 to your intersection value to find $n(A)$. |
| 370 | 80498a | R2 | States that the sets are not disjoint | State that the sets are not disjoint because they overlap. |
| 371 | 80498a | R3 | Gives a non-zero intersection, $n(A \cap B)=5$ | Read the overlapping region and write it as a non-zero value of $n(A \cap B)$. |
| 372 | 8049b8 | CK1 | Selects the tangent ratio for triangle $QRT$ | Use $\tan 38^\circ=\frac{15}{QR}$ from triangle $QRT$. |
| 373 | 8049b8 | AK1 | Substitutes $15$ and $38^\circ$ and rearranges to find $QR$ | Substitute $15$ and $38^\circ$ into your tangent equation and rearrange to find $QR$. |
| 374 | 8049b8 | R1 | Expresses the distance correct to 3 significant figures | Round your distance to $3$ significant figures and include the unit m. |
| 375 | 8049b8 | CK2 | Selects the tangent ratio for triangle $PRT$ | Use $\tan \angle TPR=\frac{15}{PR}$ from triangle $PRT$. |
| 376 | 8049b8 | AK3 | Finds $PR$ by adding $20$ to "their" $QR$ | Add $20$ to your earlier $QR$ value to find $PR$. |
| 377 | 8049b8 | AK4 | Uses $\tan \angle TPR=15\div\text{"their" }PR$ to calculate the angle | Use $\tan \angle TPR=15\div\text{your }PR$ and apply inverse tangent to calculate the angle. |
| 378 | 8049b8 | R2 | Expresses "their" angle correct to 1 decimal place | Round your angle to $1$ decimal place and include $^\circ$. |
| 379 | 8049b8 | R3 | States that position $P$ does not meet the safety requirement using "their" angle | Use your angle to state whether position $P$ meets the safety requirement. |
| 380 | 8049b8 | CK3 | Identifies that an angle less than $25^\circ$ is below the minimum requirement | Recognise that an angle below $25^\circ$ is below the minimum safety requirement. |
| 381 | 8049c0 | CK1 | Recognises that the $140°$ clockwise turn is from $FH$ to $FD$. | Trace the $140°$ clockwise turn from $FH$ to $FD$ on the sketch before calculating the bearing. |
| 382 | 8049c0 | AK1 | Calculates $040°-140°+360°=260°$. | Subtract the clockwise turn from the known bearing, then add $360°$ to write the result as a positive three-figure bearing. |
| 383 | 8049c0 | R1 | Selects $260°$, consistent with $H$ southwest of $F$. | Choose the bearing that places $H$ southwest of $F$ on the sketch. |
| 384 | 8049c0 | CK2 | Uses reverse bearings differing by $180°$. | Find the reverse bearing by adding or subtracting $180°$. |
| 385 | 8049c0 | AK2 | Finds $260°-180°=080°$ using “their” bearing of $H$ from $F$. | Subtract $180°$ from your bearing of $H$ from $F$ and write the result as a three-figure bearing. |
| 386 | 8049c0 | CK3 | Uses “their” bearing from $H$ to $F$ as the ferry's arrival course. | Use your bearing from $H$ to $F$ as the ferry's arrival course at $F$. |
| 387 | 8049c0 | AK3 | Finds the difference between $080°$ and $040°$ as $40°$, using “their” bearing. | Find the difference between your arrival course and the departure bearing to get the size of the turn. |
| 388 | 8049c0 | R2 | Identifies the $40°$ turn as anticlockwise. | Use the order from the arrival course to the departure bearing to state whether the turn is clockwise or anticlockwise. |
| 389 | 8049c0 | AK4 | Compares “their” turn with $35°$. | Compare your turn with $35°$ using the correct inequality. |
| 390 | 8049c0 | R3 | Concludes that the rule is not met. | Use your comparison to state whether the rule is met. |
| 391 | 8049c8 | CK1 | Identifies that the route from $A$ to $C$ via $B$ consists of $AB$ and $BC$ | Trace the route from $A$ to $C$ via $B$ as the two segments $AB$ and $BC$. |
| 392 | 8049c8 | AK1 | Adds $180 + 120$ | Add $180 + 120$ to find the distance travelled via $B$. |
| 393 | 8049c8 | CK2 | Recognises that the complete walk includes "their" distance via $B$ and the direct distance $CA$ | Include your distance via $B$ and the direct distance $CA$ to make the complete walk. |
| 394 | 8049c8 | AK2 | Adds $250$ m to "their" distance from part (a) | Add $250$ m to your distance from part (a). |
| 395 | 8049c8 | CK3 | Selects average speed as total distance divided by total time | Calculate average speed by dividing total distance by total time. |
| 396 | 8049c8 | R1 | Divides "their" total distance by $11$ minutes | Divide your total distance by $11$ minutes to find your average speed. |
| 397 | 8049c8 | R3 | States that Kemar did not meet the requirement since "their" speed is less than $0.9$ m/s | State that Kemar does not meet the requirement because your speed is less than $0.9$ m/s. |
| 398 | 8049c8 | AK3 | Converts "their" speed from m/min to m/s by dividing by $60$ | Convert your speed from m/min to m/s by dividing by $60$. |
| 399 | 8049da | CK1 | Represents the outcomes for spinner result $P$ as ordered pairs | Write each possible card result alongside spinner result $P$ as an ordered pair. |
| 400 | 8049da | AK1 | Completes the row for spinner result $G$ | Complete the row by pairing $G$ with every possible card result. |
| 401 | 8049da | AK2 | Completes the row for spinner result $M$ | Complete the row by pairing $M$ with every possible card result. |
| 402 | 8049da | CK2 | Identifies the outcomes satisfying the inclusive condition $P$ or card $2$ | Select every ordered pair where the spinner shows $P$, the card is $2$, or both. |
| 403 | 8049da | AK3 | Counts 4 favourable outcomes from "their" sample space | Count the favourable outcomes from your sample space. |
| 404 | 8049da | CK3 | Identifies $(P,2)$ as the outcome which satisfies both conditions | Find the ordered pair that satisfies both conditions at the same time. |
| 405 | 8049da | R1 | Uses "their" reward outcomes from (b) and excludes the shared outcome | Start with your reward outcomes from part (b) and remove the outcome that satisfies both conditions. |
| 406 | 8049da | R2 | Uses "their" changed-rule outcomes to identify two outcomes containing card $2$ | Use your changed-rule outcomes to select and count those containing card $2$. |
| 407 | 8049da | R3 | Uses "their" changed-rule outcomes to identify one outcome containing spinner result $P$ | Use your changed-rule outcomes to select and count those containing spinner result $P$. |
| 408 | 8049da | R4 | Concludes that Anisa is correct from the comparison $2:1$ | Compare the two counts as a ratio and use it to decide whether Anisa is correct. |
| 409 | 8049e7 | CK1 | Forms $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Form $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ by subtracting the position vector of $A$ from that of $B$. |
| 410 | 8049e7 | AK1 | Subtracts corresponding coordinates to obtain $\begin{pmatrix}6\\8\end{pmatrix}$ | Subtract the corresponding coordinates and write the displacement as a column vector $\begin{pmatrix}\cdot\\\cdot\end{pmatrix}$. |
| 411 | 8049e7 | CK2 | Uses $\|\overrightarrow{AB}\|=\sqrt{6^2+8^2}$ | Use $\|\overrightarrow{AB}\|=\sqrt{6^2+8^2}$ to find the straight-route length. |
| 412 | 8049e7 | AK2 | Evaluates $6^2+8^2=100$ | Evaluate $6^2+8^2$ before finding the square root. |
| 413 | 8049e7 | AK3 | Finds $\sqrt{100}=10$ | Find $\sqrt{100}$ to obtain the gutter length. |
| 414 | 8049e7 | CK3 | Forms "their" gutter length divided by $3$ | Divide your gutter length by $3$ to find how many sections are needed. |
| 415 | 8049e7 | AK4 | Calculates $10\div3=3.\overline{3}$, or equivalent using "their" length | Calculate $10\div3$ using your gutter length if you obtained a different length earlier. |
| 416 | 8049e7 | R1 | Selects the next whole number of sections, giving $4$ | Round the number of sections up to the next whole number so that you have enough complete sections. |
| 417 | 8049e7 | R2 | Calculates unused length as $3\times$ "their" number of sections minus "their" gutter length | Calculate the unused length as $3\times$ your number of sections minus your gutter length. |
| 418 | 8049e7 | R3 | States $2$ m as the unused guttering | State the unused guttering in metres. |
| 419 | 8049f4 | CK1 | Recognises that the next increase is one more than "their" increase | Identify that the next increase is one more than your previous increase. |
| 420 | 8049f4 | AK2 | Finds the next increase by adding $1$ to "their" increase | Add $1$ to your previous increase to find the next increase. |
| 421 | 8049f4 | AK3 | Adds "their" next increase to $10$ | Add your next increase to $10$. |
| 422 | 8049f4 | CK2 | Recognises that the $3$ extra seedlings are needed for each bed | Recognise that the $3$ extra seedlings are needed for every bed. |
| 423 | 8049f4 | R1 | Determines the number needed for one bed as "their" Figure 4 total plus $3$ | Add $3$ to your Figure 4 total to find the number needed for one bed. |
| 424 | 8049f4 | R2 | Forms eight equal groups of "their" number needed for one bed | Form eight equal groups of your number needed for one bed. |
| 425 | 8049f4 | CK3 | States distributive property | State that the distributive property applies. |
| 426 | 8049f4 | R3 | Explains that $8$ is multiplied by both terms in the bracket | Explain that $8$ multiplies both terms inside the bracket. |
| 427 | 8049fc | AK1 | Calculates $25 \times 12$ | Calculate $25 \times 12$ to find the amount for the steel rods. |
| 428 | 8049fc | AK2 | Calculates $15 \times 8$ | Calculate $15 \times 8$ to find the amount for the roofing sheets. |
| 429 | 8049fc | R1 | Adds "their" three material amounts | Add your three material amounts to get the invoice subtotal. |
| 430 | 8049fc | CK2 | Uses $5\%$ of "their" subtotal as the discount | Find $5\%$ of your subtotal to calculate the discount. |
| 431 | 8049fc | AK3 | Subtracts the discount from "their" subtotal | Subtract the discount from your subtotal to find the discounted amount. |
| 432 | 8049fc | CK3 | Uses "their" discounted amount as the taxable amount | Use your discounted amount as the taxable amount. |
| 433 | 8049fc | R2 | Calculates $12.5\%$ of "their" discounted amount | Calculate $12.5\%$ of your discounted amount to find the sales tax. |
| 434 | 8049fc | R3 | Adds "their" sales tax to "their" discounted amount | Add your sales tax to your discounted amount to find the total invoice. |
| 435 | 804a04 | CK1 | Recognises that the radical term must first be isolated | Isolate the square-root term before rearranging the formula. |
| 436 | 804a04 | AK1 | Divides by $2\pi$ and squares both sides | Divide both sides by $2\pi$, then square both sides. |
| 437 | 804a04 | AK2 | Multiplies by $g$, giving $l=\frac{gT^2}{4\pi^2}$ | Multiply by $g$ and write $l=\frac{gT^2}{4\pi^2}$. |
| 438 | 804a04 | CK2 | Uses the expression with $l$ as the subject | Use the rearranged expression with $l$ as the subject. |
| 439 | 804a04 | AK3 | Substitutes $g=9.8$ and $T=4\pi$ into "their" expression | Substitute $g=9.8$ and $T=4\pi$ into your expression. |
| 440 | 804a04 | AK4 | Squares $4\pi$ and simplifies the expression | Square $4\pi$ and simplify your expression. |
| 441 | 804a04 | CK3 | Forms height above floor as $42-$ pendulum length | Form the height above the floor by subtracting the pendulum length from $42$. |
| 442 | 804a04 | R1 | Subtracts "their" pendulum length from $42$ | Subtract your pendulum length from $42$. |
| 443 | 804a04 | R3 | Compares "their" height with the required minimum of $2.5\text{ m}$ | Compare your height with the required minimum of $2.5\text{ m}$. |
| 444 | 804a04 | R4 | States a conclusion consistent with "their" comparison, FT | State whether the device meets the safety requirement using your comparison. |
| 445 | 804a11 | CK1 | Recognises that the underweight total combines the two packing-line frequencies | Add the frequencies from the two packing lines to find the total number of underweight packets. |
| 446 | 804a11 | CK2 | Forms experimental probability using underweight packets over total packets | Form the experimental probability by dividing the number of underweight packets by the total number of packets. |
| 447 | 804a11 | AK2 | Simplifies $\frac{\text{their }30}{120}$ to $\frac{1}{4}$ | Simplify $\frac{\text{your underweight total}}{\text{total packets}}$ to an equivalent fraction in lowest terms. |
| 448 | 804a11 | R1 | Expresses the probability in lowest terms | Cancel any common factors so your probability is written in lowest terms. |
| 449 | 804a11 | CK3 | Uses $1-\text{their underweight probability}$ for the probability of an acceptable packet | Find the probability that a packet is acceptable using $1-\text{your underweight probability}$. |
| 450 | 804a11 | AK3 | Multiplies $\frac{3}{4} \times \frac{3}{4}$ for two independent selections | For two independent selections, multiply $\frac{\text{acceptable packets}}{\text{total packets}}$ by itself. |
| 451 | 804a11 | R2 | Uses the complement of “their” probability that both packets are acceptable | Find the probability of at least one underweight packet by subtracting your probability that both packets are acceptable from 1. |
| 452 | 804a11 | R3 | Compares $\frac{7}{16}$ with $\frac{1}{4}$ and states that the batch is rejected | Compare your at-least-one-underweight probability, written as $\frac{\text{underweight cases}}{\text{all cases}}$, with the rejection limit and state that the batch is rejected when it is greater. |
| 453 | 804a19 | CK1 | Selects the tangent ratio for triangle $PRS$ | Use the tangent ratio, relating the opposite side to the adjacent side in triangle $PRS$. |
| 454 | 804a19 | AK1 | Substitutes to obtain $\tan x=\frac{18}{30}$ | Substitute the given side lengths into $\tan x=\frac{RS}{PR}$. |
| 455 | 804a19 | R1 | Expresses the angle correct to 1 decimal place | Round your calculated angle to 1 decimal place. |
| 456 | 804a19 | CK2 | Forms the angle at $Q$ as "their" $x+9^\circ$ | Add $9^\circ$ to your value of $x$ to form the angle at $Q$. |
| 457 | 804a19 | R2 | Expresses "their" distance correct to 3 significant figures | Round your calculated distance to 3 significant figures. |
| 458 | 804a19 | CK3 | Identifies $PQ=PR-QR$ from the positions on the same straight line | Use the straight-line positions to subtract $QR$ from $PR$ and find $PQ$. |
| 459 | 804a19 | R3 | States that the marker moves towards $R$ | State that the marker moves towards $R$. |
| 460 | 804a21 | CK1 | Recognises that reverse bearings differ by $180°$ | Use the fact that reversing a bearing changes the direction by $180°$. |
| 461 | 804a21 | AK1 | Adds $180°$ to $070°$ to obtain $250°$ | Add $180°$ to $070°$ to find the reverse bearing. |
| 462 | 804a21 | CK2 | Uses bearing $QP$ as "their" answer from part (a) | Use your answer from part (a) as the bearing $QP$. |
| 463 | 804a21 | AK2 | Finds $250°-160°$ | Subtract the bearing of $QR$ from your bearing of $QP$. |
| 464 | 804a21 | R1 | Identifies the smaller angle at $Q$ as $90°$ | Identify the smaller angle at $Q$ by taking the smaller difference between the two bearings. |
| 465 | 804a21 | CK3 | Recognises that $PQ=QR$ makes $\triangle PQR$ isosceles | Recognise that $PQ=QR$ makes $\triangle PQR$ isosceles. |
| 466 | 804a21 | AK3 | Calculates each base angle as $(180°-\text{their }\angle PQR)\div2$ | Calculate each base angle using $(180°-\text{your }\angle PQR)\div2$. |
| 467 | 804a21 | R2 | Adds "their" angle at $P$ clockwise to bearing $070°$ | Add your angle at $P$ clockwise to the bearing $070°$. |
| 468 | 804a21 | R3 | States the bearing in three-digit format as $115°$ | Write the bearing in three-digit format, using a leading zero if needed. |
| 469 | 804a29 | CK1 | Recognises that $gf(x)=g(f(x))$ | Interpret $gf(x)$ as applying $f$ first and then applying $g$ to the result. |
| 470 | 804a29 | AK1 | Substitutes $x+1$ into $g$ | Replace the input of $g$ with the expression produced by $f(x)$ before simplifying. |
| 471 | 804a29 | AK2 | Simplifies to $x^2-2x-8$ | Expand the substituted expression, combine like terms, and write the quadratic in simplified form. |
| 472 | 804a29 | CK2 | Identifies that elements with image $-8$ occur where the graph meets $y=-8$ | Use the horizontal line at the requested image value and read the $x$-coordinates where it meets the graph. |
| 473 | 804a29 | R3 | Uses symmetry about $x=1$ and "their" $gf(3)$ to identify $x=-1$ as another index with image $-5$ | Use symmetry about $x=1$ and your earlier $gf(3)$ value to locate the matching index on the opposite side of the axis. |
| 474 | 804a29 | AK4 | Factorises "their" expression from (a), or otherwise solves "their" equation $gf(x)=0$ | Set your expression from part (a) equal to zero, then factor it or solve the resulting equation for its roots. |
| 475 | 804a29 | R4 | Justifies rejection of the one-root conclusion by identifying two $x$-intercepts on the graph | Reject the one-root conclusion by showing that the graph crosses the $x$-axis at two distinct positions. |
| 476 | 804a31 | CK1 | Identifies that $P \cup C$ includes the three regions inside the circles | Identify the three regions inside the circles as $P \cup C$. |
| 477 | 804a31 | AK1 | Adds $14+6+10$ to obtain $30$ | Add $14+6+10$ to find the total inside the circles. |
| 478 | 804a31 | CK2 | States neither item as $P' \cap C'$ | Write the customers who bought neither item as $P' \cap C'$. |
| 479 | 804a31 | AK2 | Subtracts "their" $n(P \cup C)$ from $50$ | Subtract your $n(P \cup C)$ from $50$. |
| 480 | 804a31 | CK3 | Selects "their" $n(P \cup C)$ as the number of customers requiring vouchers | Use your $n(P \cup C)$ as the number of customers who require vouchers. |
| 481 | 804a31 | AK3 | Divides "their" number of voucher recipients by $4$ | Divide your number of voucher recipients by $4$. |
| 482 | 804a31 | R1 | Rounds up "their" quotient to a whole number of booklets | Round your quotient up to a whole number of booklets. |
| 483 | 804a31 | AK4 | Calculates unused vouchers as $4\times$ "their" number of booklets minus "their" $n(P \cup C)$ | Calculate unused vouchers using $4\times$ your number of booklets minus your $n(P \cup C)$. |
| 484 | 804a31 | R2 | Compares "their" unused vouchers with "their" number who bought neither item | Compare your unused vouchers with your number of customers who bought neither item. |
| 485 | 804a31 | R3 | Concludes that the unused vouchers are not enough | Conclude that the unused vouchers are not enough. |
| 486 | 804a39 | CK1 | Recognises a constant second difference of $4$ from the diagram | Calculate the first differences between consecutive figures, then compare them to identify the constant second difference. |
| 487 | 804a39 | R1 | Forms $2n^2+3n$ from the pattern | Use the constant second difference to build the quadratic rule for the number of seedlings in figure $n$. |
| 488 | 804a39 | CK2 | Substitutes $n=5$ into "their" factorised expression | Replace $n$ with $5$ in your factorised expression for the pattern. |
| 489 | 804a39 | AK2 | Evaluates $2(5)+3$ | Evaluate the bracketed calculation after substituting $n=5$. |
| 490 | 804a39 | CK3 | Recognises that each complete pattern requires "their" Figure $5$ total | Use your Figure $5$ total as the number of seedlings needed for one complete pattern. |
| 491 | 804a39 | R2 | Divides $180$ by "their" Figure $5$ total and selects the greatest whole number of complete patterns | Divide $180$ by your Figure $5$ total and choose the largest whole number of complete patterns. |
| 492 | 804a39 | AK4 | Subtracts $2\times$ "their" Figure $5$ total from $180$ | Subtract $2\times$ your Figure $5$ total from $180$ to find how many seedlings remain. |
| 493 | 804a64 | CK1 | Identifies that the y-intercept occurs when $x=0$ | Find the point where $x=0$ to identify the y-intercept. |
| 494 | 804a64 | CK2 | Recognises that the x-intercept has net amount $0$ | Use the point where the graph has net amount $0$ to locate the x-intercept. |
| 495 | 804a64 | R2 | Forms $2x +$ "their" y-coordinate $=0$ | Form an equation by adding twice the number of bottles to your earlier y-coordinate and setting the result equal to $0$. |
| 496 | 804a64 | AK1 | Rearranges correctly to obtain $2x=8$, or follow-through equivalent | Rearrange your equation to isolate $x$, keeping your earlier value if you used one. |
| 497 | 804a64 | AK3 | Multiplies \$2 by "their" number of bottles | Multiply \$2 by your number of bottles to find the sales received. |
| 498 | 804a64 | CK3 | Recognises that sales received equal the initial loss when net amount is $0$ | Recognise that a net amount of $0$ means the sales received exactly cover the initial loss. |
| 499 | 804a64 | R3 | States that there is no profit or loss | State that the situation results in no profit or loss. |
| 500 | 804a74 | CK1 | Forms $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. | Form $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ by subtracting the position vector of $A$ from that of $B$. |

## Batch 3 — proposed (500 rows, gpt-5.6-terra, 2026-09-05)

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | 804a74 | AK1 | Subtracts corresponding components to obtain $\begin{pmatrix}6\\8\end{pmatrix}$. | Subtract A’s components from B’s corresponding components and write the result as $\begin{pmatrix}u\\v\end{pmatrix}$. |
| 2 | 804a74 | CK2 | Uses $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$. | Use $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$ to find a vector’s magnitude. |
| 3 | 804a74 | AK2 | Calculates $\sqrt{6^2+8^2}=10$. | Substitute the two components of your displacement into $\sqrt{a^2+b^2}$ and simplify the result. |
| 4 | 804a74 | R1 | Concludes Yes because $\begin{pmatrix}\frac{3}{5}\\\frac{4}{5}\end{pmatrix}$ is a positive scalar multiple of “their” $\overrightarrow{AB}$. | Conclude Yes by showing that the proposed vector is a positive scalar multiple of your $\overrightarrow{AB}$. |
| 5 | 804a74 | CK3 | Recognises that a unit vector has magnitude $1$. | Check that the proposed vector has unit magnitude before deciding whether it is a unit vector. |
| 6 | 804a74 | AK3 | Shows $\sqrt{\left(\frac{3}{5}\right)^2+\left(\frac{4}{5}\right)^2}=1$. | Calculate its magnitude using $\sqrt{\left(\frac{p}{q}\right)^2+\left(\frac{r}{s}\right)^2}$ and check that it satisfies the unit-vector condition. |
| 7 | 804a74 | AK4 | Converts $3$ m to $6$ grid units. | Divide the stated distance in metres by the number of metres represented by one grid unit. |
| 8 | 804a74 | R2 | Uses “their” unit vector to obtain the displacement $6\begin{pmatrix}\frac{3}{5}\\\frac{4}{5}\end{pmatrix}=\begin{pmatrix}\frac{18}{5}\\\frac{24}{5}\end{pmatrix}$. | Multiply your unit vector by the grid-unit distance and write the displacement as $\begin{pmatrix}\frac{p}{q}\\\frac{r}{s}\end{pmatrix}$. |
| 9 | 804a74 | R3 | Adds the displacement to $\overrightarrow{OA}$ to obtain $\begin{pmatrix}\frac{23}{5}\\\frac{29}{5}\end{pmatrix}$. | Add the displacement to $\overrightarrow{OA}$ and write the resulting position vector as $\begin{pmatrix}\frac{p}{q}\\\frac{r}{s}\end{pmatrix}$. |
| 10 | 804a7c | CK1 | Recognises that corresponding entries of matrices of the same order are added | Add each entry in one matrix to the entry in the same position in the other matrix. |
| 11 | 804a7c | AK1 | Adds the entries in the first row correctly | Add the corresponding entries across the first row to form the first row of your total matrix. |
| 12 | 804a7c | CK2 | Recognises that "their" order matrix can be multiplied by the price column vector | Multiply your order matrix by the price column vector to find the charges. |
| 13 | 804a7c | R1 | Uses the price vector on the right of "their" order matrix | Write the price column vector on the right of your order matrix before multiplying. |
| 14 | 804a7c | AK3 | Calculates the first component using "their" first row | Use the first row of your order matrix to calculate the first component of the charge vector. |
| 15 | 804a7c | CK3 | Identifies that both shop charges must be included in the budget comparison | Include both shop charges when you find the total amount to compare with the budget. |
| 16 | 804a7c | R2 | Finds the amount remaining by subtracting the sum of "their" charges from \$550 | Subtract the sum of your charges from \$550 to find the amount remaining. |
| 17 | 804a7c | R3 | Compares "their" total charge with \$550 and states that the budget is sufficient | Compare your total charge with \$550 and state whether the budget is sufficient. |
| 18 | 804a84 | CK1 | Recognises that reverse bearings differ by $180°$. | Use the fact that reverse bearings differ by $180°$. |
| 19 | 804a84 | AK1 | Calculates $230°-180°=50°$. | Subtract $180°$ from the given bearing. |
| 20 | 804a84 | R1 | Writes the bearing as $050°$. | Write your bearing in three-digit format, adding a leading zero if needed. |
| 21 | 804a84 | CK2 | Recognises that perpendicular paths form an angle of $90°$. | Use the fact that perpendicular paths form an angle of $90°$. |
| 22 | 804a84 | AK2 | Adds $90°$ to "their" bearing of $B$ from $A$. | Add $90°$ to your bearing of $B$ from $A$. |
| 23 | 804a84 | R2 | Uses the clockwise position of $C$ to obtain $140°$. | Use the clockwise position of $C$ to choose the correct right-angle turn. |
| 24 | 804a84 | CK3 | Recognises that the bearing of $A$ from $C$ is the reverse bearing. | Treat the bearing of $A$ from $C$ as the reverse of the bearing of $C$ from $A$. |
| 25 | 804a84 | AK3 | Adds $180°$ to "their" bearing of $C$ from $A$. | Add $180°$ to your bearing of $C$ from $A$. |
| 26 | 804a84 | R3 | Writes "their" reverse bearing in three-digit format, $320°$. | Write your reverse bearing in three-digit format. |
| 27 | 804a99 | CK1 | Recognises that the cost of all cases is found by multiplying the number of cases by the cost per case | Multiply the number of cases by the cost per case to find the cost before discount. |
| 28 | 804a99 | CK2 | Uses $12\%$ of "their" cost before discount as the discount | Find $12\%$ of your cost before discount to get the discount. |
| 29 | 804a99 | AK2 | Subtracts the discount from "their" cost before discount | Subtract the discount from your cost before discount. |
| 30 | 804a99 | CK3 | Applies the $15\%$ tax to "their" discounted cost | Apply the $15\%$ tax rate to your discounted cost. |
| 31 | 804a99 | AK3 | Calculates $15\%$ of "their" discounted cost | Calculate $15\%$ of your discounted cost to find the tax. |
| 32 | 804a99 | AK4 | Adds "their" tax to "their" discounted cost | Add your tax to your discounted cost to find the total amount payable. |
| 33 | 804a99 | R1 | Compares "their" total amount payable with \$4 000 | Compare your total amount payable with \$4 000. |
| 34 | 804a99 | R2 | Finds the shortfall from "their" total amount payable | Subtract \$4 000 from your total amount payable to find the shortfall. |
| 35 | 804a99 | R3 | States that the cash is not sufficient | State that the cash is not sufficient because your total amount payable is greater than the cash available. |
| 36 | 804aa6 | CK1 | Recognises that the coconut-bar total is $9 \times 14$ | Find the coconut-bar total by multiplying the 9 crates by 14 bars in each crate: $9 \times 14$. |
| 37 | 804aa6 | CK2 | Recognises that the ginger-bar total is $9 \times 6$ | Find the ginger-bar total by multiplying the 9 crates by 6 bars in each crate: $9 \times 6$. |
| 38 | 804aa6 | AK3 | Adds the two bar totals to obtain $180$ | Add your coconut-bar total and your ginger-bar total to find the total number of bars. |
| 39 | 804aa6 | CK3 | States the distributive property | State the distributive property as the property used. |
| 40 | 804aa6 | R1 | Explains that 9 is the common number of crates | Explain that 9 is the common number of crates in both products. |
| 41 | 804aa6 | R2 | Divides "their" total number of bars by 13 | Divide your total number of bars by 13 to find how many full boxes you can fill. |
| 42 | 804aa6 | AK4 | Obtains $13$ remainder $11$, or equivalent | Write the quotient and remainder from your division. |
| 43 | 804aa6 | R3 | Includes one further box for the remaining bars | Add one more box when your remainder shows that some bars are left over. |
| 44 | 804aae | CK1 | Recognises that the grand total is found by combining all four outcomes. | Combine the frequencies from all four outcomes to find the grand total. |
| 45 | 804aae | AK1 | Adds the frequencies to obtain $50$. | Add all four frequencies to obtain $50$. |
| 46 | 804aae | CK2 | Selects $15$ as the frequency for tail and odd number. | Read the frequency in the table where tail and odd number meet. |
| 47 | 804aae | AK2 | Divides $15$ by "their" total and simplifies to $\frac{3}{10}$. | Divide $15$ by your total, then simplify the fraction to $\frac{3}{10}$. |
| 48 | 804aae | CK3 | Recognises that the theoretical probability is $\frac{1}{2}\times\frac{1}{2}$. | For the theoretical probability, multiply the probability of a tail by the probability of an odd number: $\frac{1}{2}\times\frac{1}{2}$. |
| 49 | 804aae | AK3 | Evaluates the theoretical probability as $\frac{1}{4}$. | Evaluate $\frac{1}{2}\times\frac{1}{2}$ to get $\frac{1}{4}$. |
| 50 | 804aae | R1 | Finds the difference between "their" experimental probability and $\frac{1}{4}$, giving $\frac{1}{20}$. | Subtract $\frac{1}{4}$ from your experimental probability and simplify the difference to $\frac{1}{20}$. |
| 51 | 804aae | R2 | States that the results support the theoretical probability. | State that the experimental result supports the theoretical probability. |
| 52 | 804aae | R3 | Justifies the conclusion by relating "their" experimental probability to the theoretical probability or by identifying a small difference. | Justify your conclusion by showing that your experimental probability is close to the theoretical probability or that the difference is small. |
| 53 | 804ab6 | CK1 | Identifies red, blue and green as the possible token colours | Read the bar chart and list every token colour with a non-zero bar. |
| 54 | 804ab6 | AK1 | States a valid sample space, $\{R, B, G\}$ | Write each possible colour initial inside the sample-space braces $\{\}$. |
| 55 | 804ab6 | CK2 | Counts 6 tokens from the bar chart | Add the frequencies of all the colour bars to find the total number of tokens. |
| 56 | 804ab6 | AK2 | Calculates $\frac{3}{6}$, giving $\frac{1}{2}$ | Write the red probability as $\frac{\text{red-token frequency}}{\text{total-token frequency}}$ and simplify it. |
| 57 | 804ab6 | CK3 | Recognises that both a red token and a head are required | Treat getting a voucher as needing both events to happen: selecting red and getting a head. |
| 58 | 804ab6 | AK3 | Multiplies "their" probability of red by $\frac{1}{2}$ | Multiply your probability of red by the probability of getting a head, using $\frac{\text{favourable outcomes}}{\text{total outcomes}}$ for each probability. |
| 59 | 804ab6 | R1 | Finds the required new probability as "their" probability from (c) minus $\frac{1}{12}$ | Subtract the stated reduction, written as $\frac{\text{numerator}}{\text{denominator}}$, from your probability in part (c). |
| 60 | 804ab6 | R2 | Uses 3 red tokens and a total of $6+x$ tokens after adding $x$ blue tokens | Keep the original red-token count unchanged and write the new total as the original total plus $x$ after adding blue tokens. |
| 61 | 804ab6 | R3 | Forms $\frac{3}{2(6+x)} =$ "their" required new probability | Set $\frac{\text{unchanged red count}}{2(\text{new total})}$ equal to your required probability. |
| 62 | 804ab6 | AK5 | Solves the equation to obtain $x=3$ | Rearrange and solve your equation for $x$. |
| 63 | 804ab6 | R4 | Interprets $x=3$ as 3 blue tokens to be added | State that the value of $x$ represents the number of blue tokens you add. |
| 64 | 804ad2 | CK1 | Selects compatible distance and speed units | Convert the distances into kilometres so they match speeds written in kilometres per hour. |
| 65 | 804ad2 | AK1 | Divides $1.2$ by $3$ to obtain $0.4\text{ h}$ | Divide $1.2$ by $3$ and state the time in $\text{h}$. |
| 66 | 804ad2 | CK2 | Identifies $AB$, $BC$ and $CA$ as the three sections of the complete journey | Use $AB$, $BC$ and $CA$ as the three sections that make up the whole journey. |
| 67 | 804ad2 | AK3 | Converts and adds the distances to obtain $5\text{ km}$ | Convert each section distance to kilometres, then add all three distances and state the total in $\text{km}$. |
| 68 | 804ad2 | CK3 | Uses average speed as total distance divided by total time | Find the average speed by dividing the total distance by the total time. |
| 69 | 804ad2 | AK4 | Divides "their" total distance by $4\frac{1}{6}$ to obtain $1.2\text{ h}$ | Divide your total distance by $4\frac{1}{6}$ and state the time in $\text{h}$. |
| 70 | 804ad2 | R1 | Subtracts "their" times for $AB$ and $BC$ from "their" total journey time | Subtract your times for $AB$ and $BC$ from your total journey time to find the time for $CA$. |
| 71 | 804ad2 | R3 | Divides $2\text{ km}$ by "their" time for $CA$ to infer $5\text{ km/h}$ | Divide $2\text{ km}$ by your time for $CA$ and state the speed in $\text{km/h}$. |
| 72 | 804ada | CK1 | Reads the start and stop times as $2\text{ s}$ and $8\text{ s}$ | Read the labelled start and stop times from the diagram, keeping the units as $\text{ s}$. |
| 73 | 804ada | CK2 | Recognises that the equation must be squared to remove the square root | Square both sides of the equation to remove the square root. |
| 74 | 804ada | AK2 | Obtains $T^2=\frac{4\pi^2l}{g}$ | After squaring, simplify so that $T^2$ is written as one fraction containing $\pi^2$, with denominator $g$. |
| 75 | 804ada | AK3 | Rearranges correctly to obtain $l=\frac{gT^2}{4\pi^2}$ | Isolate $l$ by multiplying by $g$ and dividing by the coefficient containing $\pi^2$, then write the result as $\frac{\text{numerator}}{\text{denominator}}$. |
| 76 | 804ada | CK3 | Substitutes $g=10$ and "their" value of $T$ into the rearranged formula | Substitute $g=10$ and your value of $T$ into your rearranged formula. |
| 77 | 804ada | AK4 | Simplifies to $\frac{90}{\pi^2}$, or correct follow-through using "their" value of $T$ | Simplify your substitution to one exact fraction of the form $\frac{\text{numerator}}{\pi^2}$, following through with your value of $T$. |
| 78 | 804ada | R1 | Expresses "their" answer in exact form | Leave your length in exact form, using $\pi$ rather than a decimal approximation. |
| 79 | 804ada | R2 | States that the cord is not long enough, following through from "their" length | Compare your length with the available cord length and state whether the cord is long enough, following through from your length. |
| 80 | 804ada | R3 | Justifies that $\frac{90}{\pi^2}>9$ using $\pi^2<10$ | Use $\pi^2<10$ to compare your exact fraction $\frac{\text{numerator}}{\pi^2}$ with the required length. |
| 81 | 804ae2 | CK1 | Uses $\vec{PQ}=\vec{OQ}-\vec{OP}$ | Find the displacement by subtracting the position vector of $P$ from the position vector of $Q$: $\vec{PQ}=\vec{OQ}-\vec{OP}$. |
| 82 | 804ae2 | AK1 | Calculates the horizontal component as $1-(-3)=4$ | Subtract the x-coordinate of $P$ from the x-coordinate of $Q$ to find the horizontal component. |
| 83 | 804ae2 | AK2 | Calculates the vertical component as $4-1=3$ | Subtract the y-coordinate of $P$ from the y-coordinate of $Q$ to find the vertical component. |
| 84 | 804ae2 | CK2 | Recognises that $\vec{PR}=\vec{PQ}+\vec{QR}$ | Form the displacement to $R$ by adding the two route vectors: $\vec{PR}=\vec{PQ}+\vec{QR}$. |
| 85 | 804ae2 | AK3 | Adds the corresponding components of "their" $\vec{PQ}$ and $\vec{QR}$ | Add the horizontal components together and add the vertical components together for your $\vec{PQ}$ and $\vec{QR}$. |
| 86 | 804ae2 | R1 | Obtains $\binom{8}{0}$, following through from "their" $\vec{PQ}$ | Write the two summed components as a column vector $\binom{a}{b}$, following through from your earlier $\vec{PQ}$. |
| 87 | 804ae2 | CK3 | Uses $\|\binom{x}{y}\|=\sqrt{x^2+y^2}$ | Use the vector-length formula $\|\binom{x}{y}\|=\sqrt{x^2+y^2}$. |
| 88 | 804ae2 | R2 | Finds the magnitude of "their" $\vec{PR}$ | Substitute the two components of your $\vec{PR}$ into the magnitude calculation and evaluate the square root. |
| 89 | 804ae2 | R3 | Uses the scale of $5$ m per grid unit to obtain $40\text{ m}$ | Multiply your magnitude in grid units by the scale factor $5\text{ m}$ per grid unit to give the distance in metres. |
| 90 | 804aea | CK1 | Recognises that reciprocal bearings differ by $180°$ | Reverse the bearing by turning $180°$ to get the reciprocal bearing. |
| 91 | 804aea | CK2 | Recognises that a bearing to the south-east is between $090°$ and $180°$ | Place a south-east bearing between $090°$ and $180°$. |
| 92 | 804aea | AK2 | Subtracts $75°$ from "their" bearing of $A$ from $B$ | Subtract $75°$ from your earlier bearing of $A$ from $B$. |
| 93 | 804aea | R1 | Selects the south-east direction, giving $140°$ rather than $290°$ | Choose the south-east direction rather than the north-west alternative. |
| 94 | 804aea | CK3 | Recognises that the bearing of $B$ from $C$ differs by $180°$ from "their" bearing of $C$ from $B$ | Reverse your earlier bearing of $C$ from $B$ by changing it by $180°$. |
| 95 | 804aea | AK3 | Calculates the bearing of $B$ from $C$ as "their" $140°+180°=320°$ | Add $180°$ to your earlier bearing of $C$ from $B$ to calculate the bearing of $B$ from $C$. |
| 96 | 804aea | R2 | Finds the smaller angle between "their" bearing of $B$ from $C$ and $270°$ | Find the smaller angle between your bearing of $B$ from $C$ and $270°$. |
| 97 | 804aea | CK4 | Selects the sine rule using $AB/\sin(\angle BCA)=AC/\sin(75°)$ | Use the sine rule in the form $\dfrac{AB}{\sin(\angle BCA)}=\dfrac{AC}{\sin(75°)}$. |
| 98 | 804aea | AK4 | Calculates $\angle BAC=090°-035°=55°$ | Calculate $\angle BAC$ by subtracting the two given bearings at $A$. |
| 99 | 804aea | AK5 | Substitutes $180\sin(\text{"their" }\angle BCA)/\sin(75°)$ and evaluates | Substitute your earlier $\angle BCA$ into $\dfrac{180\sin(\text{your }\angle BCA)}{\sin(75°)}$ and evaluate it. |
| 100 | 804aea | R3 | Expresses "their" distance correct to 3 significant figures | Write your distance correct to $3$ significant figures. |
| 101 | 804af7 | CK1 | Recognises that $fg(x)=f(g(x))$ | Interpret $fg(x)$ as applying $g$ first and then applying $f$ to the result. |
| 102 | 804af7 | AK1 | Substitutes $x+1$ for $x$ in $f(x)$ | Replace $x$ in $f(x)$ with the expression produced by $g(x)$. |
| 103 | 804af7 | R1 | Reads the minimum value $-4$ from the turning point | Read the y-coordinate of the turning point as the minimum value. |
| 104 | 804af7 | AK3 | Factors "their" quadratic as $(x-3)(x+1)$ | Factor your quadratic into two linear brackets by finding two numbers with the required product and sum. |
| 105 | 804af7 | CK3 | Identifies that an image of $-3$ is represented by the horizontal level $y=-3$ | Locate the horizontal graph level that corresponds to the specified image value. |
| 106 | 804af7 | R2 | Obtains one domain element from the intersection at $x=0$ | Read one domain element from the x-coordinate where that horizontal level intersects the curve. |
| 107 | 804af7 | R3 | Uses "their" axis of symmetry to identify the second domain element $x=2$ | Use your axis of symmetry to reflect your first domain element across the axis and find the second one. |
| 108 | 804aff | CK1 | Selects the tangent ratio for triangle $BCD$ | Choose tangent by relating the opposite height to the adjacent horizontal side in $\tan 28^\circ=\frac{CD}{75}$. |
| 109 | 804aff | AK1 | Substitutes $75$ and $28^\circ$ into $\tan 28^\circ=\frac{CD}{75}$ | Substitute the given length and angle into $\tan 28^\circ=\frac{CD}{75}$. |
| 110 | 804aff | AK2 | Calculates $CD=75\tan28^\circ$ | Calculate $CD$ by evaluating $75\tan28^\circ$. |
| 111 | 804aff | R1 | Expresses the height correct to 3 significant figures | Round your height to 3 significant figures and include the unit. |
| 112 | 804aff | CK2 | Identifies that $AC=AB+BC$ | Identify $AC$ by adding the two horizontal distances, $AB$ and $BC$. |
| 113 | 804aff | AK3 | Calculates $AC=45+75=120\text{ m}$ | Calculate $AC$ in $\text{m}$ by adding the two given horizontal lengths. |
| 114 | 804aff | CK3 | Selects the tangent ratio using $CD$ and $AC$ | Use the tangent ratio $\tan\angle DAC=\frac{CD}{AC}$. |
| 115 | 804aff | AK4 | Calculates $\tan^{-1}\left(\frac{\text{their }CD}{120}\right)$ | Calculate $\tan^{-1}\left(\frac{\text{your }CD}{120}\right)$ using your earlier $CD$ value. |
| 116 | 804aff | R2 | Expresses the angle correct to 1 decimal place | Round your angle to 1 decimal place and include $^\circ$. |
| 117 | 804aff | R3 | Concludes that the camera will not identify the lighthouse because "their" angle is less than $20^\circ$ | Conclude that the camera does not identify the lighthouse because your angle is less than $20^\circ$. |
| 118 | 804b07 | CK1 | Recognises that $V$ contains the regions labelled $6$ and $x$ | Look at set $V$ and include both the overlap labelled $6$ and the part labelled $x$. |
| 119 | 804b07 | R1 | Forms $x + 6 = 21$ | Use $n(V)=21$ to write $x+6=21$. |
| 120 | 804b07 | CK2 | Identifies the three regions in $H \cup V$ | Identify the three regions that lie in $H \cup V$. |
| 121 | 804b07 | AK2 | Adds $14$, $6$ and "their" value of $x$ | Add $14$, $6$, and your value of $x$ to find $n(H \cup V)$. |
| 122 | 804b07 | CK3 | Recognises $(H \cup V)'$ as the region outside both sets | Select the region outside both $H$ and $V$ for $(H \cup V)'$. |
| 123 | 804b07 | AK3 | Subtracts "their" $n(H \cup V)$ from $40$ | Subtract your $n(H \cup V)$ from $40$. |
| 124 | 804b0f | CK1 | Identifies $5x$ as the highest common factor | Find the greatest factor that divides both terms, including the common variable factor. |
| 125 | 804b0f | AK1 | Divides both terms by $5x$ to obtain $3x+4$ | Divide each term by the common factor to find the expression left inside the brackets. |
| 126 | 804b0f | CK2 | Recognises that total tiles equal tiles per row multiplied by number of rows | Write the total number of tiles as the number in each row multiplied by the number of rows. |
| 127 | 804b0f | R1 | Uses "their" factorisation, matching $5x$ to the number of tiles in each row | Use your factorisation to identify which factor represents the number of tiles in each row. |
| 128 | 804b0f | CK3 | Forms $5x=3x+4$ for a square wall | Set the two dimensions equal because a square has the same number of rows as tiles in each row. |
| 129 | 804b0f | AK3 | Solves "their" equation to obtain $x=2$ | Solve your equation for $x$ by collecting the variable terms and then isolating $x$. |
| 130 | 804b0f | R3 | Concludes that $x=2$ satisfies the positive whole-number condition | Check that your value of $x$ is a positive whole number before stating that it is suitable. |
| 131 | 804b0f | CK4 | Recognises that the required total is the product of the two equal dimensions | Find the required total by multiplying the two equal dimensions. |
| 132 | 804b0f | AK4 | Substitutes "their" value of $x$ to calculate $10\times10$ | Substitute your value of $x$ into both dimensions, then calculate $\text{row size}\times\text{number of rows}$. |
| 133 | 804b1c | R1 | Reads the $V$-intercept correctly from the graph | Read the coordinate where the line crosses the $V$-axis and write the intercept as an ordered pair. |
| 134 | 804b1c | R2 | Reads the $t$-intercept correctly from the graph | Read the coordinate where the line crosses the $t$-axis and write the intercept as an ordered pair. |
| 135 | 804b1c | CK3 | Uses the change in volume over the change in time | Divide the change in volume by the change in time to find the rate of decrease. |
| 136 | 804b1c | AK1 | Finds the decrease in volume as $16$ litres over $8$ hours, or using "their" intercepts | Use your two intercepts to find how much the volume decreases and how long the decrease takes. |
| 137 | 804b1c | AK3 | Uses $16-2(5)$, or "their" initial volume and rate | Subtract the volume lost after $5$ hours, using your initial volume and your rate of decrease. |
| 138 | 804b1c | R3 | Compares "their" volume with $7$ litres and concludes that it is insufficient | Compare your calculated volume with $7$ litres and state whether it is insufficient for the garden. |
| 139 | 804b2c | CK1 | Forms $\vec{HM}=\vec{OM}-\vec{OH}$ | Calculate $\vec{HM}=\vec{OM}-\vec{OH}$ by subtracting the position vector of $H$ from the position vector of $M$. |
| 140 | 804b2c | AK1 | Subtracts components to obtain $\begin{pmatrix}3\\4\end{pmatrix}$ | Subtract the corresponding components to form $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 141 | 804b2c | CK2 | Selects $\sqrt{x^2+y^2}$ to find the magnitude of "their" vector | Find the magnitude of your vector using $\sqrt{x^2+y^2}$. |
| 142 | 804b2c | AK2 | Evaluates $\sqrt{3^2+4^2}=5$ grid units, or equivalent using "their" vector | Substitute the components of your vector into $\sqrt{x^2+y^2}$ and evaluate the result in grid units. |
| 143 | 804b2c | R1 | Converts "their" grid distance using $100$ m per grid unit | Multiply your grid distance by $100$ m per grid unit to convert it to metres. |
| 144 | 804b2c | CK3 | Recognises that a unit vector is found by dividing a vector by its magnitude | Find a unit vector by dividing a vector by its magnitude. |
| 145 | 804b2c | AK3 | Divides both components of "their" $\vec{HM}$ by "their" magnitude | Divide each component of your $\vec{HM}$ by your magnitude. |
| 146 | 804b2c | R2 | Uses the direction from $H$ to $M$, not the reverse direction | Use the direction from $H$ to $M$, so your vector points towards $M$ rather than towards $H$. |
| 147 | 804b34 | CK1 | Recognises that the overtime rate is $1.5 \times \$18$ per hour | Use an overtime rate of $1.5 \times \$18$ per hour. |
| 148 | 804b34 | AK1 | Calculates ordinary and overtime earnings | Calculate the ordinary earnings and the overtime earnings separately by multiplying each number of hours by its rate. |
| 149 | 804b34 | CK2 | Recognises that tax applies only to gross earnings above \$1 400 | Apply income tax only to the part of the gross earnings above \$1 400. |
| 150 | 804b34 | R1 | Finds taxable earnings by subtracting \$1 400 from "their" gross earnings | Find the taxable earnings by subtracting \$1 400 from your gross earnings. |
| 151 | 804b34 | AK3 | Finds 10% of "their" taxable earnings | Calculate 10% of your taxable earnings to find the income-tax deduction. |
| 152 | 804b34 | CK3 | Recognises that the health-insurance deduction is 2% of gross earnings | Use 2% of the gross earnings for the health-insurance deduction. |
| 153 | 804b34 | R2 | Subtracts "their" tax and insurance deductions from "their" gross earnings to obtain net pay | Subtract your tax deduction and your insurance deduction from your gross earnings to obtain your net pay. |
| 154 | 804b34 | CK4 | Identifies the investment as 18% of "their" net pay | Identify the investment as 18% of your net pay. |
| 155 | 804b34 | AK4 | Calculates 18% of "their" net pay | Calculate 18% of your net pay to find the investment amount. |
| 156 | 804b34 | R3 | Subtracts "their" investment from "their" net pay to find the amount retained | Subtract your investment from your net pay to find the amount retained. |
| 157 | 804b34 | R4 | Concludes that "their" retained amount is less than \$1 210 | Compare your retained amount with \$1 210 and conclude whether it is less. |
| 158 | 821070 | CK1 | Recognises the square-number pattern. | Use the square-number pattern in the diagram to find the number of packets in Figure 4. |
| 159 | 821070 | R1 | Forms \$25 multiplied by "their" number of packets. | Multiply \$25 by your number of packets to form the marked price. |
| 160 | 821070 | CK2 | Identifies discount as marked price minus sale price. | Find the discount by subtracting the sale price from the marked price. |
| 161 | 821070 | AK3 | Finds "their" marked price minus \$340. | Subtract \$340 from your marked price to find your discount. |
| 162 | 821070 | R2 | Divides "their" discount by "their" marked price and multiplies by 100. | Divide your discount by your marked price and multiply by 100. |
| 163 | 821070 | R3 | States the discount as a percentage. | State your discount as a percentage using the \% symbol. |
| 164 | 82109b | CK1 | Identifies that the $y$-intercept occurs when $x=0$ | Set $x=0$ to locate the $y$-intercept on the graph. |
| 165 | 82109b | CK2 | Uses the linear relationship $P=mx+c$ | Use the linear form $P=mx+c$ to organise the equation of the line. |
| 166 | 82109b | AK1 | Calculates gradient $=\frac{3-(-12)}{10-0}=1.5$ | Choose two points on the line and calculate the gradient as $\frac{\text{change in }P}{\text{change in }x}$. |
| 167 | 82109b | AK2 | Forms $P=1.5x-12$, using "their" $y$-intercept | Substitute your gradient and your $y$-intercept into $P=mx+c$ to form your equation. |
| 168 | 82109b | AK3 | Substitutes $P=0$ into "their" equation | Replace $P$ with $0$ in your equation to represent break-even. |
| 169 | 82109b | AK4 | Solves "their" equation for $x$ | Rearrange your equation step by step until $x$ is the subject. |
| 170 | 82109b | R2 | Interprets "their" value of $x$ as the break-even number of garments | State that your value of $x$ is the number of garments made when profit is zero. |
| 171 | 82109b | AK5 | Solves $\text{their }P\geq6$ using "their" equation | Use your equation to solve $\text{your }P\geq6$ for $x$. |
| 172 | 82109b | R3 | Selects the least whole number satisfying "their" inequality | Choose the smallest whole number that satisfies your inequality. |
| 173 | 8210a8 | AK1 | Continues the pattern to obtain 15 beads. | Continue the bead pattern by adding the next increase to find the number of beads in the next figure. |
| 174 | 8210a8 | AK2 | Multiplies "their" number of beads by 4. | Multiply your number of beads by $4$ to find the marked price. |
| 175 | 8210a8 | CK1 | Uses 75% of the marked price as the sale price. | Calculate the sale price as $75\%$ of the marked price. |
| 176 | 8210a8 | R1 | Adds \$18 to "their" sale price to obtain \$63. | Add $\$18$ to your sale price to find the other sale price. |
| 177 | 8210a8 | R2 | Reverses the discount to find a marked price of \$84. | Reverse the discount by dividing your sale price by $0.75$ to find the marked price. |
| 178 | 8210a8 | R3 | Uses \$4 per bead to obtain 21 beads. | Divide the marked price by $\$4$ per bead to find the number of beads. |
| 179 | 8210a8 | CK2 | Identifies 21 beads as Figure 5 in the pattern. | Match your number of beads to the pattern to identify its figure number. |
| 180 | 8210b0 | CK1 | Recognises that the total for Fortnight 1 is $5 \times 20$ | Find the total number of crates by multiplying the five days by the mean, using $5 \times 20$. |
| 181 | 8210b0 | AK1 | Calculates the total as $100$ crates | Calculate the product for the total number of crates in Fortnight 1. |
| 182 | 8210b0 | AK2 | Subtracts the four known values from $100$ to obtain $20$ | Subtract all four known daily harvests from your Fortnight 1 total to find the missing Wednesday harvest. |
| 183 | 8210b0 | CK2 | Identifies $16$ and $24$ as the extreme values for Fortnight 1 | Look through the Fortnight 1 values and identify the smallest and largest harvest amounts. |
| 184 | 8210b0 | AK3 | Calculates $24-16=8$; follow-through on "their" Wednesday value | Using your Wednesday value if needed, subtract the smallest Fortnight 1 harvest from the largest to calculate the range. |
| 185 | 8210b0 | CK3 | Identifies $17$ and $22$ as the extreme values for Fortnight 2 | Look through the Fortnight 2 values and identify the smallest and largest harvest amounts. |
| 186 | 8210b0 | AK4 | Calculates $22-17=5$ | Subtract the smallest Fortnight 2 harvest from the largest to calculate its range. |
| 187 | 8210b0 | R1 | Compares "their" two ranges correctly | Compare your two ranges and decide which one is smaller. |
| 188 | 8210b0 | R2 | Selects Fortnight 2 as having the smaller range | Choose the fortnight that has the smaller range. |
| 189 | 8210b0 | R3 | Explains that a smaller range means the harvest amounts are more consistent | Explain that a smaller range means the harvest amounts are less spread out and therefore more consistent. |
| 190 | 8210b8 | CK1 | Identifies the solid as a sphere | Identify the solid shown in the diagram by matching its shape to the correct three-dimensional object. |
| 191 | 8210b8 | CK2 | Selects the volume formula for a sphere | Choose the volume formula that applies to a sphere. |
| 192 | 8210b8 | AK1 | Substitutes radius $3$ into $V=\frac{4}{3}\pi r^3$ | Substitute the given radius into $V=\frac{4}{3}\pi r^3$. |
| 193 | 8210b8 | R1 | Expresses the volume exactly in terms of $\pi$ | Simplify the volume exactly and leave it in terms of $\pi$. |
| 194 | 8210b8 | CK3 | Forms the replacement volume as eight times "their" volume | Form the replacement volume by multiplying your earlier volume by eight. |
| 195 | 8210b8 | AK3 | Substitutes "their" replacement volume into $V=\frac{4}{3}\pi r^3$ and makes $r$ the subject | Substitute your replacement volume into $V=\frac{4}{3}\pi r^3$ and rearrange to make $r$ the subject. |
| 196 | 8210b8 | AK4 | Evaluates the cube root to obtain $r=6$ | Evaluate the cube root to find the radius. |
| 197 | 8210b8 | R2 | Uses the cubic relationship between volume and radius to give the replacement radius in metres | Use the cubic volume–radius relationship to state the replacement radius in metres. |
| 198 | 8210c0 | CK1 | Identifies the discount as $15\%$ of the marked price | Calculate the discount as $15\%$ of the marked price. |
| 199 | 8210c0 | AK2 | Subtracts "their" discount from \$2 400 | Subtract your discount from \$2 400 to find your sale price. |
| 200 | 8210c0 | CK2 | Applies the sales-tax rate to "their" sale price | Apply the sales-tax rate to your sale price. |
| 201 | 8210c0 | AK5 | Adds "their" sale price and "their" sales tax to obtain \$2 295 | Add your sale price and your sales tax to find your total paid. |
| 202 | 8210c0 | R1 | Selects $N$ as the smallest set containing "their" total | Choose $N$ as the smallest set containing your total. |
| 203 | 8210c0 | R2 | Justifies the choice by identifying "their" total as a positive whole number | Justify your choice by stating that your total is a positive whole number. |
| 204 | 8210c0 | R3 | Subtracts "their" total from \$2 300 to determine the change | Subtract your total from \$2 300 to find the change. |
| 205 | 8210c8 | AK1 | Extends the dot pattern to obtain $17$ positions for Figure 4 | Extend the dot pattern to find the number of positions in Figure 4. |
| 206 | 8210c8 | CK1 | Identifies $17$ as prime | Decide whether your number of positions in Figure 4 is prime. |
| 207 | 8210c8 | R1 | Justifies prime by giving $1$ and $17$ as the only positive factors | List all the positive factors of your Figure 4 total to justify that it is prime. |
| 208 | 8210c8 | CK2 | Forms total marked price using \$15 for each of "their" number of positions | Form the total marked price by multiplying your number of positions by $\$15$. |
| 209 | 8210c8 | AK2 | Calculates \$15 multiplied by "their" number of positions | Calculate $\$15$ multiplied by your number of positions. |
| 210 | 8210c8 | AK3 | Calculates $20\%$ of "their" total marked price | Calculate $20\%$ of your total marked price. |
| 211 | 8210c8 | AK4 | Subtracts "their" discount from "their" total marked price | Subtract your discount from your total marked price. |
| 212 | 8210c8 | CK3 | Identifies profit as sales revenue minus amount paid | Find the profit by subtracting the amount paid from the sales revenue. |
| 213 | 8210c8 | R2 | Uses \$20 for each of "their" positions and subtracts "their" amount paid to determine profit | Multiply your number of positions by $\$20$ and subtract your amount paid to determine the profit. |
| 214 | 8210c8 | R3 | States that sales revenue exceeds the amount paid | Compare the sales revenue with the amount paid and state which is greater. |
| 215 | 8210d0 | CK1 | Identifies the four regions in the Compost set. | Locate all four regions inside the Compost set, including each overlap region. |
| 216 | 8210d0 | AK1 | Adds the known Compost regions to obtain $7+3+2=12$. | Add the three known numbers in the Compost set before combining the result with $x$. |
| 217 | 8210d0 | CK2 | Recognises that at least one practice is represented by all seven regions inside the three sets. | Include all seven regions inside the three sets when you count households using at least one practice. |
| 218 | 8210d0 | AK3 | Adds the seven internal regions using "their" value of $x$. | Add all seven internal regions, using your value of $x$ from the Compost calculation. |
| 219 | 8210d0 | R1 | Counts each overlap region once only. | Count each overlap region only once, even when it belongs to two or three sets. |
| 220 | 8210d0 | AK4 | Subtracts "their" number using at least one practice from 80. | Subtract your total for households using at least one practice from 80. |
| 221 | 8210d0 | R3 | Identifies the region outside all three sets. | Use the region outside all three circles to represent households using none of the practices. |
| 222 | 8210d8 | R1 | Identifies $PQ$ and $QR$ as the sections of the outward route and adds their lengths | Trace the outward route through $PQ$ and $QR$, then add those two labelled lengths. |
| 223 | 8210d8 | CK1 | Uses $\text{time}=\text{distance}\div\text{speed}$ | Calculate the journey time using $\text{time}=\text{distance}\div\text{speed}$. |
| 224 | 8210d8 | CK2 | Uses total distance divided by total time for average speed | Find the average speed by dividing the total journey distance by the total journey time. |
| 225 | 8210d8 | AK2 | Calculates the return time from "their" outward distance at $30\,000\text{ m/h}$ | Use your outward distance to calculate the return time at $30\,000\text{ m/h}$. |
| 226 | 8210d8 | AK3 | Divides twice "their" outward distance, converted to kilometres, by the total of "their" journey times | Double your outward distance, convert it to kilometres, and divide by the sum of your outward and return times. |
| 227 | 8210d8 | R2 | Expresses "their" average speed correct to 3 significant figures | Write your calculated average speed correct to 3 significant figures. |
| 228 | 8210d8 | CK3 | Recognises that the route distance must be converted to kilometres before applying the per-kilometre charge | Convert the route distance to kilometres before using the per-kilometre charge. |
| 229 | 8210d8 | AK4 | Converts "their" outward distance to kilometres and calculates the base fare | Convert your outward distance to kilometres, then multiply by the charge per kilometre to find the base fare. |
| 230 | 8210d8 | R3 | Applies the discount and then the sales tax to "their" base fare | Subtract the discount from your base fare first, then calculate and add the sales tax on the reduced fare. |
| 231 | 8210e0 | CK2 | Uses $r=\dfrac{\text{their diameter}}{2}$ in the sphere-volume formula | Substitute $r=\dfrac{\text{your diameter}}{2}$ into $V=\dfrac{4}{3}\pi r^3$ before calculating the volume. |
| 232 | 8210e0 | R1 | Forms $1.25\times$ "their" volume for the required capacity | Convert $125\%$ to a multiplier and multiply it by your volume to find the required capacity. |
| 233 | 8210e0 | CK3 | Rearranges to obtain $r^3=\dfrac{3V}{4\pi}$ | Multiply both sides of the volume formula by $\dfrac{3}{4\pi}$ to isolate $r^3$. |
| 234 | 8210e0 | R2 | Uses "their" required capacity in the rearranged relationship | Substitute your required capacity for $V$ in the rearranged relationship. |
| 235 | 8210e0 | AK3 | Simplifies to $r^3=270$ | Cancel common factors and simplify the right-hand side until you have one value for $r^3$. |
| 236 | 8210e0 | AK4 | Finds $r=3\sqrt[3]{10}$ | Take the cube root and simplify the result using $\sqrt[3]{\,}$. |
| 237 | 8210e0 | R3 | Expresses "their" radius in exact form | Write your radius in exact cube-root form instead of as a decimal approximation. |
| 238 | 8210e8 | CK1 | Identifies that the $y$-intercept occurs when $x=0$ | Identify the $y$-intercept by setting $x=0$ on the graph. |
| 239 | 8210e8 | AK1 | Forms "their" initial-stock equation $12-2x=0$ | Use your initial number of bags and the daily decrease to form an equation equal to zero. |
| 240 | 8210e8 | AK2 | Solves "their" equation to obtain $x=6$ | Solve your equation for $x$ to find when the number of bags reaches zero. |
| 241 | 8210e8 | R2 | States the $x$-intercept as $(6,0)$ | State your $x$-intercept as an ordered pair with zero as its $y$-coordinate. |
| 242 | 8210e8 | R3 | Finds the new emptying time as "their" $x$-intercept plus 2 days | Add 2 days to your $x$-intercept to find your new emptying time. |
| 243 | 8210e8 | CK2 | Recognises that the unchanged sale rate is 2 bags per day | Use the unchanged sale rate of 2 bags per day for the new display. |
| 244 | 8210e8 | AK3 | Forms $-2(\text{their new emptying time})+c=0$ | Form $-2(\text{your new emptying time})+c=0$ using your new emptying time. |
| 245 | 8210e8 | AK4 | Calculates "their" value of $c$ as 16 | Calculate $c$ from your equation to find the initial number of bags. |
| 246 | 8210f0 | CK1 | Recognises that total waiting time is mean multiplied by number of patients | Multiply the mean waiting time by the number of patients to find the total waiting time. |
| 247 | 8210f0 | AK1 | Calculates $18 \times 8 = 144$ | Carry out the multiplication $\times$ carefully to calculate the total waiting time. |
| 248 | 8210f0 | CK2 | Forms total waiting time as sum of the seven known times and Anisa's time | Write the total waiting time as the sum of the seven known waiting times and Anisa's waiting time. |
| 249 | 8210f0 | AK2 | Finds sum of the seven known waiting times as $114$ | Add the seven known waiting times carefully before finding Anisa's time. |
| 250 | 8210f0 | AK3 | Calculates $144 - 114 = 30$ | Subtract the sum of the known waiting times from the total waiting time. |
| 251 | 8210f0 | CK3 | Identifies the fourth and fifth values as $15$ and $17$ after ordering the data | Order all the waiting times from smallest to largest, then identify the two middle values. |
| 252 | 8210f0 | AK4 | Calculates median as $(15 + 17) \div 2 = 16$ | Add the two middle values and divide by $\div$ to calculate the median. |
| 253 | 8210f0 | AK5 | Calculates range as $30 - 8 = 22$ | Subtract the smallest waiting time from the largest waiting time to calculate the range. |
| 254 | 8210f0 | R1 | Compares 'their' median with the limit of $15$ minutes | Compare your median with the clinic's median limit. |
| 255 | 8210f0 | R2 | Compares 'their' range with the limit of $20$ minutes | Compare your range with the clinic's range limit. |
| 256 | 8210f0 | R3 | Explains that the required conditions are not satisfied | Use both comparisons to state whether the clinic meets all the required conditions. |
| 257 | 8210f8 | CK1 | Recognises that the discounted price is $80\%$ of the marked price | Find the percentage paid after the discount and use $80\%$ of the marked price. |
| 258 | 8210f8 | AK2 | Divides \$960 by "their" discounted price per bottle | Divide \$960 by your discounted price per bottle. |
| 259 | 8210f8 | R1 | Interprets the quotient as 24 whole bottles | Interpret your quotient as the number of whole bottles purchased. |
| 260 | 8210f8 | AK3 | Calculates $12.5\%$ of \$960, giving \$120 | Calculate $12.5\%$ of \$960 for the sales tax. |
| 261 | 8210f8 | AK4 | Adds "their" sales tax to \$960 | Add your sales tax to \$960 to find the total paid. |
| 262 | 8210f8 | CK2 | Selects selling revenue excluding sales tax less manufacturing cost, using "their" number of bottles and "their" discounted price | Subtract the manufacturing cost from the selling revenue before sales tax, using your number of bottles and discounted price. |
| 263 | 8210f8 | CK3 | Identifies 24 as composite | Check whether your number of bottles has factors other than $1$ and itself to classify it. |
| 264 | 8210f8 | R2 | Determines all valid factors of "their" number of bottles, excluding 1 and the total | List every factor of your number of bottles that is greater than $1$ and less than the total. |
| 265 | 8210f8 | R3 | Counts six possible carton sizes | Count the valid factors in your list to find the possible carton sizes. |
| 266 | 821105 | CK1 | Selects the five values for the random sample | Choose the five values that belong to the random sample from the table. |
| 267 | 821105 | AK1 | Adds the sample values to obtain $70$ | Add the five selected sample values to find the sample total. |
| 268 | 821105 | R1 | Uses the condition $f(x)=$ "their" mean | Set $f(x)=$ your calculated mean. |
| 269 | 821105 | AK3 | Identifies $x=1$ where $f(x)=$ "their" mean | Identify the first day number where $f(x)=$ your calculated mean. |
| 270 | 821105 | AK4 | Identifies $x=5$ where $f(x)=$ "their" mean | Identify the other day number where $f(x)=$ your calculated mean. |
| 271 | 821105 | R2 | Uses the midpoint of "their" two day numbers to obtain $3$ | Calculate the midpoint of your two day numbers. |
| 272 | 821105 | R3 | States the axis as the equation $x=3$ | Write the axis as an equation in the form $x=$ your midpoint. |
| 273 | 821105 | CK2 | Identifies the mean from the random sample as a statistic | Classify the mean calculated from a random sample as a statistic. |
| 274 | 821105 | CK3 | Identifies the mean for all 7 days as a parameter | Classify the mean calculated from all days as a parameter. |
| 275 | 82110d | CK1 | Identifies $OA$ as a radius | Identify $OA$ as a radius of the buoy. |
| 276 | 82110d | AK1 | Rearranges to obtain $r^3 = \frac{3V}{4\pi}$ | Rearrange the volume formula until you have $r^3 = \frac{3V}{4\pi}$. |
| 277 | 82110d | CK2 | Recognises that a cube root is required to obtain $r$ | Take the cube root to isolate $r$. |
| 278 | 82110d | AK3 | Substitutes $V = \frac{500\pi}{3}$ into "their" expression for $r$ | Substitute $V = \frac{500\pi}{3}$ into your expression for $r$. |
| 279 | 82110d | AK4 | Evaluates "their" expression to obtain $5$ | Evaluate your expression carefully to find the radius. |
| 280 | 82110d | R1 | Interprets "their" radius as the length $OA$, in centimetres | State that your radius is the length $OA$ and give it in centimetres. |
| 281 | 82110d | CK3 | Uses diameter $= 2 \times$ "their" radius | Calculate the diameter using $2 \times$ your radius. |
| 282 | 82110d | R2 | Compares "their" diameter with $9\text{ cm}$ and concludes that the buoy will not pass through the opening | Compare your diameter with $9\text{ cm}$ and conclude whether the buoy passes through the opening. |
| 283 | 821115 | CK1 | Identifies package B as the eligible package | Check the package conditions and choose package B as the eligible package. |
| 284 | 821115 | CK2 | States that 29 has exactly two factors, 1 and 29 | List the factors of $29$ and verify that it has exactly two factors. |
| 285 | 821115 | CK3 | Selects the marked price of \$1 450 for "their" selected package | Read the table and use the marked price of \$1 450 for your selected package. |
| 286 | 821115 | AK1 | Calculates $12\%$ of \$1 450 | Calculate $12\%$ of \$1 450 to find your discount. |
| 287 | 821115 | AK2 | Subtracts "their" discount from \$1 450 | Subtract your discount from \$1 450 to find your discounted price. |
| 288 | 821115 | R1 | Uses "their" discounted price as the amount on which sales tax is charged | Use your discounted price, not the original marked price, as the amount on which sales tax is charged. |
| 289 | 821115 | AK3 | Calculates $10\%$ sales tax on "their" discounted price | Calculate $10\%$ sales tax on your discounted price. |
| 290 | 821115 | AK4 | Adds "their" sales tax to "their" discounted price | Add your sales tax to your discounted price to find your amount paid. |
| 291 | 821115 | AK5 | Subtracts "their" sales tax from "their" amount paid | Subtract your sales tax from your amount paid to find your retained amount. |
| 292 | 821115 | AK6 | Finds the difference between "their" retained amount and \$1 050 | Find the difference between your retained amount and \$1 050. |
| 293 | 821115 | R2 | Concludes profit when "their" retained amount exceeds the cost | Conclude that you make a profit if your retained amount is greater than the cost. |
| 294 | 821115 | R3 | Supports the verdict using "their" retained amount, cost and difference | Support your verdict by comparing your retained amount with the \$1 050 cost and stating the difference. |
| 295 | 821125 | CK1 | Recognises that the eight mutually exclusive regions represent all 80 customers | Treat the eight non-overlapping regions as the complete group of customers. |
| 296 | 821125 | AK1 | Adds the seven known regions to obtain 68 | Add the seven known region counts to find the total already accounted for. |
| 297 | 821125 | CK2 | Identifies the three exactly-two regions and the all-three region | Select the three regions shared by exactly two sets and the central region shared by all three sets. |
| 298 | 821125 | AK3 | Adds $6 + 5 + 4 +$ "their" value of $x$ | Add $6 + 5 + 4 + x$, using your value of $x$. |
| 299 | 821125 | CK3 | Recognises that customers who bought fewer than two items are the complement of those who bought at least two items | Find the customers who buy fewer than two items by taking the complement of those who buy at least two items. |
| 300 | 821125 | R1 | Subtracts "their" number from part (b) from 80 | Subtract your number from part (b) from $80$. |
| 301 | 821125 | R2 | Divides "their" number of customers requiring vouchers by 10 | Divide your number of customers requiring vouchers by $10$. |
| 302 | 821132 | CK1 | Recognises that the angle at the centre is twice the angle at the circumference on the same arc. | Use the fact that the angle at the centre is twice the angle at the circumference standing on the same arc. |
| 303 | 821132 | AK1 | Halves $100°$ to obtain $50°$. | Halve the given central angle to find $\angle ACB$. |
| 304 | 821132 | AK2 | Equates angle $PAB$ to "their" angle $ACB$. | Set $\angle PAB$ equal to your earlier $\angle ACB$. |
| 305 | 821132 | R1 | Identifies angle $ACB$ as the angle in the alternate segment for chord $AB$. | Identify $\angle ACB$ as the angle in the alternate segment for chord $AB$. |
| 306 | 821132 | CK2 | States the alternate segment theorem. | State the alternate segment theorem before applying it to the tangent and chord. |
| 307 | 821132 | R2 | Uses equal tangents from $P$ to establish that $PA=PB$. | Use the equal-tangents property from $P$ to show that $PA=PB$. |
| 308 | 821132 | R3 | Deduces that angle $PBA$ equals "their" angle $PAB$. | Use $PA=PB$ to make $\angle PBA$ equal to your $\angle PAB$. |
| 309 | 821132 | AK3 | Uses the angle sum of triangle PAB$: $180°-"their"50°-"their"50°. | Subtract your two base-angle values from the angle sum in triangle $PAB$ to find $\angle APB$. |
| 310 | 82116c | R1 | Reads that the $y$-intercept occurs when $x=0$ | Put $x=0$ to locate the $y$-intercept on the graph. |
| 311 | 82116c | CK1 | Recognises that the gradient can be found from the two intercepts | Use the two intercepts as points to find the gradient. |
| 312 | 82116c | AK1 | Calculates gradient $=-2$ | Subtract the $y$-coordinates and divide by the difference between the $x$-coordinates to calculate the gradient. |
| 313 | 82116c | AK2 | Uses "their" $y$-intercept to obtain $c=12$ | Substitute your $y$-intercept into $y=mx+c$ and solve for $c$. |
| 314 | 82116c | R3 | Expresses $y=-2x+12$ in the required form | Write the equation in the form $y=mx+c$, using your gradient and $y$-intercept. |
| 315 | 82116c | CK2 | Identifies "their" constant term as the starting volume of water | Interpret your constant term as the starting volume of water. |
| 316 | 82116c | AK3 | Divides "their" starting volume by $4$ | Divide your starting volume by $4$ to find the emptying rate. |
| 317 | 82116c | R4 | States "their" result as a rate in litres per hour | State your result as a rate in litres per hour. |
| 318 | 82116c | CK3 | Recognises that $y=0$ at the $x$-intercept | Use $y=0$ at the $x$-intercept. |
| 319 | 82116c | AK4 | Substitutes $x=9$, $y=0$ and "their" replacement-pump rate into $y=-3x+c$ | Substitute the stated $x$-intercept coordinates and your replacement-pump rate into the given equation, then solve for $c$. |
| 320 | 82118d | CK1 | Identifies the complete route as $1200 + 1500 + 900$ | Add the lengths of all three parts of the route to find the complete distance. |
| 321 | 82118d | CK2 | Uses distance divided by time with distance in kilometres and time in hours | Convert the distance to kilometres and the time to hours, then divide distance by time. |
| 322 | 82118d | R1 | Multiplies "their" average speed by $1.5$ hours to obtain $7.2\text{ km}$ | Multiply your average speed by $1.5\text{ hours}$ to calculate the distance travelled. |
| 323 | 82118d | CK3 | Identifies the discounted charge as the amount on which sales tax is calculated | Use the charge after the discount as the amount on which you calculate sales tax. |
| 324 | 82118d | AK3 | Calculates the basic charge from "their" distance at \$40 per kilometre | Multiply your distance travelled by $\$40$ per kilometre to calculate the basic charge. |
| 325 | 82118d | AK4 | Deducts $15\%$ discount from "their" basic charge | Find $15\%$ of your basic charge and subtract this discount from it. |
| 326 | 82118d | R2 | Calculates sales tax of $12.5\%$ on "their" discounted charge | Calculate sales tax as $12.5\%$ of your discounted charge. |
| 327 | 82119a | CK1 | Recognises that the sale price is $75\%$ of the marked price | Treat the sale price as $75\%$ of the marked price. |
| 328 | 82119a | R1 | Forms an equation connecting the marked price and the sale price | Write an equation by setting $0.75p$ equal to the sale price. |
| 329 | 82119a | AK1 | Divides $360$ by $0.75$ | Divide $360$ by $0.75$ to find the marked price. |
| 330 | 82119a | AK3 | Subtracts the cost price from the sale price | Subtract the cost price from the sale price to calculate the profit. |
| 331 | 82119a | CK2 | Uses profit divided by marked price, multiplied by $100$ | Calculate the percentage using $\frac{\text{profit}}{\text{marked price}}\times100$. |
| 332 | 82119a | AK4 | Substitutes "their" profit and "their" marked price into the percentage calculation | Substitute your earlier profit and your earlier marked price into the percentage calculation. |
| 333 | 82119a | CK3 | States $N$ | Choose the smallest listed number set that contains both positive integers. |
| 334 | 82119a | R3 | Justifies that "their" marked price and "their" profit are positive integers | Explain that your earlier marked price and your earlier profit are both positive integers. |
| 335 | 8211a2 | CK1 | Identifies the greatest and least mean heights as $9$ m and $0$ m | Read the table and identify the greatest and least mean heights. |
| 336 | 8211a2 | CK2 | States sample statistic | State that the calculated value is a sample statistic. |
| 337 | 8211a2 | CK3 | Recognises that the calculation used a random sample of 12 balls | Point out that the calculation uses randomly selected balls rather than every ball in the competition. |
| 338 | 8211a2 | R1 | Uses "their" range to identify the corresponding height on the quadratic relationship | Use your range to identify the corresponding height on the quadratic relationship. |
| 339 | 8211a2 | R2 | Writes the axis of symmetry as the equation $t=3$ using "their" time from (c) | Write the axis of symmetry as an equation using your time from part (c). |
| 340 | 8211a2 | AK3 | Identifies $0$ as one root | Identify the time value where the quadratic relationship has zero height as one root. |
| 341 | 8211a2 | AK4 | Uses symmetry about $t=3$ to obtain the second root, $6$ | Use symmetry about the axis of the quadratic relationship to find the second root from the root you already identify. |
| 342 | 8211af | AK1 | Obtains $3V=4\pi r^3$ | Multiply both sides by $3$ to clear the denominator and leave $4\pi r^3$ on the other side. |
| 343 | 8211af | AK2 | Divides by $4\pi$ to obtain $r^3=\frac{3V}{4\pi}$ | Divide both sides by $4\pi$ to isolate $r^3$ as $\frac{3V}{4\pi}$. |
| 344 | 8211af | AK3 | Substitutes $V=288\pi$ into "their" expression for $r$ | Substitute $V=288\pi$ into your expression for $r$. |
| 345 | 8211af | AK4 | Evaluates "their" cube root correctly | Evaluate the cube root in your substituted expression accurately. |
| 346 | 8211af | CK3 | Recognises that the diameter is twice "their" radius | Find the diameter by multiplying your radius by $2$. |
| 347 | 8211af | AK5 | Calculates diameter $12\text{ cm}$, or correct follow-through from "their" radius | Calculate the diameter from your radius and write the length using $\text{cm}$. |
| 348 | 8211af | R1 | Uses $C=\pi d$ with "their" diameter to obtain $12\pi\text{ cm}$, or correct follow-through | Substitute your diameter into $C=\pi d$ and write the circumference using $\text{cm}$. |
| 349 | 8211af | CK4 | States that an edge is a line segment where faces meet | State that an edge is a line segment where faces meet. |
| 350 | 8211af | R2 | Identifies the join as a circular curve | Identify the join as a circular curve. |
| 351 | 8211af | R3 | Concludes that circumference, rather than edge length, describes the join | Describe the distance around the circular join as a circumference rather than an edge length. |
| 352 | 8211c1 | CK1 | Identifies that a cube root is required to isolate $r$ | Take the cube root of both sides to isolate $r$. |
| 353 | 8211c1 | AK1 | Rearranges correctly to $r=\sqrt[3]{\frac{3V}{4\pi}}$ | Rearrange the volume formula until $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 354 | 8211c1 | AK2 | Substitutes $V=36\pi$ into "their" formula for $r$ | Substitute $V=36\pi$ into your formula for $r$ and simplify. |
| 355 | 8211c1 | R1 | Uses "their" radius as the horizontal coordinate and the $4$-unit vertical displacement | Use your radius as the horizontal coordinate and move $4$ units vertically to locate the next point. |
| 356 | 8211c1 | CK2 | Identifies $OA$ and $BC$ as parallel | Identify $OA$ and $BC$ as the parallel sides. |
| 357 | 8211c1 | R2 | Explains that both line segments are horizontal or have the same gradient | Explain that $OA$ and $BC$ are parallel because both line segments are horizontal or have the same gradient. |
| 358 | 8211c1 | CK3 | Identifies $OABC$ as a rectangle | Identify $OABC$ as a rectangle. |
| 359 | 8211c1 | R3 | Justifies the rectangle using parallel opposite sides and perpendicular adjacent sides | Justify the rectangle by showing that opposite sides are parallel and adjacent sides are perpendicular. |
| 360 | 9e8750 | CK1 | Recognises that the $90°$ work sector represents one quarter of the passengers | Use the full $360°$ circle to show that the $90°$ work sector is one quarter of all passengers. |
| 361 | 9e8750 | AK1 | Calculates $75 \times 4 = 300$ | Multiply the work-sector passenger count by $4$ to calculate the total number of passengers. |
| 362 | 9e8750 | CK2 | Identifies the day-trip fraction as $\frac{144}{360}$ | Write the day-trip share as $\frac{144}{360}$ by comparing its sector angle with the whole pie chart. |
| 363 | 9e8750 | AK2 | Multiplies $\frac{144}{360}$ by "their" total number of passengers | Multiply $\frac{144}{360}$ by your total number of passengers to find the day-trip passenger count. |
| 364 | 9e8750 | CK3 | Recognises that passengers travelling on day trips or visiting relatives must be combined | Combine the day-trip passengers and the passengers visiting relatives because both groups need ferry seats. |
| 365 | 9e8750 | AK4 | Calculates the number visiting relatives as $\frac{54}{360} \times$ "their" total $= 45$ | Calculate the relatives count using $\frac{54}{360} \times$ your total number of passengers. |
| 366 | 9e8750 | R1 | Adds "their" day-trip passengers to 45 to obtain 165 | Add your day-trip passenger count to your relatives passenger count to find how many seats are needed. |
| 367 | 9e8750 | R2 | Compares 165 with the capacity of 150 and determines an excess of 15 | Compare the number of seats needed with the ferry capacity and subtract the capacity to find the shortfall. |
| 368 | 9e8750 | R3 | Concludes that the ferry cannot carry all the required passengers | State that the ferry cannot carry everyone because the required number of seats is greater than its capacity. |
| 369 | 9e8767 | CK1 | Identifies that $r^3$ must be isolated. | Rearrange the volume equation so that $r^3$ is alone on one side. |
| 370 | 9e8767 | CK2 | Recognises that the inverse operation for a cube is a cube root. | Use a cube root, such as $\sqrt[3]{r^3}$, to undo the cube. |
| 371 | 9e8767 | AK1 | Rearranges correctly to obtain $r=\sqrt[3]{\frac{3V}{4\pi}}$. | Divide first and then take the cube root to write $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 372 | 9e8767 | AK2 | Substitutes $V=288\pi$ into "their" formula for $r$. | Substitute $V=288\pi$ into the formula you obtained for $r$ before simplifying. |
| 373 | 9e8767 | CK3 | Forms the displacement as $\vec{OQ}-\vec{OP}$. | Form the displacement by calculating $\vec{OQ}-\vec{OP}$ in that order. |
| 374 | 9e8767 | AK4 | Subtracts the position columns to obtain $\begin{pmatrix}-3\\2\end{pmatrix}$. | Subtract corresponding entries in the two position columns to form $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 375 | 9e8767 | R1 | Uses "their" radius as the scale factor for the coordinate displacement. | Use your radius as the scale factor to convert the coordinate displacement into the required units. |
| 376 | 9e877e | CK1 | Reads 12 as the greatest whole-number value from the number line | Read the greatest labelled whole number at the rightmost valid position on the number line. |
| 377 | 9e877e | CK2 | Forms $d+35(\text{their }12)=600$ | Form an equation by adding the delivery fee to $35(\text{your bag count})$ and setting it equal to the budget. |
| 378 | 9e877e | AK1 | Calculates $35\times\text{their }12$ | Calculate the bag cost by evaluating $35\times\text{your bag count}$. |
| 379 | 9e877e | AK3 | Calculates the increased delivery fee as \$216 | Find the increased delivery fee by adding the stated percentage increase to your original delivery fee. |
| 380 | 9e877e | CK3 | Forms $216+35x\leq650$ | Write the budget condition with the new delivery fee plus the bag cost no greater than the budget, using $\leq$. |
| 381 | 9e877e | AK4 | Obtains $35x\leq434$ | Subtract the new delivery fee from both sides while keeping the $\leq$ sign to isolate the bag-cost term. |
| 382 | 9e877e | AK5 | Solves to obtain $x\leq12.4$ | Divide both sides by the cost per bag, keeping the $\leq$ sign, to find the upper bound for $x$. |
| 383 | 9e877e | R1 | Uses the whole-number condition to give 12 bags | Use the whole-number condition to choose the greatest possible number of bags. |
| 384 | 9e877e | R2 | Uses "their" increased delivery fee in the cost of 13 bags | Use your increased delivery fee and the cost of the stated number of bags to form the total cost. |
| 385 | 9e877e | R3 | Obtains a total cost of \$671 | Add the delivery fee and bag cost carefully to calculate the total cost. |
| 386 | 9e877e | R4 | Concludes that \$671 exceeds \$650, so the shopkeeper is incorrect | Compare your total cost with the budget and state that the shopkeeper is incorrect when it is greater. |
| 387 | 9e878b | CK1 | Recognises that the angle at the centre is twice the angle at the circumference on the same arc | Use the fact that the angle at the centre is twice the angle at the circumference standing on the same arc. |
| 388 | 9e878b | AK1 | Calculates $2\times32=64°$ | Double the given angle by calculating $2\times32$. |
| 389 | 9e878b | CK2 | Recognises that $OP=OQ$ as radii, so $\triangle OPQ$ is isosceles | Use $OP=OQ$ to identify $\triangle OPQ$ as isosceles. |
| 390 | 9e878b | AK2 | Subtracts “their” $\angle POQ$ from $180°$ | Subtract your $\angle POQ$ from $180°$. |
| 391 | 9e878b | AK3 | Divides the remaining angle equally to obtain $58°$ | Divide the remaining angle equally between the two base angles. |
| 392 | 9e878b | CK3 | Recognises that the tangent at $P$ is perpendicular to radius $OP$ | Use the fact that the tangent at $P$ is perpendicular to the radius $OP$. |
| 393 | 9e878b | R1 | Forms the complementary relationship $x+\text{“their” }\angle OPQ=90°$ | Write the complementary relationship $x+\text{your }\angle OPQ=90°$. |
| 394 | 9e878b | AK4 | Evaluates $90°-\text{“their” }58°$ | Evaluate $90°-\text{your earlier angle}$. |
| 395 | 9e878b | R2 | Concludes that the tangent-chord angle is $32°$, consistent with $\angle PRQ$ | State that the angle between the tangent and chord equals $\angle PRQ$. |
| 396 | 9e878b | R3 | States the angle in the alternate segment theorem | State the angle in the alternate segment theorem. |
| 397 | 9e8793 | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. | Find $\overrightarrow{AB}$ by subtracting $\overrightarrow{OA}$ from $\overrightarrow{OB}$: $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 398 | 9e8793 | CK2 | Forms $\overrightarrow{OC}=\overrightarrow{OB}+2\overrightarrow{AB}$. | Form $\overrightarrow{OC}$ by adding $\overrightarrow{OB}$ to $2\times\overrightarrow{AB}$: $\overrightarrow{OC}=\overrightarrow{OB}+2\overrightarrow{AB}$. |
| 399 | 9e8793 | AK2 | Finds $2\times$ "their" $\overrightarrow{AB}$. | Multiply each component of your $\overrightarrow{AB}$ by $2$ to find $2\times\overrightarrow{AB}$. |
| 400 | 9e8793 | AK3 | Adds $\overrightarrow{OB}$ to obtain $\begin{pmatrix}11\\4\end{pmatrix}$, following through from "their" vector. | Add $\overrightarrow{OB}$ to your vector and write the result as $\begin{pmatrix}\cdots\\\cdots\end{pmatrix}$. |
| 401 | 9e8793 | CK3 | Uses $\overrightarrow{AC}=\overrightarrow{OC}-\overrightarrow{OA}$. | Find $\overrightarrow{AC}$ by subtracting $\overrightarrow{OA}$ from $\overrightarrow{OC}$: $\overrightarrow{AC}=\overrightarrow{OC}-\overrightarrow{OA}$. |
| 402 | 9e8793 | R1 | Establishes that "their" $\overrightarrow{AC}$ is $3\times$ "their" $\overrightarrow{AB}$. | Show that your $\overrightarrow{AC}$ is $3\times$ your $\overrightarrow{AB}$. |
| 403 | 9e8793 | R2 | Concludes that $A$, $B$ and $C$ are collinear. | Use the scalar-multiple relationship between the vectors to conclude that $A$, $B$ and $C$ are collinear. |
| 404 | 9e8793 | R3 | States that the trolley travelled in a straight line, with $C$ beyond $B$. | State that the trolley travels in a straight line, with $C$ beyond $B$. |
| 405 | 9e87ad | AK1 | Adds $7$ to obtain $28$ | Add the common difference to the last given code to find the next code. |
| 406 | 9e87ad | AK2 | Adds $7$ again to obtain $35$ | Add the same common difference again to the code you just found. |
| 407 | 9e87ad | CK1 | Identifies common difference $7$ | Subtract consecutive codes to identify the constant difference. |
| 408 | 9e87ad | R1 | Forms $T_n = 7n + 7$ from "their" sequence | Use your sequence to form and simplify a rule for $T_n$ in terms of $n$. |
| 409 | 9e87ad | AK3 | Substitutes $n = 12$ into "their" rule to obtain $91$ | Substitute the requested term number into your rule and simplify. |
| 410 | 9e87ad | R2 | Gives positive factors $1$, $7$, $13$ and $91$ to justify composite | List every positive factor of the code and use the list to justify that it is composite. |
| 411 | 9e87ad | R3 | Uses a discount rate of $4\%$ from "their" number of positive factors | Use the number of positive factors you found to choose the corresponding discount rate. |
| 412 | 9e87ad | CK3 | Uses the discounted price as the base for sales tax | Calculate the sales tax using the discounted price, not the original price, as the base. |
| 413 | 9e87ad | AK4 | Calculates discounted price \$518.40 | Apply the discount rate to the original price to calculate the discounted price. |
| 414 | 9e87ad | AK5 | Calculates $12.5\%$ of "their" discounted price | Calculate the stated sales-tax percentage of your discounted price. |
| 415 | 9e87ad | R4 | Adds "their" sales tax to "their" discounted price to obtain \$583.20 | Add your sales tax to your discounted price to find the amount payable. |
| 416 | 9e87b5 | AK2 | Divides "their" total depth by $7$ | Divide your total depth by $7$ to calculate the mean depth. |
| 417 | 9e87b5 | CK1 | Identifies the mean calculated from the seven readings as a sample statistic | Classify the mean from the seven readings as a sample statistic. |
| 418 | 9e87b5 | CK2 | Identifies the mean from all drainage-channel positions as a population parameter | Classify the mean from all drainage-channel positions as a population parameter. |
| 419 | 9e87b5 | AK4 | Reads both values of $x$ for which $f(x)$ equals "their" mean depth | Read the two $x$-values on the chart where $f(x)$ equals your mean depth. |
| 420 | 9e87b5 | R1 | States $x=3$ as the equation of the axis of symmetry using the midpoint of "their" pair of values | Find the midpoint of your pair of $x$-values and write the equation of the axis of symmetry. |
| 421 | 9e87b5 | R2 | Identifies equal-depth positions equidistant on opposite sides of $x=3$ | Identify the equal-depth positions that are the same distance on opposite sides of the axis of symmetry. |
| 422 | 9e87b5 | R3 | Links the maximum depth at $x=3$ to the midpoint conclusion | Use the maximum depth at the axis of symmetry to conclude that the deepest point is at the midpoint of the section. |
| 423 | 9e87bd | AK1 | Uses angles on a straight line to calculate $x = 180° - 72°$ | Use angles on a straight line to calculate $x$ by subtracting $72°$ from $180°$. |
| 424 | 9e87bd | CK1 | Recognises that corresponding angles on parallel lines are equal | Use the fact that corresponding angles on parallel lines are equal. |
| 425 | 9e87bd | R1 | Associates $x$ and $y$ as corresponding angles | Identify $x$ and $y$ as corresponding angles in the parallel-line diagram. |
| 426 | 9e87bd | CK2 | Identifies $y$ as an obtuse angle | Classify $y$ by comparing its size with the angle ranges. |
| 427 | 9e87bd | R2 | Explains that an obtuse angle is greater than $90°$ and less than $180°$ | Explain that an obtuse angle is greater than $90°$ and less than $180°$. |
| 428 | 9e87bd | CK3 | Recognises that perpendicular roads meet at $90°$ | Use the fact that perpendicular roads meet at $90°$. |
| 429 | 9e87bd | AK3 | Calculates the smaller angle between $t$ and $m$ as $180° -$ "their" $y$ | Calculate the smaller angle between $t$ and $m$ by subtracting your value of $y$ from $180°$. |
| 430 | 9e87bd | AK4 | Calculates the turn from "their" smaller angle to $90°$ | Calculate the turn by finding the difference between your smaller angle and $90°$. |
| 431 | 9e87c5 | CK1 | Identifies the discount as $15\%$ of the marked price | Calculate the discount by finding $15\%$ of the marked price. |
| 432 | 9e87c5 | AK2 | Subtracts "their" discount from \$800 | Subtract your discount from \$800 to find the discounted price. |
| 433 | 9e87c5 | CK2 | Identifies the discounted price as the amount on which sales tax is charged | Use the discounted price, not the marked price, as the amount on which to calculate sales tax. |
| 434 | 9e87c5 | R1 | Adds "their" sales tax to "their" discounted price | Add your sales tax to your discounted price to find the total amount paid. |
| 435 | 9e87c5 | R2 | Deducts "their" sales tax from "their" total amount paid before calculating profit | Deduct your sales tax from your total amount paid before calculating the profit. |
| 436 | 9e87cd | CK1 | Recognises that members attending at least one activity are represented by all seven regions inside the circles | Use every region inside at least one circle to represent members who attend at least one activity. |
| 437 | 9e87cd | AK1 | Adds the seven regions inside the circles | Add the numbers in all seven regions inside the circles. |
| 438 | 9e87cd | AK3 | Subtracts "their" number attending at least one activity from $90$ | Subtract your at-least-one-activity total from $90$. |
| 439 | 9e87cd | CK2 | Recognises that members attending exactly one activity exclude members attending none and members attending two or three activities | For exactly one activity, exclude the members outside all circles and the members in two or three circles. |
| 440 | 9e87cd | AK5 | Calculates the members still attending no activity as "their" $x-24$ | Calculate the members still attending no activity as your $x-24$. |
| 441 | 9e87cd | R1 | Subtracts "their" remaining none and the $15$ members attending two or three activities from $90$ | Subtract your remaining none total and the total for two or three activities from $90$. |
| 442 | 9e87cd | CK3 | Recognises that $75\%$ of $90$, namely $67.5$, is the required comparison value | Calculate $75\%$ of $90$ to find the required comparison value. |
| 443 | 9e87cd | R3 | Compares "their" exactly-one-activity total with $67.5$ | Compare your exactly-one-activity total with the required comparison value. |
| 444 | 9e87cd | R4 | States that the coordinator is not correct, with a valid reason | State that the coordinator is not correct because your exactly-one-activity total is below the required comparison value. |
| 445 | 9e87d5 | CK1 | Recognises that $\angle ACB=90°$, since $AB$ is a diameter. | Use $AB$ being a diameter to identify $\angle ACB$ as a right angle. |
| 446 | 9e87d5 | R1 | Uses the angle sum of triangle $ABC$ with $90°$ and $38°$. | Use the angle sum in triangle $ABC$ by subtracting the two known angles from the total. |
| 447 | 9e87d5 | CK2 | Recognises that the angle at the centre is twice the angle at the circumference standing on the same arc. | Use the same-arc theorem to connect a central $\angle$ with the angle at the circumference. |
| 448 | 9e87d5 | R2 | Relates $\angle AOC$ to “their” $\angle ABC$, standing on arc $AC$. | Relate $\angle AOC$ to your $\angle ABC$ because both stand on arc $AC$. |
| 449 | 9e87d5 | AK2 | Doubles “their” angle $ABC$. | Double your $\angle ABC$ to find the corresponding angle at the centre. |
| 450 | 9e87d5 | CK3 | Recognises that the tangent at $A$ is perpendicular to radius $OA$. | Use the radius-tangent fact to make the tangent at $A$ perpendicular to $OA$. |
| 451 | 9e87d5 | R3 | Uses “their” $\angle AOC$ in isosceles triangle $AOC$. | Use your $\angle AOC$ in isosceles triangle $AOC$ to set up the base angles. |
| 452 | 9e87d5 | AK3 | Calculates each base angle of triangle $AOC$ as $38°$, using “their” angle $AOC$. | Calculate each base angle of triangle $AOC$ from your $\angle AOC$. |
| 453 | 9e87d5 | AK4 | Calculates $90°-38°$. | Subtract the base angle you found from $90°$ to calculate the acute angle between the tangent and $AC$. |
| 454 | 9e87e7 | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. | Find the displacement from $A$ to $B$ by using $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 455 | 9e87e7 | AK1 | Subtracts the horizontal components: $2-(-4)=6$. | Subtract the horizontal component of $A$ from the horizontal component of $B$, taking care when subtracting a negative number. |
| 456 | 9e87e7 | AK2 | Subtracts the vertical components: $5-2=3$. | Subtract the vertical component of $A$ from the vertical component of $B$. |
| 457 | 9e87e7 | CK2 | Identifies $\overrightarrow{OC}=\begin{pmatrix}-1\\-3\end{pmatrix}$ from the grid. | Read $\overrightarrow{OC}$ from the grid and write its horizontal and vertical components as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 458 | 9e87e7 | R1 | Uses "their" $\overrightarrow{AB}$ as $\overrightarrow{CD}$. | Use your earlier $\overrightarrow{AB}$ as $\overrightarrow{CD}$. |
| 459 | 9e87e7 | AK3 | Finds the horizontal coordinate of $D$: $-1+6=5$, using "their" horizontal displacement. | Add your horizontal displacement to the horizontal coordinate of $C$ to find the horizontal coordinate of $D$. |
| 460 | 9e87e7 | AK4 | Finds the vertical coordinate of $D$: $-3+3=0$, giving $\begin{pmatrix}5\\0\end{pmatrix}$. | Add the vertical components to find the vertical coordinate of $D$, then write both coordinates as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 461 | 9e87e7 | CK3 | Recognises that a quadrilateral with one pair of opposite sides equal and parallel is a parallelogram. | Use the fact that one pair of opposite sides is equal and parallel to identify the quadrilateral as a parallelogram. |
| 462 | 9e87e7 | R2 | Establishes that $\overrightarrow{AB}=\overrightarrow{CD}$, using "their" vectors. | Compare your vectors component by component and state that $\overrightarrow{AB}=\overrightarrow{CD}$. |
| 463 | 9e87e7 | R3 | Concludes that $ABDC$ is a parallelogram. | Conclude that $ABDC$ is a parallelogram. |
| 464 | 9e87ef | CK1 | Squares both sides to obtain $M^2=P+2M$ | Square both sides and write the resulting equation using $M$ and $P$. |
| 465 | 9e87ef | AK1 | Subtracts $2M$ to isolate $P$ | Subtract $2M$ from both sides so that $P$ is isolated. |
| 466 | 9e87ef | CK2 | Substitutes $M=7$ into "their" expression for $P$ | Substitute $M=7$ into your expression for $P$. |
| 467 | 9e87ef | AK2 | Evaluates $7^2$ | Evaluate the squared term before completing the rest of the calculation. |
| 468 | 9e87ef | AK3 | Subtracts $2(7)$ from "their" squared value | Subtract $2(7)$ from your squared value. |
| 469 | 9e87ef | CK3 | Reads that setting B is at $35$ on the diagram | Locate the calculated value of $P$ on the diagram and read the matching setting label. |
| 470 | 9e87ef | R2 | Selects setting B using "their" value of $P$ | Select the setting that matches your value of $P$. |
| 471 | 9e87f7 | AK1 | Adds the five 2025 attendance figures. | Add the five 2025 attendance figures to find the total attendance. |
| 472 | 9e87f7 | CK1 | Uses total attendance divided by 5 to find the mean. | Divide the total attendance by $5$ to find the mean daily attendance. |
| 473 | 9e87f7 | AK3 | Divides "their" total by 5 to obtain $78$. | Divide your total by $5$ to calculate the mean daily attendance. |
| 474 | 9e87f7 | R1 | Obtains a 2026 mean of "their" mean plus 2. | Add $2$ to your mean to find the 2026 mean daily attendance. |
| 475 | 9e87f7 | CK2 | Recognises that the total for five days is $5$ multiplied by the mean. | Multiply the mean daily attendance by $5$ to find the total for five days. |
| 476 | 9e87f7 | AK4 | Calculates the 2026 total as $5 \times 80 = 400$. | Calculate the 2026 total using $5 \times$ your 2026 mean. |
| 477 | 9e87f7 | AK5 | Subtracts the four known 2026 values from $400$ to obtain $88$. | Subtract the four known 2026 attendance figures from the 2026 total to find the missing value. |
| 478 | 9e87f7 | CK3 | Identifies the range as the greatest attendance minus the least attendance. | Find the range by subtracting the least attendance from the greatest attendance. |
| 479 | 9e87f7 | R2 | Determines the 2025 range as $84 - 72 = 12$. | Subtract the least 2025 attendance from the greatest 2025 attendance to find the range. |
| 480 | 9e87f7 | R3 | Determines the 2026 range as "their" greatest value minus $70$, giving $18$ for $x = 88$. | Subtract $70$ from your greatest 2026 attendance value to find the 2026 range. |
| 481 | 9e87f7 | R4 | Chooses 2025 because it has the smaller range. | Choose the year with the smaller range because its attendance is more consistent. |
| 482 | 9e881d | R3 | Interprets $gf(x)$ as $g(f(x))$ using "their" output from the graph | Treat $gf(x)$ as $g(f(x))$ and use your output from the graph as the input to $g$. |
| 483 | 9e881d | AK1 | Obtains $f(\text{their }x)=15$ | Read the graph at the $x$ you found and obtain $f(\text{your }x)=15$. |
| 484 | 9e881d | CK2 | Identifies the mean of the 30 selected bottles as a sample statistic | Classify the mean from the selected bottles as a sample statistic. |
| 485 | 9e881d | CK3 | Identifies the mean of all bottles produced as a population parameter | Classify the mean from all the bottles produced as a population parameter. |
| 486 | 9e881d | AK3 | Multiplies 498 by "their" number of bottles | Multiply 498 by the number of bottles you found. |
| 487 | 9e8825 | CK1 | States or uses $t=\frac{d}{v}$ | Use $t=\frac{d}{v}$ to calculate the time from the distance travelled and the speed. |
| 488 | 9e8825 | AK2 | Calculates the time for $QR$ as $\frac{240}{480}=0.5$ minute | Divide the distance from $Q$ to $R$ by the speed on that section to find the time taken. |
| 489 | 9e8825 | AK3 | Adds $0.5$ minute to "their" time for $PQ$ to obtain $1$ minute | Add the time for $QR$ to your time for $PQ$ to find the outward journey time. |
| 490 | 9e8825 | CK2 | Identifies the complete-route distance as the sum of the three road sections | Add the distances of all three road sections to get the complete-route distance. |
| 491 | 9e8825 | CK3 | Identifies that the complete journey time includes the return journey from $R$ to $P$ | Include the time from $R$ back to $P$ when finding the time for the complete journey. |
| 492 | 9e8825 | R1 | Forms an average-speed calculation using $720$ m and "their" outward journey time together with the return time | Divide the complete-route distance by your outward journey time plus the return time to calculate the average speed. |
| 493 | 9e8825 | R2 | States that Nia is not correct | State that Nia is not correct. |
| 494 | 9e8825 | R3 | Explains that average speed is total distance divided by total time, not the mean of the separate speeds | Explain that average speed is found by dividing total distance by total time, rather than averaging the separate speeds. |
| 495 | 9e8832 | CK2 | Uses gradient $= \dfrac{\text{change in }y}{\text{change in }x}$ | Calculate the gradient using $\dfrac{\text{change in }y}{\text{change in }x}$ from two clear points on the line. |
| 496 | 9e8832 | AK1 | Finds a vertical change of $12$ and a horizontal change of $4$ | Count the vertical change and the horizontal change between two points on the line before forming the gradient. |
| 497 | 9e8832 | R1 | Expresses "their" equation in the form $y=mx+c$ | Rewrite your equation in the form $y=mx+c$, using your gradient for $m$ and your y-intercept for $c$. |
| 498 | 9e8832 | CK3 | Sets $y=0$ to determine the x-intercept | Set $y=0$ in the line equation and solve for the x-coordinate of the intercept. |
| 499 | 9e8832 | AK4 | Solves "their" equation to obtain $x=4$ and gives $(4,0)$ | Solve your equation for $x$, then write the resulting x-intercept as an ordered pair. |
| 500 | 9e8832 | R2 | Interprets the x-intercept as zero net earnings or break-even point | State that this x-intercept is where the taxi driver has zero net earnings and breaks even. |
