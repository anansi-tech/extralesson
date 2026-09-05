# Hint approval log

One table per batch. A row is approved by setting its status in the batch file; `pnpm hints:approve <n>` writes approved hints to the bank.

## Batch 1 — approved (200 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 200 rows. Rows 9, 65, 128, 131, 132, 192 hand-edited; rows 31, 79, 168, 175 set to his sentences. Rows 141–148 and 176–182 later put in the imperative under the no-leading-You check.

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
| 141 | d9c1e8 | CK1 | Recognises that $\overrightarrow{AB}$ is found by subtracting the coordinates of $A$ from those of $B$. | Find $\overrightarrow{AB}$ by subtracting each coordinate of $A$ from the corresponding coordinate of $B$. |
| 142 | d9c1e8 | AK1 | Subtracts correctly to obtain $\begin{pmatrix}3\\4\end{pmatrix}$. | Subtract the coordinates carefully and write the resulting vector as $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 143 | d9c1e8 | CK2 | Uses $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$. | Use $\left\|\begin{pmatrix}x\\y\end{pmatrix}\right\|=\sqrt{x^2+y^2}$ to find the magnitude. |
| 144 | d9c1e8 | AK2 | Evaluates $\sqrt{3^2+4^2}$. | Square both vector components, add the results, and evaluate the square root $\sqrt{a^2+b^2}$. |
| 145 | d9c1e8 | CK3 | Recognises that a point on the $x$-axis has second coordinate $0$. | Write the point on the $x$-axis with $0$ as its second coordinate. |
| 146 | d9c1e8 | AK3 | Uses $\|x-1\|=$ 'their' magnitude of $\overrightarrow{AB}$ to obtain $x=6$ or $x=-4$. | Use $\|x-1\|=$ your magnitude of $\overrightarrow{AB}$ and solve for both possible values of $x$. |
| 147 | d9c1e8 | R2 | Uses the condition $AC=AB$ with 'their' magnitude from part (b). | Set $AC=AB$ by using your magnitude of $\overrightarrow{AB}$ as the length of $AC$. |
| 148 | d9c1e8 | R3 | Selects $x=6$, since $C$ is to the right of $A$, and gives $(6,0)$. | Choose the solution to the right of $A$ and write the point with second coordinate $0$. |
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
| 176 | d9c20d | CK1 | Identifies $f$ and $g$ as inverse functions | Use the reflection in $y=x$ to identify the relationship between $f$ and $g$. |
| 177 | d9c20d | CK2 | Recognises that the inverse reverses the input and output | Reverse the input and output when finding the inverse function. |
| 178 | d9c20d | AK2 | Interchanges the variables and rearranges $y=2x+1$ to make $y$ the subject | Interchange $x$ and $y$ in $y=2x+1$ and rearrange to make $y$ the subject. |
| 179 | d9c20d | R2 | States $g:x\to \frac{x-1}{2}$ | State the inverse rule in the form $g:x\to\frac{\text{expression}}{\text{constant}}$. |
| 180 | d9c20d | CK3 | Forms the composition $g(f(x))$ | Write the composition $g(f(x))$ before simplifying it. |
| 181 | d9c20d | AK3 | Substitutes $f(x)=2x+1$ into $g$ | Replace the input of $g$ with $f(x)$ using the given rule for $f$. |
| 182 | d9c20d | R3 | Simplifies to conclude $g(f(x))=x$ | Simplify the composition fully and state the resulting identity. |
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

## Batch 3 — approved (500 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 500 rows. Row 163 set to his sentence; rows 47 and 49 drop the answer values. Rows 247 and 252 later lose a standalone operator symbol.

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
| 47 | 804aae | AK2 | Divides $15$ by "their" total and simplifies to $\frac{3}{10}$. | Divide $15$ by your total, then simplify the fraction. |
| 48 | 804aae | CK3 | Recognises that the theoretical probability is $\frac{1}{2}\times\frac{1}{2}$. | For the theoretical probability, multiply the probability of a tail by the probability of an odd number: $\frac{1}{2}\times\frac{1}{2}$. |
| 49 | 804aae | AK3 | Evaluates the theoretical probability as $\frac{1}{4}$. | Multiply the two probabilities of the independent events. |
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
| 163 | 821070 | R3 | States the discount as a percentage. | State your discount as a percentage with the % sign. |
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
| 247 | 8210f0 | AK1 | Calculates $18 \times 8 = 144$ | Carry out the multiplication carefully to calculate the total waiting time. |
| 248 | 8210f0 | CK2 | Forms total waiting time as sum of the seven known times and Anisa's time | Write the total waiting time as the sum of the seven known waiting times and Anisa's waiting time. |
| 249 | 8210f0 | AK2 | Finds sum of the seven known waiting times as $114$ | Add the seven known waiting times carefully before finding Anisa's time. |
| 250 | 8210f0 | AK3 | Calculates $144 - 114 = 30$ | Subtract the sum of the known waiting times from the total waiting time. |
| 251 | 8210f0 | CK3 | Identifies the fourth and fifth values as $15$ and $17$ after ordering the data | Order all the waiting times from smallest to largest, then identify the two middle values. |
| 252 | 8210f0 | AK4 | Calculates median as $(15 + 17) \div 2 = 16$ | Add the two middle values and divide by two to calculate the median. |
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

## Batch 4 — approved (500 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 500 rows. Rows 477–487 put in the imperative; row 318 set to his sentence; rows 167 and 257 lose a standalone operator symbol.

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | 9e8847 | CK2 | Recognises that the frame has two triangular ends | Identify the two triangular ends of the frame. |
| 2 | 9e8847 | CK3 | Recognises that three edges meet at each vertex | Count the three edges that meet at each vertex. |
| 3 | 9e8847 | AK2 | Calculates "their" 6 $\times 3 = 18$ edge-ends | Multiply your vertex total by three to find the total number of edge-ends. |
| 4 | 9e8847 | R1 | Accounts for each edge being counted at both of its endpoints | Divide the edge-end total by two because each edge has two endpoints. |
| 5 | 9e8847 | AK4 | Divides "their" 9 by 4 | Divide your total number of straws by the number of straws in one packet. |
| 6 | 9e8847 | R2 | Selects 3 whole packets as the minimum number required | Choose the smallest whole number of packets that provides enough straws. |
| 7 | 9e8854 | CK1 | Recognises that the angle at the centre is twice the angle at the circumference subtended by chord $AB$. | Use the circle fact that the angle at the centre is twice the angle at the circumference subtended by chord $AB$. |
| 8 | 9e8854 | AK1 | Doubles $55°$. | Multiply $55°$ by $2$. |
| 9 | 9e8854 | CK2 | Recognises that $OA=OB$ as radii, so $\triangle OAB$ is isosceles. | Identify $OA=OB$ as radii and use this to treat $\triangle OAB$ as isosceles. |
| 10 | 9e8854 | AK3 | Subtracts "their" $\angle AOB$ from $180°$. | Subtract your earlier $\angle AOB$ from $180°$. |
| 11 | 9e8854 | R1 | Divides the remaining angle equally between the two base angles. | Divide the remaining angle equally between the two base angles of the isosceles triangle. |
| 12 | 9e8854 | CK3 | Recognises the perpendicular relationship between radius $OA$ and tangent $AT$. | Use the fact that radius $OA$ is perpendicular to tangent $AT$ at the point of contact. |
| 13 | 9e8854 | AK4 | Evaluates $90°-$ "their" $\angle OAB$. | Calculate $90°-\angle OAB$ using your earlier $\angle OAB$. |
| 14 | 9e8854 | R2 | Forms $\angle TAB=90°-$ "their" $\angle OAB$. | Form $\angle TAB=90°-\angle OAB$ using your earlier $\angle OAB$. |
| 15 | 9e8854 | R3 | Gives a valid tangent-radius justification. | State that a tangent is perpendicular to the radius at the point of contact. |
| 16 | 9e886b | CK1 | States $\vec{AB}=\vec{OB}-\vec{OA}$ | Write $\vec{AB}=\vec{OB}-\vec{OA}$ before calculating the displacement. |
| 17 | 9e886b | AK1 | Subtracts the components to obtain $\begin{pmatrix}3\\2\end{pmatrix}$ | Subtract the corresponding horizontal and vertical components and write the displacement as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 18 | 9e886b | CK2 | Recognises that $\vec{BC}=\vec{AB}$ | Set $\vec{BC}$ equal to $\vec{AB}$ because the move from $B$ to $C$ matches the move from $A$ to $B$. |
| 19 | 9e886b | R1 | Forms $\vec{OC}=\vec{OB}+$ "their" $\vec{AB}$ | Form $\vec{OC}=\vec{OB}+\vec{AB}$ using your earlier $\vec{AB}$. |
| 20 | 9e886b | AK2 | Adds the vector components to obtain $\begin{pmatrix}2\\5\end{pmatrix}$, following through on "their" $\vec{AB}$ | Add the corresponding components of $\vec{OB}$ and your earlier $\vec{AB}$, then write the result as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 21 | 9e886b | R2 | Recognises that $\vec{CD}=$ "their" $\vec{AB}$ | Set $\vec{CD}$ equal to your earlier $\vec{AB}$ because this move is the same size and direction. |
| 22 | 9e886b | R3 | Forms $\vec{OD}=$ "their" $\vec{OC}+$ "their" $\vec{AB}$ | Form $\vec{OD}=\vec{OC}+\vec{AB}$ using your earlier $\vec{OC}$ and $\vec{AB}$. |
| 23 | 9e886b | AK3 | Adds the horizontal components using "their" vectors | Add the horizontal components of your earlier vectors to find the horizontal component of $\vec{OD}$. |
| 24 | 9e886b | AK4 | Adds the vertical components and obtains $\begin{pmatrix}5\\7\end{pmatrix}$, following through on "their" vectors | Add the vertical components of your earlier vectors and write the completed result as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 25 | 9e887d | AK1 | Multiplies 35 by \$16. | Multiply the regular hours by the hourly rate, $35 \times \$16$, to find the regular pay. |
| 26 | 9e887d | CK2 | Recognises that take-home pay is gross pay less the bus-pass deduction. | Subtract the bus-pass deduction from gross pay to get take-home pay. |
| 27 | 9e887d | AK2 | Uses "their" regular pay and represents overtime pay by $24x$. | Use your regular-pay result and write the overtime pay as $24x$. |
| 28 | 9e887d | R1 | Expresses the relationship as an equation in $x$. | Set take-home pay, after subtracting the bus-pass deduction, equal to the required amount and write this as an equation in $x$. |
| 29 | 9e887d | AK3 | Collects terms to obtain $24x = 240$, or equivalent. | Collect the constant terms on one side of the equation and the $24x$ term on the other side. |
| 30 | 9e887d | AK4 | Divides by 24. | Divide both sides of your equation by $24$ to isolate $x$. |
| 31 | 9e887d | AK5 | Solves $560 + 24h - 30 \ge 820$ to obtain $h \ge \frac{145}{12}$, or equivalent. | Rearrange $560 + 24h - 30 \ge 820$ by collecting constants and dividing by $24$, then write the result in the form $h \ge \frac{\text{difference}}{24}$. |
| 32 | 9e887d | R2 | Uses the whole-number condition to determine that at least 13 overtime hours are required. | Round the required number of overtime hours up to the next whole number to find the minimum needed. |
| 33 | 9e887d | R3 | Finds a maximum of "their" overtime hours from part (c), plus 2. | Add $2$ to your overtime-hours result from part (c) to find the maximum allowed. |
| 34 | 9e887d | R4 | Concludes correctly that the target cannot be met. | Compare the minimum whole number of hours needed with your maximum allowed hours and state whether the target can be met. |
| 35 | 9e888a | CK1 | Forms $N$ from the coordinate columns in the stated order | Place the coordinate columns into $N$ in the stated order, keeping each column’s top and bottom entries aligned. |
| 36 | 9e888a | R1 | Forms a total-volume equation using "their" numbers of mango and coconut trays | Form a total-volume equation using your numbers of mango and coconut trays, with the coconut-tray volume represented by $x$. |
| 37 | 9e888a | CK2 | Uses $200\text{ cm}^3$ as the volume for each mango-drink tray | Use $200\text{ cm}^3$ as the volume of every mango-drink tray in your total-volume equation. |
| 38 | 9e888a | CK3 | Recognises that the container volume is $V=x$ | Replace $V$ with $x$ because the container volume is given by $V=x$. |
| 39 | 9e888a | AK3 | Rearranges correctly to obtain $r=\left(\frac{3x}{4\pi}\right)^{1/3}$ | Rearrange the volume formula step by step until you isolate $r=\left(\frac{3x}{4\pi}\right)^{1/3}$. |
| 40 | 9e888a | R2 | Substitutes "their" value of $x$ into "their" expression for $r$ | Substitute your value of $x$ into your expression for $r$ before calculating the radius. |
| 41 | 9e888a | AK4 | Evaluates the cube root, giving $3.627\ldots$ | Evaluate the cube root in your radius expression accurately using your calculator. |
| 42 | 9e888a | R3 | Expresses "their" radius correct to $3$ significant figures | Round your radius to $3$ significant figures and include the correct unit. |
| 43 | 9e8892 | CK1 | Identifies that the next increase in the number of markers is $5$ | Compare consecutive figures and continue the pattern of increases to find the next increase. |
| 44 | 9e8892 | AK1 | Adds $5$ to $10$ to obtain $15$ | Add the next increase you find to the total in the previous figure. |
| 45 | 9e8892 | CK2 | Recognises that Figure $n$ has $n+1$ rows of markers | Count the rows in Figure $n$ and express the number of rows in terms of $n$. |
| 46 | 9e8892 | R1 | Represents the total as $1+2+\cdots+(n+1)$ | Write $D$ by summing the row lengths as $1+2+\cdots+(n+1)$. |
| 47 | 9e8892 | R2 | Equates "their" expression for $D$ to $78$ | Set your expression for $D$ equal to the total specified in the question. |
| 48 | 9e8892 | AK3 | Expands and rearranges "their" equation to a quadratic equation in $n$ | Expand and rearrange your equation into a quadratic equation in $n$. |
| 49 | 9e8892 | AK4 | Solves "their" quadratic equation | Solve your quadratic equation for all possible values of $n$. |
| 50 | 9e8892 | R3 | Rejects the negative root since $n$ is a natural number | Discard any negative solution because $n$ represents a natural-numbered figure. |
| 51 | 9e889a | CK1 | Identifies the discount as $15\%$ of the listed price | Find $15\%$ of the listed price to identify the discount. |
| 52 | 9e889a | AK1 | Calculates $0.15 \times 2400 = 360$ | Calculate $0.15 \times 2400$ carefully to find the discount. |
| 53 | 9e889a | AK2 | Subtracts "their" discount from \$2 400 | Subtract your discount from \$2 400 to find the discounted price. |
| 54 | 9e889a | CK2 | Uses the discounted price as the taxable amount | Use the discounted price, not the listed price, as the taxable amount. |
| 55 | 9e889a | AK3 | Calculates $12.5\%$ of "their" discounted price | Calculate $12.5\%$ of your discounted price to find the sales tax. |
| 56 | 9e889a | CK3 | Identifies total cost as "their" discounted price plus "their" sales tax | Treat the total cost as your discounted price plus your sales tax. |
| 57 | 9e889a | AK4 | Adds "their" discounted price and sales tax | Add your discounted price and sales tax to find the total cost. |
| 58 | 9e889a | R1 | States the correct affordability decision from "their" total cost | Use your total cost to state whether Kemar can afford the tiles. |
| 59 | 9e889a | R2 | Compares "their" total cost with \$2 300 to find the amount less | Compare your total cost with \$2 300 to find how much less it is. |
| 60 | 9e88a2 | AK1 | Multiplies each waiting time by its frequency | Multiply each waiting time by its frequency and add the resulting products to find the total waiting time. |
| 61 | 9e88a2 | AK3 | Divides "their" total waiting time by 30 | Divide your total waiting time by the number of customers in the sample to calculate the mean. |
| 62 | 9e88a2 | CK1 | Identifies the mean calculated from the sample as a statistic | Identify the mean calculated from the selected customers as a statistic. |
| 63 | 9e88a2 | CK2 | Identifies all 180 customers as the population | Identify all the customers being investigated as the population. |
| 64 | 9e88a2 | R1 | Uses "their" sample mean as an estimate of the population mean before finding the total | Use your sample mean as an estimate of the population mean before calculating the estimated total waiting time. |
| 65 | 9e88a2 | R2 | States that the manager's conclusion is not justified | State that the manager's conclusion is not justified. |
| 66 | 9e88a2 | CK3 | Identifies 7.4 minutes as a sample statistic | Identify the calculated mean waiting time as a sample statistic. |
| 67 | 9e88a2 | CK4 | Identifies the actual mean for all customers as a population parameter | Identify the actual mean waiting time for all customers as a population parameter. |
| 68 | 9e88a2 | R3 | Explains that a sample statistic estimates but does not establish the exact population parameter | Explain that a sample statistic estimates the population parameter but does not give its exact value. |
| 69 | 9e88aa | CK1 | Recognises that both sides must be squared | Square both sides of the equation before simplifying. |
| 70 | 9e88aa | AK1 | Squares and simplifies to obtain $T^2=\frac{4\pi^2l}{g}$ | Square both sides and simplify the constants to obtain $T^2=\frac{4\pi^2l}{g}$. |
| 71 | 9e88aa | CK2 | Identifies the coefficient of $l$ as the gradient, $\frac{4\pi^2}{g}$ | Identify the coefficient multiplying $l$ as the gradient, $\frac{4\pi^2}{g}$. |
| 72 | 9e88aa | CK3 | Forms $mg=4\pi^2$ by clearing the denominator | Clear the denominator by multiplying through by $g$ to form $mg=4\pi^2$. |
| 73 | 9e88aa | R1 | Reads a correct gradient of 4 from the graph | Use two clear points on the graph and calculate rise divided by run to read the gradient. |
| 74 | 9e88aa | AK3 | Substitutes "their" gradient into $g=\frac{4\pi^2}{m}$ | Substitute your gradient into $g=\frac{4\pi^2}{m}$ and simplify. |
| 75 | 9e88aa | R2 | Expresses "their" value of $g$ correct to 3 significant figures | Write your value of $g$ correct to 3 significant figures. |
| 76 | 9e88aa | R3 | States that "their" value rounds to $9.9\text{ m s}^{-2}$ to 1 decimal place | Round your value of $g$, with units $\text{ m s}^{-2}$, to 1 decimal place and compare it with the accepted value. |
| 77 | 9e88c1 | CK1 | States the axis of symmetry as the equation $x=3$ | Read the vertical line through the turning point and state the equation of the axis of symmetry. |
| 78 | 9e88c1 | R2 | Uses symmetry about $x=3$ and “their” image from (a) to obtain $4$ | Reflect your image from (a) across the axis $x=3$ to find the matching input. |
| 79 | 9e88c1 | CK2 | Recognises that $gf(2)=g(f(2))$ | Rewrite $gf(2)$ as $g(f(2))$ before evaluating it. |
| 80 | 9e88c1 | AK1 | Substitutes “their” value of $f(2)$ into $g$ | Substitute your value of $f(2)$ into $g$ and simplify. |
| 81 | 9e88c1 | CK3 | Recognises that $gf(x)=0$ when $f(x)=-3$ | Set $g(f(x))$ equal to zero, then find the corresponding required value of $f(x)$. |
| 82 | 9e88c1 | AK4 | Adds 3 to the minimum value of $f$ | Add $3$ to the minimum value of $f$ to obtain the minimum value of $gf$. |
| 83 | 9e88ce | CK1 | Recognises that angles opposite equal sides are equal | Use the equal sides to identify the opposite angles as equal. |
| 84 | 9e88ce | AK2 | Adds $65°$ and "their" $\angle PRQ$ | Add $65°$ to your value for $\angle PRQ$. |
| 85 | 9e88ce | CK2 | Recognises that the angles in a triangle total $180°$ | Use the fact that the angles in a triangle add to $180°$. |
| 86 | 9e88ce | AK3 | Subtracts "their" sum of the two base angles from $180°$ | Subtract your sum of the two base angles from $180°$. |
| 87 | 9e88ce | CK3 | Identifies an angle less than $90°$ as acute | Classify an angle less than $90°$ as acute. |
| 88 | 9e88ce | R3 | States that "their" angle is less than $90°$ | State that your angle is less than $90°$. |
| 89 | 9e88d6 | CK1 | Recognises $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Form $\overrightarrow{AB}$ by subtracting $\overrightarrow{OA}$ from $\overrightarrow{OB}$. |
| 90 | 9e88d6 | AK1 | Subtracts coordinates to obtain $\begin{pmatrix}3\\2\end{pmatrix}$ | Subtract the corresponding coordinates and write the result as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 91 | 9e88d6 | CK2 | Recognises $\overrightarrow{AC}=\overrightarrow{AB}+\overrightarrow{BC}$ | Form $\overrightarrow{AC}$ by adding $\overrightarrow{AB}$ and $\overrightarrow{BC}$. |
| 92 | 9e88d6 | AK2 | Finds $\overrightarrow{BC}=2\begin{pmatrix}3\\2\end{pmatrix}=\begin{pmatrix}6\\4\end{pmatrix}$ | Double each component of $\overrightarrow{AB}$ to find $\overrightarrow{BC}$ and write it as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 93 | 9e88d6 | R1 | Adds $\overrightarrow{AB}$ to $2\overrightarrow{AB}$ to obtain $\begin{pmatrix}9\\6\end{pmatrix}$; follow-through using "their" $\overrightarrow{AB}$ | Add your $\overrightarrow{AB}$ to $2\overrightarrow{AB}$ component by component to obtain $\overrightarrow{AC}$ as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 94 | 9e88d6 | CK3 | Recognises $\overrightarrow{OC}=\overrightarrow{OA}+\overrightarrow{AC}$ | Form $\overrightarrow{OC}$ by adding $\overrightarrow{OA}$ and $\overrightarrow{AC}$. |
| 95 | 9e88d6 | AK3 | Adds $\begin{pmatrix}-4\\-3\end{pmatrix}$ to "their" $\overrightarrow{AC}$ | Add $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$ for $\overrightarrow{OA}$ to your $\overrightarrow{AC}$ component by component. |
| 96 | 9e88d6 | R2 | States the resulting position vector $\begin{pmatrix}5\\3\end{pmatrix}$; follow-through from "their" $\overrightarrow{AC}$ | Use your $\overrightarrow{AC}$ to state the resulting position vector $\overrightarrow{OC}$ as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 97 | 9e88d6 | AK4 | Compares $x=5$ with the upper boundary $x=4$ | Compare the $x$-coordinate of $C$ with the upper $x$-boundary. |
| 98 | 9e88d6 | AK5 | Compares $y=3$ with the upper boundary $y=2$ | Compare the $y$-coordinate of $C$ with the upper $y$-boundary. |
| 99 | 9e88d6 | R3 | Uses "their" coordinates of $C$ to test the storage-area conditions | Use your coordinates of $C$ to check both storage-area boundary conditions. |
| 100 | 9e88d6 | R4 | Concludes that $C$ is not in the storage area, with a valid reason | Conclude whether $C$ is in the storage area and give the boundary comparison that justifies your conclusion. |
| 101 | 9e88e3 | CK1 | Recognises that the total number of packets is the sum of all frequencies | Add the frequencies for every bar to form the total number of packets. |
| 102 | 9e88e3 | AK1 | Adds the frequencies to obtain $40$ | Add all the bar frequencies carefully and write the resulting total. |
| 103 | 9e88e3 | CK2 | Selects the classes from $500$ g onwards | Select every class beginning at $500$ g and continuing to larger masses. |
| 104 | 9e88e3 | AK2 | Adds the qualifying frequencies: $10+14+6+2=32$ | Add the frequencies of only the selected classes to find the qualifying number of packets. |
| 105 | 9e88e3 | AK3 | Calculates $(32/\text{their }40)\times100=80\%$ | Calculate $(\text{your qualifying total}/\text{your total})\times100\%$ to find the percentage. |
| 106 | 9e88e3 | CK3 | Recognises that $75\%$ of the total batch gives the required minimum number | Find the required minimum number of packets by taking $75\%$ of your total batch. |
| 107 | 9e88e3 | AK4 | Calculates $0.75\times\text{their }40=30$ | Calculate $\text{your total}\times\text{the decimal form of the required percentage}$ to find the minimum number. |
| 108 | 9e88e3 | R1 | Interprets “at least $75\%$” as a percentage that is greater than or equal to $75\%$ | Treat at least $75\%$ as including $75\%$ itself as well as any larger percentage. |
| 109 | 9e88e3 | R2 | Compares “their” percentage with $75\%$ correctly | Compare your percentage with $75\%$ using the correct greater-than-or-equal-to idea. |
| 110 | 9e88e3 | R3 | States that the batch meets the requirement | Use your comparison to state whether the batch meets the requirement. |
| 111 | 9e88f0 | R1 | Equates the angle between tangent $t$ and chord $AB$ to $\angle ACB$ | Set the angle between tangent $t$ and chord $AB$ equal to $\angle ACB$. |
| 112 | 9e88f0 | CK1 | States angle in the alternate segment | State that the tangent-chord angle equals the angle in the alternate segment. |
| 113 | 9e88f0 | CK2 | States that a radius is perpendicular to a tangent at the point of contact | State that a radius is perpendicular to a tangent at the point of contact. |
| 114 | 9e88f0 | R2 | Forms $90°-$ “their” angle from part (a) | Subtract your angle from part (a) from $90°$. |
| 115 | 9e88f0 | AK2 | Evaluates $90°-$ “their” angle from part (a) | Evaluate the result of subtracting your angle from part (a) from $90°$. |
| 116 | 9e88f0 | CK3 | Identifies $OA=OB$ as radii of the same circle | Identify $OA=OB$ as radii of the same circle. |
| 117 | 9e88f0 | R3 | Uses equal base angles in isosceles triangle $OAB$ | Use the equal base angles in isosceles triangle $OAB$. |
| 118 | 9e88f0 | AK3 | Doubles “their” value of $\angle OAB$ | Double your value of $\angle OAB$. |
| 119 | 9e88f0 | AK4 | Subtracts “their” doubled angle from $180°$ | Subtract your doubled angle from $180°$. |
| 120 | 9e88f8 | AK1 | Adds the three distances travelled. | Add the three distances travelled to find your total distance. |
| 121 | 9e88f8 | CK1 | Selects $\text{time}=\dfrac{\text{distance}}{\text{speed}}$. | Use $\text{time}=\dfrac{\text{distance}}{\text{speed}}$ to choose the calculation for the journey time. |
| 122 | 9e88f8 | AK2 | Divides "their" total distance by $240$. | Divide your total distance by $240$ to calculate your time. |
| 123 | 9e88f8 | CK2 | Identifies that the total cost includes the running cost and the fixed charge. | Include both the running cost and the fixed charge when finding the total cost. |
| 124 | 9e88f8 | AK3 | Calculates the running cost using $16\times$ "their" time. | Calculate the running cost using $16\times$ your time. |
| 125 | 9e88f8 | AK4 | Adds \$40 to "their" running cost. | Add \$40 to your running cost to find your total cost. |
| 126 | 9e88f8 | R1 | Determines the revenue needed by adding \$72 profit to "their" total cost. | Add \$72 profit to your total cost to determine the required revenue. |
| 127 | 9e88f8 | R2 | Divides "their" required revenue by $8$ passengers. | Divide your required revenue by $8$ passengers to find the fare per passenger. |
| 128 | 9e8905 | CK1 | Recognises that the $y$-intercept occurs when $x=0$ | Locate the $y$-intercept by finding where the line meets the vertical axis. |
| 129 | 9e8905 | R1 | Reads the $y$-intercept as $(0,12)$ | Read the coordinate where the line crosses the vertical axis and write it as an ordered pair. |
| 130 | 9e8905 | CK2 | Uses "their" $y$-intercept as the value of $c$ | Use your $y$-intercept as the value of $c$ in the line equation. |
| 131 | 9e8905 | AK1 | Obtains gradient $-2$ from the graph | Calculate the gradient from two points on the graph by dividing the change in $y$ by the change in $x$. |
| 132 | 9e8905 | AK2 | Forms $y=-2x+12$ using "their" values | Form $y=mx+c$ by using your gradient and your $y$-intercept. |
| 133 | 9e8905 | CK3 | Sets $y=0$ to determine the $x$-intercept | Set $y=0$ before solving for the $x$-intercept. |
| 134 | 9e8905 | AK3 | Solves "their" equation for $x=6$ when $y=0$ | Substitute $y=0$ into your equation and solve for $x$. |
| 135 | 9e8905 | R2 | States the $x$-intercept as the coordinate $(6,0)$ | State the $x$-intercept as a coordinate with zero as its second coordinate. |
| 136 | 9e8905 | CK4 | Recognises that a load which fits must be represented by a point on or below the line | Check that a load that fits lies on the line or below it on the graph. |
| 137 | 9e8905 | AK4 | Substitutes $x=5$ into "their" equation to obtain $y=2$ | Substitute $x=5$ into your equation and calculate the corresponding value of $y$. |
| 138 | 9e8905 | AK5 | Compares 3 plastic bags with "their" maximum of 2 plastic bags | Compare the proposed number of plastic bags with your maximum number of plastic bags. |
| 139 | 9e8905 | R3 | Concludes that the proposed load cannot be transported in one trip, with a valid reason | Conclude whether one trip is possible by explaining how the proposed load compares with the maximum permitted load. |
| 140 | 9e8915 | CK1 | Recognises that all seven interior regions are included in $n(H \cup D \cup C)$ | Include every one of the seven regions inside the circles when finding $n(H \cup D \cup C)$. |
| 141 | 9e8915 | AK1 | Adds the entries in the seven interior regions | Add the numbers in all seven interior regions of the Venn diagram. |
| 142 | 9e8915 | CK2 | Recognises that adults with no condition are outside $H \cup D \cup C$ | Use the region outside $H \cup D \cup C$ for adults with no condition. |
| 143 | 9e8915 | AK3 | Subtracts "their" $n(H \cup D \cup C)$ from $80$ | Subtract your total for $n(H \cup D \cup C)$ from $80$. |
| 144 | 9e8915 | R1 | Identifies the remainder as the number with none of the three conditions, FT from "their" union | Identify the remainder from your union total as the number with none of the three conditions. |
| 145 | 9e8915 | CK3 | Uses "their" number with no condition as the favourable outcomes and $80$ as the total outcomes | Use your number with no condition as the favourable outcomes and $80$ as the total outcomes. |
| 146 | 9e8915 | AK4 | Forms the probability $\frac{\text{their }29}{80}$ | Form the probability as $\frac{\text{your number with no condition}}{80}$. |
| 147 | 9e8915 | R2 | Expresses "their" probability in lowest terms | Simplify your probability to its lowest terms. |
| 148 | 9e8915 | R3 | Correctly compares "their" probability with $\frac{1}{3}$ | Compare your probability carefully with $\frac{1}{3}$. |
| 149 | 9e891d | CK1 | Recognises that the marked price is 125% of the growing cost | Treat the marked price as $125\%$ of the growing cost. |
| 150 | 9e891d | CK2 | Identifies that the 10% reduction is calculated from "their" marked price | Calculate the $10\%$ reduction from your marked price. |
| 151 | 9e891d | AK3 | Subtracts "their" reduction from "their" marked price | Subtract your reduction from your marked price to find your selling price. |
| 152 | 9e891d | AK4 | Subtracts \$12 000 from "their" selling price to obtain 1 500 | Subtract the growing cost from your selling price to find the difference. |
| 153 | 9e891d | R1 | Identifies the positive difference between selling price and cost as profit | State that a positive difference between the selling price and the cost is profit. |
| 154 | 9e891d | R2 | Forms the comparison $\frac{\text{their profit}}{12\,000}\times100$ | Calculate the percentage profit using $\frac{\text{your profit}}{12\,000}\times100$. |
| 155 | 9e8925 | CK3 | Recognises that both sides must be squared to remove the square root | Square both sides of the equation to remove the square root. |
| 156 | 9e8925 | AK1 | Squares correctly to obtain $M^2=P+2M$ | Square both sides carefully and simplify the right-hand side. |
| 157 | 9e8925 | AK2 | Rearranges to obtain $P=M^2-2M$ | Rearrange the equation so that $P$ is the subject. |
| 158 | 9e8925 | CK4 | Uses $M=8$ | Use the given value of $M$. |
| 159 | 9e8925 | AK3 | Substitutes "their" expression for $P$ and "their" value of $M$ | Substitute your expression for $P$ and your value of $M$ into the equation. |
| 160 | 9e8925 | R1 | Expresses the structural rating as an integer | Write the structural rating as an integer. |
| 161 | 9e8925 | AK5 | Calculates total edge length as $4(4+3+2)=36\text{ m}$ | Add the three listed dimensions, multiply the sum by four, and give the length in $\text{ m}$. |
| 162 | 9e8925 | R2 | Compares "their" value of $P$ with the total edge length | Compare your value of $P$ with your total edge length using an inequality. |
| 163 | 9e8925 | R3 | Concludes correctly whether the frame is approved, using "their" values | State whether the frame is approved using your two calculated values. |
| 164 | 9e8932 | CK1 | Identifies \$7 as the common increase in fare. | Subtract consecutive fares to find the constant increase for one additional passenger. |
| 165 | 9e8932 | AK1 | Applies five increases of \$7 to obtain \$53. | Start with the fare for one passenger and add five equal increases to find the fare for six passengers. |
| 166 | 9e8932 | AK2 | Uses "their" total for 6 passengers as the starting value. | Use your total for six passengers as the starting fare for the next calculation. |
| 167 | 9e8932 | AK3 | Adds $4\times\$7$ to "their" total. | Calculate four further equal increases, then add this amount to your total. |
| 168 | 9e8932 | CK2 | Recognises \$7 as the fare added for each passenger. | Identify the amount added to the fare for each extra passenger. |
| 169 | 9e8932 | AK4 | Determines the fixed charge as \$11 using "their" total. | Subtract the passenger-charge part from your total to find the fixed charge. |
| 170 | 9e8932 | R1 | Forms a formula relating $C$ and $n$. | Write a formula relating $C$ to $n$ by combining the charge per passenger with the fixed charge. |
| 171 | 9e8932 | CK3 | Substitutes \$123 for $C$ to form $7n+11=123$. | Replace $C$ with the given total fare in your formula before solving. |
| 172 | 9e8932 | R2 | Rearranges "their" equation to determine $n$. | Rearrange your equation to isolate $n$. |
| 173 | 9e893a | CK1 | Recognises that $r^3$ must be isolated before finding $r$ | Isolate $r^3$ before you take the cube root to find $r$. |
| 174 | 9e893a | AK1 | Multiplies by 3 and divides by $4\pi$ to obtain $r^3=\frac{3V}{4\pi}$ | Multiply by $3$ and divide by $4\pi$ to write $r^3=\frac{3V}{4\pi}$. |
| 175 | 9e893a | CK2 | Substitutes $V=\frac{32\pi}{3}$ into the expression for $r$ | Substitute the given value of $V$ into $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 176 | 9e893a | AK3 | Simplifies to obtain $r^3=8$ | Simplify the expression for $r^3$ completely before taking the cube root. |
| 177 | 9e893a | CK3 | Identifies $2.5\text{ m}$ as the greatest permitted radius from the number line | Read the rightmost included point on the number line as the greatest permitted radius in $\text{m}$. |
| 178 | 9e893a | R2 | Concludes that the proposed tank will fit using "their" radius from part (b) | Use your radius from part (b) to conclude whether the proposed tank will fit. |
| 179 | 9e893a | R3 | States that "their" radius is less than the maximum permitted radius | Compare your radius with the maximum permitted radius and state that it is less. |
| 180 | 9e8942 | CK1 | Recognises that the angle at the centre is twice the angle at the circumference on arc $AB$ | Identify the central angle and the angle at the circumference that both subtend arc $AB$, then use the fact that the central angle is twice the circumference angle. |
| 181 | 9e8942 | AK1 | Calculates $120 \div 2 = 60°$ | Write the division $120 \div 2$ and calculate the angle at the circumference. |
| 182 | 9e8942 | CK2 | Identifies $\angle ACB$ as the angle in the alternate segment for chord $AB$ | Use chord $AB$ to identify $\angle ACB$ as the angle in the alternate segment. |
| 183 | 9e8942 | AK2 | Gives $\angle TAB = 60°$ using “their” $\angle ACB$ | Set $\angle TAB$ equal to your earlier value for $\angle ACB$. |
| 184 | 9e8942 | R1 | States the tangent-chord theorem | State that the angle between a tangent and a chord equals the angle in the alternate segment. |
| 185 | 9e8942 | CK3 | Recognises that tangents from $T$ are equal, so triangle $TAB$ is isosceles | Use the fact that the tangents from $T$ are equal to show that triangle $TAB$ is isosceles. |
| 186 | 9e8942 | AK3 | Obtains $\angle TBA = 60°$ from “their” $\angle TAB$ | Make $\angle TBA$ equal to your earlier value for $\angle TAB$ because these are the base angles of isosceles triangle $TAB$. |
| 187 | 9e8942 | R2 | Forms the angle sum in triangle $TAB$ using “their” base angles | Form the triangle angle sum $\angle ATB + \angle TAB + \angle TBA = 180°$ using your base angles. |
| 188 | 9e8942 | AK4 | Calculates $\angle ATB = 180° - 60° - 60° = 60°$ | Subtract the two base angles from $180°$ to calculate $\angle ATB$. |
| 189 | 9e894a | CK1 | States $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Find the displacement by subtracting the position vector of $A$ from that of $B$: $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 190 | 9e894a | CK2 | Expresses $\overrightarrow{OC}=\overrightarrow{OA}+k\overrightarrow{AB}$, where $k>1$ | Write the position vector of $C$ as $\overrightarrow{OC}=\overrightarrow{OA}+k\overrightarrow{AB}$ and use $k>1$ because $C$ lies beyond $B$ on the ray. |
| 191 | 9e894a | R1 | Forms the east-coordinate equation $-5+6k=10$, using “their” $\overrightarrow{AB}$ | Use your $\overrightarrow{AB}$ to form an equation by making the east-coordinate of $\overrightarrow{OC}$ equal to the given east-coordinate of $C$. |
| 192 | 9e894a | AK2 | Solves for $k=\frac{5}{2}$ | Solve your east-coordinate equation for $k$ and write the result as a simplified fraction using $\frac{\text{numerator}}{\text{denominator}}$. |
| 193 | 9e894a | AK3 | Substitutes to obtain $\overrightarrow{OC}=\begin{pmatrix}10\\-3\end{pmatrix}$, or correct follow-through | Substitute your value of $k$ into $\overrightarrow{OC}=\overrightarrow{OA}+k\overrightarrow{AB}$ and calculate both entries of $\overrightarrow{OC}$ as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 194 | 9e894a | AK4 | Finds $\overrightarrow{BC}=\overrightarrow{OC}-\overrightarrow{OB}=\begin{pmatrix}9\\-6\end{pmatrix}$, or correct follow-through | Subtract $\overrightarrow{OB}$ from your $\overrightarrow{OC}$ to find $\overrightarrow{BC}$ as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 195 | 9e894a | CK3 | Uses $BC=\sqrt{9^2+(-6)^2}$, or correct follow-through from “their” vector | Use the two components of your $\overrightarrow{BC}$ in the distance formula $BC=\sqrt{x^2+y^2}$. |
| 196 | 9e894a | AK5 | Simplifies the distance to $3\sqrt{13}$, or correct follow-through | Factor the number inside your square root and simplify it into the form $a\sqrt{b}$. |
| 197 | 9e894a | R2 | Expresses “their” distance in surd form | Write your distance in simplified surd form, leaving no square factor inside the $\sqrt{\ }$. |
| 198 | 9e894a | R3 | Uses “their” lengths or parallel displacement vectors to obtain $AB:BC=2:3$, or correct follow-through | Use your two lengths, or compare the parallel displacement vectors, and simplify $AB:BC$ to its lowest whole-number ratio. |
| 199 | 9e894a | R4 | States that $B$ is not the midpoint because $AB\ne BC$ | Compare the lengths $AB$ and $BC$, then state that $B$ is not the midpoint when $AB\ne BC$. |
| 200 | 9e8957 | CK1 | Forms a weighted mean using the passenger numbers and their frequencies | Multiply each passenger number by its frequency, add these products, then divide by the total frequency to find the weighted mean. |
| 201 | 9e8957 | AK2 | Calculates $\sum fx = 188$ | Calculate $\sum fx$ by multiplying each passenger number by its frequency and adding all the products. |
| 202 | 9e8957 | R1 | Uses "their" sample mean as the estimated number of passengers per departure for 150 departures | Multiply your sample mean by the total number of departures to estimate the total number of passengers. |
| 203 | 9e8957 | R2 | Explains that the result is based on only some, rather than all, ferry departures | Explain that this is an estimate because the sample includes only some ferry departures, not every departure. |
| 204 | 9e8957 | CK2 | Identifies the sample mean as a sample statistic | Identify the mean calculated from the sample as a sample statistic. |
| 205 | 9e8957 | CK3 | Identifies the mean for all departures as a population parameter | Identify the mean for all ferry departures as a population parameter. |
| 206 | 9e8957 | R3 | Recognises that a random sample is likely to be representative of the population | State that a random sample is likely to represent the whole population. |
| 207 | 9e895f | CK1 | Recognises that the required point has ordinate "their" $f(0)$ | On the graph, locate the point whose ordinate equals your $f(0)$. |
| 208 | 9e895f | AK2 | Finds the midpoint of $0$ and "their" second input | Find the midpoint between $0$ and your second input. |
| 209 | 9e895f | CK2 | Recognises that $gf(0)=g(f(0))$ | Rewrite $gf(0)$ as $g(f(0))$ before evaluating it. |
| 210 | 9e895f | CK3 | Recognises that zero net gain is represented by the roots of the graph | Identify the roots of the graph as the inputs where the net gain is zero. |
| 211 | 9e895f | R3 | Uses "their" axis of symmetry to support that the two roots lie on opposite sides of it | Use your axis of symmetry to show that the two roots lie on opposite sides of it. |
| 212 | 9e8967 | CK1 | Recognises that the frequencies must total 12. | Add the frequencies and check that they equal the total frequency given in the table. |
| 213 | 9e8967 | AK1 | Subtracts the known frequencies from 12 to obtain 3. | Subtract the known frequencies from the stated total to find the missing frequency. |
| 214 | 9e8967 | CK2 | Selects the mean from the frequency distribution. | Choose the mean of the frequency distribution as the measure for the average number of bottles sold per day. |
| 215 | 9e8967 | AK2 | Calculates $\sum fx = 216$, using "their" missing frequency. | Calculate $\sum fx$ by multiplying each number of bottles by its frequency, using your missing frequency, and adding the products. |
| 216 | 9e8967 | AK3 | Divides "their" total by 12 to obtain "their" mean. | Divide your $\sum fx$ total by the total frequency to find your mean. |
| 217 | 9e8967 | CK3 | Uses "their" mean as the estimated number sold per opening day. | Use your mean as the estimated number of bottles sold on one opening day. |
| 218 | 9e8967 | AK4 | Multiplies "their" mean by 5 to estimate the number required. | Multiply your mean by the number of opening days to estimate the number of bottles required. |
| 219 | 9e8967 | R1 | Compares "their" estimated requirement with 95 bottles. | Compare your estimated requirement with the number of bottles ordered. |
| 220 | 9e8967 | R2 | Concludes that the order is enough. | Conclude that the order is enough if the number ordered is at least your estimated requirement. |
| 221 | 9e8974 | CK1 | Recognises that the pattern has a constant increase. | Compare consecutive figures and identify the same increase in matchsticks each time. |
| 222 | 9e8974 | CK2 | Identifies $3n$ as the variable part of the relationship. | Multiply the figure number by the constant increase to form the variable part. |
| 223 | 9e8974 | CK3 | Identifies the fixed term as 1. | Use the first figure to determine the fixed amount left after the variable part. |
| 224 | 9e8974 | AK3 | Substitutes $n=10$ into "their" formula. | Substitute $n=10$ into your formula and evaluate it. |
| 225 | 9e8974 | CK4 | Forms an inequality using "their" relationship and the limit of 35 matchsticks. | Use your relationship to write an inequality showing that the matchstick total cannot exceed the limit. |
| 226 | 9e8974 | AK5 | Solves "their" inequality, or calculates successive figure totals, to obtain $n\leq\frac{34}{3}$. | Rearrange your inequality until it has the form $n \leq \frac{\text{remaining matchsticks}}{\text{increase per figure}}$. |
| 227 | 9e8974 | R1 | Uses the whole-number condition to select 11 as the greatest possible figure number. | Choose the greatest whole-number figure number that satisfies your inequality. |
| 228 | 9e8974 | R2 | Shows that Figure 12 requires 37 matchsticks. | Calculate the matchsticks needed for the next figure after your chosen whole-number figure. |
| 229 | 9e8974 | R3 | Concludes that Figure 11 is greatest because 37 exceeds 35. | State that your chosen figure is greatest because the next figure exceeds the matchstick limit. |
| 230 | 9e898e | CK1 | Identifies the solid as a sphere | Identify the solid as a sphere from its one curved surface, no edges, and no vertices. |
| 231 | 9e898e | CK2 | Selects $V=\frac{4}{3}\pi r^3$ for the spherical buoy | Choose the sphere-volume formula $V=\frac{4}{3}\pi r^3$ for the buoy. |
| 232 | 9e898e | AK1 | Rearranges to obtain $r^3=\frac{3V}{4\pi}$ | Rearrange $V=\frac{4}{3}\pi r^3$ to make $r^3=\frac{3V}{4\pi}$. |
| 233 | 9e898e | AK2 | Takes the cube root to obtain $r=\sqrt[3]{\frac{3V}{4\pi}}$ | Take the cube root of $r^3=\frac{3V}{4\pi}$ to obtain $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 234 | 9e898e | AK3 | Substitutes $V=288\pi$ into "their" expression for $r$ | Substitute $V=288\pi$ into your expression for $r$ and simplify. |
| 235 | 9e898e | CK3 | Recognises that the diameter of the buoy is twice its radius | Recognise that the buoy's diameter is twice its radius. |
| 236 | 9e898e | R1 | Finds the diameter using twice "their" radius | Multiply your radius by two to find your diameter. |
| 237 | 9e898e | R2 | Compares "their" diameter with the inside diameter of the access ring | Compare your diameter with the inside diameter of the access ring. |
| 238 | 9e898e | R3 | Concludes correctly, with reason, whether the buoy will fit | State whether the buoy fits and justify your conclusion using the comparison of the two diameters. |
| 239 | 9e899b | CK1 | Identifies the angle between a tangent and a chord as equal to the angle in the alternate segment. | Use the alternate-segment theorem to set the angle between the tangent and chord equal to the angle in the opposite segment. |
| 240 | 9e899b | CK2 | Recognises that the radius is perpendicular to the tangent at $A$. | Use the fact that the radius meets the tangent at a right angle at $A$. |
| 241 | 9e899b | AK2 | Evaluates $90°-$ "their" angle from part (a). | Calculate $90°-$ your angle from part (a). |
| 242 | 9e899b | R1 | Recognises that $OA=OB$ as radii of the same circle. | State that $OA=OB$ because both are radii of the same circle. |
| 243 | 9e899b | R2 | Deduces that $\angle OBA=$ "their" $\angle OAB$. | Set $\angle OBA=\angle OAB$ because the triangle has equal radii sides. |
| 244 | 9e899b | R3 | Forms the triangle angle relationship $\angle AOB+2($ "their" $\angle OAB)=180°$. | Form $\angle AOB+2(\text{your }\angle OAB)=180°$ using the angles in triangle $AOB$. |
| 245 | 9e899b | AK3 | Substitutes "their" value from part (b) into the triangle angle relationship. | Substitute your value from part (b) into $\angle AOB+2(\angle OAB)=180°$ and solve for the remaining angle. |
| 246 | d16f03 | CK1 | Selects $15\%$ of the ticket price as the discount | Calculate the discount by finding $15\%$ of the ticket price. |
| 247 | d16f03 | AK2 | Subtracts "their" discount from \$240 | Subtract your discount from $\$240$ to find the discounted ticket price. |
| 248 | d16f03 | CK2 | Uses the discounted ticket price as the basis for sales tax | Use the discounted ticket price, not the original ticket price, as the amount on which you calculate sales tax. |
| 249 | d16f03 | AK3 | Calculates $12.5\%$ of "their" discounted ticket price | Calculate $12.5\%$ of your discounted ticket price to find the sales tax. |
| 250 | d16f03 | AK4 | Adds "their" discounted ticket price and "their" sales tax | Add your discounted ticket price and your sales tax to find the amount paid. |
| 251 | d16f03 | CK3 | Identifies net ticket income as "their" amount paid less "their" sales tax | Find the net ticket income by subtracting your sales tax from your amount paid. |
| 252 | d16f03 | R1 | Determines profit and expresses it as a percentage of the \$190 cost, using "their" values | Subtract the $\$190$ cost from your net ticket income, then express the result as a percentage of $\$190$ using your values. |
| 253 | d16f03 | R2 | Expresses "their" percentage correct to 3 significant figures | Round your percentage to 3 significant figures. |
| 254 | d16f03 | R3 | Compares "their" profit percentage with $8\%$ | Compare your profit percentage with $8\%$. |
| 255 | d16f03 | R4 | States that the requirement is not met, with a valid reason | State that the requirement is not met because your profit percentage is below $8\%$. |
| 256 | d16f10 | AK1 | Converts $8$ minutes $20$ seconds to $500$ seconds | Convert the minutes to seconds, then add the remaining seconds. |
| 257 | d16f10 | CK1 | Selects the relationship distance $=$ speed $\times$ time | Use the relationship that distance equals speed multiplied by time. |
| 258 | d16f10 | AK2 | Calculates $4.8 \times$ "their" time | Multiply $4.8$ by your converted time. |
| 259 | d16f10 | CK2 | Recognises that the lap distance is $AB+BC+CA$ | Add $AB$, $BC$, and $CA$ to represent one complete lap. |
| 260 | d16f10 | R1 | Forms $BC=$ "their" lap distance $-750-900$ | Subtract $750$ and $900$ from your lap distance to find $BC$. |
| 261 | d16f10 | CK3 | Identifies the second-day distance as $AB+BC+CB$ | Use $AB+BC+CB$ for the second-day distance. |
| 262 | d16f10 | R2 | Calculates $750+2\times$ "their" $BC$ | Calculate $750+2\times$ your value for $BC$. |
| 263 | d16f10 | R3 | Converts $7$ minutes $30$ seconds to $450$ seconds for use with metres per second | Convert the minutes to seconds and add the $30$ seconds before using metres per second. |
| 264 | d16f18 | CK1 | Recognises that corresponding entries are added | Add the entries in matching positions in the two matrices. |
| 265 | d16f18 | CK2 | Recognises that three identical days require scalar multiplication by $3$ | Multiply your one-day production matrix by $3$ to find the total for three identical days. |
| 266 | d16f18 | CK3 | Selects $P\times$ "their" three-day production matrix | Set up $P\times$ your three-day production matrix, with $P$ on the left. |
| 267 | d16f18 | AK3 | Calculates the retail entry using "their" matrix | Calculate the retail total by multiplying the price row by the first column of your matrix. |
| 268 | d16f18 | AK4 | Calculates the wholesale entry using "their" matrix | Calculate the wholesale total by multiplying the price row by the second column of your matrix. |
| 269 | d16f18 | R2 | States the orders as $2\times2$ and $1\times2$ | State the matrix orders as $2\times2$ and $1\times2$. |
| 270 | d16f18 | R3 | Explains that the inner dimensions are unequal, so the product is not defined | Compare the inner dimensions and explain that they are unequal, so the product is not defined. |
| 271 | d16f25 | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. | Calculate $\overrightarrow{AB}$ by subtracting $\overrightarrow{OA}$ from $\overrightarrow{OB}$: $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 272 | d16f25 | CK2 | Forms $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{BC}$. | Form $\overrightarrow{OC}$ by adding $\overrightarrow{OB}$ and $\overrightarrow{BC}$: $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{BC}$. |
| 273 | d16f25 | AK2 | Substitutes $\overrightarrow{BC}$ as "their" $\overrightarrow{AB}$. | Substitute your $\overrightarrow{AB}$ for $\overrightarrow{BC}$ before adding the vectors. |
| 274 | d16f25 | CK3 | Uses $\overrightarrow{AC}=\overrightarrow{OC}-\overrightarrow{OA}$. | Calculate $\overrightarrow{AC}$ by subtracting $\overrightarrow{OA}$ from $\overrightarrow{OC}$: $\overrightarrow{AC}=\overrightarrow{OC}-\overrightarrow{OA}$. |
| 275 | d16f25 | AK4 | Finds $\overrightarrow{AC}=\begin{pmatrix}8\\6\end{pmatrix}$ using "their" $\overrightarrow{OC}$. | Use your $\overrightarrow{OC}$ in $\overrightarrow{AC}=\overrightarrow{OC}-\overrightarrow{OA}$ and write the result as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 276 | d16f25 | R1 | Shows that $\overrightarrow{AC}=2\overrightarrow{AB}$ using "their" $\overrightarrow{AB}$. | Multiply your $\overrightarrow{AB}$ by $2$ and show that it equals $\overrightarrow{AC}=2\overrightarrow{AB}$. |
| 277 | d16f25 | R2 | Concludes that $A$, $B$ and $C$ are collinear because $\overrightarrow{AC}$ is a scalar multiple of $\overrightarrow{AB}$. | State that $A$, $B$ and $C$ are collinear because $\overrightarrow{AC}$ is a scalar multiple of $\overrightarrow{AB}$. |
| 278 | d16f32 | CK1 | Recognises that Figure 4 is a square arrangement with 4 rows of 4 soaps | Count the rows and the soaps in each row to recognise the square arrangement. |
| 279 | d16f32 | CK2 | Identifies the numbers of soaps as square numbers | List the soap totals and identify the pattern as square numbers. |
| 280 | d16f32 | AK2 | States $D = n^2$ | Write the rule for the number of soaps as $D = n^2$. |
| 281 | d16f32 | AK3 | Substitutes $n = 6$ into $D = n^2$ to obtain 36 | Substitute $n = 6$ into $D = n^2$ and evaluate the square. |
| 282 | d16f32 | CK3 | Identifies the discounted selling price as the amount on which sales tax is charged | Use the discounted selling price as the amount on which you calculate sales tax. |
| 283 | d16f32 | AK4 | Calculates the discounted price from "their" 36 soaps | Calculate the discounted price from your number of soaps by finding the tagged value and subtracting the discount. |
| 284 | d16f32 | AK5 | Calculates the tax-inclusive total as \$911.25, using "their" discounted price | Calculate the tax-inclusive total in $\$$ by adding the sales tax to your discounted price. |
| 285 | d16f32 | CK4 | Selects percentage profit $= \dfrac{\text{profit}}{\text{cost}} \times 100$ | Use percentage profit $= \dfrac{\text{profit}}{\text{cost}} \times 100$. |
| 286 | d16f32 | R1 | Forms $\dfrac{\text{their payment} - (36 \times 18)}{36 \times 18} \times 100$ | Form $\dfrac{\text{your payment} - (\text{number of soaps} \times 18)}{\text{number of soaps} \times 18} \times 100$ to calculate the percentage profit. |
| 287 | d16f32 | R3 | Concludes that "their" percentage profit exceeds $35\%$ | Compare your percentage profit with $35\%$ and state whether it exceeds this amount. |
| 288 | d16f3a | CK1 | Identifies that set $C$ includes the cement-only region and the intersection. | Include both the cement-only region and the overlapping region when you count set $C$. |
| 289 | d16f3a | AK1 | Adds $24 + 9$ to obtain $33$. | Add the cement-only count to the count in the overlap. |
| 290 | d16f3a | CK2 | Recognises that all four disjoint regions are included in the total number of customers. | Include all four disjoint regions when you find the total number of customers. |
| 291 | d16f3a | AK2 | Calculates the total number of customers as $24 + 16 + 9 + 11 = 60$. | Add the numbers in all four regions to calculate the total number of customers. |
| 292 | d16f3a | R1 | Forms the percentage calculation using "their" number who ordered cement over the total number of customers. | Divide your number who ordered cement by your total number of customers, then multiply by $100$. |
| 293 | d16f3a | AK3 | Evaluates $\frac{33}{60}\times100$ to obtain $55\%$. | Evaluate $\frac{\text{your cement total}}{\text{your customer total}}\times100$ and write the result using $\%$. |
| 294 | d16f3a | CK3 | Recognises that an amount equal to $55\%$ satisfies the condition “at least $55\%$”. | Treat a percentage equal to the required percentage as meeting an at-least requirement, written using $\%$. |
| 295 | d16f3a | R2 | Compares "their" percentage with the required $55\%$ and identifies that they are equal. | Compare your percentage with the required percentage and state that they are equal, using $\%$ correctly. |
| 296 | d16f3a | R3 | States that the delivery will be arranged from the comparison with the requirement. | Use your comparison with the requirement to state whether the delivery is arranged. |
| 297 | d16f3a | AK4 | Calculates the difference between "their" percentage and $55\%$ as $0$ percentage points. | Subtract the required percentage from your percentage to find the difference in percentage points, using $\%$. |
| 298 | d16f47 | CK1 | Recognises that the square root is removed by squaring both sides | Square both sides to remove the square root. |
| 299 | d16f47 | AK1 | Divides both sides by $2\pi$ | Divide both sides of the equation by $2\pi$. |
| 300 | d16f47 | AK2 | Squares and rearranges to obtain $l = \frac{gT^2}{4\pi^2}$ | Square the equation and rearrange it to make $l = \frac{gT^2}{4\pi^2}$ the subject. |
| 301 | d16f47 | CK2 | Substitutes $T = 2.50$ and $g = 9.8$ into "their" expression for $l$ | Substitute $T = 2.50$ and $g = 9.8$ into your expression for $l$. |
| 302 | d16f47 | AK3 | Evaluates $\frac{2.50}{2\pi}$ correctly | Evaluate $\frac{2.50}{2\pi}$ accurately before continuing. |
| 303 | d16f47 | AK4 | Squares and multiplies by $9.8$ to obtain "their" length | Square your result and multiply by $9.8$ to find your length. |
| 304 | d16f47 | R1 | Expresses "their" length correct to $3$ significant figures | Round your length to $3$ significant figures and include the unit. |
| 305 | d16f47 | CK3 | Identifies $1.60\text{ m}$ as the maximum permitted length | Use $1.60\text{ m}$ as the maximum permitted length. |
| 306 | d16f47 | R2 | Compares "their" calculated length with $1.60\text{ m}$ | Compare your calculated length with $1.60\text{ m}$ using an inequality. |
| 307 | d16f47 | R3 | States a correct fitting decision consistent with "their" comparison | State whether the pendulum fits, using the result of your comparison. |
| 308 | d16f4f | CK1 | Recognises that total mass is sample mean multiplied by number of packets | Multiply the sample mean mass by the number of packets to find the total mass. |
| 309 | d16f4f | R1 | Forms $6 \times 1.95$ | Calculate $6 \times 1.95$. |
| 310 | d16f4f | R2 | Identifies packet F as the difference between the total mass and the masses of the other five packets | Find packet F's mass by subtracting the masses of the other five packets from the total mass. |
| 311 | d16f4f | AK2 | Adds the five known masses to obtain $9.5$ kg | Add the five known packet masses. |
| 312 | d16f4f | R3 | Forms "their" total mass minus $9.5$ | Subtract the sum of the five known masses from your total mass. |
| 313 | d16f4f | CK2 | Identifies the mean from the six packets as a sample statistic | Classify the mean from the six selected packets as a sample statistic. |
| 314 | d16f4f | CK3 | Identifies the mean for all 240 packets as a population parameter | Classify the mean for all 240 packets as a population parameter. |
| 315 | d16f57 | CK1 | Identifies that the $y$-intercept is on the $y$-axis | Locate the point where the line crosses the $y$-axis. |
| 316 | d16f57 | R1 | Reads the intercept coordinate as $(0,12)$ | Read and write the coordinate of the point where the line crosses the $y$-axis. |
| 317 | d16f57 | CK2 | Recognises that $y=0$ represents no bibs remaining | Set $y=0$ to represent the point when no bibs remain. |
| 318 | d16f57 | AK1 | Calculates $12\div2=6$ | Divide the initial number of bibs by the number given to each team. |
| 319 | d16f57 | R2 | Interprets 6 as the greatest number of teams which can collect bibs | State that this result is the greatest number of teams that can collect bibs. |
| 320 | d16f57 | R3 | Uses "their" greatest number of teams for the new arrangement | Use your greatest number of teams when planning the new arrangement. |
| 321 | d16f57 | AK2 | Divides 18 by "their" number of teams | Divide the new total number of bibs by your number of teams. |
| 322 | d16f57 | CK3 | Forms a decreasing relationship from 18 initial bibs and "their" number given to each team | Start with the initial number of bibs and subtract your bibs-per-team amount for each team. |
| 323 | d16f57 | AK4 | Substitutes "their" number of bibs per team as the coefficient of $x$ | Use your bibs-per-team amount as the negative coefficient of $x$ in the equation. |
| 324 | d16f57 | AK5 | Rearranges to $y=-3x+18$ using "their" value | Rearrange your equation into slope-intercept form using your bibs-per-team value. |
| 325 | d16f57 | R4 | Expresses "their" equation in the form $y=mx+c$ | Write your equation in the form $y=mx+c$. |
| 326 | d16f5f | CK1 | Identifies that the angle at the centre is twice the angle at the circumference on the same arc | Use the fact that the angle at the centre is twice the angle at the circumference on the same arc. |
| 327 | d16f5f | AK1 | Calculates $2 \times 35 = 70°$ | Calculate $2 \times 35$ to find the central angle. |
| 328 | d16f5f | CK2 | Recognises $OA = OB$ as radii of the circle | Recognise that $OA = OB$ because both are radii of the circle. |
| 329 | d16f5f | AK2 | Uses $\bigl(180 - \text{their }\angle AOB\bigr) \div 2$ to obtain $55°$ | Calculate $\bigl(180 - \text{your }\angle AOB\bigr) \div 2$ to find the base angle. |
| 330 | d16f5f | CK3 | Recognises that a tangent is perpendicular to the radius at the point of contact | Use the fact that a tangent is perpendicular to the radius at the point of contact. |
| 331 | d16f5f | AK3 | Calculates $90 - \text{their }\angle OAB = 35°$ | Calculate $90 - \text{your }\angle OAB$ to find the angle between the chord and the tangent. |
| 332 | d16f5f | R1 | States that tangents from external point $T$ are equal | State that the tangents from external point $T$ are equal. |
| 333 | d16f5f | R2 | Infers that $\angle TBA$ equals their $\angle BAT$ in isosceles triangle $ABT$ | Set $\angle TBA$ equal to your $\angle BAT$ because triangle $ABT$ is isosceles. |
| 334 | d16f5f | R3 | Forms the angle sum $\angle ATB = 180° - 2(\text{their }\angle BAT)$ | Form $\angle ATB = 180° - 2(\text{your }\angle BAT)$ to find the angle at $T$. |
| 335 | d16f6c | CK1 | Identifies $fg(0)$ as $f(g(0))$ | Rewrite $fg(0)$ as $f(g(0))$ before evaluating it. |
| 336 | d16f6c | AK1 | Evaluates $g(0)$ as $2$ | Substitute the input into $g$ and simplify to find the output. |
| 337 | d16f6c | R1 | Recognises that the given height has two possible time values | Look for both points where the horizontal height line meets the curve, since one height can occur at two times. |
| 338 | d16f6c | AK3 | Reads one time value, $2$, from the graph for height "their" answer to (a) | Draw a horizontal line at the height given by your answer to (a) and read one intersection time from the graph. |
| 339 | d16f6c | AK4 | Reads the other time value, $4$, from the graph for height "their" answer to (a) | Read the time at the other intersection of the horizontal line for your answer to (a) with the graph. |
| 340 | d16f6c | R2 | Finds the midpoint of "their" two time values | Add your two time values and divide by two to find the midpoint. |
| 341 | d16f6c | CK2 | States the axis of symmetry as the vertical-line equation $x=3$ | Write the midpoint as a vertical-line equation in the form $x=\ldots$. |
| 342 | d16f6c | CK3 | Identifies "their" two values from (b) as the limiting times of the permitted display | Use your two times from (b) as the start and end limits of the permitted display. |
| 343 | d16f74 | AK1 | Calculates $11-5=6$. | Subtract the earlier cumulative frequency from the next cumulative frequency to find the missing frequency. |
| 344 | d16f74 | AK2 | Calculates $20-11=9$. | Subtract the earlier cumulative frequency from the next cumulative frequency to find the missing frequency. |
| 345 | d16f74 | AK3 | Calculates $26-20=6$. | Subtract the earlier cumulative frequency from the next cumulative frequency to find the missing frequency. |
| 346 | d16f74 | R1 | Gives the greatest frequency, 9, as the reason for the modal interval. | Use the greatest frequency to justify your choice of modal interval. |
| 347 | d16f74 | CK2 | Selects 'their' frequencies for the two relevant intervals, out of 30 students. | Select your frequencies for the two relevant intervals from your completed table and use the total number of students. |
| 348 | d16f74 | AK4 | Calculates $\frac{15}{30}\times100=50\%$, following through on 'their' frequencies. | Calculate the percentage from your selected frequencies using $\frac{\cdots}{\cdots}\times100\%$. |
| 349 | d16f74 | R2 | States that the conclusion is not supported. | State that the conclusion is not supported. |
| 350 | d16f74 | R3 | Explains that 'their' 50% represents half, not more than half. | Explain that your percentage represents half of the students, not more than half. |
| 351 | d16f7c | CK1 | Selects the volume formula for a sphere | Choose the sphere volume formula $V=\frac{4}{3}\pi r^3$. |
| 352 | d16f7c | AK1 | Rearranges to obtain $r^3=\frac{3V}{4\pi}$ | Rearrange $V=\frac{4}{3}\pi r^3$ by isolating $r^3$ to get $r^3=\frac{3V}{4\pi}$. |
| 353 | d16f7c | AK2 | Takes the cube root to make $r$ the subject | Take the cube root of both sides so that $r$ is the subject. |
| 354 | d16f7c | R1 | Expresses the subject correctly in exact form | Write the radius exactly as $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 355 | d16f7c | AK3 | Substitutes $V=288\pi$ into the formula using "their" rearrangement | Substitute $V=288\pi$ into your rearranged formula before simplifying. |
| 356 | d16f7c | CK2 | Recognises that the diameter is twice the radius | Find the diameter by multiplying the radius by $2$. |
| 357 | d16f7c | R2 | Concludes that the ball will not pass through the opening | State whether the ball passes through the opening after comparing its size with the opening width. |
| 358 | d16f7c | R3 | Compares "their" diameter with the limiting width of $10$ cm | Compare your diameter with the limiting width of $10$ cm. |
| 359 | d16f7c | R4 | Explains that the ball must fit across the shorter side of the rectangular opening | Explain that the ball must fit across the shorter side of the rectangular opening. |
| 360 | d16f89 | CK1 | States $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Write the displacement as $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 361 | d16f89 | AK1 | Subtracts the vector components to obtain $\begin{pmatrix}4\\3\end{pmatrix}$ | Subtract the corresponding components and write the result as a column vector $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 362 | d16f89 | CK2 | Interprets the condition as $\overrightarrow{BC}=2\overrightarrow{AB}$ | Translate twice the magnitude in the same direction into $\overrightarrow{BC}=2\overrightarrow{AB}$. |
| 363 | d16f89 | AK2 | Calculates $2\times$ “their” $\overrightarrow{AB}$ | Multiply each component of your earlier $\overrightarrow{AB}$ by $2\times$ to find $\overrightarrow{BC}$. |
| 364 | d16f89 | AK3 | Adds “their” $\overrightarrow{BC}$ to $\overrightarrow{OB}$ to obtain $\begin{pmatrix}9\\11\end{pmatrix}$ | Add your earlier $\overrightarrow{BC}$ component by component to $\overrightarrow{OB}$ and write $\overrightarrow{OC}$ as $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 365 | d16f89 | CK3 | Uses midpoint relationship $\overrightarrow{OD}=2\overrightarrow{OB}-\overrightarrow{OC}$ | Use the midpoint fact to write $\overrightarrow{OD}=2\overrightarrow{OB}-\overrightarrow{OC}$. |
| 366 | d16f89 | AK4 | Substitutes $\overrightarrow{OB}$ and “their” $\overrightarrow{OC}$ to obtain $\begin{pmatrix}-7\\-1\end{pmatrix}$ | Substitute $\overrightarrow{OB}$ and your earlier $\overrightarrow{OC}$ into the midpoint equation, then simplify to $\begin{pmatrix}\text{horizontal component}\\\text{vertical component}\end{pmatrix}$. |
| 367 | d16f89 | R2 | Finds $\overrightarrow{DA}$ using “their” $\overrightarrow{OD}$ and $\overrightarrow{OA}$ | Find $\overrightarrow{DA}$ by subtracting your earlier $\overrightarrow{OD}$ from $\overrightarrow{OA}$. |
| 368 | d16f89 | R3 | Identifies $\overrightarrow{DA}$, “their” $\overrightarrow{AB}$ and “their” $\overrightarrow{BC}$ as scalar multiples in the same direction | Compare $\overrightarrow{DA}$ with your earlier $\overrightarrow{AB}$ and $\overrightarrow{BC}$, then state that each is a scalar multiple pointing in the same direction. |
| 369 | d16f91 | AK1 | Substitutes $3$ in $f(x)=2x+1$, giving $7$ | Substitute the given input into $f(x)=2x+1$ and simplify. |
| 370 | d16f91 | CK1 | Recognises that the trial condition is $g(f(3))=16$ | Use the stated trial condition by writing $g(f(3))=16$. |
| 371 | d16f91 | AK2 | Substitutes "their" value of $f(3)$ into $g$, giving $7k+2=16$ | Put your result for $f(3)$ into $g$ and set it equal to the trial output before forming an equation in $k$. |
| 372 | d16f91 | AK3 | Solves for $k=2$ | Rearrange your equation to isolate $k$. |
| 373 | d16f91 | CK2 | Recognises that $gf(x)=g(f(x))$ | Rewrite $gf(x)$ as $g(f(x))$ before simplifying. |
| 374 | d16f91 | AK4 | Evaluates $g(f(x))=2(2x+1)+2=4x+4$ | Substitute $f(x)$ into $g$ and expand to obtain the composite expression. |
| 375 | d16f91 | R1 | Forms the tank inequality using "their" composite function: $4x+4\le16$ | Use your composite function and the tank's maximum capacity to write an inequality using $\le$. |
| 376 | d16f91 | CK3 | Recognises that $x$ is restricted to non-negative whole-number values | Restrict $x$ to non-negative whole-number values. |
| 377 | d16f91 | R2 | Reads the boundary intersection as $x=3$ | Read the $x$-coordinate where the shaded boundary meets the tank-capacity line. |
| 378 | d16f91 | R3 | States the allowable discrete values as $\{0,1,2,3\}$ | List the non-negative whole-number $x$-values from zero up to the point where the shaded region reaches the tank-capacity line, writing them as a set. |
| 379 | d16f9e | CK1 | Recognises that the discount is $10\%$ of the marked cost. | Find the discount by calculating $10\%$ of the marked cost. |
| 380 | d16f9e | CK2 | Identifies the discounted cost as \$1 500 less "their" discount. | Subtract your discount from \$1 500 to get the discounted cost. |
| 381 | d16f9e | CK3 | Identifies profit as sales revenue less total cost. | Find profit by subtracting total cost from sales revenue. |
| 382 | d16f9e | AK3 | Calculates the sales revenue as \$2 100. | Multiply the number of items sold by the selling price per item to calculate the sales revenue. |
| 383 | d16f9e | AK4 | Calculates total cost using \$1 500 less "their" discount plus "their" sales tax. | Calculate total cost by subtracting your discount from \$1 500 and then adding your sales tax. |
| 384 | d16f9e | R1 | Subtracts "their" total cost from "their" sales revenue. | Subtract your total cost from your sales revenue. |
| 385 | d16fb5 | CK1 | Recognises that the angle at the centre is twice the angle at the circumference on arc $AB$ | Identify arc $AB$ and use the fact that the angle at the centre is twice the angle at the circumference standing on that arc. |
| 386 | d16fb5 | AK1 | Calculates $2\times58=116°$ | Double the given angle by calculating $2\times58$. |
| 387 | d16fb5 | CK2 | States that $OA=OB$ as radii of the target | State that $OA=OB$ because both are radii of the circle. |
| 388 | d16fb5 | AK2 | Finds the remaining angles in triangle $OAB$: $180°-\text{their }116°=64°$ | Subtract your central angle from $180°$, writing $180°-\text{your central angle}$, to find the two base angles together. |
| 389 | d16fb5 | R1 | Uses equal base angles to obtain $\frac{64°}{2}=32°$ | Divide your remaining angle total equally between the two base angles using $\frac{\text{your remaining angle total}}{2}$. |
| 390 | d16fb5 | CK3 | Recognises that a radius is perpendicular to a tangent at the point of contact | Use the fact that a radius is perpendicular to a tangent at the point where the tangent touches the circle. |
| 391 | d16fb5 | AK3 | Forms $\angle PAB=90°-\text{their }\angle OAB$ | Find $\angle PAB$ by calculating $90°-\text{your }\angle OAB$. |
| 392 | d16fb5 | CK4 | States that $PA=PB$ because tangents from an external point are equal | State that $PA=PB$ because tangents from the same external point are equal. |
| 393 | d16fb5 | R2 | Uses equal tangents to set $\angle PBA$ equal to "their" $\angle PAB$ | Set $\angle PBA$ equal to your $\angle PAB$ because the tangents are equal. |
| 394 | d16fb5 | R3 | Applies the angle sum of triangle $PAB$: $180°-2(\text{their }58°)$ | Use the angle sum of triangle $PAB$ by calculating $180°-2(\text{your }\angle PAB)$. |
| 395 | d16fbd | CK1 | Forms the total number of children using frequency multiplied by number of children | Multiply each number of children by its frequency, then add the products. |
| 396 | d16fbd | AK1 | Obtains total number of children, $72$ | Calculate the total number of children from your frequency products. |
| 397 | d16fbd | R1 | Relates the sample of $30$ households to the population of $300$ households | Compare the sample of $30$ households with the population of $300$ households to find the scale factor. |
| 398 | d16fbd | AK3 | Multiplies "their" sample mean by $300$ | Multiply your sample mean by $300$ to estimate the total number of children in the population. |
| 399 | d16fbd | CK2 | Identifies the mean from the sample as a statistic | Label the mean calculated from the sample as a statistic. |
| 400 | d16fbd | CK3 | Identifies the mean from all households as a parameter | Label the mean calculated from all households as a parameter. |
| 401 | d16fbd | R2 | States that the selected households may not be representative of all households | State that the selected households may not represent all the households in the population. |
| 402 | d16fbd | R3 | Explains that the sample mean can differ from the population mean | Explain that the sample mean may differ from the population mean because the sample is only part of the population. |
| 403 | d16fca | CK1 | Recognises that $r^3$ must be isolated before finding $r$ | Isolate $r^3$ before you take the cube root to find $r$. |
| 404 | d16fca | AK1 | Obtains $r^3=\dfrac{3V}{4\pi}$ | Multiply by $3$, then divide by $4\pi$, to obtain $r^3=\dfrac{3V}{4\pi}$. |
| 405 | d16fca | CK2 | Substitutes $V=288\pi$ into the expression for $r$ | Replace $V$ with $288\pi$ in $r=\sqrt[3]{\dfrac{3V}{4\pi}}$ and simplify. |
| 406 | d16fca | CK3 | Uses diameter $=2r$ | Find the diameter by using $\text{diameter}=2r$. |
| 407 | d16fca | R1 | Compares "their" diameter with $12.5\text{ cm}$ | Compare your diameter with $12.5\text{ cm}$. |
| 408 | d16fca | R2 | Uses the inclusive condition that the diameter is no more than $12.5\text{ cm}$ | Check that your diameter is no more than $12.5\text{ cm}$, including the case where it is equal. |
| 409 | d16fca | R3 | Concludes that the coconut will fit | State whether the coconut will fit in the crate from your comparison. |
| 410 | d16fd7 | CK1 | Recognises that the total route is the sum of the three labelled sides | Add the three labelled side lengths to find the total route distance. |
| 411 | d16fd7 | CK2 | Uses $t = d \div s$ | Use $t = d \div s$ to calculate the duration. |
| 412 | d16fd7 | AK2 | Divides "their" total distance by $1200$ | Divide your total distance by $1200$ to find the duration. |
| 413 | d16fd7 | AK3 | Multiplies "their" duration by \$30 | Multiply your duration by \$30 to find the usual charge. |
| 414 | d16fd7 | R1 | Finds the discount by subtracting \$54 from "their" usual charge | Subtract \$54 from your usual charge to find the discount. |
| 415 | d16fd7 | R2 | Expresses "their" discount as a fraction of "their" usual charge | Write your discount as a fraction of your usual charge. |
| 416 | d16fdf | CK1 | Forms the revenue expression $27x$. | Write revenue as the selling price multiplied by the number of crates, $x$. |
| 417 | d16fdf | CK2 | Equates revenue to total cost, $27x=120+15x$. | Set your revenue expression equal to the total-cost expression for the no-profit situation. |
| 418 | d16fdf | AK1 | Collects the $x$-terms to obtain $12x=120$. | Move the $x$-terms to one side of the equation and the constant term to the other side. |
| 419 | d16fdf | AK2 | Divides by 12. | Divide both sides by the coefficient of $x$ to find the break-even number of crates. |
| 420 | d16fdf | CK3 | Recognises that each crate above "their" break-even number gives \$12 profit. | Find the profit from each crate sold after your break-even number by subtracting the cost per crate from the selling price. |
| 421 | d16fdf | AK4 | Finds $18-$ "their" break-even number of additional crates. | Subtract your break-even number from the maximum number of crates shown on the number line. |
| 422 | d16fdf | CK4 | Forms an inequality for a profit of at least \$120, using "their" break-even number. | Write an inequality for profit being at least the target amount, using your break-even number. |
| 423 | d16fdf | R1 | Determines the least required number of crates as $20$, or follows through correctly from "their" inequality. | Solve your inequality to find the least number of crates required. |
| 424 | d16fdf | R2 | Compares the required number of crates with the maximum shown on the number line, or compares "their" greatest profit with \$120. | Compare your required number of crates with the maximum shown on the number line, or compare your greatest profit with \$120. |
| 425 | d16fdf | R3 | Concludes that the target cannot be achieved, with a valid supporting reason. | State whether the target is possible and support your conclusion by referring to the maximum capacity or your greatest profit. |
| 426 | d16fe7 | CK1 | States that the cuboid has 4 vertical edges | Count the edges that run straight up and down on the cuboid. |
| 427 | d16fe7 | CK2 | Recognises that each vertical edge has length $25\text{ cm}$ | Read the measurement shown on one vertical edge and write it in $\text{cm}$. |
| 428 | d16fe7 | CK3 | Recognises that there are 4 edges of length $60\text{ cm}$ and 4 edges of length $40\text{ cm}$ | Identify the horizontal edges in each of the two labelled directions, recording how many have each length in $\text{cm}$. |
| 429 | d16fe7 | AK2 | Calculates $4(60+40)$ for the horizontal edges | Calculate $4(60+40)$ to find the total length of the horizontal edges. |
| 430 | d16fe7 | AK3 | Adds "their" vertical-edge total to obtain $500\text{ cm}$ | Add your vertical-edge total to the horizontal total, keeping the result in $\text{cm}$. |
| 431 | d16fe7 | AK4 | Divides "their" total metres by 2 | Divide your total length in metres by the length of one piece of edging. |
| 432 | d16fe7 | R2 | Rounds "their" quotient up to 3 complete lengths | Round your quotient up because you must buy whole lengths of edging. |
| 433 | d16fe7 | R3 | Explains that 2 complete lengths provide only $4\text{ m}$ and are insufficient | Compare the length supplied by two complete pieces with your required total and state why it is insufficient, using $\text{m}$. |
| 434 | d16ff4 | AK1 | Adds 4 to obtain 18 seedlings for bed 4 | Add the common increase to the seedling total in the preceding bed to calculate the total for bed 4. |
| 435 | d16ff4 | AK2 | Adds 4 to "their" bed-4 total to obtain 22 seedlings | Add the same common increase to your bed-4 total to calculate the total for bed 5. |
| 436 | d16ff4 | CK1 | Identifies a common difference of 4 | Subtract consecutive seedling totals to identify the constant difference in the sequence. |
| 437 | d16ff4 | CK2 | Recognises that each term is 2 more than a multiple of 4 | Compare each total with the relevant multiple of $4$ and identify the fixed excess. |
| 438 | d16ff4 | CK3 | Forms an equation by substituting $D = 102$ into "their" expression | Substitute $D = 102$ into your expression and form an equation in $n$. |
| 439 | d16ff4 | AK4 | Solves "their" equation to obtain $n = 25$ | Rearrange your equation step by step until $n$ is isolated. |
| 440 | d16ff4 | R1 | Applies "their" expression to test whether $D = 100$ | Use your expression with $D = 100$ and solve for $n$ to test whether the total can occur. |
| 441 | d16ff4 | R2 | Obtains $n = 24.5$ from "their" equation | Solve your equation for $n$ and keep the fractional result you obtain. |
| 442 | d16ff4 | R3 | Concludes that 100 is not possible because a bed number must be a natural number | Conclude that the stated seedling total is impossible because the bed number you obtain is not a natural number. |
| 443 | d16ffc | CK1 | Uses $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Calculate the displacement using $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 444 | d16ffc | AK1 | Subtracts corresponding components to obtain $\begin{pmatrix}5\\3\end{pmatrix}$ | Subtract the corresponding components and write the result as $\begin{pmatrix}\text{horizontal component}\\text{vertical component}\end{pmatrix}$. |
| 445 | d16ffc | CK2 | Recognises $\overrightarrow{BC}=\overrightarrow{AB}$ | Use the repeated displacement to write $\overrightarrow{BC}=\overrightarrow{AB}$. |
| 446 | d16ffc | R1 | Forms $\overrightarrow{OC}=\overrightarrow{OB}+$ 'their' $\overrightarrow{AB}$ | Add your $\overrightarrow{AB}$ to $\overrightarrow{OB}$ to form $\overrightarrow{OC}=\overrightarrow{OB}+\overrightarrow{AB}$. |
| 447 | d16ffc | AK2 | Adds components to obtain $\begin{pmatrix}6\\7\end{pmatrix}$ | Add the corresponding components and write the result as $\begin{pmatrix}\text{horizontal component}\\text{vertical component}\end{pmatrix}$. |
| 448 | d16ffc | AK3 | Finds $\overrightarrow{AC}$ by subtracting $\overrightarrow{OA}$ from 'their' $\overrightarrow{OC}$ | Find $\overrightarrow{AC}$ by subtracting $\overrightarrow{OA}$ from your $\overrightarrow{OC}$. |
| 449 | d16ffc | AK4 | Obtains $\begin{pmatrix}10\\6\end{pmatrix}$ | Complete the component subtraction and write $\overrightarrow{AC}$ as $\begin{pmatrix}\text{horizontal component}\\text{vertical component}\end{pmatrix}$. |
| 450 | d16ffc | R2 | Identifies $B$ as the midpoint of $AC$ | State that $B$ is the midpoint of $AC$. |
| 451 | d16ffc | R3 | Justifies the midpoint using $\overrightarrow{AB}=\overrightarrow{BC}$ | Justify the midpoint by showing that $\overrightarrow{AB}=\overrightarrow{BC}$. |
| 452 | d17004 | CK1 | Recognises that the angles in the pie chart total $360°$. | Use the fact that the sector angles in a pie chart add to $360°$. |
| 453 | d17004 | R1 | Forms $2x+(x+12)+48+120=360$. | Set the sum of all four sector-angle expressions equal to the full angle of a circle. |
| 454 | d17004 | AK1 | Solves the equation to obtain $x=60$. | Collect the $x$ terms, isolate the term containing $x$, and divide by its coefficient. |
| 455 | d17004 | CK2 | Identifies the tank sector as $2x=120°$. | Use the sector labelled $2x$ for the tanks and substitute your value of $x$. |
| 456 | d17004 | AK2 | Calculates the fraction as $120/360=1/3$. | Divide the tank-sector angle by $360°$ to calculate its fraction of the whole. |
| 457 | d17004 | R2 | Expresses the fraction in lowest terms. | Simplify your fraction by dividing the numerator and denominator by the same common factor. |
| 458 | d17004 | CK3 | Recognises that $75$ represents one-third of the households. | Treat the stated number of households as the one-third portion of the total surveyed. |
| 459 | d17004 | AK3 | Calculates the total as $75\div(1/3)=225$. | Divide the given one-third household count by $\frac{1}{3}$ to find the total number surveyed. |
| 460 | d17004 | CK4 | Identifies the tank and rain-barrel sectors as the relevant sectors. | Select both the tank sector and the rain-barrel sector because either method includes households using either one. |
| 461 | d17004 | AK4 | Finds their combined angle as $120°+72°=192°$. | Find the rain-barrel angle from $x+12$ and add it to the tank angle. |
| 462 | d17004 | AK5 | Calculates $(192/360)\times225=120$ households. | Multiply the combined-sector fraction of $360°$ by the total number surveyed. |
| 463 | d17004 | R3 | Concludes that the standpipe will be built because $120<125$. | Compare your household total with the stated cutoff and state that the standpipe is built when it is below that cutoff. |
| 464 | d17011 | CK1 | Forms $gf(x)$ as $M-f(x)$ using "their" maximum value | Use your maximum value to write $gf(x)$ as that value minus $f(x)$. |
| 465 | d17011 | AK1 | Substitutes $-x^2+6x$ for $f(x)$ | Replace $f(x)$ with the given function rule before you simplify $gf(x)$. |
| 466 | d17011 | AK2 | Simplifies to $x^2-6x+9$, or equivalent | Remove the brackets carefully and collect like terms to simplify the quadratic expression. |
| 467 | d17011 | CK2 | Forms the inequality $gf(x)\leq4$ | Write the condition that $gf(x)$ is no greater than the stated vertical-distance limit. |
| 468 | d17011 | AK3 | Solves $x^2-6x+9=4$ to obtain one boundary value, $1$ or $5$ | Set your quadratic expression equal to the stated limit and solve for one boundary value of $x$. |
| 469 | d17011 | AK4 | Obtains both boundary values $x=1$ and $x=5$ using "their" quadratic expression | Use your quadratic expression to find both boundary values of $x$. |
| 470 | d1701e | CK1 | Recognises that the seven regions inside the three sets represent passengers who used at least one mode of transport | Add the numbers in all seven regions inside the three circles to find the passengers who used at least one mode of transport. |
| 471 | d1701e | CK2 | Recognises that the total number of passengers is "their" union plus the outside region | Combine your union total with the number outside all three circles to represent all passengers. |
| 472 | d1701e | AK2 | Subtracts "their" union from 150 | Subtract your union total from 150 to find the number outside the circles. |
| 473 | d1701e | CK3 | Identifies the minibus-only region and the outside region as passengers who used neither a bus nor a taxi | Select the minibus-only region and the region outside all three circles, since neither is in the bus or taxi sets. |
| 474 | d1701e | AK3 | Calculates $18+$ "their" $x$ | Add $18$ to your $x$ value to find the passengers who used neither a bus nor a taxi. |
| 475 | d1701e | AK4 | Divides "their" number of passengers by 8 | Divide your number of passengers by 8 to find how many shuttles are needed. |
| 476 | d1701e | R2 | Recognises that a fractional number of shuttles requires a further whole shuttle | Round any fractional shuttle result up to the next whole shuttle, because you cannot use part of a shuttle. |
| 477 | d17038 | CK1 | Identifies that the $y$-intercept occurs when $x=0$ | Set $x=0$ to locate the $y$-intercept. |
| 478 | d17038 | R1 | Reads the coordinate $(0,12)$ from the graph | Read the coordinate where the line crosses the vertical axis. |
| 479 | d17038 | CK2 | Recognises that the $y$-intercept is the constant term in the linear equation | Use the constant term as the $y$-intercept in a linear equation. |
| 480 | d17038 | AK1 | Forms $B=-2x+12$ using "their" $y$-intercept | Substitute the gradient and your $y$-intercept into $B=mx+c$ to form your equation. |
| 481 | d17038 | CK3 | Identifies that $B=0$ at the $x$-intercept | Set $B$ to zero to locate the $x$-intercept. |
| 482 | d17038 | AK2 | Substitutes $B=0$ into "their" equation | Substitute $B=0$ into your equation before solving for $x$. |
| 483 | d17038 | AK3 | Solves the resulting equation to obtain $x=6$ | Rearrange the resulting equation and solve for $x$. |
| 484 | d17038 | R2 | Uses "their" initial balance as the change from the balance to zero | Use your initial balance as the total decrease needed to reach zero. |
| 485 | d17038 | AK5 | Calculates the second gradient as $-12\div4=-3$ | Calculate the second gradient by dividing the change in balance by the change in time. |
| 486 | d17038 | R3 | Concludes that the second line is steeper | Identify the second line as steeper after comparing its gradient with the original gradient. |
| 487 | d17038 | R4 | Justifies the comparison using the magnitudes of the gradients or the shorter time to clear the same balance | Compare the magnitudes of the gradients, or compare which arrangement clears the same balance in less time. |
| 488 | d1704a | CK1 | Recognises that each radius is perpendicular to its tangent. | Use the fact that a radius meets a tangent at a right angle at both points of contact. |
| 489 | d1704a | R1 | Forms the angle sum in quadrilateral $OADB$: $\angle AOB+90+104+90=360$. | Write the interior-angle equation for quadrilateral $OADB$, including $\angle AOB$ and the three known angles. |
| 490 | d1704a | AK1 | Evaluates $360-284$. | Subtract $284$ from $360$ to find the central angle. |
| 491 | d1704a | CK2 | Uses the fact that the angle at the centre is twice the angle at the circumference on the same arc. | Use the theorem that the angle at the centre is twice the angle at the circumference on the same arc. |
| 492 | d1704a | AK3 | Divides “their” $\angle AOB$ by $2$. | Divide your earlier $\angle AOB$ by $2$ to find the angle at the circumference. |
| 493 | d1704a | R2 | Judges the statement correct using “their” angle $ACB$. | Judge the statement correct by comparing your earlier angle $ACB$ with the angle between the tangent and chord. |
| 494 | d1704a | CK3 | States the tangent-chord theorem. | State that the angle between a tangent and a chord equals the angle in the alternate segment. |
| 495 | d1704a | R3 | Relates the angle between tangent $DA$ and chord $AB$ to the angle in the alternate segment, $\angle ACB$. | Set the angle between tangent $DA$ and chord $AB$ equal to $\angle ACB$ in the alternate segment. |
| 496 | d17052 | CK1 | Recognises that the radius is one half of the diameter | Use the fact that the radius is half the diameter. |
| 497 | d17052 | AK1 | Calculates $8\div2=4$ | Divide the given diameter using $8\div2$ to find the radius. |
| 498 | d17052 | CK2 | Identifies that $r^3$ must be isolated before finding $r$ | Rearrange the volume formula until $r^3$ is isolated before taking a cube root. |
| 499 | d17052 | AK2 | Rearranges correctly to obtain $r=\sqrt[3]{\frac{3V}{4\pi}}$ | Rearrange the formula to make $r$ the subject: $r=\sqrt[3]{\frac{3V}{4\pi}}$. |
| 500 | d17052 | CK3 | Recognises that the capacity gives $V=250$ | Use the stated capacity by setting $V=250$. |

## Batch 5 — approved (500 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 500 rows. Rows 13, 487 and 490 rewritten to the step without the answer.

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | d17052 | AK3 | Substitutes $250$ into "their" expression for $r$ | Substitute $250$ for $V$ in your expression for $r$. |
| 2 | d17052 | AK4 | Evaluates $\sqrt[3]{\frac{3(250)}{4\pi}}$ | Evaluate $\sqrt[3]{\frac{3(250)}{4\pi}}$ using your calculator. |
| 3 | d17052 | R1 | Expresses "their" radius correct to 3 significant figures | Write your radius correct to 3 significant figures. |
| 4 | d17052 | R2 | Compares "their" required radius with "their" greatest possible radius | Compare your required radius with your greatest possible radius using an inequality. |
| 5 | d17052 | R3 | Concludes correctly that the tank fits | Use your comparison to state whether the tank fits between the supports. |
| 6 | d1705a | CK1 | States $\vec{AB}=\vec{OB}-\vec{OA}$ | Find the displacement by subtracting $\vec{OA}$ from $\vec{OB}$, writing $\vec{AB}=\vec{OB}-\vec{OA}$. |
| 7 | d1705a | AK1 | Subtracts corresponding components to obtain $\begin{pmatrix}6\\-2\end{pmatrix}$ | Subtract the corresponding components carefully and write the resulting vector as $\begin{pmatrix}\cdots\\\cdots\end{pmatrix}$. |
| 8 | d1705a | CK2 | Forms $\vec{BC}=2\times$ "their" $\vec{AB}$ | Use your earlier $\vec{AB}$ to form $\vec{BC}=2\times\vec{AB}$. |
| 9 | d1705a | AK2 | Doubles the first component of "their" $\vec{AB}$ | Multiply the first component of your earlier $\vec{AB}$ by $2$. |
| 10 | d1705a | AK3 | Doubles the second component of "their" $\vec{AB}$ | Multiply the second component of your earlier $\vec{AB}$ by $2$. |
| 11 | d1705a | AK4 | Adds "their" $\vec{BC}$ to $\vec{OB}$ to obtain $\vec{OC}=\begin{pmatrix}16\\-3\end{pmatrix}$ | Add your earlier $\vec{BC}$ component by component to $\vec{OB}$ to find $\vec{OC}=\begin{pmatrix}\cdots\\\cdots\end{pmatrix}$. |
| 12 | d1705a | CK3 | States $\vec{AC}=\vec{OC}-\vec{OA}$ | Find the displacement by subtracting $\vec{OA}$ from $\vec{OC}$, writing $\vec{AC}=\vec{OC}-\vec{OA}$. |
| 13 | d1705a | R1 | Obtains $\vec{AC}=\begin{pmatrix}18\\-6\end{pmatrix}=3\times$ "their" $\vec{AB}$ | Calculate $\vec{AC}$ and express it as a whole-number multiple of your earlier $\vec{AB}$. |
| 14 | d1705a | R2 | Concludes that $A$, $B$ and $C$ are collinear because $\vec{AC}$ is a scalar multiple of $\vec{AB}$ | State that $A$, $B$ and $C$ are collinear because $\vec{AC}$ is a scalar multiple of $\vec{AB}$. |
| 15 | d17067 | CK1 | Identifies the discount as $15\%$ of the marked price | Calculate the discount as $15\%$ of the marked price. |
| 16 | d17067 | CK2 | Uses marked price less "their" discount | Subtract your discount from the marked price to get the discounted selling price. |
| 17 | d17067 | CK3 | Applies sales tax to "their" discounted selling price | Apply the sales tax rate to your discounted selling price. |
| 18 | d17067 | AK3 | Calculates $12.5\%$ of "their" selling price | Calculate $12.5\%$ of your selling price to find the sales tax. |
| 19 | d17067 | AK4 | Adds "their" sales tax to "their" selling price | Add your sales tax to your selling price to find the total amount paid. |
| 20 | d17067 | CK4 | Selects the selling price before sales tax as the income for calculating profit | Use the selling price before sales tax as the income when calculating profit. |
| 21 | d17067 | AK5 | Subtracts the cost from "their" pre-tax selling price | Subtract the cost from your pre-tax selling price to calculate profit. |
| 22 | d17067 | R1 | Concludes that the claim is incorrect using "their" profit | Use your profit to conclude that the manager’s claim is incorrect. |
| 23 | d17067 | R2 | Recognises that \$49.50 is found using the total amount paid, including sales tax | Recognise that the stated amount comes from the total paid and includes sales tax. |
| 24 | d17067 | R3 | States that sales tax must be remitted and is not profit | State that sales tax must be remitted, so it is not profit. |
| 25 | d1706f | CK1 | Recognises that $Qp$ gives the ticket revenue for each session | Use $Qp$ to represent the ticket revenue for each session. |
| 26 | d1706f | AK1 | Forms $38(15)+24(8)$, or equivalent | Calculate $38(15)+24(8)$ to find the morning-session revenue. |
| 27 | d1706f | CK2 | Recognises that $Np=1.1(Qp)$ | Use $Np=1.1(Qp)$ to model the projected revenues. |
| 28 | d1706f | R1 | Uses "their" result from (a) to obtain the projected revenues | Use your result from part (a) and multiply each session revenue by $1.1$ to obtain the projected revenues. |
| 29 | d1706f | AK3 | Calculates $1.1\times762$, or $1.1\times$ "their" first entry | Calculate $1.1\times762$, or multiply the first entry of your matrix from part (a) by $1.1$. |
| 30 | d1706f | CK3 | Identifies the expected total as the sum of the two entries in "their" projected revenue matrix | Add the two entries in your projected revenue matrix to find the expected total. |
| 31 | d1706f | R2 | Adds "their" projected revenues and compares the result with \$1 650 | Add your projected revenues and compare the total with \$1 650. |
| 32 | d1706f | R3 | Concludes that the target will not be met | State whether the target is met after making your comparison. |
| 33 | d1707c | AK1 | Locates week $6$ as another element with image "their" $f(2)$ | Find the later week where the predicted mass equals your value of $f(2)$. |
| 34 | d1707c | R1 | States both weeks, $2$ and $6$ | State the first week and the later matching week together. |
| 35 | d1707c | AK2 | Counts the whole weeks from "their" first week to "their" second week, inclusively | Count every whole week from your first week to your second week, including both ends. |
| 36 | d1707c | R2 | Uses the condition at least "their" $f(2)$, including the end weeks | Use all weeks for which the predicted mass is at least your value of $f(2)$, including the end weeks. |
| 37 | d1707c | AK3 | Identifies the maximum predicted mass as $16$ | Scan the table and select the greatest predicted mass. |
| 38 | d1707c | AK4 | Identifies week $4$ as the week of maximum predicted mass | Find the week paired with the greatest predicted mass. |
| 39 | d1707c | R3 | States the axis of symmetry as the equation $x = 4$ | Write the vertical line through the peak as an equation beginning with $x =$. |
| 40 | d1707c | CK2 | Identifies the mean from the 8 selected trees as a sample statistic | Classify the mean calculated from the selected trees as a statistic from a sample. |
| 41 | d1707c | CK3 | Identifies the mean from all 40 trees as a population parameter | Classify the mean calculated from all the trees as a parameter from a population. |
| 42 | 004444 | CK1 | Forms $b+c=4$ from Figure 1. | Use the number of shells in Figure 1 to form an equation in $b$ and $c$. |
| 43 | 004444 | CK2 | Forms $2b+c=6$ from Figure 2. | Use the number of shells in Figure 2 to form a second equation in $b$ and $c$. |
| 44 | 004444 | AK1 | Eliminates one variable to obtain $b=2$. | Subtract one equation from the other to eliminate one variable, then solve for $b$. |
| 45 | 004444 | AK2 | Substitutes to obtain $c=2$, follow-through from "their" value of $b$. | Substitute your value of $b$ into one of your equations and solve for $c$. |
| 46 | 004444 | CK3 | Forms $n^2+2n+2$ using "their" values of $b$ and $c$. | Substitute your values of $b$ and $c$ into the expression for the number of shells and simplify. |
| 47 | 004444 | AK3 | Completes the square for "their" quadratic expression. | Complete the square for your quadratic expression by adding and subtracting the needed constant. |
| 48 | 004444 | R1 | States $(n+1)^2+1$ in the requested form. | Write your completed-square expression in the requested form. |
| 49 | 004444 | CK4 | Equates "their" completed-square expression to 82. | Set your completed-square expression equal to the given number of shells. |
| 50 | 004444 | AK4 | Rearranges to obtain $(n+1)^2=81$, follow-through from "their" expression. | Rearrange your equation by moving the constant outside the square to the other side. |
| 51 | 004444 | AK5 | Solves to obtain $n=8$ or $n=-10$. | Take both square roots and solve each resulting equation for $n$. |
| 52 | 004444 | R2 | Identifies $-10$ as the other algebraic solution. | Identify the negative value of $n$ as the other algebraic solution. |
| 53 | 004444 | R3 | Rejects $-10$ because a figure number is a positive whole number. | Reject the negative solution because a figure number must be a positive whole number. |
| 54 | 0ab933 | CK1 | Recognises $12\%$ as $\frac{12}{100}$ of the total harvest | Write $12\%$ as $\frac{12}{100}$ of the total harvest. |
| 55 | 0ab933 | AK1 | Calculates $0.12 \times 1\,200\,000$ | Calculate $0.12 \times 1\,200\,000$. |
| 56 | 0ab933 | CK2 | Recognises that suitable beans equal the total harvest less rejected beans | Find the suitable-bean total by subtracting the rejected-bean total from the total harvest. |
| 57 | 0ab933 | AK2 | Subtracts "their" rejected-bean total from 1 200 000 | Subtract your rejected-bean total from 1 200 000. |
| 58 | 0ab933 | AK3 | Divides "their" suitable-bean total by 1 200 000 and multiplies by 100 | Divide your suitable-bean total by 1 200 000, then multiply by 100. |
| 59 | 0ab933 | R2 | Compares "their" percentage of suitable beans with 90% | Compare your percentage of suitable beans with $90\%$. |
| 60 | 0ab933 | R3 | Concludes that the harvest will not be accepted | Use the comparison to state whether the harvest is accepted. |
| 61 | 0ab933 | CK3 | Identifies the required number of suitable beans as 90% of 1 200 000 | Find the required suitable-bean total by calculating $90\%$ of 1 200 000. |
| 62 | 0ab933 | AK4 | Calculates the required number of suitable beans as 1 080 000 | Calculate the required number of suitable beans. |
| 63 | 0ab933 | AK5 | Subtracts "their" suitable-bean total from 1 080 000 | Subtract your suitable-bean total from the required suitable-bean total. |
| 64 | 0ab933 | R4 | Expresses "their" answer in standard form | Write your final number in standard form as $a \times 10^n$. |
| 65 | 0ab945 | CK1 | Substitutes $t=1$ into the mapping for $f$ | Substitute $t=1$ into the rule for $f$ and simplify carefully. |
| 66 | 0ab945 | AK2 | Obtains the turning-point height $9$ | Read the height-coordinate of the turning point from the function or graph. |
| 67 | 0ab945 | R1 | States that $9$ is a maximum, using the negative coefficient of the squared term | Use the negative coefficient of the squared term to state that the turning-point height is a maximum. |
| 68 | 0ab945 | AK3 | Locates the other time as $5$ seconds from the graph or by calculation | Find the second time at the same height by reading the matching point on the graph or calculating it. |
| 69 | 0ab945 | R2 | Uses "their" height from (a) and "their" axis of symmetry to identify the second time | Use your height from part (a) and your axis of symmetry to identify the second time. |
| 70 | 0ab945 | R3 | Justifies the answer using symmetry about $t=3$ | Justify the second time by showing that the two times are equally far from the axis of symmetry. |
| 71 | 0ab945 | AK4 | Substitutes $f(t)$ into $g$, obtaining $f(t)-5$ | Replace the input of $g$ with $f(t)$ and simplify the resulting expression. |
| 72 | 0ab945 | CK3 | Recognises that the required number is the number of roots of $gf(t)=0$ | Set $gf(t)=0$ and count the distinct roots of the resulting equation. |
| 73 | 0ab945 | R4 | Uses the two distinct times, $t=1$ and "their" time from (c), to justify two roots | Use the two distinct times, including $t=1$ and your time from part (c), to justify the number of roots. |
| 74 | d0dc6a | CK1 | Recognises that $1$ cm on the plan represents $2$ m in reality | Use the scale to convert one centimetre on the plan into metres in reality. |
| 75 | d0dc6a | CK2 | Recognises that the slab area is the outer rectangular area less the cut-out area | Find the slab area by subtracting the cut-out rectangular area from the outer rectangular area. |
| 76 | d0dc6a | AK3 | Calculates the areas of the outer rectangle and the cut-out | Calculate each rectangle’s area by multiplying its length by its width. |
| 77 | d0dc6a | R1 | Subtracts "their" cut-out area from "their" outer area to obtain $336\text{ m}^2$ | Subtract your cut-out area from your outer area and state the result in $\text{m}^2$. |
| 78 | d0dc6a | CK3 | Uses volume $=$ area $\times$ thickness | Use volume $=$ area $\times$ thickness to link the concrete volume, slab area, and thickness. |
| 79 | d0dc6a | CK4 | Uses upper bounds for the outer dimensions and lower bounds for the cut-out dimensions | Use the largest possible outer dimensions and the smallest possible cut-out dimensions when finding the greatest slab area. |
| 80 | d0dc6a | R2 | Shows that $16.8 \div$ "their" greatest area is less than $0.050$ m | Calculate thickness using volume $\div$ your greatest area, then show that it is less than the required thickness. |
| 81 | d0dc6a | R3 | Concludes that the delivery does not guarantee the required thickness | State that the delivery does not guarantee the required thickness because the greatest possible slab area gives a thickness below the requirement. |
| 82 | d0dc72 | CK1 | States class width $10$ kg. | Find the class width by subtracting the lower class boundary from the upper class boundary. |
| 83 | d0dc72 | CK2 | Identifies the midpoint of the class as $34.5$ kg. | Find the class midpoint by averaging the two class limits. |
| 84 | d0dc72 | CK3 | Uses class midpoints and frequencies, including “their” midpoint for the class $30–39$. | Multiply each class midpoint by its frequency, using your earlier midpoint for the class $30–39$. |
| 85 | d0dc72 | AK1 | Calculates $\sum fx = 1207.5$. | Add all the frequency–midpoint products to calculate $\sum fx$. |
| 86 | d0dc72 | AK2 | Divides $1207.5$ by $35$ to obtain $34.5$ kg. | Divide your $\sum fx$ by the total frequency to estimate the mean mass. |
| 87 | d0dc72 | AK3 | Calculates the lower quartile as approximately $26.3$ kg using the grouped data. | Locate the lower-quartile position in the cumulative frequencies and interpolate within the relevant class using the grouped-data boundaries. |
| 88 | d0dc72 | AK4 | Calculates the upper quartile as approximately $43.1$ kg using the grouped data. | Locate the upper-quartile position in the cumulative frequencies and interpolate within the relevant class using the grouped-data boundaries. |
| 89 | d0dc72 | AK5 | Finds the interquartile range and halves “their” interquartile range. | Subtract your lower quartile from your upper quartile to find the interquartile range, then divide your interquartile range by two. |
| 90 | d0dc72 | R1 | Expresses both estimates correct to 1 decimal place. | Write both estimates to 1 decimal place. |
| 91 | d0dc72 | CK4 | Uses both stated acceptance conditions. | Check that the estimated mean meets the minimum condition and that the semi-interquartile range meets the maximum condition. |
| 92 | d0dc72 | R2 | Compares “their” estimated mean and semi-interquartile range with the required limits. | Compare your estimated mean and your semi-interquartile range with the required limits. |
| 93 | d0dc72 | R3 | Concludes that the shipment is accepted, based on both conditions. | State whether the shipment is accepted after using both conditions. |
| 94 | d0dc7f | CK1 | Forms the displacement as position of $A'$ minus position of $A$ | Subtract the coordinates of $A$ from the corresponding coordinates of $A'$ to form the displacement vector. |
| 95 | d0dc7f | AK1 | Calculates $\binom{1-(-3)}{0-2}=\binom{4}{-2}$ | Calculate each component of the displacement as $\binom{x_{A'}-x_A}{y_{A'}-y_A}$. |
| 96 | d0dc7f | CK2 | Uses the same translation vector for the image of $B$ | Apply the same translation vector you found for $A$ to point $B$. |
| 97 | d0dc7f | AK2 | Adds "their" translation vector to $B$ to obtain $B'(3,3)$ | Add each component of your translation vector to the corresponding coordinate of $B$ to find $B'$. |
| 98 | d0dc7f | AK3 | Adds "their" translation vector to $C$ to obtain $C'(6,2)$ | Add each component of your translation vector to the corresponding coordinate of $C$ to find $C'$. |
| 99 | d0dc7f | CK3 | States that a translation preserves length and orientation | State that a translation keeps lengths and orientation unchanged. |
| 100 | d0dc7f | R1 | Uses "their" image coordinates to show $\overrightarrow{A'B'}=\overrightarrow{AB}$ | Use your image coordinates to calculate both $\overrightarrow{A'B'}$ and $\overrightarrow{AB}$ by subtracting start-point coordinates from end-point coordinates, then show that the vectors are equal. |
| 101 | d0dc7f | R2 | Uses equal corresponding side vectors to justify congruency and unchanged orientation | Use the equal corresponding side vectors to justify that the triangles are congruent and have unchanged orientation. |
| 102 | d0dc7f | AK4 | Subtracts the horizontal component of "their" translation vector from the x-coordinate of $P'$ | Reverse the translation by subtracting the horizontal component of your translation vector from the x-coordinate of $P'$. |
| 103 | d0dc7f | AK5 | Subtracts the vertical component of "their" translation vector from the y-coordinate of $P'$ to obtain $P=(4,5)$ | Subtract the vertical component of your translation vector from the y-coordinate of $P'$ and write the resulting coordinates of $P$. |
| 104 | d0dc7f | R3 | Shows that $\overrightarrow{AP}=\binom{7}{3}$ is not a scalar multiple of $\overrightarrow{AC}=\binom{5}{2}$ | Compare $\overrightarrow{AP}=\binom{7}{3}$ with $\overrightarrow{AC}=\binom{5}{2}$ by checking whether one vector is a single scalar multiple of the other. |
| 105 | d0dc7f | R4 | Concludes that $P$ cannot lie on $AC$ | Conclude that $P$ cannot lie on $AC$ because the vectors from $A$ are not scalar multiples. |
| 106 | d0dc87 | CK1 | Forms $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. | Subtract the position vector $\overrightarrow{OA}$ from $\overrightarrow{OB}$ to form $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 107 | d0dc87 | CK2 | Forms $\tan \theta=\dfrac{2}{4}$ using components of "their" $\overrightarrow{AB}$. | Form $\tan \theta=\dfrac{\text{vertical component}}{\text{horizontal component}}$ using the components of your $\overrightarrow{AB}$. |
| 108 | d0dc87 | AK2 | Evaluates $\theta=\tan^{-1}(2/4)=26.565\ldots°$. | Calculate $\theta=\tan^{-1}(\text{your ratio})$, show the unrounded decimal with $\ldots$, and then round it suitably. |
| 109 | d0dc87 | CK3 | Recognises that the opposite direction gives $\overrightarrow{CD}=-\overrightarrow{AB}$. | Reverse the direction of $\overrightarrow{AB}$ by writing $\overrightarrow{CD}=-\overrightarrow{AB}$. |
| 110 | d0dc87 | AK3 | Obtains $\overrightarrow{CD}=\begin{pmatrix}-4\\-2\end{pmatrix}$ from "their" $\overrightarrow{AB}$. | Negate both components of your $\overrightarrow{AB}$ to write $\overrightarrow{CD}$ as $\begin{pmatrix}-a\\-b\end{pmatrix}$ when your vector is $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 111 | d0dc87 | AK4 | Adds "their" displacement to $C(8,7)$ to obtain $D(4,5)$. | Add the corresponding components of your displacement to the coordinates of $C$ to find the coordinates of $D$. |
| 112 | d0dc87 | R2 | Uses the direction opposite to "their" direction in part (b) to select the negative displacement from $C$. | Use the direction opposite to your direction from part (b) to choose the negative displacement starting from $C$. |
| 113 | d0dc87 | CK4 | Sets up the determinant $\begin{vmatrix}4&3\\2&4\end{vmatrix}=4(4)-2(3)$. | Place the components of $\overrightarrow{AB}$ and $\overrightarrow{AD}$ into $\begin{vmatrix}a&c\\b&d\end{vmatrix}=a(d)-b(c)$ and evaluate the determinant. |
| 114 | d0dc87 | R3 | Concludes that the paths are not parallel because "their" determinant is non-zero. | If your determinant is non-zero, conclude that the paths are not parallel. |
| 115 | d0dc8f | CK3 | Identifies $BD$ as half of $BC$ | Divide the length of $BC$ by $2$ to find $BD$. |
| 116 | d0dc8f | R1 | Explains that reflection in $AD$ makes $D$ the midpoint of $BC$ | Explain that reflecting in $AD$ swaps $B$ and $C$, so $D$ is the midpoint of $BC$. |
| 117 | d0dc8f | AK2 | Forms $AD^2 + ("their" BD)^2 = 13^2$ | Use your value of $BD$ in $AD^2 + (BD)^2 = 13^2$. |
| 118 | d0dc8f | AK3 | Evaluates $AD^2 = 13^2 - ("their" BD)^2$ | Rearrange to calculate $AD^2 = 13^2 - (BD)^2$ using your value of $BD$. |
| 119 | d0dc8f | CK4 | Recognises that both sloping sides contribute $13$ m | Include both sloping sides, with each contributing $13$ m, when finding the timber length. |
| 120 | d0dc8f | R2 | Includes the central support as part of the required timber length | Add the central support $AD$ to the outside edges when finding the required timber length. |
| 121 | d0dc8f | R3 | Compares $47.5$ m with "their" total and concludes that it is insufficient | Compare \$47.5 m with your total length and state that it is insufficient if the total is greater. |
| 122 | d0dcb1 | CK1 | Recognises that net change is money received less cost of trays | Take the money received and subtract the cost of the trays to define the net change. |
| 123 | d0dcb1 | R1 | Forms $7n-18-4n$ | Write the money-received expression minus the tray-cost expression. |
| 124 | d0dcb1 | AK1 | Substitutes $n=4$ into "their" net-change expression | Replace every $n$ in your net-change expression from part (a) with $4$ and evaluate. |
| 125 | d0dcb1 | AK3 | Simplifies "their" net-change expression to $3n-18$ | Collect the like $n$-terms in your net-change expression and then combine the constants. |
| 126 | d0dcb1 | AK4 | Expands $3(n-6)$ to obtain $3n-18$ | Multiply $3$ by each term inside the bracket in $3(n-6)$. |
| 127 | d0dcb1 | CK2 | States that the expressions are identical because both simplify to $3n-18$ | Simplify both expressions fully and state that they are identical because they have the same simplified form. |
| 128 | d0dcb1 | CK3 | Recognises from "their" $3(n-6)$ that each additional tray increases net change by $3$ dollars | Read the coefficient multiplying the bracket as the increase in net change for each additional tray. |
| 129 | d0dcb1 | CK4 | Recognises that the number of additional trays must be a whole number | Use a whole-number value for the number of additional trays, rounding up when necessary. |
| 130 | d0dcb1 | R2 | Forms an inequality using "their" net change for four trays, for example $-6+3k\ge0$ | Use your net change for four trays as the starting amount, add $3k$, and make the inequality $\ge 0$. |
| 131 | d0dcb1 | AK5 | Solves "their" inequality to obtain $k\ge2$ | Solve your inequality by isolating $k$ to find the least whole-number value that satisfies it. |
| 132 | d0dcc3 | CK1 | Recognises that marked price is selling price plus discount. | Add the selling price and the discount to find the marked price. |
| 133 | d0dcc3 | AK1 | Adds $208 + 52$ to obtain \$260. | Add $208 + 52$ to find the marked price. |
| 134 | d0dcc3 | CK2 | Uses marked price as the base value for the percentage discount. | Use the marked price as the whole amount when finding the discount percentage. |
| 135 | d0dcc3 | AK2 | Calculates $\frac{52}{\text{their }260}\times100$ to obtain $20\%$. | Calculate $\frac{52}{\text{your marked price}}\times100$ to find the discount percentage. |
| 136 | d0dcc3 | R1 | Determines markup as "their" discount percentage plus 10 percentage points. | Add 10 percentage points to your discount percentage to find the markup percentage. |
| 137 | d0dcc3 | CK3 | Forms the relationship marked price $=130\%$ of cost price. | Write the marked price as $130\%$ of the cost price. |
| 138 | d0dcc3 | AK3 | Divides "their" marked price by $1.30$. | Divide your marked price by $1.30$ to find the cost price. |
| 139 | d0dcc3 | R2 | Finds profit by subtracting "their" cost price from the selling price. | Subtract your cost price from the selling price to find the profit. |
| 140 | d0dcc3 | R3 | Uses "their" cost price as the base value for percentage profit. | Use your cost price as the whole amount when finding the percentage profit. |
| 141 | d0dcc3 | AK5 | Calculates $\frac{\text{their profit}}{\text{their cost price}}\times100$. | Calculate $\frac{\text{your profit}}{\text{your cost price}}\times100$ to find the percentage profit. |
| 142 | d0dccb | AK1 | Counts the frequencies for 2 and 3 baskets correctly | Count how many times each of the first two basket numbers appears in the table and enter those frequencies. |
| 143 | d0dccb | AK2 | Counts the frequency for 4 baskets correctly | Count every occurrence of the basket number in this row and record its frequency. |
| 144 | d0dccb | AK3 | Counts the frequencies for 5 and 10 baskets correctly | Count the occurrences of each of the last two basket numbers and record both frequencies. |
| 145 | d0dccb | CK1 | Forms a weighted total from the completed frequency table | Multiply each basket number by its frequency, then add all the products to form the weighted total. |
| 146 | d0dccb | CK2 | Identifies the 10th and 11th values as the middle values | Order the data using the frequency table and locate the two central positions before finding the median. |
| 147 | d0dccb | R1 | Uses "their" modal value to select the relevant frequency | Use your modal value to select the matching frequency from the completed table. |
| 148 | d0dccb | R2 | States that "their" modal value occurred on 7 of the 20 days | State how many days your modal value occurs, out of the total number of days. |
| 149 | d0dccb | R3 | Compares $\frac{7}{20}$ with $\frac{1}{3}$ correctly | Compare $\frac{f}{n}$ with one third by writing both fractions with a common denominator. |
| 150 | d0dccb | R4 | Concludes that the supplier should make the arrangement, based on "their" comparison | Use your comparison to decide whether the supplier should make the arrangement and state the conclusion. |
| 151 | d0dcd3 | CK1 | Recognises that the translation vector is found from $B'-B$. | Subtract the coordinates of $B$ from those of $B'$ to form $B'-B$. |
| 152 | d0dcd3 | AK1 | Calculates $\binom{8-4}{4-1}=\binom{4}{3}$. | Calculate $\binom{8-4}{4-1}$ carefully to obtain the translation vector. |
| 153 | d0dcd3 | CK2 | Applies the same translation vector to the coordinates of $A$. | Add the translation vector to both coordinates of $A$ to locate $A'$. |
| 154 | d0dcd3 | AK3 | Applies "their" translation vector to $C$ to obtain $C'=(6,6)$. | Apply your translation vector to both coordinates of $C$ to locate $C'$. |
| 155 | d0dcd3 | CK3 | Recognises that an enlargement of scale factor $\frac{1}{2}$ about the origin halves each coordinate. | Multiply each coordinate by $\frac{1}{2}$ for an enlargement about the origin. |
| 156 | d0dcd3 | AK4 | Obtains $A''=\left(\frac{5}{2},2\right)$ using "their" $A'$. | Use your $A'$ coordinates and calculate $A''=\left(\frac{1}{2}\times x,\frac{1}{2}\times y\right)$. |
| 157 | d0dcd3 | AK5 | Obtains $C''=(3,3)$ using "their" $C'$. | Use your $C'$ coordinates, multiplying each by $\frac{1}{2}$, to locate $C''$. |
| 158 | d0dcd3 | CK4 | States that a positive enlargement preserves orientation. | State that a positive enlargement keeps the orientation unchanged. |
| 159 | d0dcd3 | R1 | Compares corresponding lengths using "their" image coordinates, for example $AC=\sqrt{5}$ and $A''C''=\frac{\sqrt{5}}{2}$. | Using your image coordinates, calculate corresponding lengths with the distance formula, such as $AC=\sqrt{...}$ and $A''C''=\frac{\sqrt{...}}{...}$, then compare them. |
| 160 | d0dcd3 | R2 | Concludes that the triangles are not congruent because corresponding side lengths differ. | Conclude that the triangles are not congruent because corresponding side lengths are different. |
| 161 | d0dcd3 | R3 | Decides that Devon is not correct since the replacement stencil does not meet both requirements. | Decide that Devon is not correct by checking that the replacement fails to keep both orientation and corresponding side lengths the same. |
| 162 | d0dce0 | CK1 | Uses $\vec{AB}=\vec{OB}-\vec{OA}$ | Compute $\vec{AB}=\vec{OB}-\vec{OA}$. |
| 163 | d0dce0 | CK2 | Forms $\tan \theta=3/6$ using components of "their" $\vec{AB}$ | Form $\tan \theta$ from the horizontal and vertical components of your $\vec{AB}$. |
| 164 | d0dce0 | AK2 | Evaluates $\tan^{-1}(3/6)$ | Evaluate $\tan^{-1}$ of your component ratio. |
| 165 | d0dce0 | R1 | Gives "their" direction correct to 1 decimal place | Give your direction rounded to 1 decimal place. |
| 166 | d0dce0 | CK3 | Selects $ad-bc$ for the determinant of a $2 \times 2$ matrix | Find the determinant of your $2 \times 2$ matrix using $ad-bc$. |
| 167 | d0dce0 | AK3 | Calculates $\vec{BC}=\begin{pmatrix}3\\6\end{pmatrix}$ | Calculate $\vec{BC}=\vec{OC}-\vec{OB}$ and write the result as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 168 | d0dce0 | AK4 | Forms $M=\begin{pmatrix}6&3\\3&6\end{pmatrix}$ using "their" $\vec{AB}$ | Form $M=\begin{pmatrix}\vec{AB}\\\vec{BC}\end{pmatrix}$ by using your vectors as the rows. |
| 169 | d0dce0 | R2 | Compares "their" direction with the interval from $25°$ to $28°$ | Check whether your direction lies in the interval from $25°$ to $28°$. |
| 170 | d0dce0 | R3 | Compares "their" determinant with $30$ | Compare your determinant with $30$. |
| 171 | d0dce0 | R4 | Concludes correctly that the plot meets both conditions | State whether the plot meets both inspection conditions after making both comparisons. |
| 172 | d0dce8 | CK1 | Identifies $AC$ as the line of symmetry | Identify $AC$ as the line that divides the banner into two matching mirror-image halves. |
| 173 | d0dce8 | CK2 | States rotational symmetry of order $1$ | State the rotational symmetry order by checking how many complete turns map the banner onto itself. |
| 174 | d0dce8 | CK3 | Recognises that a line of symmetry is a perpendicular bisector of the segment joining corresponding points | Use the fact that the symmetry line is the perpendicular bisector of the segment joining corresponding points. |
| 175 | d0dce8 | R1 | Uses the symmetry to justify $BO=DO$ and $\angle AOB=90^\circ$ | Use reflection in $AC$ to justify $BO=DO$ and $\angle AOB=90^\circ$. |
| 176 | d0dce8 | CK4 | Forms the Pythagorean relationships $AO^2+BO^2=20^2$ and $(25-AO)^2+BO^2=15^2$ | Apply Pythagoras to both right-angled triangles to form $AO^2+BO^2=20^2$ and $(25-AO)^2+BO^2=15^2$. |
| 177 | d0dce8 | AK1 | Eliminates $BO$ and obtains $AO=16$ | Subtract the two Pythagorean equations to eliminate $BO$ and solve the resulting equation for $AO$. |
| 178 | d0dce8 | AK2 | Substitutes "their" $AO$ into a correct Pythagorean relationship to obtain $BO^2$ | Substitute your earlier $AO$ into a correct Pythagorean relationship and rearrange to obtain $BO^2$. |
| 179 | d0dce8 | AK4 | Obtains "their" $BD$ as twice "their" $BO$ | Find your $BD$ by doubling your $BO$, since $O$ is the midpoint of $BD$. |
| 180 | d0dce8 | AK5 | Compares "their" banner height with the frame height of $20\text{ cm}$ | Compare your banner height with the frame height of $20\text{ cm}$. |
| 181 | d0dce8 | R2 | Interprets $BO$ and $DO$ as the perpendicular distances on opposite sides of the central bar $AC$ | Interpret $BO$ and $DO$ as equal perpendicular distances from the central bar $AC$ on opposite sides. |
| 182 | d0dce8 | R3 | Concludes correctly, with justification, that the banner will not fit | Use the height comparison to conclude whether the banner fits inside the frame, and give the reason. |
| 183 | d0dcf0 | R1 | Forms $20p-c=500$ from the first day's sales | Subtract the fixed cost from the first day’s sales income and set the result equal to the first day’s net receipts. |
| 184 | d0dcf0 | R2 | Forms $30p-c=800$ from the second day's sales | Subtract the same fixed cost from the second day’s sales income and set the result equal to the second day’s net receipts. |
| 185 | d0dcf0 | AK1 | Eliminates $c$ to obtain $p=30$ | Subtract one sales equation from the other to eliminate $c$ and solve for $p$. |
| 186 | d0dcf0 | AK2 | Substitutes to obtain $c=100$ | Substitute your value of $p$ into either sales equation and solve for $c$. |
| 187 | d0dcf0 | CK1 | Recognises that $-2$ must be factored from the quadratic and linear terms | Factor out the common negative coefficient from both the quadratic and linear terms. |
| 188 | d0dcf0 | AK3 | Substitutes "their" $p$ and $c$ and expands to obtain $P=-2x^2+30x-100$ | Substitute your $p$ and $c$ into the profit expression, then expand and collect like terms. |
| 189 | d0dcf0 | AK4 | Completes the square for "their" quadratic expression | Complete the square for your quadratic expression by halving the coefficient of $x$, squaring it, and balancing the constant term. |
| 190 | d0dcf0 | R3 | Adjusts the constant correctly to state an equivalent completed-square expression | Multiply back through your completed-square expression and adjust the constant so it stays equivalent to your original quadratic. |
| 191 | d0dcf0 | CK2 | Uses $P=0$ to identify the break-even boundaries | Set $P=0$ to find the break-even boundaries. |
| 192 | d0dcf0 | CK3 | Recognises that no loss requires $P\geq0$ | Use $P\geq0$ to represent the condition for no loss. |
| 193 | d0dcf0 | AK5 | Solves "their" quadratic to obtain the boundary values $x=5$ and $x=10$ | Solve your quadratic equation to find both boundary values of $x$. |
| 194 | d0dcf0 | R4 | Selects all positive whole-number values from 5 to 10 inclusive | List every positive whole-number value of $x$ between the two break-even boundaries, including both boundaries. |
| 195 | d0dcf8 | CK1 | Recognises that the 18% is divided into 18 equal 1% parts | Split the given $18\%$ into $18$ equal $1\%$ parts to find the amount for one part. |
| 196 | d0dcf8 | AK1 | Divides $72\,000$ by $18$ | Divide $72\,000$ by $18$ to calculate your $1\%$ amount. |
| 197 | d0dcf8 | CK2 | Recognises that the total represents $100\%$ | Use $100\%$ as the percentage representing the whole production. |
| 198 | d0dcf8 | AK2 | Multiplies "their" 1% value by $100$ | Multiply your $1\%$ value by $100$ to find your total production. |
| 199 | d0dcf8 | CK3 | Identifies dispatched sachets as total produced less rejected sachets | Find the dispatched sachets by subtracting the rejected sachets from the total produced. |
| 200 | d0dcf8 | AK3 | Subtracts $72\,000$ from "their" total | Subtract $72\,000$ from your total to calculate your dispatched number. |
| 201 | d0dcf8 | CK4 | States percentage as dispatched number divided by total number, multiplied by $100$ | Divide the dispatched number by the total number and multiply by $100$ to form the percentage. |
| 202 | d0dcf8 | R2 | Uses "their" dispatched number and "their" total to obtain the percentage | Use your dispatched number and your total in the percentage calculation, then simplify the result. |
| 203 | d0dcf8 | CK5 | Identifies that a power of $10^5$ is required | Choose a standard-form expression with a power of $10^5$. |
| 204 | d0dcf8 | AK4 | Obtains coefficient $3.28$ from "their" dispatched number | Move the decimal point in your dispatched number until the coefficient is at least $1$ and less than $10$. |
| 205 | d0dcf8 | R3 | Expresses "their" answer in standard form | Write your result in standard form using your coefficient multiplied by the appropriate power of $10$. |
| 206 | d0dd05 | CK1 | Recognises that the line has a negative gradient. | Read the line from left to right and identify that it goes down, so the gradient is negative. |
| 207 | d0dd05 | AK1 | Calculates gradient $= -3$. | Choose two clear points on the line and calculate the gradient using $\frac{y_2-y_1}{x_2-x_1}$. |
| 208 | d0dd05 | CK2 | Identifies the $y$-intercept as $36$. | Read the point where the line crosses the $y$-axis to identify the $y$-intercept. |
| 209 | d0dd05 | AK2 | Uses "their" gradient as the coefficient of $x$. | Use your gradient as the coefficient of $x$ in your equation. |
| 210 | d0dd05 | R1 | Expresses "their" equation in the form $y = mx + c$. | Write your equation in the form $y = mx + c$, using your gradient for $m$ and the $y$-intercept for $c$. |
| 211 | d0dd05 | AK4 | Substitutes $x = 7$ into "their" equation. | Substitute $x = 7$ into your equation and simplify to find $y$. |
| 212 | d0dd05 | CK3 | Recognises that retaining exactly $15$ m satisfies the condition "at least 15 m". | Treat exactly $15$ m retained as satisfying at least $15$ m, because equality is included. |
| 213 | d0dd05 | R2 | Uses "their" result from part (c) to identify 7 costumes as meeting the requirement. | Use your result from part (c) to identify the number of costumes that still leaves at least $15$ m. |
| 214 | d0dd05 | R3 | Determines that an eighth costume would leave $12$ m, or correct follow-through from "their" result in part (c). | Starting from your result in part (c), subtract the fabric needed for one more costume to find what eight costumes leave. |
| 215 | d0dd05 | R4 | Concludes that 7 is the greatest possible whole number of costumes, with a valid comparison to the 15 m requirement. | Compare the amount left after seven and after eight costumes with $15$ m, then state the greatest whole number that still meets the requirement. |
| 216 | d0dd12 | CK1 | Recognises that $fg(t)=f(g(t))$ | Treat $fg(t)$ as $f(g(t))$ before carrying out the composition. |
| 217 | d0dd12 | AK1 | Substitutes $t-3$ for $x$ in $f(x)$ | Replace $x$ in $f(x)$ with $t-3$. |
| 218 | d0dd12 | AK2 | Simplifies to $12-(t-3)^2$ | Simplify the composed expression by evaluating the square and then combining the constant terms. |
| 219 | d0dd12 | R1 | States that the graph opens downwards, so the vertex gives a greatest value | State that the parabola opens downwards, so its vertex represents the greatest water level. |
| 220 | d0dd12 | CK4 | Forms the condition $h\ge8$ using "their" model | Use your model to write the safety condition as $h\ge8$. |
| 221 | d0dd12 | AK3 | Uses "their" expression to obtain $(t-3)^2\le4$ | Rearrange your expression to isolate the squared term in an inequality of the form $(t-3)^2\le\ldots$. |
| 222 | d0dd12 | AK4 | Obtains boundary times $t=1$ and $t=5$ from "their" inequality | Solve your inequality at its two boundary cases to find the starting and ending times. |
| 223 | d0dd12 | R2 | Selects the interval between the boundary times, following through on "their" maximum and axis | Choose all times between your two boundary times, using your earlier maximum and axis of symmetry. |
| 224 | d0dd12 | AK5 | Calculates the gradient of the tangent as $2$ | Calculate the tangent gradient by dividing the vertical change by the horizontal change between two clear points on the tangent. |
| 225 | d0dd12 | R3 | Interprets a positive gradient as an increasing water level | Interpret the positive gradient by stating that the water level is increasing. |
| 226 | d0dd1a | CK2 | Uses the grouped-data mean with the class midpoints | Multiply each class frequency by its class midpoint, add these products, and divide by the total frequency to find the grouped-data mean. |
| 227 | d0dd1a | AK1 | Forms $\frac{489 + 24.5x}{22 + x} = 23.5$ | Form the mean equation $\frac{T+mx}{N+x}=\bar{x}$ by adding the unknown class contribution to the known weighted total and total frequency. |
| 228 | d0dd1a | AK2 | Solves the equation to obtain $x = 28$ | Solve your mean equation carefully for $x$ by clearing the denominator first and collecting the $x$ terms. |
| 229 | d0dd1a | R1 | Interprets the solution as a valid whole-number frequency | Check that your value of $x$ can represent a frequency by confirming that it is a non-negative whole number. |
| 230 | d0dd1a | AK3 | Calculates lower quartile as $9.5 + \frac{12.5-4}{9}\times10 = 18.9$ to 1 d.p., using "their" frequency | Use your frequency in the lower-quartile interpolation formula $L+\frac{p-c}{f}\times w$ and round the estimate to one decimal place. |
| 231 | d0dd1a | AK4 | Calculates upper quartile as $19.5 + \frac{37.5-13}{28}\times10 = 28.3$ to 1 d.p., using "their" frequency | Use your frequency in the upper-quartile interpolation formula $L+\frac{p-c}{f}\times w$ and round the estimate to one decimal place. |
| 232 | d0dd1a | AK5 | Finds $28.25 - 18.94\ldots = 9.3$ to 1 d.p. | Subtract your lower-quartile estimate from your upper-quartile estimate, use $\ldots$ for any continuing decimal if needed, and round the interquartile range to one decimal place. |
| 233 | d0dd1a | R2 | Concludes that the claim is false since "their" lower quartile is below the lower boundary $19.5$ of the modal class | Compare your lower-quartile estimate with the lower boundary of the modal class and use this comparison to decide whether the claim is false. |
| 234 | d0dd1a | R3 | Expresses the quartile estimates and interquartile range to 1 decimal place | Write both quartile estimates and the interquartile range consistently to one decimal place. |
| 235 | d0dd93 | CK1 | Recognises that $1\text{ cm}$ on the plan represents $2\text{ m}$ in reality | Use the scale to state what $1\text{ cm}$ on the plan represents in reality. |
| 236 | d0dd93 | AK1 | Calculates $4.5\times2=9\text{ m}$ | Multiply the plan measurement by the scale conversion, using $l\times s$, to find the real length in $\text{m}$. |
| 237 | d0dd93 | CK2 | Recognises the region as a rectangle and a semicircle | Split the region into a rectangle and a semicircle before finding its area. |
| 238 | d0dd93 | AK2 | Uses the scale to obtain a diameter of $14\text{ m}$ and uses "their" length for the rectangular area | Convert the diameter using the scale, then multiply it by your own converted length to find the rectangular area. |
| 239 | d0dd93 | AK3 | Calculates the semicircle area and combines it with the rectangular area | Find the area of the semicircle from its radius, find the rectangular area, and add the two areas. |
| 240 | d0dd93 | R1 | Expresses the area correct to $1$ decimal place | Round your total area to one decimal place and write it in $\text{m}^2$. |
| 241 | d0dd93 | CK3 | States upper plan measurements of $7.05\text{ cm}$ and $4.55\text{ cm}$ | Use the upper bound for each plan measurement and state both values in $\text{cm}$. |
| 242 | d0dd93 | AK4 | Converts the upper measurements to $14.1\text{ m}$ and $9.1\text{ m}$ | Convert each upper plan measurement separately into $\text{m}$ using the scale. |
| 243 | d0dd93 | AK5 | Calculates a maximum possible area of approximately $206.4\text{ m}^2$ | Use both converted upper dimensions to calculate the maximum possible area in $\text{m}^2$. |
| 244 | d0dd93 | R2 | Uses both upper measurements to determine the greatest possible area | Use both upper measurements when deciding the greatest possible area. |
| 245 | d0dd93 | R3 | Compares $205\text{ m}^2$ with "their" maximum possible area | Compare the given turf area with your maximum possible area, both in $\text{m}^2$. |
| 246 | d0dd93 | R4 | Concludes that the turf is insufficient, with a supporting reason | Conclude whether the turf is sufficient and support your conclusion by stating how the two areas compare. |
| 247 | d0dd9b | CK1 | Equates corresponding upper entries and obtains $x=2$ | Equate the corresponding upper entries and solve the resulting equation for $x$. |
| 248 | d0dd9b | CK2 | Forms $\overrightarrow{OQ}=\overrightarrow{OP}+\overrightarrow{PQ}$ | Form $\overrightarrow{OQ}=\overrightarrow{OP}+\overrightarrow{PQ}$ by adding the displacement from $P$ to $Q$ to the position vector of $P$. |
| 249 | d0dd9b | AK2 | Substitutes "their" $\overrightarrow{OP}$ and the given $\overrightarrow{PQ}$ | Substitute your earlier $\overrightarrow{OP}$ and the given $\overrightarrow{PQ}$ into $\overrightarrow{OQ}=\overrightarrow{OP}+\overrightarrow{PQ}$. |
| 250 | d0dd9b | R1 | Forms $\overrightarrow{QR}=\overrightarrow{OR}-\overrightarrow{OQ}$ using "their" $\overrightarrow{OQ}$ | Use your earlier $\overrightarrow{OQ}$ to form $\overrightarrow{QR}=\overrightarrow{OR}-\overrightarrow{OQ}$. |
| 251 | d0dd9b | AK4 | Determines $\overrightarrow{QR}=\begin{pmatrix}2\\5\end{pmatrix}$ from "their" vectors | Subtract the corresponding components of your vectors to determine $\overrightarrow{QR}$ as a column vector $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 252 | d0dd9b | R2 | Uses $\overrightarrow{PS}=\overrightarrow{QR}$ for the parallelogram | Use the equal and parallel opposite sides of the parallelogram to write $\overrightarrow{PS}=\overrightarrow{QR}$. |
| 253 | d0dd9b | CK3 | Recognises that the direction vector must be divided by its magnitude to give a unit vector | Divide the direction vector $\overrightarrow{PS}$ by its magnitude to obtain a unit vector. |
| 254 | d0dd9b | AK5 | Uses "their" $\overrightarrow{PS}$ to obtain magnitude $\sqrt{29}$ and divides both components by it | Use your earlier $\overrightarrow{PS}$ to calculate its magnitude with $\sqrt{a^2+b^2}$, then divide both components by that magnitude. |
| 255 | d0dd9b | R4 | Expresses "their" unit vector in exact form | Write your unit vector in exact form by keeping any surd unrounded. |
| 256 | d0dda8 | CK1 | Forms the translation vector from the change in coordinates from $A$ to $A'$ | Subtract the coordinates of $A$ from the corresponding coordinates of $A'$ to form the translation vector. |
| 257 | d0dda8 | CK2 | Uses the same translation vector for point $D$ | Apply the same translation vector to point $D$. |
| 258 | d0dda8 | AK2 | Finds the image x-coordinate: $-6+6=0$ | Add the horizontal component of the translation vector to the x-coordinate of $D$. |
| 259 | d0dda8 | AK3 | Finds the image y-coordinate: $4-3=1$ | Add the vertical component of the translation vector to the y-coordinate of $D$. |
| 260 | d0dda8 | CK3 | Identifies $AD$ and $A'D'$ as corresponding sides | Match side $AD$ with side $A'D'$ as the sides joining the corresponding translated vertices. |
| 261 | d0dda8 | AK4 | Finds $\vec{AD}=\binom{-1}{3}$ | Calculate $\vec{AD}$ by subtracting the coordinates of $A$ from those of $D$ and write the result as a $\binom{}{}$ vector. |
| 262 | d0dda8 | AK5 | Finds $\vec{A'D'}=\binom{-1}{3}$ using "their" coordinates of $D'$ | Use your coordinates of $D'$ to calculate $\vec{A'D'}$ and write the result as a $\binom{}{}$ vector. |
| 263 | d0dda8 | CK4 | States that a translation preserves lengths, directions or orientation | State that a translation preserves length, direction, and orientation. |
| 264 | d0dda8 | R1 | Uses the matching side vectors and translation property to support the comparison | Compare the matching vectors $\vec{AD}$ and $\vec{A'D'}$ and use the translation property to justify your comparison. |
| 265 | d0dda8 | R2 | Concludes that the boundaries are congruent | Use your comparison to conclude whether the two boundaries are congruent. |
| 266 | d0dda8 | R3 | Concludes that the order of the vertices is unchanged and decides Yes | Check whether the corresponding vertices remain in the same order, then state your decision. |
| 267 | d0ddb0 | CK1 | Forms $\vec{AB}=\vec{OB}-\vec{OA}$ | Form $\vec{AB}$ by subtracting $\vec{OA}$ from $\vec{OB}$. |
| 268 | d0ddb0 | AK1 | Subtracts corresponding components to obtain $\begin{pmatrix}3\\2\end{pmatrix}$ | Subtract matching components and write the result as $\begin{pmatrix}\cdot\\\cdot\end{pmatrix}$. |
| 269 | d0ddb0 | CK2 | Identifies the vertical-to-horizontal ratio as $2/3$ | Divide the vertical component of the route vector by its horizontal component. |
| 270 | d0ddb0 | AK2 | Forms $\tan \theta=2/3$ using 'their' vector $\vec{AB}$ | Use your $\vec{AB}$ to set $\tan\theta$ equal to the vertical component divided by the horizontal component. |
| 271 | d0ddb0 | AK3 | Evaluates $\theta=\tan^{-1}(2/3)$ | Use $\tan^{-1}$ on your ratio to calculate $\theta$. |
| 272 | d0ddb0 | R1 | Expresses 'their' direction correct to 1 decimal place | Write your direction in degrees rounded to one decimal place. |
| 273 | d0ddb0 | CK3 | Uses $ad-bc$ for the determinant of a $2\times2$ matrix | For a $2\times2$ determinant, multiply the leading diagonal and subtract the product of the other diagonal. |
| 274 | d0ddb0 | AK4 | Forms the matrix using 'their' $\vec{AB}$ and $\vec{DC}=\begin{pmatrix}6\\4\end{pmatrix}$ | Build the determinant matrix from your $\vec{AB}$ and $\vec{DC}$ as columns: $\begin{pmatrix}\cdot&\cdot\\\cdot&\cdot\end{pmatrix}$. |
| 275 | d0ddb0 | AK5 | Evaluates the determinant as $(3\times4)-(2\times6)=0$ | Evaluate the determinant by subtracting the diagonal products: $(\cdot\times\cdot)-(\cdot\times\cdot)$. |
| 276 | d0ddb0 | R3 | Interprets a zero determinant as showing that the route vectors are scalar multiples | State that a zero determinant means the two route vectors are scalar multiples. |
| 277 | d0ddb0 | R4 | Uses the scalar-multiple condition to justify that $AB$ is parallel to $DC$ | Use the scalar-multiple relationship to justify that $AB\parallel DC$. |
| 278 | d0ddb8 | CK1 | Forms $2PQ + 10 = 36$ from the equal sides and the perimeter | Use the equal sides and the perimeter to write one equation in $PQ$. |
| 279 | d0ddb8 | CK2 | Recognises $PQN$ as a right-angled triangle | Identify $PQN$ as the triangle containing the right angle. |
| 280 | d0ddb8 | CK3 | Recognises that the perpendicular from the apex of the isosceles triangle bisects $QR$ | Use the isosceles-triangle property that the perpendicular from the apex cuts $QR$ into two equal lengths. |
| 281 | d0ddb8 | R1 | Deduces $NQ = 5\text{ m}$ | Divide $QR$ by $2$ to find $NQ$ in $\text{m}$. |
| 282 | d0ddb8 | AK2 | Applies Pythagoras' theorem using "their" $PQ$ and $NQ = 5$ | Apply Pythagoras' theorem in $PQN$ using your $PQ$ and your value of $NQ$. |
| 283 | d0ddb8 | AK4 | Calculates the area of the whole cloth using $\frac12 \times 10 \times$ "their" $PN$ | Calculate the whole-cloth area using $\frac12 \times 10 \times$ your $PN$. |
| 284 | d0ddb8 | R2 | Explains that no other line maps the triangle onto itself | Explain that only the line through $P$ and the midpoint of $QR$ reflects the triangle onto itself. |
| 285 | d0ddb8 | R3 | Concludes that no non-trivial rotation maps the cloth onto itself, giving order $1$ | Check that no rotation smaller than a full turn of $360^\circ$ maps the cloth onto itself, then state the rotational-symmetry order. |
| 286 | d0ddc5 | CK1 | Recognises that the markup is calculated from the cost price | Calculate the markup using the cost price as the base value. |
| 287 | d0ddc5 | CK2 | Recognises that the marked price is the base value for the discount percentage | Use the marked price as the base value when finding the discount percentage. |
| 288 | d0ddc5 | CK3 | Selects the cost price as the base value for percentage profit | Use the cost price as the base value when calculating percentage profit. |
| 289 | d0ddc5 | AK4 | Finds profit using "their" selling price minus 480 | Subtract 480 from your selling price to find the profit. |
| 290 | d0ddc5 | CK4 | Recognises that the further reduction must be compared with profit calculated as a percentage of cost | Compare the further reduction with the cost price, since profit percentage is calculated from cost price. |
| 291 | d0ddc5 | R1 | Expresses the further \$15 reduction as a percentage of 480 | Express the further \$15 reduction as a percentage of 480. |
| 292 | d0ddc5 | R2 | Subtracts this percentage from "their" percentage profit | Subtract this percentage from your percentage profit. |
| 293 | d0ddc5 | R3 | Concludes that the farmer should not agree because "their" resulting percentage profit is less than $12\%$ | Conclude that the farmer should not agree because your resulting percentage profit is less than $12\%$. |
| 294 | 797b9e | CK1 | Uses suitable headings for the value and frequency columns | Label the two columns with suitable headings for the catch value and its frequency. |
| 295 | 797b9e | AK1 | Records frequencies $1$, $1$ and $2$ for catches of $3$, $4$ and $5$ fish | Read the bar heights for catches of 3, 4 and 5 fish and enter each frequency in the table. |
| 296 | 797b9e | AK2 | Records frequencies $3$, $1$ and $2$ for catches of $6$, $7$ and $8$ fish | Read the bar heights for catches of 6, 7 and 8 fish and enter each frequency in the table. |
| 297 | 797b9e | R1 | Organises all distinct catch values in ascending order in a frequency table | List every distinct catch value once in increasing order and place its frequency beside it in a table. |
| 298 | 797b9e | CK2 | Selects $\frac{\sum fx}{\sum f}$ to find the mean | Use $\frac{\sum fx}{\sum f}$ to calculate the mean. |
| 299 | 797b9e | AK3 | Calculates $\sum fx=58$ | Multiply each catch value by its frequency and add the products to calculate $\sum fx$. |
| 300 | 797b9e | R2 | Selects "their" modal value as the candidate whole-number typical catch | Choose your modal value as your whole-number typical catch. |
| 301 | 797b9e | R3 | Compares "their" candidate with "their" mean and verifies that it is not less than the mean | Compare your candidate with your mean and check that it is not less than the mean. |
| 302 | 797b9e | R4 | Concludes that "their" candidate satisfies both stated conditions | State that your candidate meets both required conditions. |
| 303 | 797ba6 | CK1 | Recognises that the four disjoint regions total 35 commuters | Add the entries in all four disjoint regions, since together they make up the whole universal set. |
| 304 | 797ba6 | AK1 | Forms $14 + 10 + x + 5 = 35$ | Write an equation that adds the four region entries and sets the total equal to the number of commuters. |
| 305 | 797ba6 | R1 | Solves the equation to obtain $x = 6$ | Rearrange your equation to isolate $x$ and calculate its value. |
| 306 | 797ba6 | CK2 | Identifies the positive factors of "their" value of $x$ | List every positive integer that divides your value of $x$ exactly. |
| 307 | 797ba6 | AK2 | Writes the factors in roster form | Put the factors in roster form by writing them once each inside curly brackets, separated by commas. |
| 308 | 797ba6 | CK3 | Recognises that each required subset contains two distinct elements | Form each subset by choosing two different elements, without repeating an element in the same subset. |
| 309 | 797ba6 | AK3 | Lists $\{1,2\}$, $\{1,3\}$ and $\{1,6\}$ | Start by pairing the smallest element with each larger element exactly once. |
| 310 | 797ba6 | AK4 | Lists $\{2,3\}$ and $\{2,6\}$ | Next, pair the second-smallest element with each larger unused element. |
| 311 | 797ba6 | AK5 | Lists $\{3,6\}$ | Finish with the one remaining pair of larger elements. |
| 312 | 797ba6 | R2 | Tests "their" two-element subsets using divisibility by "their" value of $x$ | Multiply the two elements in each of your two-element subsets and test whether each product is divisible by your value of $x$. |
| 313 | 797ba6 | R4 | Justifies the accepted pairs using products divisible by "their" value of $x$ | Explain that you accept a pair only when its product divides exactly by your value of $x$. |
| 314 | 797bae | CK1 | Represents the heater increase by adding $(3x-2)$ | Add $(3x-2)$ to the starting temperature to represent the heater increase. |
| 315 | 797bae | CK2 | Represents the ventilation change by subtracting $(x+5)$ | Subtract $(x+5)$ from the running temperature to represent the ventilation change. |
| 316 | 797bae | AK1 | Simplifies the directed-number expression to $2x-11$ | Combine the constants and like $x$-terms carefully to simplify the directed-number expression. |
| 317 | 797bae | AK2 | Substitutes $6$ into "their" expression for the final temperature | Substitute $6$ into your expression for the final temperature and evaluate it. |
| 318 | 797bae | CK3 | Uses the fact that identical expressions have the same simplified form for all values of $x$ | Simplify both expressions and use matching simplified forms to show that they are identical for every value of $x$. |
| 319 | 797bae | AK4 | Expands $2(x-6)+1$ correctly | Expand $2(x-6)+1$ by multiplying $2$ by each term inside the bracket before combining constants. |
| 320 | 797bae | R1 | Shows that $2(x-6)+1$ simplifies to "their" expression from part (a) | Simplify $2(x-6)+1$ and compare the result with your expression from part (a). |
| 321 | 797bae | CK4 | Forms an inequality using "their" acceptable temperature from part (b) | Write an inequality that compares the temperature expression with your acceptable temperature. |
| 322 | 797bae | AK5 | Solves $2(x-6)+1\geq$ "their" temperature to obtain $x\geq6$ | Solve the inequality using $\geq$ by undoing the addition and multiplication while keeping the inequality direction correct. |
| 323 | 797bae | R2 | Selects $6$ as the least permitted whole-number setting | Choose the smallest permitted whole-number setting that satisfies your inequality. |
| 324 | 797bae | R3 | Justifies the minimum by showing that the preceding setting gives a temperature below "their" acceptable temperature | Test the whole-number setting immediately below your least setting and show that its temperature is below your acceptable temperature. |
| 325 | 797bb6 | R1 | Defines suitable variables and forms $l+w=14$ and $l-w=4$ | Let $l$ and $w$ represent the length and width, then translate the perimeter and difference statements into two equations. |
| 326 | 797bb6 | AK1 | Eliminates one variable correctly | Add or subtract the two equations so that one variable cancels, then solve for the remaining variable. |
| 327 | 797bb6 | AK2 | Determines the second dimension by substitution | Substitute your first dimension into one original equation and calculate the other dimension. |
| 328 | 797bb6 | CK2 | Forms the enlarged area as $(\text{their length}+x)(\text{their width}+x)$ | Increase each of your dimensions by $x$ and write the area as $(\text{your length}+x)(\text{your width}+x)$. |
| 329 | 797bb6 | AK3 | Expands to obtain $x^2+14x+45$, or correct follow-through from their dimensions | Expand your area product and collect like terms in descending powers of $x$. |
| 330 | 797bb6 | CK3 | Recognises that $x^2+14x+49=(x+7)^2$, or correct follow-through | Identify the perfect-square trinomial by squaring the bracket formed from half the coefficient of $x$. |
| 331 | 797bb6 | AK4 | Writes $(x+7)^2-4$, or correct completed-square follow-through | Use the balancing constant to rewrite your quadratic as a squared bracket minus a constant. |
| 332 | 797bb6 | CK4 | Sets their completed-square expression equal to $60$ | Set your completed-square expression equal to the required area. |
| 333 | 797bb6 | AK5 | Solves to obtain $x=1$ and $x=-15$, or correct follow-through | Isolate the squared bracket, take both square-root branches, and solve each resulting linear equation for $x$. |
| 334 | 797bb6 | R2 | Selects $x=1$ using the allowable interval | Choose the solution that lies within the allowable interval shown on the number line. |
| 335 | 797bb6 | R3 | Explains that $-15$ is not an allowable value of $x$ | State that you reject the other solution because it lies outside the allowable interval for $x$. |
| 336 | 797bbe | CK1 | Recognises that Figure 3 contains 40 lamps and identifies 15% of this total | Count the lamps in Figure 3 and identify the stated percentage of that total. |
| 337 | 797bbe | CK2 | Recognises that the uncovered lamps are the total less "their" covered lamps | Subtract your covered-lamp total from the total number of lamps to find your uncovered-lamp total. |
| 338 | 797bbe | AK2 | Calculates the percentage using "their" uncovered lamps out of 40 | Divide your uncovered-lamp total by the total number of lamps and multiply by $100\%$. |
| 339 | 797bbe | CK3 | Selects "their" uncovered percentage as the proportion of full-operation flashes produced | Use your uncovered percentage as the proportion of full-operation flashes the panel produces. |
| 340 | 797bbe | AK3 | Finds "their" percentage of 10 000 000 | Calculate your percentage of the full-operation flash total. |
| 341 | 797bbe | AK5 | Converts "their" number of flashes to $8.5 \times 10^6$ | Rewrite your number of flashes in standard form, using $a \times 10^n$. |
| 342 | 797bbe | R2 | Expresses "their" answer in standard form | State your flash output in standard form using $a \times 10^n$. |
| 343 | 797bbe | R3 | Concludes suitable using "their" standard-form output | Use your standard-form output to decide whether the panel is suitable for the event. |
| 344 | 797bbe | R4 | States that "their" output is greater than the minimum requirement | Compare your output with the minimum requirement and state that it is greater. |
| 345 | 797bda | CK3 | Recognises that underfilling occurs where the curve is below the $x$-axis | Look for the interval where the curve lies below the $x$-axis to identify when underfilling occurs. |
| 346 | 797bda | AK2 | Substitutes $x+1$ into $f$ to form $f(g(x))$ | Replace the input $x$ in $f$ with $x+1$ to write $f(g(x))$. |
| 347 | 797bda | R2 | Translates the roots using "their" result from (b), giving roots at $0$ and $6$ | Use your roots from part (b) and shift both one unit left to find the roots of the composite. |
| 348 | 797be2 | CK1 | States class width $50 - 40 = 10$ kg. | Subtract the lower class boundary from the upper class boundary to find the class width in kg. |
| 349 | 797be2 | CK2 | Selects appropriate class midpoints. | Find each class midpoint by averaging the two boundaries of that class. |
| 350 | 797be2 | AK1 | Obtains weighted total $\sum fx = 1900$. | Multiply every class midpoint by its frequency and add the products to calculate $\sum fx$. |
| 351 | 797be2 | AK2 | Divides by total frequency to obtain $1900 \div 40 = 47.5$. | Divide your weighted total by the total frequency using $\text{weighted total} \div \text{total frequency}$. |
| 352 | 797be2 | CK3 | Identifies the 20th value and the median class $40 \le m < 50$. | Find the halfway observation from the total frequency, then identify its class and write the boundaries as lower boundary $\le m <$ upper boundary. |
| 353 | 797be2 | AK3 | Interpolates to obtain estimated median $40 + \frac{20-11}{12}\times10 = 47.5$. | Interpolate within the median class by adding the lower boundary to $\frac{\text{position into class}}{\text{class frequency}}\times\text{class width}$. |
| 354 | 797be2 | R1 | Compares their estimated mean and median to conclude that the distribution is approximately symmetrical. | Compare your estimated mean with your estimated median and use how close they are to state whether the distribution is approximately symmetrical. |
| 355 | 797be2 | CK4 | Identifies quartile positions as the 10th and 30th values. | Find the observations one quarter and three quarters of the way through the total frequency. |
| 356 | 797be2 | AK4 | Interpolates to obtain $Q_1 \approx 38.6$ and $Q_3 \approx 57.8$. | Interpolate in the two quartile classes and record the estimates as $Q_1 \approx \ldots$ and $Q_3 \approx \ldots$. |
| 357 | 797be2 | AK5 | Uses their quartiles to calculate interquartile range and semi-interquartile range. | Subtract your lower quartile from your upper quartile, then divide this interquartile range by two to find the semi-interquartile range. |
| 358 | 797be2 | R2 | Expresses the estimated semi-interquartile range correct to 1 decimal place. | Round your estimated semi-interquartile range to one decimal place. |
| 359 | 797be2 | R3 | Uses their estimated median plus or minus their semi-interquartile range to decide that $58$ kg is not acceptable. | Use your estimated median plus or minus your semi-interquartile range to form the acceptable interval, compare the bag mass with it, and state that the bag is not acceptable. |
| 360 | 797bf4 | CK1 | Recognises that the translation vector is found from corresponding image and object coordinates. | Compare a point on the original outline with its matching point on the image and subtract the object coordinates from the image coordinates to find the translation vector. |
| 361 | 797bf4 | AK1 | Finds the horizontal displacement as $2-(-4)=6$. | Subtract the original $x$-coordinate from the matching image $x$-coordinate to find the horizontal displacement. |
| 362 | 797bf4 | AK2 | Finds the vertical displacement as $3-1=2$, giving $\binom{6}{2}$. | Subtract the original $y$-coordinate from the matching image $y$-coordinate and write both displacements as $\binom{\text{horizontal}}{\text{vertical}}$. |
| 363 | 797bf4 | CK2 | Recognises that reflection in $y=x$ interchanges the coordinates. | For a reflection in $y=x$, interchange the $x$- and $y$-coordinates. |
| 364 | 797bf4 | AK3 | Translates $H$ using 'their' vector to obtain $(5,0)$. | Add each component of your translation vector to the corresponding coordinate of $H$. |
| 365 | 797bf4 | AK4 | Reflects $(5,0)$ in $y=x$ to obtain $(0,5)$. | Reflect the point you obtain in $y=x$ by swapping its two coordinates. |
| 366 | 797bf4 | CK3 | States congruent. | State that the final triangular image is congruent to $ABC$ because the transformations preserve size and shape. |
| 367 | 797bf4 | R1 | States that the orientation is reversed because a reflection reverses orientation. | State that the orientation is reversed because a reflection reverses orientation. |
| 368 | 797bf4 | R2 | Reverses the transformations in the correct order, undoing the reflection before the translation. | Work backwards from the final image by undoing the reflection first and then undoing the translation. |
| 369 | 797bf4 | R3 | Uses $K''(-1,7)$ to determine the position before reflection as $(7,-1)$. | Reflect $K''$ in $y=x$ by interchanging its coordinates to locate the point before reflection. |
| 370 | 797bf4 | AK5 | Subtracts 'their' translation vector from $(7,-1)$. | Subtract your translation vector from the point before reflection to find your original point. |
| 371 | 797bf4 | R4 | Confirms that translating 'their' point and then reflecting gives $(-1,7)$. | Check your point by translating it with your vector and then reflecting it in $y=x$ to see whether it reaches the given final point. |
| 372 | 797bfc | CK1 | Uses $\vec{AB}=\vec{OB}-\vec{OA}$ | Find the displacement by subtracting the position vector of $A$ from the position vector of $B$ using $\vec{AB}=\vec{OB}-\vec{OA}$. |
| 373 | 797bfc | AK1 | Subtracts corresponding components to obtain $\begin{pmatrix}6\\8\end{pmatrix}$ | Subtract corresponding components in $\vec{OB}-\vec{OA}$ and write the differences in a column vector such as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 374 | 797bfc | AK2 | Finds $\|\vec{AB}\|=\sqrt{6^2+8^2}=10$ m | Use Pythagoras on the components of $\vec{AB}$ with $\|\vec{AB}\|=\sqrt{x^2+y^2}$, then state the length in m. |
| 375 | 797bfc | CK2 | Forms $\tan\theta=8/6$ for the angle north of east | Form $\tan\theta$ by dividing the northward component of $\vec{AB}$ by its eastward component. |
| 376 | 797bfc | AK3 | Evaluates $\theta=\tan^{-1}(8/6)$ | Use $\theta=\tan^{-1}(\text{your ratio})$ to calculate the angle. |
| 377 | 797bfc | R1 | Expresses the direction as $53.1°$ north of east, correct to 1 decimal place | State your angle to one decimal place and describe it as north of east. |
| 378 | 797bfc | CK3 | Recognises that $\vec{AC}=\dfrac{15}{\text{their }\|\vec{AB}\|}\vec{AB}$ | Scale your displacement vector with $\vec{AC}=\dfrac{15}{\text{your }\|\vec{AB}\|}\vec{AB}$. |
| 379 | 797bfc | R2 | Uses the scale factor $15/(\text{their }10)$ to obtain a displacement in the same direction as $\vec{AB}$ | Multiply every component of $\vec{AB}$ by $15/(\text{your }\|\vec{AB}\|)$ so that $\vec{AC}$ stays in the same direction. |
| 380 | 797bfc | AK4 | Adds $\vec{OA}$ to their $\vec{AC}$ to obtain $\vec{OC}=\begin{pmatrix}11\\14\end{pmatrix}$ | Add $\vec{OA}$ component by component to your $\vec{AC}$ and write the result as $\vec{OC}=\begin{pmatrix}x\\y\end{pmatrix}$. |
| 381 | 797bfc | CK4 | Forms $M$ using $\vec{AB}$ and their $\vec{AC}$ as columns | Form $M$ by placing $\vec{AB}$ and your $\vec{AC}$ as its two columns. |
| 382 | 797bfc | AK5 | Evaluates $\det M=(6)(12)-(9)(8)=0$, using their vectors | Evaluate $\det M$ by multiplying the entries on one diagonal and subtracting the product of the entries on the other diagonal, using your vectors. |
| 383 | 797bfc | R3 | Concludes that the markers are collinear since determinant zero shows their displacement vectors are parallel | Conclude that the points are collinear because $\det M=0$ shows your displacement vectors are parallel. |
| 384 | 797c5f | CK1 | Recognises that the $y$-intercept occurs when $x=0$. | Set $x=0$ and read where the line meets the $y$-axis. |
| 385 | 797c5f | CK2 | Identifies $m$ as the gradient of the line. | Use $m$ to represent the gradient of the line. |
| 386 | 797c5f | AK3 | Forms $y=3x-18$ using the gradient and their $y$-intercept. | Use your gradient and your $y$-intercept in $y=mx+c$ to form the equation of the line. |
| 387 | 797c5f | CK3 | Sets $y=0$ for the break-even condition. | Set $y=0$ because break-even means the profit is zero. |
| 388 | 797c5f | AK4 | Solves $0=3x-18$ to obtain $x=6$. | Solve $0=3x-18$ for $x$. |
| 389 | 797c5f | R1 | Interprets $x=6$ as 6 trays sold. | State that your $x$-value gives the number of trays sold at break-even. |
| 390 | 797c5f | CK4 | Forms the order size as "their" break-even number plus 3. | Add 3 to your break-even number to find the order size. |
| 391 | 797c5f | AK5 | Substitutes 9 into "their" equation for the line. | Substitute the order size into your equation for the line to calculate the profit. |
| 392 | 797c5f | R2 | Obtains a profit of 9 hundreds of dollars, equivalent to \$900. | Convert your profit from hundreds of dollars into dollars. |
| 393 | 797c5f | R3 | Compares \$900 with \$1 000 and correctly rejects the order. | Compare your profit with \$1 000 and use the comparison to decide whether to reject the order. |
| 394 | 797c67 | CK1 | Identifies cost price as the base for the percentage markup | Use the cost price as the amount you compare the markup with when calculating the percentage markup. |
| 395 | 797c67 | AK1 | Finds markup of \$120 | Subtract the cost price from the marked price to find the markup. |
| 396 | 797c67 | CK2 | Uses 60% of "their" percentage markup as the discount percentage | Find the discount percentage by taking $60\%$ of your percentage markup. |
| 397 | 797c67 | AK4 | Deducts "their" discount from the marked price to obtain \$510, or follows through correctly | Subtract your discount from the marked price to find your selling price. |
| 398 | 797c67 | CK3 | Identifies profit as selling price less cost price, using cost price as the percentage base | Subtract the cost price from the selling price for the profit, then use the cost price as the base for the percentage. |
| 399 | 797c67 | AK5 | Finds profit of \$30, or follows through from "their" selling price | Subtract the cost price from your selling price to find your profit. |
| 400 | 797c67 | R1 | Expresses "their" profit as a percentage of the cost price to obtain $6.25\%$ | Express your profit as a percentage of the cost price using $\%$. |
| 401 | 797c67 | R2 | Determines 10% of the cost price as \$48 | Calculate 10% of the cost price to find the required profit. |
| 402 | 797c67 | R3 | Adds the required profit to the cost price to obtain \$528 | Add the required profit to the cost price to find the minimum acceptable selling price. |
| 403 | 797c67 | R4 | States that the promotional price is not acceptable because "their" selling price is below "their" minimum price, or because "their" percentage profit is less than $10\%$ | State that the promotional price is not acceptable because your selling price is below your minimum price or your percentage profit is less than $10\%$. |
| 404 | 797c83 | CK1 | Identifies the distinct passenger numbers as $3,4,5,6,7$ | List each different passenger number shown in the table, without repeating any. |
| 405 | 797c83 | AK1 | Records frequencies $1$ and $5$ for $3$ and $4$ passengers respectively | Read the table and record the frequencies for the first two passenger numbers. |
| 406 | 797c83 | AK2 | Records frequencies $4$, $3$ and $2$ for $5$, $6$ and $7$ passengers respectively | Read the table and record the frequencies for the remaining three passenger numbers. |
| 407 | 797c83 | R1 | Forms the weighted total from the frequency table | Multiply each passenger number by its frequency and add all the products to form the weighted total. |
| 408 | 797c83 | AK3 | Obtains total passengers $75$ | Calculate the total number of passengers by adding your weighted products accurately. |
| 409 | 797c83 | CK2 | Identifies the median position as the eighth value | Order the data using the frequencies and identify the middle position. |
| 410 | 797c83 | R2 | States that Devon's entire statement is not correct | State that Devon's statement is not completely correct. |
| 411 | 797c83 | R3 | Uses "their" mean and median to support that $5$ can describe a typical trip | Use your mean and median to explain why the stated number can represent a typical trip. |
| 412 | 797c83 | R4 | Uses "their" mode to show that $4$, not $5$, is the most common number | Use your mode to show which passenger number occurs most often, rather than the number Devon claims. |
| 413 | 797c8b | CK1 | Recognises the courtyard as an outer rectangle with a rectangular cut-out | Treat the courtyard as one outer rectangle with a smaller rectangular cut-out removed. |
| 414 | 797c8b | AK1 | Calculates the areas of the outer rectangle and the cut-out | Calculate the area of the outer rectangle and subtract the area of the rectangular cut-out. |
| 415 | 797c8b | CK2 | Identifies that $1$ cm on the plan represents $2$ m actually | Read the scale to identify the actual length represented by each plan length. |
| 416 | 797c8b | R1 | Uses the squared linear scale factor with "their" plan area | Square the linear scale factor and multiply it by your plan area to convert to actual area. |
| 417 | 797c8b | CK3 | Uses the greatest possible overall dimensions and the least possible cut-out dimensions | Use the greatest possible overall dimensions and the least possible cut-out dimensions to maximise the area. |
| 418 | 797c8b | AK4 | Calculates the maximum plan area as $(8.05\times6.05)-(2.95\times1.95)=42.95\text{ cm}^2$ | Calculate the maximum plan area by evaluating $(\text{greatest overall length}\times\text{greatest overall width})-(\text{least cut-out length}\times\text{least cut-out width})$. |
| 419 | 797c8b | AK5 | Converts the maximum plan area to $171.8\text{ m}^2$ | Convert your maximum plan area to actual area using the squared scale factor. |
| 420 | 797c8b | R2 | Finds the difference between $171.8\text{ m}^2$ and "their" area in part (b) | Subtract your area from part (b) from your maximum actual area to find the margin of error. |
| 421 | 797c8b | CK4 | Compares $170\text{ m}^2$ with the interval based on "their" area and margin of error | Form the lower and upper limits using your area and margin of error, then check whether the stated area lies between them. |
| 422 | 797c8b | R3 | Concludes that the claim is reasonable and supports it using "their" allowable interval | State whether the claim is reasonable and justify your conclusion by referring to your allowable interval. |
| 423 | 797c98 | CK1 | Recognises that $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Find the translation vector by calculating $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$. |
| 424 | 797c98 | AK1 | Subtracts the position vectors to obtain $\binom{2}{0}$ | Subtract the two position vectors carefully and write the result as a column vector $\binom{a}{b}$. |
| 425 | 797c98 | CK2 | Uses "their" vector $\overrightarrow{AB}$ as the translation vector | Use your vector $\overrightarrow{AB}$ as the translation vector. |
| 426 | 797c98 | AK2 | Adds "their" translation vector to $A$ to obtain $A'$ | Add your translation vector to every coordinate of $A$ to find $A'$. |
| 427 | 797c98 | AK3 | Adds "their" translation vector to $C$ to obtain $C'$ | Add your translation vector to every coordinate of $C$ to find $C'$. |
| 428 | 797c98 | CK3 | Uses the rule $(x,y)\mapsto(-y,x)$ for a $90°$ anticlockwise rotation about the origin | Apply the rule $(x,y)\mapsto(-y,x)$ for a $90°$ anticlockwise rotation about the origin. |
| 429 | 797c98 | AK4 | Rotates "their" $A'$ to obtain $A''$ | Apply the rotation rule to your $A'$ coordinates to find $A''$. |
| 430 | 797c98 | AK5 | Rotates "their" $C'$ to obtain $C''$ | Apply the rotation rule to your $C'$ coordinates to find $C''$. |
| 431 | 797c98 | CK4 | States that the original triangle and final image are congruent | State that the original triangle and its final image are congruent. |
| 432 | 797c98 | R1 | States that the triangles have the same orientation | State that the original triangle and its final image have the same orientation. |
| 433 | 797c98 | R2 | Gives preservation of side lengths as a reason | Explain that translations and rotations preserve corresponding side lengths. |
| 434 | 797c98 | R3 | Gives preservation of angle sizes as a reason | Explain that translations and rotations preserve corresponding angle sizes. |
| 435 | 797caa | CK1 | States $\overrightarrow{AB}=\overrightarrow{OB}-\overrightarrow{OA}$ | Find $\overrightarrow{AB}$ by subtracting $\overrightarrow{OA}$ from $\overrightarrow{OB}$. |
| 436 | 797caa | CK2 | Uses $\det M=ad-bc$ for the $2\times2$ matrix | Use the determinant rule $\det M=ad-bc$ for the $2\times2$ matrix. |
| 437 | 797caa | AK2 | Obtains $\det M=26-2k$ using $\binom{4}{2}$ and $\overrightarrow{AC}$ | Write the matrix columns as $\binom{\text{horizontal}}{\text{vertical}}$, use your vector from part (a) and $\overrightarrow{AC}$, then simplify $\det M$. |
| 438 | 797caa | R1 | Equates "their" determinant expression to the recorded value $18$ | Set your determinant expression equal to the recorded determinant value. |
| 439 | 797caa | AK3 | Solves the resulting equation to obtain $k=4$ | Solve the resulting linear equation for $k$. |
| 440 | 797caa | AK4 | Uses "their" value of $k$ to calculate $\overrightarrow{DC}=\binom{4}{2}$ | Substitute your value of $k$ into the coordinates and subtract the position vectors to find $\overrightarrow{DC}$ as a $\binom{\text{horizontal}}{\text{vertical}}$ vector. |
| 441 | 797caa | CK3 | Forms $\tan\theta=\frac{2}{4}$ from "their" vector $\overrightarrow{DC}$ | Use the vertical and horizontal components of your $\overrightarrow{DC}$ to form $\tan\theta=\frac{\text{vertical}}{\text{horizontal}}$. |
| 442 | 797caa | AK5 | Calculates $\theta=26.565\ldots°$ from "their" ratio | Use inverse tangent on your ratio to calculate $\theta$, keeping the calculator display in the form $\theta=\ldots°$ before rounding. |
| 443 | 797caa | R2 | Expresses "their" direction correct to 1 decimal place | Round your direction to $1$ decimal place. |
| 444 | 797caa | R3 | Recognises that "their" equal vectors $\overrightarrow{AB}$ and $\overrightarrow{DC}$ represent opposite sides which are equal and parallel | Compare your equal vectors $\overrightarrow{AB}$ and $\overrightarrow{DC}$ and state that the corresponding opposite sides are equal and parallel. |
| 445 | 797caa | R4 | Concludes that $ABCD$ is a parallelogram | Use the equal-and-parallel opposite sides to conclude that $ABCD$ is a parallelogram. |
| 446 | 797cb2 | CK3 | Recognises that the line of symmetry bisects $BC$ | Use the line of symmetry to split $BC$ into two equal lengths. |
| 447 | 797cb2 | R1 | Forms a correct relationship in right-angled triangle $ABN$ | Use Pythagoras in right-angled triangle $ABN$ to write $AN^2+BN^2=AB^2$. |
| 448 | 797cb2 | AK2 | Substitutes $17$ and "their" $BN$ correctly | Substitute $17$ for $AB$ and your earlier $BN$ into $AN^2+BN^2=AB^2$. |
| 449 | 797cb2 | CK4 | Recognises that corresponding widths are proportional to their distances from $A$ | Use similar triangles to make the ratio of corresponding widths equal the ratio of distances from $A$. |
| 450 | 797cb2 | AK4 | Finds the distance from $A$ to the louvre as "their" $AN - 6$ | Calculate the louvre's distance from $A$ as your earlier $AN - 6$. |
| 451 | 797cb2 | R2 | Concludes that the louvre cannot fit | State that the louvre cannot fit because its required width is greater than the available width. |
| 452 | 797cb2 | R3 | Gives a valid comparison between $10\text{ cm}$ and "their" available width | Compare $10\text{ cm}$ with your available width and state which is greater. |
| 453 | 797cba | CK1 | Forms $x+y=240$ and $15x+9y=2880$ | Translate the total number of tickets and the total ticket income into two simultaneous equations in $x$ and $y$. |
| 454 | 797cba | AK1 | Eliminates one variable correctly | Multiply one equation if needed, then subtract the equations so that one variable cancels. |
| 455 | 797cba | R1 | Forms number of tickets as "their" total $-10(p-12)$ | Form the expected number of tickets by subtracting the reduction caused by the price change from your total. |
| 456 | 797cba | CK2 | Uses revenue $=$ price $\times$ number of tickets | Write revenue as price $\times$ number of tickets. |
| 457 | 797cba | AK3 | Expands to $R=-10p^2+360p$, follow-through on "their" total | Substitute your total into the revenue expression, expand the brackets, and collect the $p^2$ and $p$ terms. |
| 458 | 797cba | AK4 | Completes the square to $R=-10(p-18)^2+3240$, follow-through on "their" expanded expression | Rewrite your expanded expression by completing the square, starting by factoring out the coefficient of $p^2$. |
| 459 | 797cba | CK3 | Identifies $R=3200$ as the boundary revenue | Set $R$ equal to the required revenue level to find the boundary prices. |
| 460 | 797cba | AK5 | Solves the boundary equation to obtain $p=16$ or $p=20$, follow-through on "their" completed-square form | Use your completed-square form to solve the boundary equation and find both possible prices. |
| 461 | 797cba | R2 | Uses "their" completed-square form to determine that the revenue condition holds between the boundary prices | Use your completed-square form to identify the interval between the two boundary prices where revenue is at least the required level. |
| 462 | 797cba | R3 | Selects all whole-dollar values from $16\le p\le20$ | List every whole-dollar price in the interval, remembering that each $\le$ sign includes its boundary price. |
| 463 | 797cba | R4 | Explains that the revenue requirement and the whole-dollar restriction give the listed values | Explain that the values must satisfy both the revenue requirement and the whole-dollar price restriction. |
| 464 | 797cc2 | CK1 | Identifies $48\ 000$ L as the whole quantity. | Treat $48\ 000$ L as the whole weekly water-use quantity before finding the rainwater share. |
| 465 | 797cc2 | AK1 | Finds one eighth of $48\ 000$. | Divide $48\ 000$ by $8$ to find one eighth of the weekly water use. |
| 466 | 797cc2 | CK2 | Uses the usual weekly water use as the denominator. | Use the usual weekly water use as the denominator when calculating the rainwater percentage. |
| 467 | 797cc2 | R1 | States that “their” percentage meets the target. | State clearly whether your percentage meets the target. |
| 468 | 797cc2 | R2 | Justifies the decision by comparing “their” percentage with $35\%$. | Compare your percentage with $35\%$ and use the comparison to justify your decision. |
| 469 | 797cc2 | CK3 | Recognises that the annual estimate requires $2\ 500$ households and $52$ weeks. | Include both $2\ 500$ households and $52$ weeks when setting up the annual estimate. |
| 470 | 797cc2 | AK4 | Calculates the annual usual water use as $48\ 000 \times 2\ 500 \times 52$. | Multiply $48\ 000 \times 2\ 500 \times 52$ to calculate the annual usual water use. |
| 471 | 797cc2 | R3 | Applies “their” percentage from part (b) to the annual usual water use. | Convert your percentage from part (b) to a decimal and apply it to the annual usual water use. |
| 472 | 797cc2 | AK5 | Obtains $2\ 340\ 000\ 000$ L. | Calculate the annual rainwater total in litres, keeping the thousands groups spaced as $1\ 000$ when you write it. |
| 473 | 797cc2 | R4 | Expresses “their” answer in standard form. | Rewrite your annual litre total in standard form as $a \times 10^n$, where $1 \le a < 10$. |
| 474 | 797cca | CK1 | Recognises that $fg(1)=f(g(1))$ | Rewrite $fg(1)$ as $f(g(1))$ before evaluating the functions in order. |
| 475 | 797cca | CK2 | Identifies the required height as 4 m below "their" height from (a) | Subtract 4 m from your height from part (a) to find the required height. |
| 476 | 797cca | AK2 | Solves $f(g(p))=5$ to obtain the corresponding horizontal coordinates $0$ and $4$ | Set $f(g(p))=5$ and solve for the corresponding horizontal coordinates on the graph. |
| 477 | 797cca | AK3 | Uses $g(p)=p+1$ to obtain $p=-1$ and $p=3$ | Use $g(p)=p+1$ to convert each horizontal coordinate into a value of $p$. |
| 478 | 797cca | CK3 | Recognises that the axis is midway between the two corresponding horizontal coordinates | Find the midpoint of the two corresponding horizontal coordinates to locate the axis of symmetry. |
| 479 | 797cca | AK4 | States the axis of symmetry as $x=2$ | Write the axis of symmetry as an equation in $x$ using the midpoint. |
| 480 | 797cca | R2 | Uses "their" equal-height positions and the position of the maximum to state $0<x<4$ | Use your equal-height positions and the position of the maximum to write the open interval where the graph is above the required height. |
| 481 | 797cca | CK4 | States that $f(x)=0$ has 2 roots | State how many roots the equation $f(x)=0$ has by counting the intercepts. |
| 482 | 797cca | R3 | Justifies the two roots by identifying two crossings of the $x$-axis | Justify the number of roots by identifying the two crossings of the $x$-axis. |
| 483 | 797cd7 | CK1 | Identifies 1, 2, 3, 4 and 6 as the elements of $U$ which are factors of 12 | List the elements of $U$ that divide 12 exactly. |
| 484 | 797cd7 | AK1 | Writes the identified elements correctly in listing form | Write your identified elements of $A$ in a comma-separated listing. |
| 485 | 797cd7 | CK2 | Recognises that each required subset contains type 3 and one other element of "their" set $A$ | Form each required pair by combining type 3 with one other element from your set $A$. |
| 486 | 797cd7 | AK2 | Lists $\{1,3\}$ and $\{2,3\}$ | List the two-element subsets that contain 3 by pairing it with 1 and with 2: $\{1,3\}$ and $\{2,3\}$. |
| 487 | 797cd7 | AK3 | Lists $\{3,4\}$ and $\{3,6\}$ | Continue pairing 3 with each of the remaining elements, one pair at a time. |
| 488 | 797cd7 | CK3 | Recognises that type 3 is drought-tolerant | Check whether type 3 belongs to the drought-tolerant set. |
| 489 | 797cd7 | CK4 | Identifies 2 and 6 as the butterfly-attracting elements of "their" set $A$ | Identify the butterfly-attracting elements in your set $A$. |
| 490 | 797cd7 | AK4 | Selects $\{2,3\}$ from "their" list | From your list, select the pair that contains one drought-tolerant type and one butterfly-attracting type. |
| 491 | 797cd7 | AK5 | Selects $\{3,6\}$ from "their" list | From your list, select $\{3,6\}$ because it contains a drought-tolerant type and a butterfly-attracting type. |
| 492 | 797cd7 | R1 | Tests all possible additions to "their" selection $\{2,3\}$ against both conditions | Add each remaining type to your selection $\{2,3\}$ and check both conditions each time. |
| 493 | 797cd7 | R2 | Tests all possible additions to "their" selection $\{3,6\}$ against both conditions | Add each remaining type to your selection $\{3,6\}$ and check both conditions each time. |
| 494 | 797cd7 | R3 | Concludes that no permitted three-type selection has exactly two elements in each of $D$ and $B$ | State whether any permitted three-type selection has exactly two elements in each of $D$ and $B$. |
| 495 | 797cdf | CK1 | States lower class boundary $59.5$ | Subtract half a minute from the lower class limit to find the lower class boundary. |
| 496 | 797cdf | CK2 | States upper class boundary $69.5$ | Add half a minute to the upper class limit to find the upper class boundary. |
| 497 | 797cdf | CK3 | Identifies appropriate class midpoints | Find each class midpoint by averaging its lower and upper class boundaries. |
| 498 | 797cdf | AK1 | Calculates $\sum fx = 2680$ | Multiply each class midpoint by its frequency and add the products to calculate $\sum fx$. |
| 499 | 797cdf | AK2 | Divides $2680$ by $40$ to obtain $67$ | Divide your total $\sum fx$ by the total frequency to estimate the mean journey time. |
| 500 | 797cdf | CK4 | Identifies the first- and third-quartile positions as the 10th and 30th values | Use the total frequency to locate the first- and third-quartile positions in the ordered data. |

## Batch 6 — approved (500 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 500 rows. Row 185 set to his sentence.

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | 797cdf | AK3 | Interpolates to obtain first quartile $58.1$ min, using 'their' class boundaries | Use your class boundaries to linearly interpolate within the first-quartile class. |
| 2 | 797cdf | AK4 | Interpolates to obtain third quartile $77.3$ min, using 'their' class boundaries | Use your class boundaries to linearly interpolate within the third-quartile class. |
| 3 | 797cdf | AK5 | Calculates $77.3 - 58.1 = 19.2$ min, or follows through from 'their' quartiles | Subtract your first quartile from your third quartile to calculate the interquartile range. |
| 4 | 797cdf | R1 | Expresses 'their' interquartile range correct to 1 decimal place | Write your interquartile range correct to 1 decimal place. |
| 5 | 797cdf | R2 | Uses 'their' estimated mean to reject $70$ min as the typical journey time | Compare your estimated mean with $70$ min and state why this does not support $70$ min as typical. |
| 6 | 797cdf | R3 | Uses 'their' interquartile range to justify that the middle half of the times is not tightly grouped | Use your interquartile range to explain why the middle half of the journey times is not tightly grouped. |
| 7 | 797ce7 | CK1 | Recognises that reversing the debit adds $5$ to the balance | Reverse the debit by adding its magnitude back to the balance. |
| 8 | 797ce7 | AK1 | Evaluates $-26+7$ | Calculate the sum of the starting balance and the deposit. |
| 9 | 797ce7 | AK2 | Adds $5$ to obtain $-14$ | Add the reversed debit amount to your intermediate balance. |
| 10 | 797ce7 | CK2 | Represents the supporters' deposits by $4x$ | Represent the deposits from $x$ supporters by multiplying the amount each supporter pays by $x$. |
| 11 | 797ce7 | AK3 | Forms "their" balance plus $4x-2$ | Form your balance after including the supporters' deposits and subtracting the charges. |
| 12 | 797ce7 | R1 | Simplifies using "their" balance to obtain $4x-16$ | Simplify your expression by combining the constant terms while keeping the $x$ term. |
| 13 | 797ce7 | AK4 | Expands $2(2x-8)$ to obtain $4x-16$ | Expand $2(2x-8)$ by multiplying the outside factor by both terms in the bracket. |
| 14 | 797ce7 | AK5 | Obtains the expression from part (b), or a correct follow-through equivalent | Write the expression from part (b) and compare it with your expanded expression. |
| 15 | 797ce7 | R2 | States that the expressions are identical because both simplify to the same expression | State that the expressions are identical because they simplify to the same expression. |
| 16 | 797ce7 | CK3 | Forms the condition "their" final balance is greater than or equal to zero | Write an inequality showing that your final balance is $\geq 0$. |
| 17 | 797ce7 | R3 | Solves "their" non-negative balance condition to obtain $x\geq4$ | Solve your non-negative balance condition and state the resulting bound on $x$ using $\geq$. |
| 18 | 797ce7 | R4 | Selects $4$ as the least whole number of supporters | Choose the least whole-number supporter count that satisfies your inequality. |
| 19 | a9f4c8 | CK1 | Equates corresponding entries to obtain $x=4$ | Equate the corresponding entries and solve for $x$. |
| 20 | a9f4c8 | AK1 | Obtains $y=3$ from corresponding entries | Equate the corresponding entries and solve for $y$. |
| 21 | a9f4c8 | CK2 | Forms $\vec{AB}=\vec{OB}-\vec{OA}$ | Form $\vec{AB}=\vec{OB}-\vec{OA}$ by subtracting the position vector of $A$ from the position vector of $B$. |
| 22 | a9f4c8 | AK3 | Calculates $\|\vec{AB}\|=10$ | Calculate $\|\vec{AB}\|$ using the square root of the sum of the squared components. |
| 23 | a9f4c8 | CK3 | Divides $\vec{AB}$ by its magnitude to form a unit vector | Divide $\vec{AB}$ by $\|\vec{AB}\|$ to form a unit vector in the same direction. |
| 24 | a9f4c8 | AK4 | Obtains $\begin{pmatrix}\frac{3}{5}\\\frac{4}{5}\end{pmatrix}$ | Simplify both components of your unit vector and write it as $\begin{pmatrix}\frac{a}{b}\\\frac{c}{d}\end{pmatrix}$. |
| 25 | a9f4c8 | R2 | Uses the magnitude of "their" $\vec{OC}$ to obtain $\sqrt{890}$ | Use your $\vec{OC}$ components to calculate its magnitude with $\sqrt{x^2+y^2}$. |
| 26 | a9f4c8 | R3 | Expresses "their" distance correct to 3 significant figures | Round your direct distance to 3 significant figures. |
| 27 | a9f4c8 | R4 | Compares "their" direct distance with 30 km and concludes that the worker can return | Compare your direct distance with 30 km and state whether the worker can return directly. |
| 28 | a9f4d0 | CK1 | Recognises that the translation vector is found from $\overrightarrow{AA'}$. | Find the translation vector by calculating $\overrightarrow{AA'}$ from $A$ to $A'$. |
| 29 | a9f4d0 | AK1 | Calculates $\begin{pmatrix}3-1\\2-1\end{pmatrix}=\begin{pmatrix}2\\1\end{pmatrix}$. | Subtract the coordinates of $A$ from those of $A'$ coordinate by coordinate and write the result as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 30 | a9f4d0 | AK2 | Applies 'their' translation vector to the coordinates of $B$. | Add your translation vector to the coordinates of $B$ to find $B'$. |
| 31 | a9f4d0 | CK2 | Uses the scale-factor relationship $KA''=2KA'$ for corresponding points. | Use the enlargement relationship $KA''=2KA'$ for a pair of corresponding points. |
| 32 | a9f4d0 | AK5 | Uses $K=2A'-A''$ to obtain $(-2,2)$. | Rearrange the relationship as $K=2A'-A''$ and use the coordinates of $A'$ and $A''$. |
| 33 | a9f4d0 | R1 | Confirms 'their' centre using 'their' $C'$ and $C''$. | Confirm your centre by checking that your $C'$ and $C''$ give the same centre under the enlargement. |
| 34 | a9f4d0 | CK3 | States similar. | State that the triangles are similar. |
| 35 | a9f4d0 | CK4 | States same orientation. | State that the triangles have the same orientation. |
| 36 | a9f4d0 | R2 | Judges that the triangles are not congruent. | Judge that the triangles are not congruent. |
| 37 | a9f4d0 | R3 | Justifies the judgement by stating that corresponding sides are twice as long. | Justify this by stating that corresponding sides are twice as long. |
| 38 | a9f4d8 | CK1 | States $\vec{AB}=\vec{OB}-\vec{OA}$ | Write the displacement as $\vec{AB}=\vec{OB}-\vec{OA}$ before doing any subtraction. |
| 39 | a9f4d8 | AK1 | Subtracts the position vectors to obtain $\binom{6}{4}$ | Subtract the coordinates of the position vectors component by component and write the result as a column vector $\binom{\text{horizontal change}}{\text{vertical change}}$. |
| 40 | a9f4d8 | CK2 | Forms $\tan\theta=6/4$ using the components of “their” $\vec{AB}$ | Use the horizontal and vertical components of your $\vec{AB}$ to form $\tan\theta=\frac{\text{east component}}{\text{north component}}$. |
| 41 | a9f4d8 | AK2 | Calculates $\theta\approx56°$ and gives the bearing $056°$ | Calculate $\theta\approx\text{your angle}$, round to the nearest degree, and write it as a three-figure bearing. |
| 42 | a9f4d8 | AK3 | Calculates $\vec{CD}=\vec{OD}-\vec{OC}=\binom{6}{4}$ | Find $\vec{CD}=\vec{OD}-\vec{OC}$ by subtracting the coordinates component by component and recording the result as $\binom{\text{horizontal change}}{\text{vertical change}}$. |
| 43 | a9f4d8 | R1 | Compares $\vec{CD}$ with “their” $\vec{AB}$ | Compare $\vec{CD}$ with your $\vec{AB}$ to check whether the direction vectors are equal. |
| 44 | a9f4d8 | R2 | Concludes that $AB\parallel CD$ from equal direction vectors | State $AB\parallel CD$ when the two direction vectors are equal. |
| 45 | a9f4d8 | CK3 | Recognises that the magnitude of the determinant of two adjacent side vectors gives the area of the parallelogram | Use the magnitude of the determinant of two adjacent side vectors to find the area of the parallelogram. |
| 46 | a9f4d8 | AK4 | Finds $\vec{AC}=\vec{OC}-\vec{OA}=\binom{3}{8}$ | Calculate $\vec{AC}=\vec{OC}-\vec{OA}$ and write the coordinate differences as $\binom{\text{horizontal change}}{\text{vertical change}}$. |
| 47 | a9f4d8 | AK5 | Evaluates $\begin{vmatrix}6&3\\4&8\end{vmatrix}=6(8)-4(3)=36$ | Substitute the components of your adjacent vectors into $\begin{vmatrix}a&b\\c&d\end{vmatrix}=a(d)-c(b)$ and evaluate the determinant. |
| 48 | a9f4d8 | R3 | Uses $\vec{AB}$ and $\vec{AC}$ as adjacent vectors for quadrilateral $ABDC$ | Use $\vec{AB}$ and $\vec{AC}$ as the adjacent vectors from the same vertex of quadrilateral $ABDC$. |
| 49 | a9f4e0 | CK1 | Identifies $AN$ as the line of symmetry | Identify $AN$ as the line that reflects the triangle onto itself. |
| 50 | a9f4e0 | CK3 | Selects Pythagoras' theorem for right-angled triangle $ABC$ | Use Pythagoras' theorem because triangle $ABC$ is right-angled. |
| 51 | a9f4e0 | AK1 | Calculates $BC^2 = 10^2 + 10^2$ | Calculate $BC^2 = 10^2 + 10^2$ using Pythagoras' theorem. |
| 52 | a9f4e0 | R2 | States that the line of symmetry bisects $BC$ | State that the line of symmetry bisects $BC$. |
| 53 | a9f4e0 | CK4 | Recognises that triangle $ABN$ is right-angled | Recognise that triangle $ABN$ is right-angled at $N$. |
| 54 | a9f4e0 | AK3 | Uses Pythagoras' theorem with $AB = 10$ and "their" $BN$ to obtain $AN$ | Use Pythagoras' theorem in triangle $ABN$, substituting $AB = 10$ and your earlier $BN$ value to find $AN$. |
| 55 | a9f4e0 | AK4 | Uses "their" $BC$ and "their" $AN$ as the base and perpendicular height | Use your earlier $BC$ as the base and your earlier $AN$ as the perpendicular height in the triangle area formula. |
| 56 | a9f4e0 | R3 | Compares "their" area with $48\text{ m}^2$ and concludes that the sheet is not sufficient | Compare your area with $48\text{ m}^2$ and conclude that the sheet is not sufficient. |
| 57 | a9f4e8 | CK1 | Recognises that gradient is calculated using change in $y$ divided by change in $x$. | Calculate the gradient by dividing the change in $y$ by the change in $x$. |
| 58 | a9f4e8 | CK2 | Identifies the $y$-intercept as $-6$. | Read the $y$-intercept from where the line crosses the $y$-axis. |
| 59 | a9f4e8 | AK2 | Substitutes "their" gradient and $-6$ into $y=mx+c$. | Substitute the gradient you found and the $y$-intercept into $y=mx+c$. |
| 60 | a9f4e8 | CK3 | Sets $y=0$ to determine the $x$-intercept. | Set $y=0$ before solving for the $x$-intercept. |
| 61 | a9f4e8 | AK3 | Solves "their" equation for $x$. | Rearrange the equation you formed to make $x$ the subject. |
| 62 | a9f4e8 | R3 | Determines the new break-even quantity as one less than "their" present break-even quantity. | Subtract one from the break-even quantity you found earlier to get the new break-even quantity. |
| 63 | a9f4e8 | CK4 | Recognises that retaining the starting cost gives $c=-6$. | Keep the same starting cost, so use the original $y$-intercept as $c$. |
| 64 | a9f4e8 | AK4 | Uses the new intercept to form and solve $0=2m-6$. | Use the new break-even point and the unchanged intercept to form an equation in $m$, then solve it. |
| 65 | a9f4f5 | CK1 | Recognises that the markup is calculated as a percentage of the cost price | Use the cost price as the base when you calculate the markup percentage. |
| 66 | a9f4f5 | AK1 | Calculates 25% of \$2 400 | Calculate the markup by finding $25\%$ of the cost price. |
| 67 | a9f4f5 | CK2 | Recognises that the discount is calculated on the marked price | Use the marked price as the base when you calculate the discount percentage. |
| 68 | a9f4f5 | AK3 | Calculates 10% of "their" marked price | Calculate the discount by finding $10\%$ of your marked price. |
| 69 | a9f4f5 | CK3 | Recognises that percentage profit is calculated using the cost price as the base | Divide the profit by the cost price before converting it to a percentage. |
| 70 | a9f4f5 | AK5 | Calculates profit as "their" selling price minus \$2 400 | Find the profit by subtracting the cost price from your selling price. |
| 71 | a9f4f5 | R2 | Finds the allowable fall from "their" percentage profit to 8% | Find how many percentage points your percentage profit can fall to reach $8\%$. |
| 72 | a9f4f5 | R3 | Relates this allowable fall to a reduction in "their" selling price | Convert that allowable percentage-profit fall into the corresponding reduction in your selling price. |
| 73 | a9f4fd | CK1 | Recognises that the total is found by adding all frequencies | Add all the frequencies to find the total number of crates. |
| 74 | a9f4fd | CK2 | Uses number of bruised mangoes and frequency as the table variables | Use number of bruised mangoes and frequency as the two headings in your table. |
| 75 | a9f4fd | AK2 | Records all frequencies correctly and includes total 20 | Copy each frequency into the correct row and add them to give your total. |
| 76 | a9f4fd | R1 | Forms a weighted-mean calculation using the frequencies | Multiply each bruised-mango value by its frequency, add the products, and divide by the total frequency. |
| 77 | a9f4fd | AK3 | Calculates $\sum fx = 45$ | Calculate $\sum fx$ by adding all the value-frequency products. |
| 78 | a9f4fd | R2 | Determines that 12 of "their" 20 crates have no more than 2 bruised mangoes | Add the frequencies for crates with no more than 2 bruised mangoes and compare this with half of your total. |
| 79 | a9f4fd | R3 | Explains that the median is less affected by the larger values than the mean | Explain that larger numbers affect the mean more than the median, so use the median for a typical crate. |
| 80 | a9f4fd | R4 | Concludes that the delivery should be accepted, supported by "their" frequency evidence and median | Use your frequency evidence and your median to decide whether the delivery should be accepted. |
| 81 | a9f505 | CK1 | Reads the intercepts as $(1,0)$ and $(5,0)$ | Read the coordinates where the curve crosses the $x$-axis. |
| 82 | a9f505 | R1 | Forms $b+c=-1$ and $5b+c=-25$ | Substitute each $x$-intercept into $P=x^2+bx+c$ with $P=0$ to form two simultaneous equations in $b$ and $c$. |
| 83 | a9f505 | AK1 | Eliminates one unknown from "their" simultaneous equations | Subtract or otherwise combine your simultaneous equations to eliminate one unknown. |
| 84 | a9f505 | AK2 | Substitutes to obtain the second value from "their" value of $b$ or $c$ | Substitute your value of $b$ or $c$ into one of your simultaneous equations to find the other constant. |
| 85 | a9f505 | CK3 | Recognises that $x^2-6x+9=(x-3)^2$ | Rewrite the perfect-square trinomial as the square of a binomial. |
| 86 | a9f505 | AK3 | Adds and subtracts $9$ correctly in "their" quadratic expression | Add and subtract $9$ in your quadratic expression so that the added terms form a perfect square. |
| 87 | a9f505 | AK4 | Obtains $(x-3)^2-4$ from "their" values of $b$ and $c$ | Use your values of $b$ and $c$ to write your quadratic expression in completed-square form. |
| 88 | a9f505 | CK4 | Interprets \$300 below target as $P=-3$ | Translate an operating cost of \$300 below target into an equation for $P$ with the correct sign. |
| 89 | a9f505 | AK5 | Uses "their" completed-square expression to form $(x-3)^2-4=-3$ | Substitute the below-target value of $P$ into your completed-square expression to form an equation. |
| 90 | a9f505 | R2 | Considers both square-root branches when solving "their" equation | When you take the square root of your equation, use both the positive and negative branches. |
| 91 | a9f50d | CK1 | Identifies the deducted fraction as $1-\frac{5}{8}=\frac{3}{8}$ | Subtract the retained fraction from 1 to find the deducted fraction, using $1-\frac{a}{b}$. |
| 92 | a9f50d | AK1 | Finds $\frac{3}{8}$ of \$48 000 | Multiply the deducted fraction by \$48 000 to find the amount deducted, using $\frac{a}{b}$ of the gross pay. |
| 93 | a9f50d | CK2 | Identifies a coefficient between 1 and 10 | Choose a coefficient that is at least 1 but less than 10. |
| 94 | a9f50d | AK3 | Moves the decimal point four places to obtain $1.8 \times 10^4$ | Move the decimal point four places, then write the number using the matching power of ten in $a\times10^n$. |
| 95 | a9f50d | R1 | Expresses "their" deduction in standard form | Express your deduction in standard form as $a\times10^n$. |
| 96 | a9f50d | CK3 | Uses deduction divided by gross pay multiplied by 100 | Divide the deduction by the gross pay, then multiply by 100 to convert it to a percentage. |
| 97 | a9f50d | AK4 | Substitutes "their" deduction and \$48 000 into the percentage calculation | Substitute your deduction and \$48 000 into the percentage calculation before evaluating it. |
| 98 | a9f50d | CK4 | Recognises that both deductions must be compared as percentages of the same gross pay | Convert both deductions to percentages of the same gross pay before comparing them. |
| 99 | a9f50d | R2 | Determines that the proposed deduction is $50\%$ of gross pay | Calculate the proposed deduction as a percentage of gross pay and write it with the $\%$ sign. |
| 100 | a9f50d | R3 | Compares $50\%$ with "their" original percentage and concludes correctly that the difference is 12.5 percentage points | Compare the proposed percentage with your original percentage, subtract to find the difference in percentage points, and use this to decide whether the statement is correct. |
| 101 | a9f515 | CK3 | Substitutes $g(x)$ for $x$ in $f(x)$ | Replace every $x$ in $f(x)$ with $g(x)$ before simplifying the composite function. |
| 102 | a9f515 | AK1 | Uses "their" turning-point $x$-coordinate to obtain $g(x)=x-4$ | Use your turning-point $x$-coordinate as the value subtracted in $g(x)$. |
| 103 | a9f515 | AK3 | Obtains axis value $8$ from "their" completed-square expression | Read the axis value from the number that makes the squared bracket in your completed-square expression equal to zero. |
| 104 | a9f515 | AK4 | Obtains maximum value $9$ from "their" completed-square expression | Use the constant outside the squared term in your completed-square expression to identify the maximum value. |
| 105 | a9f515 | R2 | Concludes that $fg(x)=0$ has two roots | Conclude that $fg(x)=0$ has two roots after you find two distinct solutions for $x$. |
| 106 | a9f515 | AK5 | Solves "their" equation to obtain the root $x=5$ | Solve your equation by isolating the squared term and taking both square roots to find the smaller root. |
| 107 | a9f515 | R3 | Uses symmetry about "their" axis to obtain the second root $x=11$ | Reflect your first root across your axis of symmetry to find the second root. |
| 108 | a9f515 | R4 | Finds the positive interval length from "their" roots, $11-5=6$ weeks | Subtract your smaller root from your larger root to find the length of the positive interval in weeks. |
| 109 | a9f51d | CK1 | Recognises that a scale of $1:500$ gives $5$ m for $1$ cm | Convert the scale statement into the actual distance in metres represented by one centimetre on the plan. |
| 110 | a9f51d | CK2 | Recognises the bed as a rectangle and a semicircle | Split the bed into a rectangular part and a semicircular part before finding its area. |
| 111 | a9f51d | AK1 | Calculates the rectangle area as $60 \times 40 = 2400\text{ m}^2$ | Multiply the actual length by the actual width to find the rectangle's area in $\text{m}^2$. |
| 112 | a9f51d | AK2 | Calculates the semicircle area and combines it with the rectangle area | Find the area of the semicircle using its radius, then add it to the rectangle's area. |
| 113 | a9f51d | R1 | Expresses the area exactly as $2400 + 450\pi\text{ m}^2$ | Write your total area exactly in $\text{m}^2$, keeping $\pi$ instead of changing it to a decimal. |
| 114 | a9f51d | CK3 | Uses plan limits of $11.95$ cm to $12.05$ cm and $7.95$ cm to $8.05$ cm | Form lower and upper plan dimensions by subtracting and adding the stated measurement tolerance to both given dimensions. |
| 115 | a9f51d | AK3 | Calculates the minimum area using the lower limits | Use both lower actual dimensions and the corresponding lower semicircle radius to calculate the minimum possible area. |
| 116 | a9f51d | AK4 | Calculates the maximum area using the upper limits | Use both upper actual dimensions and the corresponding upper semicircle radius to calculate the maximum possible area. |
| 117 | a9f51d | AK5 | Finds the greatest difference between "their" area in part (b) and either limiting area | Find the difference between your area from part (b) and each limiting area, then choose the greater difference. |
| 118 | a9f51d | R2 | Gives all three estimates as whole square metres | Give the minimum, maximum, and part (b) area estimates as whole $\text{m}^2$. |
| 119 | a9f51d | R3 | Compares $3760\text{ m}^2$ with "their" minimum possible area | Compare the reported area with your minimum possible area. |
| 120 | a9f51d | R4 | Concludes that the reported value cannot be due only to the stated measurement error | State whether the reported area can result only from the stated measurement error, using your comparison. |
| 121 | a9f52a | CK1 | States the lower class boundary as $19.5$. | Subtract half a unit from the lower class limit to find the lower class boundary. |
| 122 | a9f52a | CK2 | Finds the class midpoint as $24.5$. | Add the two class limits and divide by two to find the class midpoint. |
| 123 | a9f52a | CK3 | Identifies both classes with greatest frequency as $30-39$ and $40-49$. | Find the greatest frequency and list every class that has this frequency. |
| 124 | a9f52a | R1 | Uses cumulative frequencies to locate the class containing the 20th value, giving $30-39$. | Create cumulative frequencies, then identify the class containing the median-position value. |
| 125 | a9f52a | CK4 | Uses class midpoints with their corresponding frequencies. | Calculate each class midpoint and pair it with the frequency from the same class. |
| 126 | a9f52a | AK1 | Calculates the sum of frequency-midpoint products as $1450$. | Multiply each frequency by its corresponding midpoint and add all the products. |
| 127 | a9f52a | AK2 | Divides $1450$ by $40$ to obtain $36.25$. | Divide the total of the frequency-midpoint products by the total frequency. |
| 128 | a9f52a | AK3 | Estimates the lower quartile using the appropriate class, obtaining $28.07$ or equivalent. | Use the lower-quartile class boundary, cumulative frequency before the class, class frequency, and class width to interpolate your lower quartile. |
| 129 | a9f52a | AK4 | Estimates the upper quartile using the appropriate class, obtaining $45.33$ or equivalent. | Use the upper-quartile class boundary, cumulative frequency before the class, class frequency, and class width to interpolate your upper quartile. |
| 130 | a9f52a | AK5 | Finds their semi-interquartile range from their quartile estimates. | Subtract your lower-quartile estimate from your upper-quartile estimate and divide by two. |
| 131 | a9f52a | R2 | Expresses their semi-interquartile range to 2 decimal places. | Round your semi-interquartile range to two decimal places. |
| 132 | a9f52a | R3 | Compares 'their' mean with the midpoint of 'their' median class plus or minus 'their' semi-interquartile range, and gives a valid decision. | Find the midpoint of your median class, form the interval one of your semi-interquartile ranges above and below it, and compare your mean with this interval before stating the decision. |
| 133 | a9f537 | CK1 | Recognises that the translation vector is found from $A'$ minus $A$. | Find the translation vector by subtracting the coordinates of $A$ from the corresponding coordinates of $A'$. |
| 134 | a9f537 | AK1 | Subtracts components to obtain $\begin{pmatrix}6\\-3\end{pmatrix}$. | Subtract the coordinates component by component to write the translation vector as $\begin{pmatrix}6\\-3\end{pmatrix}$. |
| 135 | a9f537 | CK2 | Recognises that the same translation vector is applied to every vertex. | Use the same translation vector for every vertex of the shape. |
| 136 | a9f537 | AK2 | Applies "their" translation vector to $B$ to obtain $B'=(4,1)$. | Add your translation vector to the coordinates of $B$ to find $B'=(4,1)$. |
| 137 | a9f537 | AK3 | Applies "their" translation vector to $C$ to obtain $C'=(5,-2)$. | Add your translation vector to the coordinates of $C$ to find $C'=(5,-2)$. |
| 138 | a9f537 | R1 | Uses "their" translation vector consistently for both image vertices. | Check that you add the same components of your translation vector to both $B$ and $C$. |
| 139 | a9f537 | CK3 | Recognises that $A'$ remains fixed and that displacements from $A'$ are doubled. | Keep $A'$ fixed as the centre and double each displacement measured from $A'$. |
| 140 | a9f537 | AK4 | Uses scale factor $2$ about $A'$ to obtain $B''=(6,4)$ from "their" $B'$. | Starting at $A'$, double the displacement from $A'$ to your $B'$ and use it to locate $B''=(6,4)$. |
| 141 | a9f537 | AK5 | Uses scale factor $2$ about $A'$ to obtain $C''=(8,-2)$ from "their" $C'$. | Starting at $A'$, double the displacement from $A'$ to your $C'$ and use it to locate $C''=(8,-2)$. |
| 142 | a9f537 | R2 | Maintains the stated centre $A'$ when enlarging both of "their" image vertices. | Use the stated centre $A'$ for the enlargement of both your image vertices. |
| 143 | a9f537 | R3 | States that the triangles are not congruent. | State that the triangles are not congruent. |
| 144 | a9f537 | R4 | Justifies that corresponding lengths are doubled, so the triangles are similar but not congruent. | Explain that scale factor $2$ doubles corresponding lengths, so the triangles are similar but not congruent. |
| 145 | a9f53f | CK1 | Uses $\vec{AB}=\vec{OB}-\vec{OA}$ | Use $\vec{AB}=\vec{OB}-\vec{OA}$ to find the displacement from $A$ to $B$. |
| 146 | a9f53f | AK1 | Subtracts the position vectors to obtain $\binom{4}{3}$ | Subtract the position vectors component by component and write the result as $\binom{x}{y}$. |
| 147 | a9f53f | CK2 | Forms the bearing angle using $\tan\theta=\frac{4}{3}$ | Form the angle equation using $\tan\theta=\frac{4}{3}$ from the eastward and northward displacements. |
| 148 | a9f53f | AK2 | Calculates the bearing as $053°$ | Calculate the angle and write it as a three-figure bearing with any needed leading zeroes. |
| 149 | a9f53f | CK3 | Recognises that parallel vectors have determinant zero | Use the fact that parallel vectors have determinant zero. |
| 150 | a9f53f | CK4 | Forms $\begin{vmatrix}4&3\\4&k-5\end{vmatrix}=0$ | Form the determinant $\begin{vmatrix}a&b\\c&d\end{vmatrix}=0$ using the components of the two parallel vectors. |
| 151 | a9f53f | AK3 | Evaluates the determinant to obtain $4(k-5)-12=0$ | Evaluate the determinant by multiplying along the diagonals, subtracting, and setting the result equal to zero. |
| 152 | a9f53f | AK4 | Solves the equation to obtain $k=8$ | Solve the resulting linear equation for $k$. |
| 153 | a9f53f | R1 | Confirms that $k=8$ gives vectors in the same, rather than opposite, direction | Check that your value of $k$ makes the vectors point in the same direction, not in opposite directions. |
| 154 | a9f53f | AK5 | Uses “their” value of $k$ to find $\vec{BD}=\binom{4}{3}$ | Substitute your value of $k$ into the coordinates and calculate $\vec{BD}$ as $\binom{x}{y}$. |
| 155 | a9f53f | R2 | Compares “their” $\vec{BD}$ with $\vec{AB}$ to establish equal displacement vectors | Compare your $\vec{BD}$ with $\vec{AB}$ component by component to show that they are equal displacement vectors. |
| 156 | a9f53f | R3 | States that the bearing is the same as “their” bearing in part (b) | State that the bearing from $B$ to $D$ is the same as your bearing from part (b). |
| 157 | a9f556 | CK1 | Identifies the sloping side as the hypotenuse of a right-angled triangle | Identify the sloping side opposite the right angle as the hypotenuse. |
| 158 | a9f556 | AK1 | Forms $h^2=5^2+5^2$ | Apply Pythagoras by adding the squares of the two perpendicular sides to form an equation for $h^2$. |
| 159 | a9f556 | CK2 | Recognises that all sides of a regular octagon are equal | Use the fact that every side of a regular octagon has the same length. |
| 160 | a9f556 | AK3 | Forms the length of an uncut side as $x-10$ | Subtract the lengths removed at both ends of an original side from $x$ to find the uncut length. |
| 161 | a9f556 | R1 | Equates $x-10$ to "their" sloping side for the regular-octagon condition | Set the uncut side length equal to your earlier sloping-side length because all sides of the regular octagon are equal. |
| 162 | a9f556 | CK3 | States 8 lines of symmetry | Count the reflection axes that divide the regular octagon into matching halves and state the total. |
| 163 | a9f556 | CK4 | States rotational symmetry of order 8 | State the rotational order by counting how many matching positions the regular octagon has in one full turn. |
| 164 | a9f556 | AK5 | Calculates $360\div8=45^\circ$ | Use $360\div$ the rotational order to calculate the smallest angle of rotation in $^\circ$. |
| 165 | a9f556 | R2 | Concludes that the panel will not match after a rotation of $120^\circ$ | Decide whether rotating the panel by $120^\circ$ places it back in its original position, then state your conclusion. |
| 166 | a9f556 | R3 | Justifies that $120^\circ$ is not a multiple of "their" smallest angle of rotation | Check whether $120^\circ$ is a whole-number multiple of your earlier smallest angle of rotation and use this to justify your conclusion. |
| 167 | a9f570 | CK1 | Recognises that players in at least one sport occupy the three inner regions. | Look at the three regions inside the two circles, not the outside region, to identify everyone who plays at least one sport. |
| 168 | a9f570 | AK1 | Lists all eight players in $L$. | Write every player from the three inner regions into $L$. |
| 169 | a9f570 | CK2 | Identifies $R$ and $S$ as the players in both sets. | Read the names in the overlapping region to identify the players who play both sports. |
| 170 | a9f570 | AK2 | Removes $R$ and $S$ from "their" set $L$. | Remove the two overlap players from your set $L$ to form $P$. |
| 171 | a9f570 | CK3 | Identifies $A$, $D$ and $K$ as the netball-only members of "their" set $P$. | Select the players in the netball-only region from your set $P$. |
| 172 | a9f570 | AK4 | Lists $\{A,D\}$ and $\{A,K\}$ as two-member subsets. | Make two different two-player subsets from the netball-only players. |
| 173 | a9f570 | AK5 | Lists $\{D,K\}$ as the remaining two-member subset. | List the remaining different two-player subset that you have not yet written. |
| 174 | a9f570 | R1 | Uses one of "their" two-member subsets as the pair of netball-only players. | Use one of your two-player subsets as the pair of netball-only players for a team. |
| 175 | a9f570 | R2 | Identifies $R$ and $S$ as two possible choices for the player who plays both sports. | Use each player in the overlap as a possible choice for the player who plays both sports. |
| 176 | a9f570 | R3 | Combines "their" number of pairs with two choices and concludes that six teams can be formed. | Multiply your number of netball-only pairs by the number of overlap-player choices and state the resulting number of teams. |
| 177 | a9f57d | CK1 | Identifies the difference as $x-4$ | Subtract 4 from $x$ to write the difference as $x-4$. |
| 178 | a9f57d | CK2 | Recognises three times the difference as $3(x-4)$ | Multiply the difference by 3 to write three times it as $3(x-4)$. |
| 179 | a9f57d | AK1 | Substitutes $-3$ correctly into "their" expression | Replace every $x$ in your expression with $-3$ and simplify using your expression. |
| 180 | a9f57d | AK3 | Expands $3(x-4)$ to obtain $3x-12$ | Distribute 3 across $x-4$ to get $3x-12$. |
| 181 | a9f57d | AK4 | Collects like terms to obtain $5x$ | Combine the $x$ terms and constant terms to simplify to $5x$. |
| 182 | a9f57d | R2 | Concludes that the expressions are identical for all values of $x$ | State that the expressions are identical for all values of $x$ because they both simplify to $5x$. |
| 183 | a9f57d | CK3 | Represents the increased adjustment score as $-3+n$ | Add the increase $n$ to $-3$ to write the new adjustment score as $-3+n$. |
| 184 | a9f57d | R3 | Forms an inequality using "their" score, for example $-15+5n\geq20$ | Use your score to form an inequality for at least 20 points, such as $-15+5n\geq20$. |
| 185 | a9f57d | AK5 | Solves "their" inequality to obtain $n\geq7$ | Solve your inequality by isolating $n$. |
| 186 | a9f57d | R4 | Selects the least whole-number value and gives it as an integer | Choose the smallest whole-number value that satisfies $n\geq7$ and write it as an integer. |
| 187 | a9f585 | CK1 | Recognises that the markup is calculated as 25% of the cost price | Calculate the markup as $25\%$ of the cost price. |
| 188 | a9f585 | AK1 | Calculates the markup as \$20 | Multiply the cost price by $0.25$ to calculate the markup. |
| 189 | a9f585 | CK2 | Recognises that the discount is calculated as 15% of the marked price | Calculate the discount as $15\%$ of the marked price. |
| 190 | a9f585 | AK3 | Calculates 15% of "their" marked price | Multiply your marked price by $0.15$ to calculate the discount. |
| 191 | a9f585 | CK3 | Identifies profit as selling price less cost price | Find the profit by subtracting the cost price from the selling price. |
| 192 | a9f585 | AK5 | Finds "their" profit | Subtract the cost price from your selling price to find your profit. |
| 193 | a9f585 | CK4 | Uses the cost price as the base for the percentage profit | Divide your profit by the cost price before converting it to a percentage. |
| 194 | a9f585 | R2 | Compares "their" percentage profit with 10% | Compare your percentage profit with $10\%$. |
| 195 | a9f585 | R3 | Concludes that the discount should not be allowed | Use the comparison to decide that the discount should not be allowed. |
| 196 | a9f592 | CK1 | Uses the mean as total divided by 12 | Divide the total number of patients by 12 to form the mean. |
| 197 | a9f592 | AK2 | Forms and solves $({"their"\ 32}+x)\div12=3$ | Substitute your earlier total into $(\text{your total}+x)\div12=3$ and solve for $x$. |
| 198 | a9f592 | CK2 | Includes "their" value of $x$ among the frequency-table values | Include your value of $x$ as the twelfth observation when completing the frequency table. |
| 199 | a9f592 | CK3 | Recognises that all 12 observations must be represented in the table | Check that the frequencies in your table add to all 12 observations. |
| 200 | a9f592 | AK3 | Tallies frequencies for 1 and 2 patients correctly | Count separately how many mornings show 1 patient and how many show 2 patients, then enter these frequencies. |
| 201 | a9f592 | AK4 | Tallies frequencies for 3 and 4 patients correctly | Count separately how many mornings show 3 patients and how many show 4 patients, then enter these frequencies. |
| 202 | a9f592 | AK5 | Uses "their" frequency table to locate the 6th and 7th values, giving median $3$ | Use your frequency table to locate the 6th and 7th values in order, then use them to find the median. |
| 203 | a9f592 | R2 | Uses "their" frequency table to identify the modal value as $3$ | Use your frequency table to identify the patient number with the greatest frequency as the mode. |
| 204 | a9f592 | R3 | Judges the manager's statement as false | Compare the manager's statement with the mode and state whether the statement is false. |
| 205 | a9f592 | R4 | Justifies the judgement by stating that 3 has the greatest frequency | Justify your judgement by stating which patient number has the greatest frequency. |
| 206 | a9f59f | CK1 | Identifies the displacement as 5 units right and 2 units down. | Find the horizontal and vertical changes from $A$ to $A'$ and state the translation direction. |
| 207 | a9f59f | AK2 | Adds the translation vector to $B$ to obtain $(4,3)$, or follows through using "their" vector. | Add each component of your translation vector to the coordinates of $B$. |
| 208 | a9f59f | AK3 | Adds the translation vector to $C$ to obtain $(6,0)$, or follows through using "their" vector. | Add each component of your translation vector to the coordinates of $C$. |
| 209 | a9f59f | CK2 | Recognises that the centre of enlargement is unchanged, giving $A''=(2,0)$. | Keep the centre of enlargement fixed and write the coordinates of $A''$. |
| 210 | a9f59f | AK4 | Doubles the displacement from $A'$ to "their" $B'$ to obtain $(6,6)$. | Find the displacement from $A'$ to your $B'$ and double both components from the centre of enlargement. |
| 211 | a9f59f | AK5 | Doubles the displacement from $A'$ to "their" $C'$ to obtain $(10,0)$. | Find the displacement from $A'$ to your $C'$ and double both components from the centre of enlargement. |
| 212 | a9f59f | CK3 | States similar. | State whether the original triangle and its enlargement are similar. |
| 213 | a9f59f | R1 | Justifies similarity using equal corresponding angles and corresponding side lengths in ratio $2:1$, following through from "their" image coordinates. | Compare corresponding angles and corresponding side lengths, then state the side-length ratio using your image coordinates. |
| 214 | a9f59f | CK4 | States congruent in the completion "not congruent". | Complete the statement by deciding whether the triangles are congruent. |
| 215 | a9f59f | R2 | Justifies non-congruency because corresponding side lengths are not equal, following through from "their" enlargement. | Compare corresponding side lengths in your enlargement and explain why they do or do not have equal lengths. |
| 216 | a9f59f | R3 | Concludes that orientation is unchanged under the translation followed by the positive enlargement. | Compare the order of the vertices before and after both transformations, then state whether the orientation changes. |
| 217 | a9f5a7 | CK1 | States $\vec{AB}=\vec{OB}-\vec{OA}$ | Write $\vec{AB}=\vec{OB}-\vec{OA}$ before calculating the displacement. |
| 218 | a9f5a7 | AK1 | Subtracts corresponding components to obtain $\begin{pmatrix}4\\4\end{pmatrix}$ | Subtract matching components to form $\begin{pmatrix}\cdot\\\cdot\end{pmatrix}$. |
| 219 | a9f5a7 | CK2 | Uses the east and north components to identify the bearing angle from north | Use the east and north components to measure the bearing angle clockwise from north. |
| 220 | a9f5a7 | CK3 | Forms $\vec{AD}=\vec{OD}-\vec{OA}$ | Form $\vec{AD}=\vec{OD}-\vec{OA}$ before using the direction condition. |
| 221 | a9f5a7 | R1 | Recognises that the common direction gives parallel vectors and equates the determinant to zero | Treat the vectors as parallel because they have a common direction, then set the determinant equal to zero. |
| 222 | a9f5a7 | AK3 | Obtains $\vec{AD}=\begin{pmatrix}2k\\9-k\end{pmatrix}$ | Subtract the corresponding components to express $\vec{AD}$ as $\begin{pmatrix}\cdot\\\cdot\end{pmatrix}$ in terms of $k$. |
| 223 | a9f5a7 | AK4 | Evaluates the determinant as $4(9-k)-4(2k)=54-12k$ | Expand the determinant, distribute both products, and collect the constant and $k$ terms. |
| 224 | a9f5a7 | AK5 | Solves $54-12k=0$ to obtain $k=3$ | Set the resulting expression equal to zero and solve the linear equation for $k$. |
| 225 | a9f5a7 | R2 | Uses "their" value of $k$ to obtain and compare $\vec{AD}$ with $\vec{AB}$ | Substitute your value of $k$ into $\vec{AD}$, then compare it with $\vec{AB}$ by writing both as $\begin{pmatrix}\cdot\\\cdot\end{pmatrix}$. |
| 226 | a9f5a7 | R3 | Establishes that the positive scalar multiplier is greater than $1$ | Find the scalar multiplier relating the vectors and verify that it is positive and greater than $1$. |
| 227 | a9f5af | CK1 | Recognises triangle $WXY$ as a right-angled triangle | Identify triangle $WXY$ as right-angled before using Pythagoras’ theorem. |
| 228 | a9f5af | AK1 | Forms $XY^2 = 50^2 - 48^2$ | Form $XY^2$ by subtracting the square of the known shorter side from the square of the hypotenuse. |
| 229 | a9f5af | CK2 | Uses perimeter $= 2(WX + XY)$ for the rectangle | Use $2(WX+XY)$ to represent the perimeter of the rectangle. |
| 230 | a9f5af | AK3 | Substitutes $48$ and "their" value of $XY$ | Substitute the labelled side length and your earlier $XY$ length into the perimeter expression. |
| 231 | a9f5af | CK3 | Recognises that a square has four equal sides | Use the fact that all four sides of a square are equal. |
| 232 | a9f5af | AK5 | Divides "their" perimeter by $4$ | Divide your previously calculated perimeter by $4$ to find one side of the square. |
| 233 | a9f5af | R2 | Uses two sides of length "their" $31$ to obtain diagonal $31\sqrt{2}$ | Use two square sides, each equal to your earlier side length, in Pythagoras’ theorem to write the diagonal as $s\sqrt{2}$. |
| 234 | a9f5af | R3 | Expresses "their" diagonal in surd form | Express your diagonal as a simplified surd in the form $a\sqrt{b}$. |
| 235 | a9f5af | CK4 | States 4 lines of symmetry and rotational symmetry of order 4 | State both the number of lines of symmetry of a square and its order of rotational symmetry. |
| 236 | a9f5bc | CK1 | Forms the simultaneous equations $b+c=0$ and $4b+c=-15$ | Substitute each given value of $t$ into the formula and form $b+c=0$ and $4b+c=-15$. |
| 237 | a9f5bc | AK1 | Eliminates one variable correctly | Subtract one equation from the other to eliminate the variable with matching coefficients. |
| 238 | a9f5bc | CK2 | Uses $-\frac{5}{2}$ as the value in the squared bracket | Write the squared bracket using $-\frac{5}{2}$ as the shift. |
| 239 | a9f5bc | AK3 | Completes the square by compensating for $\frac{25}{4}$ | Compensate outside the bracket for adding $\frac{25}{4}$ inside the square. |
| 240 | a9f5bc | AK5 | Using "their" completed-square expression, obtains $\left(t-\frac{5}{2}\right)^2=\frac{5}{4}$ | Set your completed-square expression equal to zero and rearrange it to obtain $\left(t-\frac{5}{2}\right)^2=\frac{5}{4}$. |
| 241 | a9f5bc | R1 | Uses both square-root branches to obtain "their" two values of $t$ | Take both the positive and negative square roots, then solve each resulting equation for $t$. |
| 242 | a9f5bc | R2 | Expresses "their" solutions in exact form | Keep your two solutions in exact surd form instead of changing them to decimals. |
| 243 | a9f5bc | CK3 | States No | State No. |
| 244 | a9f5bc | R3 | Using "their" roots, identifies the interval for which $Q<0$ | Use your two roots as boundaries and identify the interval between them where $Q<0$. |
| 245 | a9f5bc | R4 | Concludes that a negative balance means the supply is not adequate throughout the stated period | Explain that a negative balance means the water supply is not adequate for the whole stated period. |
| 246 | a9f5c9 | CK1 | Recognises that Figure 3 contains 13 dots | Count the dots in Figure 3 carefully and record the total. |
| 247 | a9f5c9 | AK1 | Finds the quantity represented by Figure 3 as $13 \times 200\ 000$ | Count the dots in Figure 3, then multiply by $200\ 000$ to find the quantity it represents. |
| 248 | a9f5c9 | AK2 | Calculates $15\%$ of $2\ 600\ 000$ | Find $15\%$ of your Figure 3 quantity by multiplying it by the decimal equivalent of the percentage. |
| 249 | a9f5c9 | AK4 | Moves the decimal point in "their" replacement quantity to obtain $3.9 \times 10^5$ | Move the decimal point in your replacement quantity and write it as $a \times 10^n$. |
| 250 | a9f5c9 | R1 | Expresses "their" answer in standard form | Express your result in standard form, with a number from 1 up to but not including 10 multiplied by a power of 10. |
| 251 | a9f5c9 | CK2 | Recognises that Figure 1 contains 5 dots | Count the dots in Figure 1 carefully and record the total. |
| 252 | a9f5c9 | CK3 | Forms the percentage comparison using "their" replacement quantity and the quantity represented by Figure 1 | Use your replacement quantity over the quantity represented by Figure 1, multiply by $100$, and compare the percentage with the specification. |
| 253 | a9f5c9 | AK5 | Calculates "their" replacement quantity as $39\%$ of the quantity represented by Figure 1 | Calculate your replacement quantity as a percentage of your Figure 1 quantity and write the result with $\%$. |
| 254 | a9f5c9 | R2 | Converts two fifths to $40\%$ | Convert two fifths to a percentage and write it with $\%$. |
| 255 | a9f5c9 | R3 | Compares "their" percentage with $40\%$ | Compare your percentage with your two-fifths percentage using $\%$ notation. |
| 256 | a9f5c9 | R4 | Concludes that the specification is met | Use your comparison to state whether Kemar meets the specification. |
| 257 | e1cb52 | R1 | Reads the axial vertices $(0,0)$, $(6,0)$ and $(0,6)$ from 'their' feasible region | Read the origin and the two vertices on the axes from your feasible region. |
| 258 | e1cb52 | R2 | Reads the intersection vertex $(4,4)$ from 'their' feasible region | Read the coordinates of the point where the two boundary lines intersect in your feasible region. |
| 259 | e1cb52 | AK3 | Calculates profits at 'their' axial vertices using $P=5x+4y$ | Substitute the coordinates of your axial vertices into $P=5x+4y$ to calculate each profit. |
| 260 | e1cb52 | AK4 | Calculates the profit at 'their' intersection vertex using $P=5x+4y$ | Substitute the coordinates of your intersection vertex into $P=5x+4y$ to calculate its profit. |
| 261 | e1cb52 | R3 | Compares 'their' profits and selects the production plan giving the greatest profit | Compare your calculated profits and choose the production plan with the greatest profit. |
| 262 | c75c59 | CK2 | Recognises that $f(x)=0$ is represented by the $x$-intercepts | Find where the curve crosses the $x$-axis, since those points show where $f(x)=0$. |
| 263 | c75c59 | CK3 | Identifies that $g(1)$ is the input to $f$ in $fg(1)$ | Work out $g(1)$ first, then use that result as the input to $f$ in $fg(1)$. |
| 264 | c75c59 | R2 | Selects the median as the appropriate average | Choose the median as the average that best represents the data. |
| 265 | c75c59 | R3 | Explains that $18$ is an extreme value which would affect the mean | Explain that $18$ is an extreme value, so it would affect the mean. |
| 266 | c75c61 | R1 | Reads the minimum point as $(3,1)$ | Read the coordinates of the lowest point on the curve, giving the $x$-coordinate first. |
| 267 | c75c61 | CK2 | Identifies the point on the $y$-axis as $(0,10)$ | Find where the curve meets the $y$-axis and write that point as an ordered pair. |
| 268 | c75c61 | CK3 | Forms $fg(0)=f(g(0))=f(3)$ | Substitute $0$ into $g$ first, then use that output as the input to $f$ in $fg(0)=f(g(0))=f(3)$. |
| 269 | c75c61 | AK3 | Evaluates $f(3)$, using "their" ordinate at $x=3$, to obtain 1 | Use your ordinate at $x=3$ to evaluate $f(3)$. |
| 270 | c75c61 | AK4 | Identifies 2 as the value occurring most often among the graph values | List the graph values and identify the value that occurs most often. |
| 271 | c75c61 | R2 | Selects the mode as the average appropriate for preparing for the most common demand | Choose the mode as the average to use when preparing for the most common demand. |
| 272 | c75c61 | R3 | Explains that the mode gives the most frequently required number of trays | Explain that the mode gives the number of trays required most frequently. |
| 273 | c75c69 | CK2 | Recognises that equal charges occur where $f(x)=0$ | Set $f(x)=0$ to find where the two companies charge the same amount. |
| 274 | c75c69 | CK3 | Interprets $fg(r)$ as $f(g(r))$ | Evaluate $g(r)$ first, then use that result as the input for $f(g(r))$. |
| 275 | c75c69 | CK4 | Selects the median as the appropriate average | Choose the median as the average that best represents the data. |
| 276 | c75c69 | R1 | Identifies $12$ as an extreme value | Identify $12$ as the extreme value in the data set. |
| 277 | c75c69 | R2 | Explains that the extreme value would distort the mean or that the median is resistant to it | Explain that the extreme value distorts the mean, so use the median because it is less affected. |
| 278 | b1a547 | CK1 | Recognises that the roots are the $x$-intercepts | Identify the roots as the $x$-coordinates where the curve crosses the $x$-axis. |
| 279 | b1a547 | R2 | Reads both roots correctly as $-1$ and $3$ | Read both $x$-coordinates where the curve crosses the $x$-axis from the graph. |
| 280 | b1a547 | AK4 | Finds the midpoint of “their” roots | Find the midpoint of your two roots. |
| 281 | b1a547 | CK2 | States the axis as the vertical-line equation $x = 1$ | Write the axis as a vertical-line equation using $x=$ and the midpoint coordinate. |
| 282 | b1a547 | R3 | Explains that the axis is halfway between “their” two roots | Explain that the axis lies halfway between your two roots. |
| 283 | b1a54f | CK2 | Identifies the roots as the $x$-coordinates where the graph crosses the $x$-axis. | Read the $x$-coordinates at the points where the graph crosses the $x$-axis to identify the roots. |
| 284 | b1a54f | R1 | Finds the midpoint of “their” roots to obtain $x=2$. | Add your two roots, divide by 2, and use the midpoint as the axis coordinate. |
| 285 | b1a54f | R2 | States the axis as the vertical-line equation $x=2$. | Write the axis of symmetry as a vertical-line equation in the form $x=\text{constant}$. |
| 286 | b1a54f | R3 | Uses “their” axis of symmetry as the $x$-coordinate of the minimum point. | Use the $x$-coordinate from your axis of symmetry as the $x$-coordinate of the minimum point. |
| 287 | b1a574 | CK2 | Recognises ground level as $f(x)=0$. | Set $f(x)=0$ to represent the firework being at ground level. |
| 288 | b1a574 | R2 | Finds the midpoint of “their” two ground-level times. | Add your two ground-level times and divide by $2$ to find the midpoint. |
| 289 | b1a574 | CK3 | Uses “their” time of greatest height as the input to $f$. | Substitute your time of greatest height into $f$. |
| 290 | b1a57c | R1 | Reads the left x-intercept as $1$ | Read the left point where the curve crosses the $x$-axis. |
| 291 | b1a57c | R2 | Reads the right x-intercept as $5$ | Read the right point where the curve crosses the $x$-axis. |
| 292 | b1a57c | CK2 | Recognises that the axis of symmetry lies midway between the roots | Locate the line halfway between the two $x$-intercepts, since this is the axis of symmetry. |
| 293 | b1a57c | AK3 | Finds the midpoint of 'their' roots and states the axis as $x=3$ | Find the midpoint of your roots and write the axis of symmetry in the form $x=3$. |
| 294 | b1a57c | AK4 | Uses 'their' axis of symmetry to obtain the x-coordinate of the minimum point | Use your axis of symmetry as the $x$-coordinate of the minimum point. |
| 295 | b1a57c | R3 | Reads the corresponding minimum value and states $(3,-4)$ | Read the lowest $y$-value on the curve at $x=3$ and state the minimum point as $(3,-4)$. |
| 296 | b1a584 | R1 | Identifies the distance charge as \$18 less "their" value when $d=0$ | Subtract your value when $d=0$ from \$18 to find the distance charge. |
| 297 | b1a584 | CK3 | Recognises that the gradient represents \$3 per kilometre | Read the gradient as the fare increasing by \$3 for each kilometre travelled. |
| 298 | b1a584 | R2 | Divides "their" distance charge by 3 to obtain the distance travelled | Divide your distance charge by $3$ to find the distance travelled. |
| 299 | b1a58c | CK1 | Recognises that more consistent data have a smaller standard deviation | Use the fact that more consistent data have a smaller standard deviation. |
| 300 | b1a58c | R1 | Forms $x<3$ | Compare Heat A's standard deviation with $3$ and write $x<3$. |
| 301 | b1a58c | CK2 | Selects $2$ and $3$ as the standard deviations to compare | Choose $2$ and $3$ as the standard deviations you need to compare. |
| 302 | b1a58c | AK1 | Compares the values to obtain $2<3$ | Compare the two standard deviations and write $2<3$. |
| 303 | b1a58c | R2 | Concludes that Heat B is more consistent because it has the smaller standard deviation | State that Heat B is more consistent because it has the smaller standard deviation. |
| 304 | b1a58c | CK3 | Recognises that the smallest standard deviation represents the most consistent heat | Identify the heat with the smallest standard deviation as the most consistent. |
| 305 | b1a58c | AK2 | Correctly compares $2$ and $2.5$ | Compare the values and establish that $2<2.5$. |
| 306 | b1a58c | AK3 | Correctly compares $2.5$ and $3$ | Compare the values and establish that $2.5<3$. |
| 307 | b1a58c | R3 | Lists the heats in the order Heat B, Heat C, Heat A | List the heats from smallest to largest standard deviation: Heat B, Heat C, Heat A. |
| 308 | b1a594 | CK2 | Identifies ground level as $h=0$ | Treat ground level as the horizontal level where the height is zero. |
| 309 | b1a594 | R2 | Reads both intercepts as $t=0$ and $t=4$ | Read the two times where the curve crosses the $t$-axis. |
| 310 | b1a594 | AK2 | Subtracts the two ground-level times, using 'their' values from part (b) | Subtract your earlier ground-level time from your later ground-level time, using your values from part (b). |
| 311 | b1a594 | AK3 | Obtains $4\text{ s}$, or the correct duration from 'their' times | State the duration from your subtraction and include the unit $\text{ s}$. |
| 312 | b1a594 | CK3 | Recognises that the maximum height occurs at $t=2\text{ s}$ | Locate the highest point on the graph and read its time-coordinate in $\text{ s}$. |
| 313 | b1a594 | R3 | Explains that the rising and falling intervals are each $2\text{ s}$, using 'their' graph readings | Use your graph readings to compare the time from launch to the maximum with the time from the maximum to landing, then state whether the intervals are equal in $\text{ s}$. |
| 314 | b1a59c | CK1 | Selects the volume calculation for a cuboid | Multiply the length, width, and height shown in the diagram to calculate the cuboid’s volume. |
| 315 | b1a59c | AK1 | Multiplies the three dimensions to obtain $3\text{ m}^3$ | Multiply all three dimensions and give the volume in $\text{m}^3$. |
| 316 | b1a59c | CK2 | Recognises that $1\text{ m}^3 = 1000\text{ L}$ | Use the standard conversion between $\text{m}^3$ and $\text{L}$. |
| 317 | b1a59c | AK2 | Converts "their" volume to litres | Multiply your volume by the cubic-metre-to-litre conversion factor to express it in $\text{L}$. |
| 318 | b1a59c | R1 | Uses "their" capacity with the charge per litre | Multiply your capacity in litres by the given charge per litre to find the purchase price. |
| 319 | b1a59c | AK4 | Subtracts the \$600 deposit from "their" purchase price | Subtract the \$600 deposit from your purchase price to find the balance. |
| 320 | b1a59c | R2 | Divides "their" balance by 6 equal instalments | Divide your remaining balance by the 6 equal instalments. |
| 321 | b1a5ae | CK3 | Recognises that $\begin{bmatrix}4&2\end{bmatrix}\begin{bmatrix}x\\y\end{bmatrix}$ represents $4x+2y$ | Multiply $\begin{bmatrix}4&2\end{bmatrix}$ by $\begin{bmatrix}x\\y\end{bmatrix}$ by pairing each entry in the row with the matching variable, then add the products. |
| 322 | b1a5ae | AK3 | Substitutes "their" values of $x$ and $y$ to obtain $4(2)+2(5)$ | Substitute your values of $x$ and $y$ into $4x+2y$ before calculating the total cost. |
| 323 | b1a5d9 | AK1 | Writes $\vec{OA}=\begin{pmatrix}1\\1\end{pmatrix}$ | Write $\vec{OA}$ as a column vector using A's horizontal coordinate above its vertical coordinate: $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 324 | b1a5d9 | AK2 | Multiplies both components of 'their' $\vec{OA}$ by $2$ | Multiply both entries of your $\vec{OA}$ column vector by $2$. |
| 325 | b1a5d9 | CK1 | Identifies $\vec{OA'}$ as the position vector $\begin{pmatrix}2\\2\end{pmatrix}$ | Read the coordinates of $A'$ from the grid and write its position vector as $\vec{OA'}=\begin{pmatrix}x\\y\end{pmatrix}$. |
| 326 | b1a5d9 | AK3 | Shows $2\begin{pmatrix}1\\1\end{pmatrix}=\begin{pmatrix}2\\2\end{pmatrix}$, or follows through using 'their' vectors | Show the doubling by multiplying each entry in $2\begin{pmatrix}x\\y\end{pmatrix}=\begin{pmatrix}2x\\2y\end{pmatrix}$. |
| 327 | b1a5d9 | R1 | Concludes that $\vec{OA'}=2\vec{OA}$ | Compare the original and image position vectors, then state that $\vec{OA'}$ is twice $\vec{OA}$. |
| 328 | b1a5d9 | CK2 | States enlargement | Use how the motif changes size while keeping its shape to identify the transformation type. |
| 329 | b1a5d9 | R2 | Identifies the origin as the centre from the corresponding vertices and their images | Join corresponding vertices and images, then trace the lines back to locate the common centre. |
| 330 | b1a5d9 | CK3 | Recognises that the multiplier of the position vectors is the scale factor | Compare the multiplier of each position vector with the definition of scale factor. |
| 331 | b1a5d9 | AK4 | Gives scale factor $2$, or follows through using 'their' multiplier | Use your position-vector multiplier as the scale factor. |
| 332 | b1a5ee | CK1 | Selects the sine ratio using the side opposite the $30^\circ$ angle and the hypotenuse | Use $\sin30^\circ$ by pairing the side opposite the $30^\circ$ angle with the hypotenuse. |
| 333 | b1a5ee | AK1 | Calculates $QR=12\sin30^\circ=6$ | Evaluate $12\sin30^\circ$ to calculate $QR$. |
| 334 | b1a5ee | CK2 | Forms $x+y=8$ from the total number of pieces | Write an equation that adds $x$ and $y$ to represent the total number of pieces. |
| 335 | b1a5ee | R1 | Forms $12x+6y=72$ using "their" length of $QR$ | Use your earlier value of $QR$ to write an equation for the total timber length in terms of $x$ and $y$. |
| 336 | b1a5ee | AK2 | Eliminates one variable by subtracting $6$ times the number equation from "their" length equation | Multiply the number equation by $6$, then subtract it from your length equation to eliminate one variable. |
| 337 | b1a5ee | AK3 | Solves the resulting equation for "their" value of $x$ | Rearrange the equation left after elimination to isolate $x$. |
| 338 | b1a5ee | R2 | Uses "their" value of $x$ in the number equation to obtain $y$ | Substitute your value of $x$ into the number equation and solve for $y$. |
| 339 | b1a5ee | CK3 | Forms the cost expression $25x+14y$ | Form the total-cost expression by adding $\$25x$ and $\$14y$. |
| 340 | b1a5fb | CK1 | Recognises that 20% of the cash price is required for the deposit | Calculate the deposit as $20\%$ of the cash price. |
| 341 | b1a5fb | CK2 | Uses the deposit and 12 monthly payments to form the total hire-purchase payment | Add your deposit to the total of the 12 monthly payments to form the total hire-purchase payment. |
| 342 | b1a5fb | AK2 | Calculates $12 \times 180 = 2\,160$ | Calculate the instalment total using $12 \times 180$. |
| 343 | b1a5fb | R1 | Adds "their" deposit to the instalment total to establish \$2 660 | Add your deposit to your instalment total to find the total hire-purchase payment. |
| 344 | b1a5fb | CK3 | Identifies the cash price as the base quantity for the percentage comparison | Use the cash price as the base quantity when finding the percentage difference. |
| 345 | b1a5fb | AK3 | Calculates "their" hire-purchase excess by subtracting \$2 500 from "their" total payment | Subtract the cash price, \$2 500, from your total payment to find your excess. |
| 346 | b1a5fb | AK4 | Calculates "their" excess as a percentage of \$2 500 | Divide your excess by the cash price, \$2 500, and multiply by $100$ to find the percentage. |
| 347 | b1a5fb | R2 | States that hire purchase costs $6.4\%$ more than the cash price | State the percentage by which hire purchase costs more than the cash price. |
| 348 | b1a603 | AK1 | Subtracts "their" lower quartile from "their" upper quartile | Subtract your lower quartile from your upper quartile. |
| 349 | b1a603 | R1 | Establishes the stated interquartile range of $6$ | State the interquartile range you get from that subtraction. |
| 350 | b1a603 | CK3 | Uses one half of "their" interquartile range | Divide your interquartile range by two to find the semi-interquartile range. |
| 351 | b1a603 | R2 | Substitutes "their" semi-interquartile range into $F = 5s^2$ | Substitute your semi-interquartile range into $F = 5s^2$. |
| 352 | b1a603 | R3 | Compares "their" fee with \$50 and concludes that the service will be used | Compare your fee with \$50 and state whether the farmer uses the service. |
| 353 | b1a60b | CK1 | Recognises 12 as $n((M \cup P)')$ | Identify the number outside both circles as $n((M \cup P)')$. |
| 354 | b1a60b | AK1 | Calculates $50 - 12$ | Subtract the number outside both circles from the total number of customers. |
| 355 | b1a60b | CK2 | Selects $n(M \cap P)=n(M)+n(P)-n(M \cup P)$ | Use $n(M \cap P)=n(M)+n(P)-n(M \cup P)$ to find the intersection. |
| 356 | b1a60b | AK2 | Substitutes values and obtains 13 | Substitute the two set totals and your union total into the intersection equation, then calculate it. |
| 357 | b1a60b | AK3 | Subtracts "their" intersection from 28 | Subtract your intersection from the mango total to find the mangoes-only region. |
| 358 | b1a60b | R1 | Establishes that the mangoes-only region contains 15 customers | Write the result of that subtraction in the mangoes-only region. |
| 359 | b1a60b | AK4 | Calculates the plantains-only region as $23 -$ "their" intersection | Calculate the plantains-only region by subtracting your intersection from the plantain total. |
| 360 | b1a60b | R2 | Identifies the mangoes-only and plantains-only regions as the customers who bought exactly one type | Add the mangoes-only and plantains-only regions because these are the customers who bought exactly one type. |
| 361 | b1a613 | CK2 | Identifies the two terms in $n+n+1$ as like terms | Identify the two $n$ terms in $n+n+1$ as like terms. |
| 362 | b1a613 | AK2 | Combines $n+n$ to obtain $2n$ | Combine $n+n$ to make $2n$. |
| 363 | b1a613 | CK3 | Forms $2n+1=25$ | Write the equation $2n+1=25$. |
| 364 | b1a613 | R2 | Solves "their" simplified expression equal to 25 | Set your simplified expression equal to $25$ and solve for $n$. |
| 365 | b1a620 | CK2 | States the direct-variation relationship $y=kx$ | Write the direct-variation model as $y=kx$. |
| 366 | b1a620 | AK4 | Finds $k=12\div3=4$, giving $y=4x$ | Calculate $k$ as $12\div3$, then substitute it into $y=kx$ to write the equation. |
| 367 | b1a620 | R1 | Equates the two arrangements as $x^2=4x$ | Set the two cone arrangements equal by writing $x^2=4x$. |
| 368 | b1a620 | AK5 | Solves $x(x-4)=0$ to obtain $x=0$ or $x=4$ | Use the zero-product rule on $x(x-4)=0$ and solve each factor separately. |
| 369 | b1a620 | R3 | For $x>4$, establishes that $x^2>4x$ | For $x>4$, compare the expressions and establish that $x^2>4x$. |
| 370 | b1a620 | R4 | Concludes that the row arrangement uses fewer cones | Use the comparison to state which arrangement has fewer cones. |
| 371 | b1a628 | CK1 | Identifies the two standard deviations as $2.4$ kg and $0.9$ kg. | Read the table and identify the two standard deviations, including the kg units. |
| 372 | b1a628 | AK1 | Finds $2.4 - 0.9 = 1.5$ kg. | Subtract the smaller standard deviation from the larger one to find the difference in kg. |
| 373 | b1a628 | CK2 | Recognises that Devon has the smaller standard deviation. | Compare the two standard deviations and identify Devon as having the smaller one. |
| 374 | b1a628 | AK2 | Uses 'their' difference to establish that Devon's standard deviation is lower. | Use your difference between the standard deviations to show that Devon's standard deviation is lower. |
| 375 | b1a628 | R1 | Links a smaller standard deviation to less variation and concludes that Devon's deliveries are more consistent. | State that a smaller standard deviation means less variation, so Devon's delivery masses are more consistent. |
| 376 | b1a628 | CK3 | Recognises that both suppliers have mean delivery mass $25.0$ kg. | Read the table and recognise that both suppliers have the same mean delivery mass. |
| 377 | b1a628 | R2 | Selects Devon as the suitable supplier. | Choose Devon as the more suitable supplier. |
| 378 | b1a628 | AK3 | Compares the equal means and uses 'their' conclusion about the smaller standard deviation. | Compare the equal means and use your conclusion about the smaller standard deviation to support your choice. |
| 379 | b1a628 | R3 | Explains that the lower standard deviation means delivery masses are less variable. | Explain that the lower standard deviation means the delivery masses vary less. |
| 380 | b1a63a | CK1 | Recognises that an intersection satisfies both $y=(x-4)^2$ and $2x+y=16$ | Use the common $y$-value in $y=(x-4)^2$ and $2x+y=16$ to find where the graphs intersect. |
| 381 | b1a63a | CK2 | Identifies $x+y\le10$ as a condition for a possible plan | Use $x+y\le10$ as an inequality that every possible plan must satisfy. |
| 382 | b1a63a | CK3 | Recognises that $(6,4)$ lies in the shaded feasible region | Locate the given point and check that it lies inside the shaded feasible region. |
| 383 | b1a63a | R2 | Rejects $(0,16)$ because $0+16>10$, then selects $(6,4)$ | Test both intersection points using $x+y\le10$, reject the point that fails, and select the point that satisfies the condition. |
| 384 | b1a63a | AK5 | Substitutes the candidate's selected plan into $P=3x+2y$, giving $26$ | Substitute your selected plan into $P=3x+2y$ and calculate the profit. |
| 385 | b1a63a | CK4 | Identifies the vertices of the feasible region as the plans to compare | List every vertex of the shaded feasible region as a plan to compare. |
| 386 | b1a63a | R3 | Compares the profits at the vertices and concludes that the candidate's plan gives the maximum profit | Calculate the profit at each vertex and state whether your selected plan gives the maximum profit. |
| 387 | b1a642 | CK1 | Recognises that the \$600 deposit represents 3 equal ratio parts | Treat the \$600 deposit as the three equal parts in the given ratio. |
| 388 | b1a642 | AK1 | Divides \$600 by 3 to obtain \$200 | Divide the \$600 deposit by 3 to find one equal part and hence one monthly instalment. |
| 389 | b1a642 | CK2 | Forms the total as the deposit plus 12 monthly instalments | Form the hire-purchase total by adding the deposit to 12 monthly instalments. |
| 390 | b1a642 | AK2 | Evaluates $\$600 + 12 \times$ "their" monthly instalment to show \$3 000 | Evaluate $\$600 + 12 \times$ your monthly instalment using your earlier instalment. |
| 391 | b1a642 | AK3 | Subtracts \$2 400 from "their" hire-purchase total | Subtract \$2 400 from your hire-purchase total to find the excess paid. |
| 392 | b1a642 | R1 | States the excess as \$600 | State the excess paid as the difference between your hire-purchase total and the cash price. |
| 393 | b1a642 | CK3 | Uses the cash price as the original quantity for the percentage comparison | Use the cash price as the original amount when comparing the excess as a percentage. |
| 394 | b1a642 | R2 | Calculates $\dfrac{\text{their excess}}{2400} \times 100$ | Calculate $\dfrac{\text{your excess}}{\text{cash price}} \times 100$. |
| 395 | b1a668 | CK2 | Identifies enlargement. | Name the transformation as an enlargement. |
| 396 | b1a668 | CK3 | States centre of enlargement as $O$, the origin. | State that the centre of enlargement is $O$, the origin. |
| 397 | b1a668 | AK3 | Determines scale factor $2$ from corresponding distances or coordinates. | Compare corresponding coordinates or distances from $O$ to calculate the scale factor. |
| 398 | b1a668 | R1 | Uses their enlargement and a $90°$ clockwise rotation about $O$. | Use your enlargement, then rotate each image point $90°$ clockwise about $O$. |
| 399 | b1a668 | AK4 | Obtains $A''=(8,-6)$. | Apply the clockwise rotation rule to the image of $A$ to find $A''$. |
| 400 | b1a668 | AK5 | Obtains $B''=(8,6)$. | Apply the clockwise rotation rule to the image of $B$ to find $B''$. |
| 401 | b1a668 | R2 | Uses scale factor $2$ to obtain $OA''=OB''=10$ and $A''B''=12$, following through on their factor. | Use your scale factor to scale $OA''$, $OB''$, and $A''B''$ from the original lengths. |
| 402 | b1a668 | R3 | Uses the cosine rule for $\angle A''OB''$ and the sine rule for $\angle OA''B''$ to obtain their angles. | Use the cosine rule to find $\angle A''OB''$, then use the sine rule to find $\angle OA''B''$. |
| 403 | b1a668 | R4 | Expresses both angles correct to 1 decimal place. | Round both of your angles to 1 decimal place. |
| 404 | b1a675 | CK1 | Forms the row-by-column products for $AB$ | Multiply each row of $A$ by each column of $B$ to form $AB$. |
| 405 | b1a675 | AK1 | Obtains the first row of $AB$ as $(1,0)$ | Recalculate the first row of $AB$ using the row-by-column products. |
| 406 | b1a675 | AK2 | Obtains the second row of $AB$ as $(0,1)$ | Recalculate the second row of $AB$ using the row-by-column products. |
| 407 | b1a675 | AK3 | Calculates $BA=I$ | Multiply $B$ by $A$ in that order and check whether the result is $I$. |
| 408 | b1a675 | R1 | Uses $AB=BA=I$ to conclude that $B=A^{-1}$ | Use $AB=BA=I$ to conclude that $B=A^{-1}$. |
| 409 | b1a675 | CK2 | Uses the inverse relationship to write $X=BD$ | Use the inverse relationship to write $X=BD$. |
| 410 | b1a675 | R2 | Premultiplies $AX=D$ by “their” inverse matrix | Premultiply $AX=D$ by your earlier inverse matrix. |
| 411 | b1a675 | CK3 | Uses $BA=I$ to simplify $BAX$ to $X$ | Replace $BA$ with $I$ in $BAX=BD$ and simplify to isolate $X$. |
| 412 | b1a675 | R3 | Evaluates “their” $BD$ to obtain $X$ | Multiply your earlier $B$ and $D$ matrices to evaluate your $BD$ and state $X$. |
| 413 | b1a682 | CK3 | Recognises that line symmetry gives equal angles at $B$ and $C$ | Use the line of symmetry to show that $\angle ABC=\angle BCA$. |
| 414 | b1a682 | AK1 | Uses angle sum of a triangle to obtain equal remaining angles of $45°$ | Use the angle sum of a triangle, subtract the right angle, and split the remaining angle equally between $B$ and $C$. |
| 415 | b1a682 | R1 | Relates $\angle ABC$ to the angle of elevation and concludes $45°$ | Identify $\angle ABC$ as the angle of elevation, then use your equal-angle result to state its size. |
| 416 | b1a682 | AK2 | Selects the cosine ratio using the adjacent side and hypotenuse | Choose the cosine ratio by placing the adjacent side over the hypotenuse. |
| 417 | b1a682 | AK3 | Substitutes to obtain $\cos45°=\frac{12}{BC}$ | Substitute the known angle and adjacent length into $\cos\theta=\frac{\text{adjacent}}{\text{hypotenuse}}$. |
| 418 | b1a682 | AK4 | Rearranges to find $BC=\frac{12}{\cos45°}$ | Rearrange $\cos\theta=\frac{\text{adjacent}}{BC}$ to make $BC$ the subject. |
| 419 | b1a682 | R2 | Expresses the length correct to 3 significant figures | Round your calculated rope length to 3 significant figures and include metres. |
| 420 | b1a682 | R3 | Compares $17\text{ m}$ with "their" unrounded value of $BC$ | Compare $17\text{ m}$ with your unrounded value of $BC$ rather than a rounded length. |
| 421 | b1a682 | R4 | Concludes that the rope can be used because the difference is positive | Find the rope length minus your unrounded $BC$ value, and use a positive difference to conclude that the rope can be used. |
| 422 | b1a68a | CK3 | Identifies the point of intersection as the common charge | Find where the two lines cross and use that point as the common charge. |
| 423 | b1a68a | AK3 | Reads the $x$-coordinate of the intersection as $4$ | Read the $x$-coordinate of the intersection point from the horizontal axis. |
| 424 | b1a68a | AK4 | Reads the $y$-coordinate of the intersection as $12$ | Read the $y$-coordinate of the intersection point from the vertical axis. |
| 425 | b1a68a | R1 | Selects Supplier B for more than "their" intersection number of chairs | Choose Supplier B when the number of chairs is more than your intersection number of chairs. |
| 426 | b1a68a | R2 | Justifies that Supplier B has the lower graph for $x$ values greater than "their" intersection value | Check values of $x$ greater than your intersection value and justify Supplier B because its graph is lower. |
| 427 | b1a692 | CK1 | Recognises that the distance travelled in one complete circuit is the perimeter | Treat the distance travelled in one complete circuit as the perimeter. |
| 428 | b1a692 | R1 | Reads the total distance as $68$ m from the completed graph | Read the final cumulative distance from your completed graph as the perimeter. |
| 429 | b1a692 | CK2 | Recognises that the two straight boundaries have total length $14 + 14$ m | Add the lengths of the two straight radii to find the total straight-boundary length. |
| 430 | b1a692 | AK4 | Subtracts $28$ m from "their" perimeter | Subtract the total straight-boundary length from your perimeter to find your arc length. |
| 431 | b1a692 | CK3 | Uses the arc as the fraction $\theta/360$ of the circumference | Use $\theta/360$ as the fraction of the full circumference represented by the arc. |
| 432 | b1a692 | R2 | Forms $\dfrac{\theta}{360} \times 2\pi(14) = \text{their arc length}$ | Form $\dfrac{\theta}{360} \times 2\pi(14) = \text{your arc length}$. |
| 433 | b1a692 | R3 | Rearranges and evaluates using "their" arc length | Rearrange the equation to make $\theta$ the subject, then evaluate it using your arc length. |
| 434 | b1a692 | R4 | Gives "their" angle to the nearest degree | Round your angle to the nearest degree. |
| 435 | b1a69a | CK1 | Identifies the deposit as $\frac14$ of the cash price | Calculate the deposit as $\frac14$ of the cash price. |
| 436 | b1a69a | CK2 | Forms total hire-purchase cost as deposit plus total instalments | Form the hire-purchase total by adding the deposit to the total of all instalments. |
| 437 | b1a69a | AK2 | Calculates $12 \times 1 800 = 21 600$ | Multiply the number of instalments by the amount paid in each instalment. |
| 438 | b1a69a | AK3 | Adds the deposit and instalments to obtain \$27 600 | Add your deposit and your instalments total to find the total hire-purchase cost. |
| 439 | b1a69a | CK3 | Uses the cash price as the reference quantity for the percentage comparison | Use the cash price as the original amount when calculating the percentage increase. |
| 440 | b1a69a | R1 | Finds "their" excess hire-purchase cost over the cash price | Subtract the cash price from your hire-purchase total to find your excess cost. |
| 441 | b1a69a | R2 | Divides "their" excess by the cash price and multiplies by $100$ | Divide your excess cost by the cash price, then multiply by $100$. |
| 442 | b1a6a2 | CK1 | Identifies the least and greatest journey times for an ascending list | Write your journey times in ascending order and identify the first and last values. |
| 443 | b1a6a2 | CK2 | Identifies the lower five values as the lower half of "their" ordered data | Take the first five values from your ordered data as the lower half. |
| 444 | b1a6a2 | AK2 | Finds $Q_1=23$ from "their" ordered data | Find $Q_1$ by locating the middle value of your lower half. |
| 445 | b1a6a2 | AK3 | Finds $Q_3=27$ from "their" ordered data | Find $Q_3$ by locating the middle value of your upper half. |
| 446 | b1a6a2 | CK3 | Uses half of "their" interquartile range for the semi-interquartile range | Use half of your interquartile range to find the semi-interquartile range. |
| 447 | b1a6a2 | AK5 | Halves "their" interquartile range: $4\div2=2$ | Halve your interquartile range by using $\div 2$. |
| 448 | b1a6a2 | CK4 | Recognises that smaller measures of spread indicate more consistent journey times | Choose the driver with the smaller measures of spread as the more consistent driver. |
| 449 | b1a6a2 | R1 | Compares "their" semi-interquartile range for Driver A with $3$ minutes | Compare your semi-interquartile range for Driver A with Driver B's semi-interquartile range. |
| 450 | b1a6a2 | R2 | Compares the standard deviations $2.45$ minutes and $2.98$ minutes | Compare the standard deviation for Driver A with the standard deviation for Driver B. |
| 451 | b1a6a2 | R3 | Selects Driver A with a conclusion supported by both comparisons | Select the driver supported by both comparisons and state that the journey times are more consistent. |
| 452 | b1a6be | R1 | Reads the intercepts $t=-2$ and $t=2$ from their graph. | Read the two points where your graph crosses the $t$-axis and state the corresponding $t$-values. |
| 453 | b1a6be | CK1 | Associates determinant zero with a singular matrix. | State that a matrix is singular when its determinant is zero. |
| 454 | b1a6be | AK4 | Multiplies $A_3$ by $B$ correctly to obtain $I_2$. | Multiply $A_3$ by $B$ carefully and show that the product is $I_2$. |
| 455 | b1a6be | CK3 | Recognises that a multiplicative inverse gives the identity matrix. | Multiply the two matrices and check that the product is the identity matrix. |
| 456 | b1a6be | R2 | Concludes that $B$ is the multiplicative inverse of $A_3$. | Conclude that $B$ is the multiplicative inverse of $A_3$. |
| 457 | 037c66 | CK1 | Places $1.6$ before $\frac{9}{5}$ in ascending order | Convert $\frac{9}{5}$ to a decimal, then place it after $1.6$ when ordering from smallest to largest. |
| 458 | 037c66 | CK3 | Identifies common difference $0.2$ | Subtract one ordered mass from the next to find the constant difference. |
| 459 | 037c66 | AK1 | Forms $T_n=1.6+(n-1)(0.2)$ using the ordered terms | Use the first ordered term and the common difference to form $T_n=\text{first term}+(n-1)(\text{common difference})$. |
| 460 | 037c66 | AK2 | Simplifies to $T_n=0.2n+1.4$ | Expand and collect the terms in your rule to write $T_n$ in the form $an+b$. |
| 461 | 037c66 | AK3 | Substitutes $n=20$ into "their" rule | Replace $n$ with $20$ in your rule. |
| 462 | 037c66 | AK4 | Evaluates "their" twentieth term | Calculate the value of your twentieth term after substituting into your rule. |
| 463 | 037c66 | R1 | Shows that the calculated mass is $5.4$ kg | State your calculated mass and include the unit kg. |
| 464 | 037c66 | CK4 | Recognises that each successive sample increases by $0.2$ kg | Use the common difference to identify how much the mass increases from one sample to the next. |
| 465 | 037c66 | AK5 | Adds three further increments of $0.2$ kg to "their" twentieth mass, or correctly solves using "their" rule | Starting with your twentieth mass, add three equal increments, or substitute successive sample positions into your rule. |
| 466 | 037c66 | R2 | Identifies $23$ as the greatest possible whole-number sample position | Choose the greatest whole-number sample position whose mass does not exceed the limit. |
| 467 | 037c66 | R3 | Justifies the decision by showing that sample $24$ has mass greater than $6$ kg | Calculate the mass of sample $24$ and compare it with $6$ kg to support your decision. |
| 468 | 037c6e | CK1 | Recognises that $729^{\frac{2}{3}}$ requires the cube root followed by squaring | For $729^{\frac{2}{3}}$, take the cube root first and then square the result. |
| 469 | 037c6e | AK1 | Finds $\sqrt[3]{729}=9$ | Evaluate $\sqrt[3]{729}$ before continuing with the calculation. |
| 470 | 037c6e | CK2 | Uses $2+3+4=9$ ratio parts | Add the ratio terms $2+3+4$ to find the total number of equal parts. |
| 471 | 037c6e | AK3 | Divides "their" total mass by 9 to obtain one ratio part | Divide your total mass by $9$ to find the mass of one ratio part. |
| 472 | 037c6e | AK4 | Gives the three shares in the ratio $2:3:4$, follow-through from "their" total | Use your total mass to calculate the three shares in the ratio $2:3:4$. |
| 473 | 037c6e | AK5 | Divides "their" Devon share by 3 kg per bag | Divide your Devon share by $3$ kg per bag to find the number of bags. |
| 474 | 037c6e | R1 | Establishes the stated result of 12 bags | State clearly the number of bags you obtain for Devon. |
| 475 | 037c6e | CK3 | Recognises that dispatching the same daily number for 5 days gives $5n$ bags | Represent the bags dispatched over five days as $5n$ when the same number is sent each day. |
| 476 | 037c6e | R2 | Forms $5n+3\leq$ "their" number of bags | Write $5n+3\leq B$, where $B$ represents your number of bags. |
| 477 | 037c6e | R3 | Selects the greatest whole-number value of $n$, follow-through from "their" number of bags | Choose the greatest whole-number value of $n$ that satisfies your inequality. |
| 478 | 037c6e | R4 | Justifies that 2 bags per day is not possible because it would require more than "their" number of bags | Show that the next whole-number daily dispatch would make the five-day dispatch plus the retained bags exceed your number of bags. |
| 479 | 037c80 | CK2 | Identifies the x-axis intersections as the roots | Read the $x$-axis intersections from the graph and state that these $x$-values are the roots. |
| 480 | 037c80 | CK3 | States that $f^{-1}$ is not a function on the original domain | State that $f^{-1}$ is not a function on the original domain. |
| 481 | 037c80 | R2 | Explains that the inverse input $0$ has two outputs, using "their" roots | Use your roots to explain that the inverse input $0$ would produce two outputs. |
| 482 | 037c80 | R3 | Selects the right-hand one-to-one branch, using "their" minimum x-coordinate | Use your minimum $x$-coordinate to select the right-hand branch where the function is one-to-one. |
| 483 | 037c80 | CK4 | Writes the composite as $fg(3)=f[g(3)]$ | Rewrite the composite function as $fg(3)=f[g(3)]$ before calculating it. |
| 484 | 037c80 | AK4 | Evaluates $g(3)=5$ | Substitute $3$ into $g(x)=x+2$ and simplify to find $g(3)$. |
| 485 | 037c88 | CK3 | Identifies "their" value in part (b)(ii) as the principal | Treat your savings value from part (b)(ii) as the principal. |
| 486 | 037c88 | R2 | Uses 3 years and the annual rate of 5% in the simple-interest calculation | Use 3 years and the annual rate of 5% in your simple-interest calculation. |
| 487 | 037c88 | AK3 | Substitutes "their" principal, 5 and 3 correctly into the simple-interest relationship | Substitute your principal, 5, and 3 correctly into the simple-interest relationship. |
| 488 | c0becb | R2 | States that each input has exactly one output | State that each input has exactly one output. |
| 489 | c0becb | AK3 | Uses "their" value of $f(3)$ as the input to $g$ | Use your value of $f(3)$ as the input to $g$. |
| 490 | c0becb | AK4 | Evaluates $g(6)=\frac{24}{6}=4$, or correct follow-through on "their" input | Evaluate $g(6)=\frac{24}{6}=4$, or apply $g$ correctly to your input. |
| 491 | c0becb | CK3 | Recognises that doubling the number of workers halves the harvesting time | Recognise that doubling the number of workers halves the harvesting time. |
| 492 | c0becb | R3 | Finds the reduction from "their" 3-worker time to the 6-worker time, giving 2 days | Subtract the 6-worker time from your 3-worker time to find the reduction in days. |
| 493 | c0bed3 | CK1 | Writes $0.375$ as $\frac{375}{1000}$ | Convert the decimal to a fraction with a power-of-ten denominator, using the form $\frac{\text{integer}}{\text{power of }10}$. |
| 494 | c0bed3 | AK1 | Simplifies $\frac{375}{1000}$ to $\frac{3}{8}$ | Cancel common factors in $\frac{\text{numerator}}{\text{denominator}}$ until no further simplification is possible. |
| 495 | c0bed3 | R1 | Expresses the fraction in lowest terms | Check that the numerator and denominator have no common factor greater than 1. |
| 496 | c0bed3 | CK2 | Selects multiplication by $100\%$ to convert the fraction to a percentage | Convert the fraction to a percentage by multiplying by $100\%$. |
| 497 | c0bed3 | AK2 | Evaluates $\frac{3}{8}\times100\%=37.5\%$ | Evaluate $\frac{\text{numerator}}{\text{denominator}}\times100\%$ carefully and write the resulting percentage. |
| 498 | c0bed3 | R2 | Applies "their" percentage as a proportion of 240 sweets | Find the number of ginger-flavoured sweets by taking your percentage of the total number of sweets. |
| 499 | c0bed3 | AK4 | Divides "their" number of plain sweets by 5 | Divide your number of plain sweets by the number that goes into each bag. |
| 500 | c0bed3 | R3 | Compares "their" required number of bags with 30 and concludes that the bags are sufficient | Compare your required number of bags with the available bags and state whether there are enough. |

## Batch 7 — approved (500 rows, gpt-5.6-terra, generated 2026-09-05)

Approved by David on 2026-09-05: all 500 rows. Row 25 set to his sentence; row 177 “factorising”.

| # | question | code | criterion | hint |
|---|---|---|---|---|
| 1 | 037c95 | CK1 | Writes $0.375$ as $\dfrac{375}{1000}$ | Multiply the decimal by $1000$ for the numerator and write the fraction as $\dfrac{\text{numerator}}{1000}$. |
| 2 | 037c95 | AK1 | Reduces $\dfrac{375}{1000}$ to an equivalent fraction | Cancel common factors from $\dfrac{\text{numerator}}{\text{denominator}}$ to make an equivalent fraction. |
| 3 | 037c95 | R1 | Expresses the fraction in lowest terms | Continue cancelling common factors until your numerator and denominator have no common factor greater than $1$. |
| 4 | 037c95 | CK2 | Selects $\dfrac{3}{8}$ of 200 to represent the morning sales | Represent the morning sales by multiplying the simplified fraction by $200$, written as $\dfrac{\text{numerator}}{\text{denominator}}\times200$. |
| 5 | 037c95 | AK2 | Calculates $\dfrac{3}{8}\times 200=75$ | Simplify and multiply $\dfrac{\text{your numerator}}{\text{your denominator}}\times200$ to calculate the morning-sales total. |
| 6 | 037c95 | CK3 | Converts $40\%$ to $0.4$ | Divide the given $40\%$ by $100$ to write the afternoon rate as a decimal. |
| 7 | 037c95 | AK3 | Calculates $0.4\times(200-\text{their morning sales})$ to obtain 50 | Calculate $\text{your afternoon decimal}\times(200-\text{your morning-sales total})$ to find the afternoon-sales total. |
| 8 | 037c95 | R2 | Finds the number remaining by subtracting both "their" sales totals from 200 | Subtract both your sales totals from $200$ to find the number of mangoes left. |
| 9 | 037c95 | R3 | Uses the original total of 200 as the whole when forming the percentage | Use the original $200$ as the whole, so place it as the denominator when you form the percentage. |
| 10 | 037c95 | AK4 | Calculates $\dfrac{\text{their remaining mangoes}}{200}\times100$ to obtain $37.5\%$ | Calculate $\dfrac{\text{your remaining mangoes}}{200}\times100$ and express the result using $\%$. |
| 11 | c0bedb | AK1 | Evaluates $5 \diamond 4$ as $2(5)+3(4)$ and obtains 22 | Evaluate $5 \diamond 4$ by multiplying each input by its stated coefficient and adding the results. |
| 12 | c0bedb | CK1 | Recognises that the rating of batch C is "their" batch A rating plus 4 | Add 4 to your batch A rating to find the rating of batch C. |
| 13 | c0bedb | CK2 | Forms $2x+3(4) = 26$ | Translate the operation rule and the rating of batch C into an equation in $x$. |
| 14 | c0bedb | AK2 | Solves the equation to obtain $x=7$ | Rearrange your equation step by step until $x$ is alone. |
| 15 | c0bedb | CK3 | Uses 4 as the first input and "their" value of $x$ as the second input | Use 4 as the first input and your value of $x$ as the second input in $4 \diamond x$. |
| 16 | c0bedb | AK3 | Substitutes correctly to obtain $2(4)+3(7)$ | Substitute the first input and your value of $x$ into the operation rule before simplifying. |
| 17 | c0bedb | AK4 | Simplifies to show that the result is 29 | Simplify the multiplication and addition in your expression to get one result. |
| 18 | c0bedb | R1 | Compares $x \diamond 4$ with $4 \diamond x$ using "their" values | Calculate $x \diamond 4$ and $4 \diamond x$ using your values, then compare the two results. |
| 19 | c0bedb | R2 | Establishes that the two results are different | Check whether the two results you obtain are equal or different. |
| 20 | c0bedb | R3 | Concludes that $\diamond$ is not commutative | Use your comparison to state whether $\diamond$ is commutative. |
| 21 | 037c9d | CK1 | Recognises that the entries for Round 1 are substituted as $2 \diamond 3$ | Substitute the Round 1 entries as $2 \diamond 3$. |
| 22 | 037c9d | AK1 | Evaluates $2(2)+3$ to obtain $7$ | Evaluate $2(2)+3$ by multiplying before adding. |
| 23 | 037c9d | CK2 | Uses "their" Round 1 code as the first entry for Round 2 | Use your Round 1 code as the first entry for Round 2. |
| 24 | 037c9d | AK2 | Applies the operation as $2(\text{their }7)+4$ | Apply the operation to your Round 1 code and the second Round 2 entry as $2(\text{your Round 1 code})+4$. |
| 25 | 037c9d | R1 | Shows that the Round 2 code is $18$ | Apply the round rule to your Round 1 code to find the Round 2 code. |
| 26 | 037c9d | CK3 | Recognises that the Round 2 code is the first entry for Round 3 | Use the Round 2 code as the first entry for Round 3. |
| 27 | 037c9d | R2 | Forms $2(18)+n=40$, or equivalent using "their" Round 2 code | Form an equation by substituting your Round 2 code into $2(\text{your Round 2 code})+n=40$. |
| 28 | 037c9d | AK3 | Solves "their" equation for $n$ | Solve your equation by isolating $n$. |
| 29 | c0bee3 | CK1 | Identifies the comparison rectangle as $8\text{ m}$ by $4\text{ m}$ | Read the labelled length and width of the comparison rectangle from the diagram and record both in $\text{m}$. |
| 30 | c0bee3 | AK1 | Calculates the area of the rectangle as $32\text{ m}^2$ | Multiply the rectangle's length by its width to calculate its area in $\text{m}^2$. |
| 31 | c0bee3 | AK2 | Multiplies "their" estimated area by 20 | Multiply your estimated shaded area by 20 to find the savings. |
| 32 | c0bee3 | CK2 | Uses "their" savings as the principal | Use your savings as the principal amount in the compound-interest calculation. |
| 33 | c0bee3 | CK3 | Uses $0.05$ as the annual rate and 2 as the number of periods | Use the annual rate and number of periods stated in the information when you apply compound interest. |
| 34 | c0beeb | AK3 | Lists all negative factors corresponding to the positive factors | Write the negative partner of every positive factor by placing a minus sign before each one. |
| 35 | c0beeb | R1 | Uses "their" positive factors and applies the condition more than 4 | Use your positive factors and keep only those that satisfy the stated greater-than condition. |
| 36 | c0beeb | R2 | Selects the only "their" factor fewer than 10, giving 6 | From your remaining factors, select the only one that also satisfies the stated upper-limit condition. |
| 37 | c0beeb | AK4 | Generates successive positive multiples of "their" carton size | Starting with your carton size, repeatedly add that same size to generate successive positive multiples. |
| 38 | c0beeb | R3 | Stops the list at the greatest multiple not exceeding 30 | Stop when the next multiple would exceed the stated maximum. |
| 39 | c0bef3 | AK1 | Halves the diameter to obtain the radius | Divide the diameter by two to find the radius. |
| 40 | c0bef3 | CK1 | Recognises that the patio consists of a rectangle and a semicircle | Split the patio into a rectangle and a semicircle before calculating its area. |
| 41 | c0bef3 | CK2 | Selects half the area of a circle for the semicircular end | Use half of the circle-area formula for the semicircular end. |
| 42 | c0bef3 | AK2 | Calculates the rectangular area as $112\text{ m}^2$ | Multiply the rectangle's length by its width and give the area in $\text{ m}^2$. |
| 43 | c0bef3 | AK3 | Substitutes "their" radius to calculate the semicircular area as $77\text{ m}^2$ | Substitute your radius into half the circle-area formula and give the semicircular area in $\text{ m}^2$. |
| 44 | c0bef3 | R1 | Combines the two component areas to establish $189\text{ m}^2$ | Add the rectangle area and the semicircle area to find the total patio area in $\text{ m}^2$. |
| 45 | c0bef3 | CK3 | Recognises that the area of one slab is found from length multiplied by width | Find the area of one slab by multiplying its length by its width. |
| 46 | c0bef3 | AK4 | Divides "their" patio area by "their" area of one slab to obtain $126$ | Divide your patio area by your area of one slab to find how many slabs you need. |
| 47 | c0bef3 | R2 | Divides "their" number of slabs by $10$ to obtain $12.6$ packs | Divide your number of slabs by $10$ to find how many packs are needed. |
| 48 | c0bef3 | R3 | Rounds up to the next whole pack because part of a pack cannot be bought | Round the number of packs up to the next whole pack because you cannot buy part of a pack. |
| 49 | 037caf | CK2 | Selects the area of a circle and recognises that the required region is a semicircle | Choose the circle-area formula, then take half of it because the region is a semicircle. |
| 50 | 037caf | AK1 | Substitutes "their" radius into $\frac12\pi r^2$ | Substitute your earlier radius into $\frac12\pi r^2$ before calculating. |
| 51 | 037caf | AK2 | Simplifies to $24.5\pi\text{ m}^2$ | Simplify the numerical coefficient, keep $\pi$, and include the square-metre unit $\text{ m}^2$. |
| 52 | 037caf | CK3 | Recognises that the areas of the rectangle and semicircle are added | Add the rectangle’s area to the semicircle’s area because both regions are included. |
| 53 | 037caf | AK3 | Obtains $140+24.5\pi$ from $14\times10+$ "their" semicircle area | Multiply the rectangle’s length by its width, then add your earlier semicircle area. |
| 54 | 037caf | R1 | Expresses "their" area in exact form | Leave your area in an exact form by keeping $\pi$ instead of converting it to a decimal. |
| 55 | 037caf | R2 | Uses the area of 3 beds and divides by the coverage of one bag | Find the total area for all the beds, then divide by the area one bag covers. |
| 56 | 037caf | AK4 | Evaluates $3\times$ "their" area $\div25$ | Calculate the area for the number of beds using $n\times$ your earlier area, then divide by the coverage of one bag. |
| 57 | c0befb | CK3 | Recognises that Figure 5 has 3 more dots than "their" Figure 4 | Compare the next figure with your Figure 4 total and identify the constant increase in dots. |
| 58 | c0befb | AK2 | Adds 3 to "their" Figure 4 total to obtain 16 | Add the pattern’s constant increase to your Figure 4 total. |
| 59 | c0befb | R2 | Uses "their" Figure 5 total as the starting value for the next figure | Start the next calculation with your Figure 5 total. |
| 60 | c0befb | AK3 | Adds 3 to "their" Figure 5 total | Add the same constant increase to your Figure 5 total. |
| 61 | 037cb7 | CK2 | Uses $n=4$ for Figure 4 | Use $n=4$ for Figure 4. |
| 62 | 037cb7 | R1 | Reads $P=16$ from their graph at $n=4$ | Read the value of $P$ from your graph where $n=4$. |
| 63 | 037cb7 | AK3 | Substitutes $n=3$ to obtain $P=9$ | Substitute $n=3$ into $P=n^2$ and calculate $P$. |
| 64 | 037cb7 | R2 | Adds $9$ to "their" Figure 4 value | Add the Figure 3 value to your Figure 4 value. |
| 65 | 037cb7 | CK3 | Recognises that the dots left are found by subtracting the number used from 30 | Find the dots left by subtracting the number used from $30$. |
| 66 | 037cb7 | AK4 | Subtracts "their" total from 30, giving 5 | Subtract your total from $30$. |
| 67 | c0bf03 | CK2 | Identifies gradient as rise divided by run | Calculate the gradient by dividing the vertical rise by the horizontal run between two points on the line. |
| 68 | c0bf03 | CK3 | Recognises that solutions of the pair are common points of the two graphs | Find the points where the two graphs cross, since these common points give the solutions. |
| 69 | c0bf03 | AK4 | Reads the intersection coordinates as $(2,-1)$ and $(3,0)$ | Read the $x$- and $y$-coordinates of each intersection directly from the graph. |
| 70 | c0bf03 | R3 | States both ordered-pair solutions | State both solutions as ordered pairs using the intersection coordinates you read. |
| 71 | c0bf0b | CK1 | Identifies that the underlined digit is in the eights place. | Locate the underlined digit by counting place values from the right and identify it as the eights place. |
| 72 | c0bf0b | AK1 | Calculates $3\times8=24$. | Multiply the digit by its place value using $3\times8$. |
| 73 | c0bf0b | AK2 | Expresses $24$ as $2^3\times3$. | Break $24$ into prime factors and use powers and multiplication, as in $2^n\times p$. |
| 74 | c0bf0b | AK3 | Expresses $36$ as $2^2\times3^2$. | Break $36$ into prime factors and use powers and multiplication, as in $2^n\times p$. |
| 75 | c0bf0b | CK2 | Identifies the common prime factors as $2^2\times3$. | Compare the prime factorisations and keep each shared prime with the smaller power to get the common factors as $2^2\times3$. |
| 76 | c0bf0b | CK3 | Selects the relationship $\operatorname{LCM}\times\operatorname{HCF}=24\times36$. | Use the relationship $\operatorname{LCM}\times\operatorname{HCF}=24\times36$ to connect the two numbers with the H.C.F. and L.C.M. |
| 77 | c0bf0b | AK4 | Substitutes $12$ and calculates $\frac{24\times36}{12}=72$. | Substitute the H.C.F. into $\frac{24\times36}{\text{HCF}}$ and calculate the quotient. |
| 78 | c0bf0b | R1 | Concludes that the common flashing interval is 72 seconds. | State that the lamps flash together once every L.C.M. seconds. |
| 79 | c0bf0b | AK5 | Converts 5 minutes to 300 seconds. | Convert the five-minute gap into seconds before comparing it with the flashing intervals. |
| 80 | c0bf0b | R2 | Uses 4 complete intervals of "their" common flashing interval to obtain 288 seconds. | Multiply 4 by your common flashing interval and express the elapsed time in seconds. |
| 81 | c0bf0b | R3 | Shows that a fifth interval of "their" common flashing interval exceeds 300 seconds. | Multiply 5 by your common flashing interval and check that it is greater than the departure gap in seconds. |
| 82 | c0bf0b | R4 | Adds 4 minutes 48 seconds to 06:45:00 to obtain 06:49:48. | Add the elapsed four-interval time, converted to minutes and seconds, to 06:45:00 and write the resulting clock time. |
| 83 | c0bf13 | CK1 | States determinant as $3(1)-1(2)$ | Calculate the determinant as $3(1)-1(2)$. |
| 84 | c0bf13 | CK2 | Forms the adjoint $\begin{pmatrix}1 & -1 \\ -2 & 3\end{pmatrix}$ | Form the adjoint by swapping the diagonal entries and changing the signs of the off-diagonal entries in a $\begin{pmatrix}\cdot & \cdot \\ \cdot & \cdot\end{pmatrix}$. |
| 85 | c0bf13 | R1 | Uses "their" non-zero determinant to establish that the inverse exists | Use your non-zero determinant to state that the inverse exists. |
| 86 | c0bf13 | CK3 | Uses $A^{-1}=\dfrac{1}{\det(A)}\operatorname{adj}(A)$ | Use $A^{-1}=\dfrac{1}{\det(A)}\operatorname{adj}(A)$ to set up the inverse. |
| 87 | c0bf13 | AK2 | Substitutes "their" determinant to obtain the stated inverse | Substitute your determinant into the inverse formula and simplify to obtain your inverse matrix. |
| 88 | c0bf13 | R2 | Applies "their" inverse matrix to the order-total vector | Multiply your inverse matrix by the order-total vector. |
| 89 | c0bf13 | AK3 | Calculates the standard-carton entry using "their" inverse | Calculate the standard-carton entry from the first row of your inverse-matrix multiplication. |
| 90 | c0bf13 | AK4 | Calculates the deluxe-carton entry using "their" inverse | Calculate the deluxe-carton entry from the second row of your inverse-matrix multiplication. |
| 91 | c0bf13 | R3 | Concludes that "their" carton numbers allow exact packing because both are positive whole numbers | Conclude that your carton numbers allow exact packing by checking that both are positive whole numbers. |
| 92 | 037cc4 | CK1 | Recognises $6$ as a common factor of both $18$ and $24$ | List the factors of both numbers and identify a factor that appears in both lists. |
| 93 | 037cc4 | AK3 | Divides $18$ and $24$ by "their" bundle size | Divide each packet total by your bundle size to find how many bundles each type makes. |
| 94 | 037cc4 | CK2 | Identifies "their" L.C.M. as the time until the alerts next sound together | Use your L.C.M. as the waiting time until both alerts sound together again. |
| 95 | 037cc4 | AK5 | Converts "their" number of minutes to hours and minutes | Convert your number of minutes into whole hours and remaining minutes. |
| 96 | 037cc4 | R1 | Adds "their" elapsed time correctly to $08{:}00$ | Add your elapsed time to $08{:}00$ carefully, carrying into the next hour when needed. |
| 97 | 037cc4 | R2 | Establishes that the next joint alert is at $09{:}12$ | State the clock time you obtain for the next joint alert. |
| 98 | 037cc4 | CK3 | States the value of the underlined units digit as $3$ | Read the underlined units digit and state its value. |
| 99 | 037cc4 | R3 | Interprets $1\underline{3}_4$ as $4+3$ | Interpret $1\underline{\phantom{0}}_4$ by multiplying the leading digit by the base and then adding the units digit. |
| 100 | 037cc4 | R4 | Compares the base-four value with "their" total number of bundles and gives a supported verdict | Compare your base-four value with your total number of bundles and give a verdict supported by the comparison. |
| 101 | 037ccc | R2 | Reads the gradient of the line as $2$ | Read the rise over run from the line to find the gradient, $2$. |
| 102 | 037ccc | CK2 | Recognises that the equation of a straight line has the form $y = mx + c$ | Use the straight-line equation form $y = mx + c$. |
| 103 | 037ccc | AK3 | Substitutes "their" gradient and "their" intercept to obtain the equation | Substitute your gradient and your intercept into $y = mx + c$ to form the equation. |
| 104 | 037ccc | R3 | Expresses "their" equation in the form $y = mx + c$ | Write your equation in the form $y = mx + c$. |
| 105 | 037ccc | CK3 | Recognises that $gf(x) = g(f(x))$ | Interpret $gf(x) = g(f(x))$ by applying $f$ first and then $g$. |
| 106 | c0bf2a | CK1 | Forms $(x+3)(x+4)$ from the rows and rolls in each row | Form $(x+3)(x+4)$ by multiplying the number of rows by the number of rolls in each row. |
| 107 | c0bf2a | AK1 | Expands to give $x^2+7x+12$ | Expand the two brackets for one tray and combine terms with the same power of $x$. |
| 108 | c0bf2a | CK2 | Uses 3 times "their" expression for one tray | Represent the rolls in three trays by multiplying your one-tray expression by 3. |
| 109 | c0bf2a | AK2 | Distributes 3 across "their" expression | Distribute 3 to every term in your one-tray expression. |
| 110 | c0bf2a | R1 | Collects like terms to obtain "their" total for 3 trays | Collect terms with the same power of $x$ to write your total number of rolls for three trays. |
| 111 | c0bf2a | CK3 | Forms revenue as $(x+2)$ multiplied by "their" total number of rolls | Form the revenue by multiplying $(x+2)$ by your total number of rolls. |
| 112 | c0bf2a | AK3 | Applies the distributive law to expand $(x+2)$ by "their" total | Use the distributive law to multiply $(x+2)$ by every term in your total number of rolls. |
| 113 | c0bf2a | R2 | Collects like terms in "their" expanded revenue expression | Collect like terms in your expanded revenue expression. |
| 114 | c0bf2a | R3 | States the fully expanded revenue expression | State your revenue expression as one fully expanded polynomial in descending powers of $x$. |
| 115 | 037cde | CK1 | Represents the buns on four racks as $4(x + 3)$ | Write four lots of the buns on one rack as $4(x + 3)$. |
| 116 | 037cde | R1 | Forms $3($"their" total for one group$)$ | Put your total for one group in brackets and multiply it by 3. |
| 117 | 037cde | CK2 | Recognises that the factor 3 applies to both terms in $3($"their" expression$)$ | Multiply every term inside your brackets by 3. |
| 118 | 037cde | AK2 | Obtains a simplified expression from $3($"their" expression$)$ | Expand your bracketed expression and collect like terms. |
| 119 | 037cde | R2 | Shows $12x + 36$ when using the correct total from part (a) | Use the correct total from part (a), multiply it by 3, and simplify. |
| 120 | 037cde | R3 | Subtracts 12 from the stated total to obtain $12x + 24$ | Subtract 12 from the stated total, then simplify. |
| 121 | 037cde | CK3 | Identifies 12 as the common factor of $12x + 24$ | Find the greatest common factor shared by both terms and factorise it. |
| 122 | c0bf32 | CK1 | Selects the sector fraction $\frac{90}{360}$ of the area of a circle | Use the sector fraction $\frac{90}{360}$ of the circle’s area. |
| 123 | c0bf32 | AK1 | Substitutes $r=7$ and $\pi=\frac{22}{7}$ into the sector-area calculation | Substitute $r=7$ and $\pi=\frac{22}{7}$ into the sector-area calculation. |
| 124 | c0bf32 | R1 | Uses \$10 per square metre with "their" area | Multiply your area by \$10 per square metre. |
| 125 | c0bf32 | CK2 | Identifies depreciation as the decrease expressed as a percentage of the original value | Find the decrease from the original value, then express that decrease as a percentage of the original value. |
| 126 | c0bf32 | R2 | Forms $\frac{\text{their new value}-308}{\text{their new value}}\times100$ | Form $\frac{\text{your new value}-308}{\text{your new value}}\times100$. |
| 127 | c0bf32 | CK3 | Selects the multiplier $1-\text{their depreciation rate}$ | Use the multiplier $1-\text{your depreciation rate}$. |
| 128 | 037ce6 | CK1 | Selects the sector area calculation using $\frac{180}{360}\pi r^2$ | Calculate the sector area using $\frac{180}{360}\pi r^2$. |
| 129 | 037ce6 | AK2 | Multiplies "their" area by 15 to obtain 1155 | Multiply your area by 15 to find your current quotation. |
| 130 | 037ce6 | CK2 | Recognises that the depreciated quotation is $70\%$ of the original quotation | Treat the depreciated quotation as $70\%$ of the original quotation. |
| 131 | 037ce6 | R1 | Forms $0.70P = 1155$, using "their" current quotation | Form $0.70P = \text{your current quotation}$. |
| 132 | 037ce6 | AK3 | Divides "their" current quotation by 0.70 | Divide your current quotation by $0.70$ to find the original quotation. |
| 133 | 037ce6 | CK3 | Uses "their" current quotation as the base amount for the appreciation percentage | Use your current quotation as the base amount when finding the appreciation percentage. |
| 134 | 037ce6 | R2 | Calculates $\frac{\text{their original quotation} - \text{their current quotation}}{\text{their current quotation}} \times 100$ | Calculate $\frac{\text{your original quotation} - \text{your current quotation}}{\text{your current quotation}} \times 100$. |
| 135 | 037ce6 | R3 | Expresses "their" percentage correct to 1 decimal place | Write your percentage correct to 1 decimal place. |
| 136 | c0bf3a | CK1 | Selects the triangle-area formula using two sides and the included angle | Use the triangle area formula with two sides and the included angle, $A=\frac{1}{2}ab\sin C$. |
| 137 | c0bf3a | AK1 | Substitutes $12$, $10$ and $60°$ correctly | Substitute the two given side lengths and the included angle into $A=\frac{1}{2}ab\sin C$ correctly. |
| 138 | c0bf3a | AK2 | Evaluates $\frac{1}{2}(12)(10)\sin 60°$ to obtain $30\sqrt{3}$ | Evaluate $\frac{1}{2}(12)(10)\sin 60°$ exactly, using $\sin 60°=\frac{\sqrt{3}}{2}$. |
| 139 | c0bf3a | R1 | Expresses the area in exact form | Write your area in exact form using $\sqrt{3}$ instead of a decimal. |
| 140 | c0bf3a | CK2 | Recognises that three identical awnings have three times the area of one awning | Multiply the area of one awning by the number of identical awnings. |
| 141 | c0bf3a | AK3 | Multiplies "their" area of one awning by $3$ | Multiply your area for one awning by $3$. |
| 142 | c0bf3a | R2 | Links "their" product to the total canvas area for three awnings | State that your product represents the total canvas area for the three awnings. |
| 143 | c0bf3a | CK3 | Recognises that the fourth awning has the same area as each of the first three | Use the fact that the fourth awning is identical to the first three, so it has the same area. |
| 144 | c0bf3a | AK4 | Adds "their" area for three awnings to "their" area for one awning | Add your area for three awnings to your area for one awning. |
| 145 | c0bf3a | R3 | Uses "their" earlier areas to determine the canvas required for all four awnings | Use your earlier areas to state the total canvas required for all four awnings. |
| 146 | 037cf3 | CK2 | Selects the area relationship for two sides and their included angle. | Use the triangle-area formula $\frac12 ab\sin C$ for two sides and the included angle. |
| 147 | 037cf3 | R2 | Identifies from 'their' image that $A'B'=A'C'=3$ and $\angle B'A'C'=90°$. | Measure your image and identify the two equal sides and the included angle at $A'$. |
| 148 | 037cf3 | AK2 | Substitutes 'their' lengths and included angle into $\frac12 ab\sin C$. | Substitute your two side lengths and your included angle into $\frac12 ab\sin C$ before simplifying. |
| 149 | 037cf3 | CK3 | Recognises that the segment area is the sector area minus the area of triangle $A'B'C'$. | Find the segment area by subtracting the area of triangle $A'B'C'$ from the sector area. |
| 150 | 037cf3 | AK4 | Calculates the $90°$ sector area as $\frac{90}{360}\pi(3)^2=\frac{9\pi}{4}$. | Calculate the sector area as the fraction of the full circle, using $\frac{\theta}{360}\pi r^2$. |
| 151 | 037cf3 | AK5 | Subtracts 'their' triangle area from $\frac{9\pi}{4}$ to obtain $\frac{9}{4}(\pi-2)$. | Subtract your triangle area from the sector area and simplify the exact result using $\pi$ and a $\frac{}{}$ coefficient. |
| 152 | 037cf3 | R3 | Compares the original area of $18$ square units with 'their' image area. | Compare the original pennant area with your image area by dividing one area by the other. |
| 153 | 037cf3 | R4 | Justifies that scale factor $\frac12$ gives area scale factor $\frac14$. | Justify the area scale factor by squaring the linear scale factor, using $\left(\frac12\right)^2$. |
| 154 | 037cfb | CK3 | Recognises that the class frequencies must be added to obtain the total number weighed | Add the frequencies of all the histogram bars to find the total number weighed. |
| 155 | 037cfb | AK1 | Adds the frequencies to obtain $40$ | Add each class frequency carefully to obtain the total. |
| 156 | 037cfb | AK2 | Forms cumulative frequencies $4$, $12$, $26$, $35$, $40$ | Create cumulative frequencies by successively adding each frequency to the running total. |
| 157 | 037cfb | R1 | Uses the 20th and 21st values from "their" total to identify the interval containing the median | Use the two middle positions from your total and locate the class interval containing both. |
| 158 | 037cfb | R2 | Selects $400$, $12$, $14$ and $100$ from "their" median interval and the histogram | Read the lower class boundary, preceding cumulative frequency, class frequency, and class width from your median interval and the histogram. |
| 159 | 037cfb | AK3 | Substitutes correctly in $400+\frac{20-12}{14}\times100$ | Substitute the values you selected into the interpolation structure $L+\frac{p-C}{f}\times w$. |
| 160 | 037cfb | AK4 | Evaluates the estimate as $457.142\ldots$ | Evaluate your interpolation expression accurately, keeping any continuing decimal shown by $\ldots$. |
| 161 | 037cfb | R3 | Expresses "their" estimate to 1 decimal place | Round your estimate to 1 decimal place. |
| 162 | 037d03 | CK2 | Recognises that reflection in $y=x$ interchanges the coordinates | Swap the $x$- and $y$-coordinates of every point when you reflect it in $y=x$. |
| 163 | 037d03 | R2 | Forms the reflection matrix with columns $(0,1)$ and $(1,0)$ | Use the transformed coordinate unit vectors as the columns of your reflection matrix $\begin{pmatrix}a&b\\c&d\end{pmatrix}$. |
| 164 | 037d03 | R3 | Uses the reflection matrix on the left of "their" rotation matrix | Put your reflection matrix on the left of your rotation matrix before you multiply them. |
| 165 | 037d03 | AK2 | Writes the matrix for a $90°$ anticlockwise rotation as $\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ | Write the standard anticlockwise $90°$ rotation matrix in the form $\begin{pmatrix}a&b\\c&d\end{pmatrix}$, checking where each coordinate moves. |
| 166 | 037d03 | AK3 | Multiplies the matrices correctly using "their" matrix from part (b) | Multiply your matrix from part (b) by your rotation matrix row by column, using your own earlier matrix even if you need to correct it. |
| 167 | 037d0b | R2 | Uses the common point of the two graphs to solve the pair of equations | Read the coordinates where the two lines intersect and use that ordered pair to solve both equations. |
| 168 | 037d0b | CK1 | Selects the coordinate differences to determine the length $AP$ | Subtract the x-coordinates and the y-coordinates of A and P, then use these differences in the distance formula. |
| 169 | 037d0b | CK2 | Recognises that midpoint coordinates are found by averaging corresponding coordinates | Add the two x-coordinates and divide by two, then do the same with the two y-coordinates to find the midpoint. |
| 170 | 037d0b | CK3 | States that parallel lines have equal gradients | Use the fact that parallel lines have the same gradient. |
| 171 | 037d0b | R4 | Forms an equation with gradient $-\frac{1}{2}$ through "their" midpoint, giving $y=-\frac{1}{2}x+\frac{7}{2}$ | Use your midpoint in $y-y_1=-\frac{1}{2}(x-x_1)$, then rearrange into $y=mx+c$. |
| 172 | c0bf51 | R1 | Reads the intersection of the two graphs as $(-1,-1)$ | Find where the two plotted lines cross and read the coordinates of that point from the grid. |
| 173 | c0bf51 | CK2 | Identifies the reference test point as $(-3,-5)$ and uses "their" intersection point | Substitute the given test input into the original rule to locate the reference point, then use your intersection point. |
| 174 | c0bf51 | R3 | Determines the perpendicular gradient as the negative reciprocal of the gradient of the original segment | Calculate the gradient of the original segment, then take its negative reciprocal for the perpendicular gradient. |
| 175 | c0bf51 | AK5 | Uses "their" midpoint and "their" length on the perpendicular line to obtain the two grid-point endpoints | Starting from your midpoint, move along the perpendicular line by half of your length in opposite directions to locate both grid-point endpoints. |
| 176 | 037d13 | CK2 | Factorizes the numerator as $(n+1)(n+4)$ | Factor the numerator into two binomials and check by expanding your factors. |
| 177 | 037d13 | AK2 | Writes the fraction as $\dfrac{(n+1)(n+4)}{n+1}$ | Rewrite the fraction as $\dfrac{(n+1)(n+4)}{n+1}$ after factorising the numerator. |
| 178 | 037d13 | AK3 | Cancels the common factor and obtains $n+4$ | Cancel the common factor in the numerator and denominator, then simplify the expression. |
| 179 | 037d13 | R2 | Forms $n+4=8$ using "their" simplified expression | Set your simplified expression equal to the supervisor’s stated number of dots. |
| 180 | 037d13 | R3 | Solves to obtain figure number $4$ | Solve the equation to identify the figure number. |
| 181 | 037d13 | CK3 | Substitutes "their" figure number into the original expression | Substitute your figure number into the original fraction, not the simplified expression. |
| 182 | 037d13 | AK4 | Evaluates "their" fraction correctly | Evaluate your fraction carefully by completing the numerator calculation and then dividing by the denominator. |
| 183 | c0bf59 | CK3 | Recognises $17x+17$ as $17(x+1)$. | Rewrite the numerator as the common factor multiplied by $(x+1)$. |
| 184 | c0bf59 | AK2 | Cancels the common factor 17. | Cancel the identical factor in the numerator and denominator to simplify the fraction. |
| 185 | c0bf59 | R2 | Equates "their" simplified average to 5. | Set your simplified average equal to $5$. |
| 186 | c0bf59 | AK4 | Solves "their" equation for $x$. | Rearrange your equation to isolate $x$. |
| 187 | c0bf61 | R2 | Uses $x=2$ to locate the appropriate point on "their" graph | Use $x=2$ to locate the corresponding point on your graph. |
| 188 | c0bf61 | AK2 | Reads ordinate $24$ from "their" graph | Read the ordinate of that point from your graph. |
| 189 | c0bf61 | CK2 | States the surface area in cm$^2$ | State the surface area with units of cm$^2$. |
| 190 | c0bf61 | CK3 | Recognises that the 4 containers have equal surface areas | Recognise that all four containers have equal surface areas. |
| 191 | c0bf61 | AK3 | Calculates $4\times$ "their" surface area of one container | Calculate the total surface area by doing $4\times$ your surface area for one container. |
| 192 | 037d20 | CK2 | Identifies the horizontal level $A = 24$ on the graph | Locate the horizontal level stated for $A$ on the graph before reading across. |
| 193 | 037d20 | CK3 | Recognises that a box with no lid has five square faces | Count the square faces that remain when the box has no lid. |
| 194 | 037d20 | R3 | Uses "their" edge length from part (b) | Use your edge length from part (b) in the calculation for the metal area. |
| 195 | 037d20 | AK2 | Forms $5 \times (\text{their } x)^2$ | Form $5 \times (\text{your } x)^2$ using your edge length. |
| 196 | c0bf69 | CK1 | Selects the rate for buying local dollars | Select the rate the bureau uses when it buys local dollars. |
| 197 | c0bf69 | CK2 | Identifies the service charge as 2% of "their" local-dollar amount | Identify the service charge as 2% of your local-dollar amount. |
| 198 | c0bf69 | AK2 | Calculates 2% of "their" amount | Calculate 2% of your local-dollar amount to find your service charge. |
| 199 | c0bf69 | R1 | Deducts "their" service charge from "their" local-dollar amount to establish \$441 | Subtract your service charge from your local-dollar amount to find your post-charge amount. |
| 200 | c0bf69 | CK3 | Recognises that the buying rate of \$2.40 per US dollar requires division to convert local dollars to US dollars | Divide by the buying rate to convert your local-dollar balance into US dollars. |
| 201 | c0bf69 | AK3 | Finds the remaining local dollars as "their" \$441 less \$375 | Subtract the attraction cost from your post-charge local-dollar amount to find your remaining balance. |
| 202 | c0bf69 | AK4 | Divides "their" remaining local dollars by 2.40 | Divide your remaining local-dollar balance by the buying rate. |
| 203 | c0bf69 | R2 | Uses "their" post-charge amount after deducting the attraction cost before converting the balance | Deduct the attraction cost from your post-charge amount before converting the balance to US dollars. |
| 204 | c0bf69 | R3 | Concludes that "their" amount received is less than US\$30 | Compare your received US-dollar amount with the stated target and conclude whether it is less. |
| 205 | 037d3a | CK1 | Identifies the sixth and seventh values as the middle positions | Locate the sixth and seventh entries in the ordered list as the two middle positions. |
| 206 | 037d3a | CK2 | Separates the data into lower and upper halves using "their" median | Split the ordered data into lower and upper halves using your median. |
| 207 | 037d3a | CK3 | Identifies a total of 12 deliveries | Count all the deliveries in the table. |
| 208 | 037d3a | CK4 | Identifies 5 deliveries with mass at least "their" upper quartile | Count the deliveries whose masses are at least your upper quartile. |
| 209 | 037d3a | AK5 | Forms the proportion $\frac{5}{12}$ | Form the proportion as $\frac{\text{qualifying deliveries}}{\text{total deliveries}}$. |
| 210 | 037d3a | R1 | Recognises that Kemar's 50% is greater than "their" proportion for Amara | Compare Kemar's $50\%$ with your proportion for Amara and identify which is greater. |
| 211 | 037d3a | R2 | Compares the standard deviations and identifies $1.4\text{ kg} < 2.0\text{ kg}$ | Compare the standard deviations using $1.4\text{ kg} < 2.0\text{ kg}$. |
| 212 | 037d3a | R3 | Concludes that Kemar should be chosen using both conditions | Choose Kemar using both the greater proportion and the smaller standard deviation. |
| 213 | 037d47 | CK1 | Recognises that all five class frequencies are required for the sample total. | Include the frequency from every class when you find the sample total. |
| 214 | 037d47 | AK1 | Adds the frequencies to obtain $80$. | Add all five class frequencies carefully to find your sample total. |
| 215 | 037d47 | CK2 | Selects the three classes with mass less than $8$ kg. | Choose all and only the classes whose masses are below $8$ kg. |
| 216 | 037d47 | AK2 | Adds the selected frequencies to obtain $50$. | Add the frequencies from the three classes you selected for masses below $8$ kg. |
| 217 | 037d47 | AK3 | Calculates $\frac{50}{\text{their }80}\times100=62.5\%$. | Calculate the percentage using $\frac{\text{your below-$8$ frequency}}{\text{your total}}\times100$. |
| 218 | 037d47 | R1 | Uses the complement of the small breadfruit, using $100\%-\text{their }62.5\%$ or $\text{their }80-\text{their }50$. | Find the not-small amount by subtracting $\text{your small percentage}$ from $100\%$, or subtract $\text{your small frequency}$ from $\text{your total}$. |
| 219 | 037d47 | CK3 | Recognises that the class $10\le m<12$ is excluded when considering masses less than $10$ kg. | Leave out the class $10\le m<12$ when you count breadfruit with masses less than $10$ kg. |
| 220 | 037d47 | R2 | Uses $\text{their }30-15$ to find the $8\le m<10$ group and combines this with their number below $8$ kg to obtain $65$ and $81.25\%$. | Subtract the frequency in the at-least-$10$ kg class from $\text{your not-small total}$ to find the $8\le m<10$ group, combine it with $\text{your below-$8$ total}$, and calculate the $\%$. |
| 221 | 037d47 | R3 | Compares their percentage with $80\%$ and concludes that the delivery qualifies. | Compare your percentage with $80\%$ and state whether the delivery qualifies. |
| 222 | c0bf92 | CK1 | Selects the frequencies from all five mass classes. | Add the frequencies from each of the five mass classes to find the total frequency. |
| 223 | c0bf92 | CK2 | Selects the three classes with masses less than 400 g. | Select only the frequency classes whose masses are below 400 g. |
| 224 | c0bf92 | AK2 | Finds the frequency below 400 g as 36. | Add the selected frequencies below 400 g. |
| 225 | c0bf92 | AK3 | Calculates $\frac{36}{\text{their }50}\times100$ to show 72%. | Calculate $\frac{\text{your frequency below 400 g}}{\text{your total frequency}}\times100$. |
| 226 | c0bf92 | CK3 | Recognises that the 200 ≤ m < 300 class is outside the packing interval. | Exclude the $200 \le m < 300$ class because it is not in the packing interval. |
| 227 | c0bf92 | R1 | Subtracts 8 from "their" frequency below 400 g to obtain the packing frequency. | Subtract the frequency in the $200 \le m < 300$ class from your frequency below 400 g to find the packing frequency. |
| 228 | c0bf92 | AK4 | Calculates $\frac{\text{their }28}{\text{their }50}\times100$ to obtain 56%. | Calculate $\frac{\text{your packing frequency}}{\text{your total frequency}}\times100$. |
| 229 | c0bf92 | R2 | Uses "their" packed percentage and identifies that the 300 ≤ m < 350 class must be removed. | Remove the percentage for the $300 \le m < 350$ class from your packed percentage. |
| 230 | c0bf9a | AK3 | Calculates $16 \times 7.35$ to obtain \$117.60. | Calculate $16 \times 7.35$ accurately to find the simple interest in \$. |
| 231 | c0bf9a | CK2 | Selects the simple-interest relationship involving principal, rate and time. | Use the simple-interest relationship $I=Prt$ linking interest, principal, rate and time. |
| 232 | c0bf9a | AK4 | Substitutes "their" interest, $r=0.049$ and $t=4$, and rearranges to find the principal. | Substitute your interest with $r=0.049$ and $t=4$ into $I=Prt$, then rearrange to find the principal. |
| 233 | c0bf9a | CK3 | Identifies the amount as principal plus interest. | Add the principal and the interest to find the total amount. |
| 234 | c0bf9a | R2 | Expresses "their" total amount correct to 3 significant figures. | Round your total amount to 3 significant figures and write it in \$. |
| 235 | 037d54 | CK3 | Selects $I = A - P$ before determining the rate. | Use $I = A - P$ before you work out the annual rate. |
| 236 | 037d54 | AK3 | Calculates the interest as \$294. | Calculate the interest by subtracting the principal from the amount. |
| 237 | 037d54 | AK4 | Substitutes \"their\" principal and \$294 into the simple-interest relationship and obtains $7\%$. | Substitute your principal and the interest into the simple-interest relationship, then solve for the rate as a $\%$. |
| 238 | 037d54 | R1 | Uses \"their\" principal and rate to calculate the amount after 3 years. | Use your principal and rate in the simple-interest formula to calculate the amount after three years. |
| 239 | 037d54 | R2 | Expresses \"their\" amount correct to 3 significant figures. | Round your amount to $3$ significant figures. |
| 240 | c0bfa2 | CK1 | Identifies the like terms in $5x+3(x+4)-2x$ | Identify the terms involving $x$ that can be combined after expanding the bracket in $5x+3(x+4)-2x$. |
| 241 | c0bfa2 | AK1 | Expands and simplifies to obtain $6x+12$ | Expand the bracket and combine the variable terms and constants into one simplified expression. |
| 242 | c0bfa2 | CK2 | Applies the quotient law of indices to the powers of 2 and 3 | Use the quotient law of indices by subtracting the denominator exponent from the numerator exponent for each base. |
| 243 | c0bfa2 | AK2 | Obtains $F=12$ | Evaluate the resulting powers and multiply the factors to find $F$. |
| 244 | c0bfa2 | R1 | Multiplies 12 by "their" simplified expression for $A$ to show the stated cost expression | Multiply $12$ by your simplified expression for $A$ to form the cost expression. |
| 245 | c0bfa2 | CK3 | Forms $72x+144\le1008$, using "their" cost expression | Write an inequality that makes your cost expression no greater than the budget. |
| 246 | c0bfa2 | AK3 | Subtracts 144 from both sides of "their" inequality | Subtract the fixed charge from both sides of your inequality. |
| 247 | c0bfa2 | AK4 | Divides by 72 to obtain $x\le12$ | Divide both sides by the coefficient of $x$ and keep the inequality direction unchanged. |
| 248 | c0bfa2 | R2 | States the solution in set-builder notation with the positive whole-number domain | Write your allowed values in set-builder notation using $x\in\mathbb{N}$ and restrict $x$ to positive whole numbers. |
| 249 | c0bfa2 | AK5 | Calculates the waived-charge cost as $72\times13=936$ | Calculate the waived-charge cost using $72\times13$. |
| 250 | c0bfa2 | R3 | Compares $936$ with the budget of \$1 008 | Compare your waived-charge cost with the budget of \$1 008. |
| 251 | c0bfa2 | R4 | Gives a justified conclusion that the special order can be produced | State whether the special order can be produced and justify this using your budget comparison. |
| 252 | 037d61 | CK1 | Selects $V=\pi r^2h$ for the cylinder | Use the cylinder-volume formula $V=\pi r^2h$. |
| 253 | 037d61 | AK1 | Substitutes $r=3$ and $h=10$ and obtains $90\pi\text{ cm}^3$ | Substitute $r=3$ and $h=10$ into the cylinder formula, then calculate the volume in $\pi\text{ cm}^3$. |
| 254 | 037d61 | CK2 | Recognises that the complete mould comprises a cylinder and a hemisphere | Split the complete mould into its cylindrical part and its hemispherical part before finding the total volume. |
| 255 | 037d61 | CK3 | Selects half the volume of a sphere for the hemisphere | Find the hemisphere volume by taking half of the volume of a sphere with the same radius. |
| 256 | 037d61 | AK2 | Calculates the hemisphere volume as $18\pi\text{ cm}^3$ | Calculate half the sphere volume and write the result in $\pi\text{ cm}^3$. |
| 257 | 037d61 | AK3 | Adds $18\pi$ to "their" cylindrical volume to obtain $108\pi\text{ cm}^3$ | Add the hemisphere volume to your cylindrical volume and express the total in $\pi\text{ cm}^3$. |
| 258 | 037d61 | AK4 | Evaluates "their" complete-mould volume in decimal form | Use a calculator to convert your complete-mould volume from a multiple of $\pi$ into a decimal. |
| 259 | 037d61 | R1 | Expresses "their" volume correct to $3$ significant figures | Round your decimal volume to $3$ significant figures. |
| 260 | 037d61 | R2 | Divides "their" volume by $100$ to determine the number of packets | Divide your volume by $100$ to find how many packets are needed. |
| 261 | 037d61 | R3 | Rounds up to whole packets, giving $4$ packets | Round the packet calculation up to the next whole packet, because you cannot buy part of a packet. |
| 262 | c0bfaa | CK2 | Selects the volume formula for the cone | Use $\frac13\pi r^2h$ for the volume of the cone. |
| 263 | c0bfaa | AK1 | Substitutes the cone dimensions to obtain $24\pi\text{ cm}^3$ | Substitute the cone dimensions into $\frac13\pi r^2h$ and simplify, keeping the unit $\text{ cm}^3$. |
| 264 | c0bfaa | AK2 | Adds $24\pi$ to "their" cylindrical volume to obtain $114\pi\text{ cm}^3$ | Add the cone volume to your cylindrical volume and simplify the terms containing $\pi$. |
| 265 | c0bfaa | R1 | Converts $6\pi$ litres to $6000\pi\text{ cm}^3$ and forms a comparison with "their" candle volume | Convert $6\pi$ litres to $\text{ cm}^3$ using $1$ litre $=1000\text{ cm}^3$, then compare this with your candle volume. |
| 266 | c0bfaa | AK3 | Divides $6000\pi$ by "their" candle volume | Divide $6000\pi$ by your candle volume to find how many candles the wax can make. |
| 267 | c0bfaa | CK3 | Recognises that the wax left is the total wax less the wax used for "their" complete candles | Subtract the wax used for your complete candles from the total wax to find the wax left. |
| 268 | c0bfaa | AK4 | Calculates $6000\pi-52(114\pi)$ | Calculate $6000\pi-52(114\pi)$ carefully by multiplying before subtracting. |
| 269 | c0bfaa | R3 | Expresses the volume left exactly in terms of $\pi$ | Write the remaining volume exactly as a multiple of $\pi$. |
| 270 | 037d69 | CK2 | Identifies first term $1.25$ and common difference $0.5$ | Identify the first term and the common difference from the departure times. |
| 271 | 037d69 | CK3 | States the nth-term structure first term plus $(n-1)$ common differences | Write the nth term as the first term plus $(n-1)$ common differences. |
| 272 | 037d69 | AK2 | Simplifies to $0.5n+0.75$, or equivalent | Expand and simplify your nth-term expression into a linear expression in $n$. |
| 273 | 037d69 | AK3 | Substitutes $n=15$ into "their" nth-term expression | Substitute $n=15$ into your nth-term expression. |
| 274 | 037d69 | AK4 | Obtains "their" time in hours after 6:00 a.m. | Evaluate your substitution to find your time in hours after 6:00 a.m. |
| 275 | 037d69 | R1 | Converts $8.25$ hours after 6:00 a.m. to 2:15 p.m. | Convert the hours-after-6:00 a.m. time into a clock time by changing the fractional hour into minutes. |
| 276 | 037d69 | R2 | Uses "their" fifteenth departure and one further interval to identify a possible sixteenth departure | Add one further departure interval to your fifteenth departure to find a possible sixteenth departure. |
| 277 | 037d69 | R3 | Rejects the seventeenth departure as later than 3:00 p.m. | Check that the next departure after your possible sixteenth departure is later than 3:00 p.m. |
| 278 | 037d69 | AK5 | Calculates the time of "their" final departure | Calculate the time of your final departure using your departure pattern. |
| 279 | 037d69 | R4 | States "their" final departure time as a clock time no later than 3:00 p.m. | State your final departure as a clock time that is no later than 3:00 p.m. |
| 280 | 037d71 | CK2 | Interchanges the input and output and selects the positive square-root branch | Interchange the input and output, then choose the positive square-root branch because the original inputs are restricted to the right-hand side. |
| 281 | 037d71 | AK3 | Rearranges to obtain $2+\sqrt{x}$ | Rearrange the equation to isolate the output and write it as $2+\sqrt{x}$. |
| 282 | 037d71 | CK3 | States the domain of $f^{-1}$ as "their" range of $f$ | State the domain of $f^{-1}$ as your range of $f$. |
| 283 | 037d71 | AK4 | Substitutes $9$ into "their" inverse function | Substitute $9$ into your inverse function before simplifying. |
| 284 | c0bfba | CK2 | Interchanges the variables in the function rule | Swap $x$ and $y$ in the function rule before rearranging it. |
| 285 | c0bfba | AK3 | Rearranges to obtain $y=2\pm\sqrt{x-1}$ | Rearrange the swapped equation to isolate $y$ and obtain $y=2\pm\sqrt{x-1}$. |
| 286 | c0bfba | CK3 | Recognises that the positive square-root branch is required since the mass is at least $2$ kg | Choose the positive square-root branch because the mass is at least $2\text{ kg}$. |
| 287 | c0bfba | AK4 | Substitutes $10$ into "their" inverse function | Substitute $10$ into your inverse function and simplify. |
| 288 | c0bfc2 | CK2 | Identifies the roots as the $x$-intercepts of the graph | Read the roots from the $x$-coordinates where the graph crosses the $x$-axis. |
| 289 | c0bfc2 | R3 | Uses the midpoint of "their" roots and states the axis as $x=2$ | Find the midpoint of your roots and write the equation of the axis of symmetry. |
| 290 | c0bfc2 | CK3 | Recognises that the minimum point lies on "their" axis of symmetry | Locate the minimum point directly on your axis of symmetry. |
| 291 | c0bfc2 | AK2 | Evaluates $g(1)=2$ | Substitute $1$ into $g(1)$ and simplify. |
| 292 | c0bfc2 | AK3 | Uses the ordinate of "their" minimum point to obtain $f(2)=-1$ | Use the ordinate of your minimum point as the value of $f(2)$. |
| 293 | 037d79 | R1 | Identifies the midpoint of "their" roots as $1$ | Add your two roots and divide by $2$ to find the midpoint of your roots. |
| 294 | 037d79 | R2 | States the vertical line $x=1$ | State the vertical line through the midpoint as $x=1$. |
| 295 | 037d79 | R3 | Explains that "their" roots are equidistant from $x=1$ | Explain that your roots lie the same distance on either side of $x=1$. |
| 296 | 037d86 | CK1 | Recognises that the total number of parts is found by combining the three ratio parts | Combine all three parts of the ratio to find the total number of parts. |
| 297 | 037d86 | AK1 | Adds $5+3+4$ to obtain $12$ | Add $5+3+4$ to calculate the total number of ratio parts. |
| 298 | 037d86 | CK2 | Identifies one ratio part as $960 \div$ "their" total number of parts | Use $960 \div$ your total number of parts to find the mass of one ratio part. |
| 299 | 037d86 | AK2 | Calculates one part as $80$ kg using "their" total number of parts | Calculate the mass of one part using your total number of ratio parts. |
| 300 | 037d86 | AK3 | Multiplies the mass of one part by $5$ to show $400$ kg | Multiply your mass for one ratio part by $5$ to find the plantain-chip mass. |
| 301 | 037d86 | CK3 | Associates cassava chips with the $3$ parts of the ratio | Use the $3$ ratio parts for cassava chips. |
| 302 | 037d86 | AK4 | Uses "their" mass of one part and $4$ ratio parts to obtain $320$ kg | Multiply your mass for one ratio part by $4$ to find the breadfruit-chip mass. |
| 303 | 037d86 | R1 | Uses the 30 kg carton capacity with "their" cassava-chip mass | Divide your cassava-chip mass by the $30$ kg capacity of each carton. |
| 304 | 037d86 | R2 | Uses the 40 kg carton capacity with "their" breadfruit-chip mass | Divide your breadfruit-chip mass by the $40$ kg capacity of each carton. |
| 305 | 037d86 | R3 | Combines "their" two carton counts to obtain $16$ cartons | Add your two carton counts to find the total number of cartons. |
| 306 | c0bfd4 | CK1 | Recognises that all three ratio parts must be combined | Add all three ratio parts to get the total number of parts. |
| 307 | c0bfd4 | CK2 | Forms $360 \div$ "their" total number of ratio parts | Calculate $360 \div$ your total number of ratio parts to find the value of one part. |
| 308 | c0bfd4 | CK3 | Associates Shop A with 3 equal ratio parts | Match Shop A to its 3 equal ratio parts. |
| 309 | c0bfd4 | AK3 | Calculates $4 \times$ "their" value of one part for Shop B | Calculate Shop B's delivery using $4 \times$ your value of one part. |
| 310 | c0bfd4 | AK4 | Calculates $5 \times$ "their" value of one part for Shop C | Calculate Shop C's delivery using $5 \times$ your value of one part. |
| 311 | c0bfd4 | R1 | Relates each of "their" shop deliveries to crates of 30 rolls | For each shop, divide your delivery by 30 rolls to find how many crates it needs. |
| 312 | c0bfd4 | R2 | Finds a total of 12 crates using "their" deliveries | Add the crate numbers from your deliveries to find the total number of crates. |
| 313 | c0bfd4 | R3 | Concludes that 12 crates exceed the van capacity by 2 crates | Compare your total number of crates with the van capacity and state how many extra crates are needed. |
| 314 | c0bfe1 | R1 | Uses $fg(0)=f[g(0)]$ | Rewrite the composite expression by applying $g$ to the input first and then applying $f$ to that result. |
| 315 | c0bfe1 | AK3 | Evaluates $g(0)=1$ | Substitute the given input into $g$ and simplify before using the result in the composite function. |
| 316 | c0bfe1 | R2 | Uses $(g(0),fg(0))=(1,0)$ and "their" $y$-intercept as points on the line | Use $(g(0),fg(0))$ and the y-intercept you found as the two points for the line. |
| 317 | c0bfe1 | R3 | Concludes that the inverse relation is a function on the stated domain | State that the inverse relation is a function on the stated domain. |
| 318 | c0bfe1 | R4 | Justifies the conclusion using the horizontal line test or equivalent one-to-one reasoning | Use the horizontal line test by explaining that each horizontal line meets the graph at most once on the stated domain. |
| 319 | c0bfe9 | CK1 | Recognises that the ratio has 5 equal parts | Add the two ratio parts to find how many equal parts the savings are split into. |
| 320 | c0bfe9 | R1 | Selects 3 of the 5 equal parts for the larger account | Take the larger account's stated share of the total equal ratio parts. |
| 321 | c0bfe9 | CK2 | Selects the compound-interest formula | Use the compound-interest formula $A=P(1+r)^n$. |
| 322 | c0bfe9 | AK2 | Substitutes \$15 000, 4% and 2 years into the compound-interest formula | Substitute the principal, annual rate, and number of years into $A=P(1+r)^n$ before calculating. |
| 323 | c0bfe9 | CK3 | Identifies interest as accumulated amount less principal | Find the interest by subtracting the principal from the accumulated amount. |
| 324 | c0bfe9 | AK4 | Subtracts "their" principal from "their" accumulated amount | Subtract your principal from your accumulated amount. |
| 325 | c0bfe9 | R2 | Concludes that "their" accumulated amount is sufficient to pay for the equipment | Compare your accumulated amount with the equipment cost and state whether it is enough. |
| 326 | c0bfe9 | R3 | Finds the surplus by subtracting the equipment cost from "their" accumulated amount | Subtract the equipment cost from your accumulated amount to find the surplus. |
| 327 | 037d9d | CK2 | Recognises that the $y$-intercept is read where $x=0$ | Read the $y$-intercept at the point where $x=0$. |
| 328 | 037d9d | CK3 | Uses gradient as change in $y$ divided by change in $x$ | Calculate the gradient by dividing the change in $y$ by the change in $x$. |
| 329 | 037d9d | R3 | States that $f^{-1}$ is not a function | State that $f^{-1}$ is not a function. |
| 330 | 037d9d | AK5 | Uses "their" roots to obtain $f^{-1}(0)=-1$ or $5$ | Use your roots as the possible outputs when finding $f^{-1}(0)$. |
| 331 | 037d9d | R4 | Explains that one input to the inverse relation has two outputs | Explain that one input in the inverse relation produces two outputs. |
| 332 | c0bff1 | CK1 | Identifies the curved edge as half the circumference of a circle of diameter $14$ m | Treat the curved edge as half the circumference of a circle, using the diameter shown. |
| 333 | c0bff1 | AK1 | Substitutes correctly into $\frac{1}{2}\pi d$ | Substitute the given diameter into $\frac{1}{2}\pi d$. |
| 334 | c0bff1 | CK2 | Identifies the straight boundary lengths as $14$ m, $17$ m and $17$ m | Read the three straight boundary lengths directly from the diagram before adding them. |
| 335 | c0bff1 | R1 | Forms the total perimeter using "their" curved-edge length | Add the three straight boundary lengths to your curved-edge length to form the total perimeter. |
| 336 | c0bff1 | CK3 | Recognises that the total edging is shared equally among five pieces | Use the fact that the total edging is split equally among the five pieces. |
| 337 | c0bff1 | R2 | Divides "their" perimeter by $5$ | Divide your perimeter by $5$. |
| 338 | c0bff1 | R3 | Interprets the quotient as the length of one piece of edging, giving $14$ m | State that quotient as the length of one piece of edging. |
| 339 | 037da5 | CK1 | Identifies the curved edge as half the circumference of a circle of diameter $14$ m | Treat the curved edge as half the circumference of a circle with diameter $14$ m. |
| 340 | 037da5 | AK1 | Calculates half of $\pi \times 14$ | Calculate half of $\pi \times 14$. |
| 341 | 037da5 | R1 | Expresses the curved length in exact form | Write the curved length exactly using $\pi$, without changing it to a decimal. |
| 342 | 037da5 | CK2 | Recognises that the perimeter consists of the two lengths, the width and the curved edge | Form the perimeter by including both straight sides, the width, and the curved edge. |
| 343 | 037da5 | AK2 | Calculates the total straight length as $20+20+14=54$ m | Add $20+20+14$ to find the total length of the straight edges. |
| 344 | 037da5 | AK3 | Adds $54$ m to "their" curved length | Add the total straight length to your curved length. |
| 345 | 037da5 | R2 | Expresses "their" perimeter in exact form | Write your perimeter in exact form, keeping $\pi$ in the expression. |
| 346 | 037da5 | CK3 | Uses $5$ m as the length of one fence roll | Use $5$ m as the length covered by one fence roll. |
| 347 | c0bff9 | CK2 | Recognises that an exponent of $\frac{1}{2}$ gives the square root | Treat the exponent $\frac{1}{2}$ as an instruction to find the square root of the number of dots. |
| 348 | c0bff9 | CK3 | Recognises that the dots form a cube with 4 dots along each edge | Arrange the Figure 4 dots as a cube and identify how many dots lie along one edge. |
| 349 | c0bff9 | R1 | Uses "their" Figure 4 cube total to establish that it is less than 100 | Compare your Figure 4 cube total with 100 to show that it is less than 100. |
| 350 | c0bff9 | R2 | Selects the next whole number of dots along an edge and tests $(\text{their }4+1)^3$ | Add one to your previous edge length and test whether $(\text{your previous edge length}+1)^3$ reaches or exceeds 100. |
| 351 | c0c001 | CK1 | Recognises direct variation and writes $m=kp$ | Recognise direct variation and write $m=kp$. |
| 352 | c0c001 | AK1 | Substitutes $m=12$ and $p=8$ to form $12=8k$ | Substitute the stated mass and package values into $m=kp$ to form an equation for $k$. |
| 353 | c0c001 | CK2 | Identifies the total order mass as $m=30$ | Identify the total mass of the order before using the direct-variation relationship. |
| 354 | c0c001 | CK3 | Recognises inverse variation and writes $t=\frac{k}{n}$ | Recognise inverse variation and write $t=\frac{k}{n}$. |
| 355 | c0c001 | AK4 | Calculates the one-packer time as $3\times$ "their" number of packages | Multiply $3$ by your earlier number of packages to calculate the one-packer time. |
| 356 | c0c001 | R1 | Uses the one-packer time as the constant of variation to form $t=\frac{60}{n}$, follow-through | Use your one-packer time as the constant in $t=\frac{k}{n}$ and write the resulting equation. |
| 357 | c0c001 | R2 | Substitutes $n=3$ into "their" inverse-variation equation to obtain $20$ minutes, follow-through | Substitute $n=3$ into your inverse-variation equation and calculate the time in minutes. |
| 358 | c0c001 | R3 | Compares the required time with $18$ minutes and concludes that the claim is not correct | Compare your calculated time with $18$ minutes and state whether the claim is correct. |
| 359 | c0c009 | CK2 | Identifies the matrix for reflection in $y=x$ as $\begin{pmatrix}0&1\\1&0\end{pmatrix}$. | Write the reflection matrix that swaps the coordinates, using the form $\begin{pmatrix}a&b\\c&d\end{pmatrix}$. |
| 360 | c0c009 | AK3 | Forms the product $\begin{pmatrix}2&0\\0&2\end{pmatrix}\begin{pmatrix}0&1\\1&0\end{pmatrix}$. | Place the enlargement matrix to the left of the reflection matrix and form the product $\begin{pmatrix}a&b\\c&d\end{pmatrix}\begin{pmatrix}e&f\\g&h\end{pmatrix}$. |
| 361 | c0c009 | R1 | Uses the transformations in the correct order to obtain $C=\begin{pmatrix}0&2\\2&0\end{pmatrix}$. | Apply the reflection first and then the enlargement, multiply in that order, and label the result $C=\begin{pmatrix}a&b\\c&d\end{pmatrix}$. |
| 362 | c0c009 | CK3 | Finds the determinant of 'their' matrix $C$. | Calculate the determinant of your matrix $C$. |
| 363 | c0c009 | AK4 | Forms the adjugate of 'their' matrix $C$. | Form the adjugate of your matrix $C$ by swapping the main-diagonal entries and changing the signs of the other diagonal. |
| 364 | c0c009 | AK5 | Divides the adjugate by 'their' determinant to obtain $C^{-1}$. | Divide every entry of your adjugate by your determinant to form $C^{-1}$. |
| 365 | c0c009 | R2 | Selects 'their' inverse matrix to reverse the combined transformation. | Use your inverse matrix $C^{-1}$ to undo the combined transformation. |
| 366 | c0c009 | R3 | Multiplies 'their' inverse matrix by $\begin{pmatrix}10\\6\end{pmatrix}$. | Multiply your inverse matrix by the given final position vector, written as $\begin{pmatrix}x\\y\end{pmatrix}$. |
| 367 | c0c009 | R4 | Concludes that the original position vector is $\begin{pmatrix}3\\5\end{pmatrix}$. | State the vector you obtain as the original position vector in the form $\begin{pmatrix}a\\b\end{pmatrix}$. |
| 368 | c0c011 | CK1 | Selects the correct fraction of the circumference for a $135^\circ$ sector | Divide $135^\circ$ by $360^\circ$ to find the fraction of the full circumference represented by the sector. |
| 369 | c0c011 | AK1 | Obtains $0.6\pi$ m for the curved edge | Multiply your sector fraction by $2\pi(0.8)$ to calculate the curved-edge length. |
| 370 | c0c011 | R1 | Expresses the arc length correct to 2 decimal places | Round your calculated arc length to 2 decimal places and write the unit m. |
| 371 | c0c011 | CK2 | Forms the number of trim lengths by dividing "their" curved-edge length by $0.5$ | Divide your curved-edge length by $0.5$ to form the number of trim lengths needed. |
| 372 | c0c011 | AK2 | Obtains approximately $3.76$ lengths using "their" curved-edge length | Carry out the division of your curved-edge length by $0.5$ to find the approximate number of lengths. |
| 373 | c0c011 | CK3 | Forms the cost in US dollars using "their" number of trim lengths | Form a multiplication using your number of trim lengths and $\text{US}\$3.20$. |
| 374 | c0c011 | AK3 | Calculates US\$12.80 using "their" number of trim lengths | Evaluate the multiplication of your number of trim lengths by $\text{US}\$3.20$ to find the US-dollar cost. |
| 375 | c0c011 | R3 | Uses the exchange rate in the correct direction to convert "their" US-dollar cost to dollars | Multiply your US-dollar cost by the number of dollars equivalent to one US dollar to convert in the correct direction. |
| 376 | c0c019 | CK1 | Recognises that 12 bottles each make 18 cups. | Use 12 bottles with 18 cups from each bottle to find the total number of cups. |
| 377 | c0c019 | R1 | Forms $12 \times 18$. | Calculate the total cups by forming $12 \times 18$. |
| 378 | c0c019 | CK2 | Recognises that the cups sold are subtracted from the total. | Subtract the cups sold from the total cups to find how many remain. |
| 379 | c0c019 | R2 | Forms "their" total $-47$. | Form your subtraction as your total $-47$. |
| 380 | c0c019 | AK2 | Subtracts 47 from "their" total correctly. | Subtract 47 correctly from your total. |
| 381 | c0c019 | CK3 | Recognises that equal sharing among 13 jugs requires division by 13. | Divide the remaining cups equally among 13 jugs. |
| 382 | c0c019 | R3 | Forms "their" remaining number of cups $\div 13$. | Form your calculation as your remaining number of cups $\div 13$. |
| 383 | c0c019 | AK3 | Divides "their" remaining number of cups by 13 correctly. | Divide your remaining number of cups correctly by 13. |
| 384 | 037dbf | CK1 | Identifies the total number of mangoes as $18 \times 24$ | Find the total number of mangoes by calculating $18 \times 24$. |
| 385 | 037dbf | CK2 | Identifies the quantity sold as $\frac{3}{4}$ of "their" total | Identify the quantity sold by taking $\frac{3}{4}$ of your total. |
| 386 | 037dbf | AK2 | Calculates $\frac{3}{4} \times$ "their" total | Calculate $\frac{3}{4} \times$ your total. |
| 387 | 037dbf | R1 | Uses "their" number of mangoes sold and the selling price of \$2.50 each | Multiply your number of mangoes sold by the selling price of \$2.50 each. |
| 388 | 037dbf | CK3 | Identifies money left as the amount received less the transport cost | Find the money left by subtracting the transport cost from the amount received. |
| 389 | 037dbf | AK3 | Subtracts \$120 from "their" amount received | Subtract \$120 from your amount received. |
| 390 | 037dc7 | CK2 | Forms the income expression $I=70x+60y$ | Write the income expression by multiplying each type of block by its income rate and adding the results. |
| 391 | 037dc7 | AK3 | Calculates the incomes at the relevant vertices from "their" feasible region | For each relevant corner of your feasible region, substitute its coordinates into your income expression and calculate the income. |
| 392 | 037dc7 | AK4 | Obtains \$640 at $(4,6)$ from "their" values | Substitute your values for the coordinates of the intersection corner into the income expression and evaluate it. |
| 393 | 037dc7 | R2 | Identifies the corner points of "their" shaded feasible region | Read off and list the coordinates of every corner of your shaded feasible region. |
| 394 | 037dc7 | R3 | Selects $(4,6)$ as the point giving the greatest income | Compare the incomes at the corners and select the point with the greatest income. |
| 395 | 037dc7 | CK3 | Forms $n^2-8n+24=12$ from the mapping and the given effect index | Set the mapping expression equal to the given effect index to form an equation in $n$. |
| 396 | 037dc7 | AK5 | Solves to obtain $n=2$ or $n=6$ | Rearrange the equation into quadratic form, factor or solve it, and state both possible values of $n$. |
| 397 | 037dc7 | R4 | Rejects $n=2$ and selects $n=6$ because "their" plan has 6 covered blocks | Compare both values of $n$ with the number of covered blocks in your plan and choose the matching value. |
| 398 | 037dcf | CK1 | Selects the tangent ratio for triangle $BCD$ | Choose the tangent ratio by dividing the side opposite the $60^\circ$ angle by the adjacent side in triangle $BCD$. |
| 399 | 037dcf | AK1 | Substitutes $BC=12$ and $\angle DBC=60^\circ$ correctly | Substitute $BC=12$ and $\angle DBC=60^\circ$ into your tangent equation. |
| 400 | 037dcf | AK2 | Obtains $CD=12\sqrt{3}$ | Evaluate the tangent calculation to find $CD$ in an exact form containing $\sqrt{3}$. |
| 401 | 037dcf | R1 | Expresses the height in exact form | Write the height $CD$ exactly, without changing the surd into a decimal. |
| 402 | 037dcf | AK3 | Finds $AC=24+12=36$ m | Add the two horizontal ground distances to calculate $AC$ in metres. |
| 403 | 037dcf | AK4 | Forms $\tan \angle DAB=\frac{\text{their }CD}{36}$ | Use your earlier height and ground distance in $\tan \angle DAB=\frac{\text{your }CD}{\text{your }AC}$. |
| 404 | 037dcf | R2 | Uses the tangent value to establish $\angle DAB=30^\circ$, following through from "their" height | Apply inverse tangent to the ratio based on your height, then state $\angle DAB$. |
| 405 | 037dcf | CK2 | States that the angle of depression is equal to the angle of elevation | State that the angle of depression equals the angle of elevation. |
| 406 | 037dcf | R3 | Compares "their" angle of depression with $35^\circ$ and concludes that a warning sign is required | Compare your angle of depression with $35^\circ$ and use the comparison to decide whether a warning sign is required. |
| 407 | 037dcf | CK3 | Explains that the equality of the angles follows from parallel horizontal lines | Explain that the angles are equal because the horizontal through $D$ and the level ground are parallel. |
| 408 | 037dd7 | CK1 | Selects the area of a circle as the required relationship. | Use the circle-area relationship $\pi r^2$. |
| 409 | 037dd7 | AK1 | Substitutes $r=14$ into $\pi r^2$. | Substitute $r=14$ into $\pi r^2$ and simplify. |
| 410 | 037dd7 | CK2 | Recognises that the $120°$ sector is one third of the circle. | Recognise that the $120°$ sector is one third of the full circle. |
| 411 | 037dd7 | AK3 | Divides “their” area of the circle by $3$. | Divide your area of the circle by $3$. |
| 412 | 037dd7 | R1 | Expresses “their” sector area in exact form. | Write your sector area exactly, keeping $\pi$ rather than using a decimal. |
| 413 | 037dd7 | CK3 | Identifies the minor segment as the sector less triangle $AOB$. | Find the minor segment by subtracting the area of triangle $AOB$ from the sector area. |
| 414 | 037dd7 | AK4 | Obtains $49\sqrt{3}\text{ cm}^2$ for the area of triangle $AOB$. | Calculate the area of triangle $AOB$ exactly and write it using $\sqrt{3}$ in $\text{ cm}^2$. |
| 415 | 037dd7 | R2 | Subtracts the area of triangle $AOB$ from “their” sector area. | Subtract the area of triangle $AOB$ from your sector area. |
| 416 | 037dd7 | R3 | Expresses “their” segment area in exact form. | Write your segment area in exact form, retaining $\pi$ and $\sqrt{3}$. |
| 417 | c0c035 | CK2 | States the direct-variation relationship $C=kD$ | Write the direct-variation equation $C=kD$. |
| 418 | c0c035 | AK2 | Uses Figure $3$ to obtain $k=8$, giving $C=8D$ | Use Figure $3$ in $C=kD$ to find $k$, then write the resulting equation for $C$. |
| 419 | c0c035 | CK3 | States the inverse-variation relationship $W=\frac{k}{n}$ | Write the inverse-variation equation $W=\frac{k}{n}$. |
| 420 | c0c035 | AK4 | Uses $W=3$ and $n=4$ to obtain $k=12$, giving $W=\frac{12}{n}$ | Substitute $W=3$ and $n=4$ into $W=\frac{k}{n}$ to find $k$, then write the equation for $W$. |
| 421 | c0c035 | CK4 | Forms the linear relationship $W=8-n$ | Write the linear relationship between workers and rows as $W=8-n$. |
| 422 | c0c035 | R2 | Solves $\frac{12}{n}=8-n$ and selects $n=6$ using the condition $n>4$ | Solve $\frac{12}{n}=8-n$, then use $n>4$ to choose the valid value of $n$. |
| 423 | c0c035 | R3 | Uses "their" $n$ to determine $W=2$ and $C=\$288$ | Use your $n$ to calculate $W=2$ and then use the cost relationship to find $C=\$288$. |
| 424 | 037de4 | R1 | Identifies the non-zero intersection of the two graphs | Find the intersection away from the origin where the two graphs cross. |
| 425 | 037de4 | R2 | Reads the coordinates of the non-zero intersection as $(3,12)$ | Read the horizontal and vertical coordinates of the non-zero crossing. |
| 426 | 037de4 | CK2 | Recognises that the required figure number must be the next whole number after the non-zero equality point | Move from the non-zero equality point to the next whole-numbered figure. |
| 427 | 037de4 | CK3 | Identifies the comparison $D=20$ and $R=16$ for Figure 4 | Calculate $D$ and $R$ for Figure 4, then compare them. |
| 428 | 037de4 | CK4 | States or uses the inverse-variation relationship $T=k/D$ | Write the inverse-variation relationship as $T=k/D$. |
| 429 | 037de4 | AK5 | Uses 'their' Figure 4 values to determine $k=60$ | Substitute your Figure 4 values into $T=k/D$ and rearrange to find $k$. |
| 430 | 037de4 | R3 | Applies $T=60/D$ to Figure 5, where $D=30$, to obtain 2 minutes | Substitute the Figure 5 value of $D$ into your equation for $T$ and calculate the time in minutes. |
| 431 | c0c03d | CK1 | Selects the frequencies for amounts greater than \$4 | Select the bars for amounts greater than \$4. |
| 432 | c0c03d | AK2 | Adds the selected frequencies to obtain 12 | Add the frequencies from the selected bars to find the number of customers. |
| 433 | c0c03d | CK2 | Recognises that one voucher is issued for each customer spending more than \$4 | Match each customer spending more than \$4 with one voucher. |
| 434 | c0c03d | CK3 | Identifies the gradient as 3 dollars per voucher | Use the increase in cost for each additional voucher as the gradient. |
| 435 | c0c03d | R1 | Uses the point based on "their" number of vouchers and "their" total cost | Use the point with coordinates given by your number of vouchers and your total cost. |
| 436 | c0c03d | R3 | Expresses the relationship in the form $C = mx + c$ | Write the cost relationship in the form $C = mx + c$. |
| 437 | c0c045 | CK1 | Forms an equation by equating the total of the sector angles to $360°$ | Add all four sector angles and set the total equal to $360°$. |
| 438 | c0c045 | AK1 | Simplifies to $4x+90=360$ | Collect the $x$ terms and constants to simplify your equation to $4x+90=360$. |
| 439 | c0c045 | CK2 | Uses $\frac{\text{bus angle}}{360}\times72$ to find the bus frequency | Find the bus frequency using $\frac{\text{bus angle}}{360}\times72$. |
| 440 | c0c045 | AK3 | Finds the bus angle as $2(\text{their }67.5)+30$ | Find the bus angle by calculating $2(\text{your }x)+30$ using your earlier value of $x$. |
| 441 | c0c045 | AK4 | Obtains $33$ from $\frac{\text{their }165}{360}\times72$ | Calculate $\frac{\text{your bus angle}}{360}\times72$ using the bus angle you found. |
| 442 | c0c045 | R1 | States that Bus has the greatest frequency or largest sector | State that Bus is the mode because it has the greatest frequency or largest sector. |
| 443 | c0c045 | R2 | Identifies the required group as the total less 'their' number travelling by bus | Subtract your number travelling by bus from the total number of students. |
| 444 | 037df1 | CK1 | Recognises that the angles in the pie chart total $360°$: $2x+(x+30)+90+x=360$ | Add the four sector angles and set the total equal to $360°$. |
| 445 | 037df1 | AK1 | Solves the equation to obtain $x=60$ | Collect the $x$ terms, move the constant term to the other side, and divide to find $x$. |
| 446 | 037df1 | CK2 | Finds the Mango juice sector angle as $2(\text{their }x)$, giving $120°$ | Calculate the Mango juice angle using $2(\text{your }x)$. |
| 447 | 037df1 | AK2 | Forms the correct fraction of the survey: $\frac{\text{their Mango angle}}{360}\times180$ | Use $\frac{\text{your Mango angle}}{360}\times180$ to find how many students chose Mango juice. |
| 448 | 037df1 | AK3 | Evaluates to show that 60 students selected Mango juice | Evaluate your fraction carefully to find the number of students who selected Mango juice. |
| 449 | 037df1 | R1 | Subtracts "their" number selecting Mango juice from the total of 180 | Subtract your number selecting Mango juice from the total of $180$. |
| 450 | 037df1 | AK4 | Correctly evaluates $180-60=120$ | Carry out the subtraction accurately to find the number selecting drinks other than Mango juice. |
| 451 | 037df1 | R2 | Uses "their" value of $x$ to establish that the Mango juice sector is greater than each other sector | Use your value of $x$ to compare the Mango juice sector with each of the other sectors. |
| 452 | 037df1 | R3 | Explains that the mode is the category with the greatest frequency | State that the mode is the category chosen by the greatest number of students. |
| 453 | c0c04d | CK3 | Recognises the larger pattern as $(5^2)^2$ using "their" square number | Square your square number to write the total for the larger pattern. |
| 454 | c0c04d | AK2 | Applies the power-of-a-power law to obtain $5^4$ | Apply the power-of-a-power law by multiplying the exponents in your expression. |
| 455 | c0c04d | R2 | Forms "their" larger-pattern total divided by $5^2$ panels | Form a division of your larger-pattern total by the number of panels. |
| 456 | c0c04d | AK3 | Applies the quotient law to simplify "their" $5^4 \div 5^2$ to $5^2$ | Apply the quotient law by subtracting the divisor exponent from the dividend exponent in your division. |
| 457 | 037df9 | CK2 | Recognises that $4^{-1} = \frac{1}{4}$ | Apply $a^{-1}=\frac{1}{a}$ to rewrite $4^{-1}$ as a reciprocal. |
| 458 | 037df9 | AK2 | Combines the indices to obtain $4^{2-1}$ | Add the exponents when multiplying powers with the same base to form $4^{2-1}$. |
| 459 | 037df9 | CK3 | Forms $($"their" answer to (b)$)^2 \times ($"their" answer to (b)$)^2$ for the total | For the total, multiply two copies of your answer to (b), with each copy squared. |
| 460 | 037df9 | AK4 | Applies the laws of indices to multiply the two powers | Use the product rule for powers with the same base by adding the exponents. |
| 461 | c0c055 | CK1 | Recognises that the rectangular section contains $8 \times 4$ square metres | Count the rows and columns in the rectangular section and multiply them as $\text{rows} \times \text{columns}$. |
| 462 | c0c055 | CK2 | Uses three quarters of "their" rectangular-section area | Find three quarters of your rectangular-section area. |
| 463 | c0c055 | R1 | Combines "their" rectangular and shaded-end areas | Add your rectangular-section area to your shaded-end area. |
| 464 | c0c055 | CK3 | Selects $12$ m$^2$ as the area covered by one pack | Use the stated area covered by one pack, in $\text{m}^2$. |
| 465 | c0c055 | AK4 | Divides "their" total estimated area by $12$ | Divide your total estimated area by the area covered by one pack. |
| 466 | c0c055 | R2 | Interprets a non-whole quotient as requiring an additional complete pack | Round any non-whole number of packs up to the next complete pack so all the area is covered. |
| 467 | 037e01 | CK1 | Recognises the estimate as three quarters of the rectangular area | Find the rectangular area first, then multiply it by $\frac{3}{4}$ to estimate the shaded area. |
| 468 | 037e01 | AK1 | Finds the rectangular area as $12 \times 6 = 72\text{ m}^2$ | Calculate the rectangular area using $12 \times 6$ and give the area in $\text{m}^2$. |
| 469 | 037e01 | R1 | Multiplies "their" estimated area by \$40 per square metre | Multiply your estimated area by \$40 per square metre to find your deposit. |
| 470 | 037e01 | CK2 | Selects a compound-interest model | Use a compound-interest model by multiplying the principal by the growth factor raised to the number of years. |
| 471 | 037e01 | CK3 | Recognises that interest is the accumulated amount less the principal | Find the interest by subtracting the principal from the accumulated amount. |
| 472 | 037e01 | AK4 | Evaluates "their" deposit multiplied by $(1.05)^2$ | Calculate your accumulated amount by evaluating your deposit multiplied by $(1.05)^2$. |
| 473 | 037e01 | R2 | Subtracts "their" principal from "their" accumulated amount | Subtract your principal from your accumulated amount to calculate your interest. |
| 474 | 037e01 | R3 | Expresses "their" interest correct to the nearest cent | Write your interest as an amount of money rounded to the nearest cent. |
| 475 | c0c05d | CK1 | Recognises that a percentage is written as a fraction over 100 | Write the percentage as a fraction with 100 as the denominator. |
| 476 | c0c05d | AK1 | Reduces $\frac{37.5}{100}$ to $\frac{3}{8}$ | Simplify $\frac{37.5}{100}$ by clearing the decimal and cancelling common factors. |
| 477 | c0c05d | CK2 | Uses "their" fraction as the required part of 96 | Multiply your fraction by the total number of entrants to find the junior entrants. |
| 478 | c0c05d | CK3 | Identifies $1 \times 36$ as a factor pair | Include the factor pair that begins with 1 by checking what multiplies with it to make the total. |
| 479 | c0c05d | AK3 | Identifies $2 \times 18$ as a factor pair | Check whether 2 divides the total exactly, then write the matching factor pair. |
| 480 | c0c05d | AK4 | Identifies $3 \times 12$ as a factor pair | Check whether 3 divides the total exactly, then write the matching factor pair. |
| 481 | c0c05d | AK5 | Identifies $4 \times 9$ as a factor pair | Check whether 4 divides the total exactly, then write the matching factor pair. |
| 482 | c0c05d | R1 | Selects the factor pair $3$ and $12$ from "their" factor pairs | From your factor pairs, select the pair whose numbers have the required heats-to-entrants relationship. |
| 483 | c0c05d | R2 | Shows that $3:12$ simplifies to $1:4$ | Simplify the ratio from your selected pair by dividing both terms by the same factor until it matches the required ratio. |
| 484 | c0c05d | R3 | Rejects Devon's arrangement because $4:9$ is not equivalent to $1:4$ | Simplify Devon's ratio, compare it with the required ratio, and state that it is not equivalent. |
| 485 | c0c05d | R4 | Concludes that "their" valid arrangement is 3 heats of 12 entrants | State your valid arrangement by giving the number of heats and the number of entrants in each heat. |
| 486 | 037e09 | AK1 | Converts $\frac{3}{8}$ to $0.375$ | Convert $\frac{3}{8}$ to a decimal by dividing the numerator by the denominator. |
| 487 | 037e09 | CK1 | Recognises that the ratio $2:1$ contains 3 equal parts | Add the parts in the ratio $2:1$ to find the total number of equal parts. |
| 488 | 037e09 | AK3 | Finds $37.5\%$ of 96, or equivalent process using "their" percentage | Calculate your percentage of $96$ to find the number bought online. |
| 489 | 037e09 | AK4 | Finds $\frac{2}{3}$ of "their" online bands | Find $\frac{2}{3}$ of your online-band total for the adult bands. |
| 490 | 037e09 | AK5 | Finds $\frac{1}{3}$ of "their" online bands | Find $\frac{1}{3}$ of your online-band total for the child bands. |
| 491 | 037e09 | CK2 | Identifies the factor pairs of "their" number of child bands | List the factor pairs that multiply to give your number of child bands. |
| 492 | 037e09 | R1 | Selects 3 and 4 as the only factors of "their" child-band total between 2 and 5 | Check the factors of your child-band total between $2$ and $5$ and select the possible packet sizes. |
| 493 | 037e09 | R2 | Finds that "their" child-band total gives 4 packets when 3 bands are placed in each packet | Divide your child-band total by the smaller possible packet size to find how many packets are needed. |
| 494 | 037e09 | R3 | Rejects 3 bands per packet because 4 is not a multiple of 3 | Check whether the number of packets from the smaller packet size is a multiple of that packet size, and reject it if it is not. |
| 495 | 037e09 | R4 | Concludes that 4 bands per packet gives 3 packets and is the only possible arrangement | Test the other possible packet size, then state it as the only arrangement when it gives a valid number of packets. |
| 496 | 037e11 | CK2 | Recognises that the solutions are given by the $x$-coordinates of the intersections. | Use the $x$-coordinates where the two graphs intersect to find the solutions. |
| 497 | 037e11 | AK4 | Reads one solution as $x=1$. | Read the $x$-coordinate of one intersection from the graph and write it as a solution. |
| 498 | 037e11 | AK5 | Reads the other solution as $x=6$. | Read the $x$-coordinate of the other intersection from the graph and write it as a solution. |
| 499 | 037e11 | R1 | Uses 'their' intersection values as boundary values for comparing the two plans. | Use your intersection values as boundary values to split the domain before comparing the two plans. |
| 500 | 037e11 | R2 | Identifies the values for which $f(x)\ge g(x)$ on the stated domain. | Identify the $x$-values on the stated domain where $f(x)\ge g(x)$ by finding where the graph of $f$ is on or above the graph of $g$. |
