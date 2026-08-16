import type { ModuleNumber } from '@/lib/types';

// Module-matched exemplars for the draft prompt (R1.5 §5). Two per module
// (one structured, one mcq), in the R1.5 schema shape. These are ORIGINAL
// in-house seeds — the founder replaces or extends them as blind-review
// feedback accumulates. Style and JSON shape only; the model must never reuse
// their content.

const M1_STRUCTURED = `{
  "kind": "structured",
  "stimulus": "A vendor at the Kingstown market sells juice in small and large bottles. A large bottle holds 250 ml more than a small bottle, and 3 small bottles hold the same amount as 2 large bottles.",
  "stem": "Use the information above to answer the parts below.",
  "archetype": "multi-step-application",
  "representation": "prose",
  "visual": null,
  "difficulty": 2,
  "marks": 7,
  "parts": [
    { "label": "a", "prompt": "Let the small bottle hold $s$ ml. Write an equation in $s$.", "marks": 2, "slots": [{ "label": "i", "answer": "3s = 2(s + 250)", "response_mode": "answer", "answer_format": "equation_form" }] },
    { "label": "b", "prompt": "Solve your equation to find the capacity of the small bottle.", "marks": 3, "slots": [{ "label": "i", "answer": "500 ml" }] },
    { "label": "c", "prompt": "A customer needs 6 litres of juice. How many large bottles must they buy?", "marks": 2, "slots": [{ "label": "i", "answer": "8" }] }
  ],
  "rubric": [
    { "code": "CK1", "profile": "CK", "criterion": "Forms an equation in one variable from the comparison", "mark_value": 2, "slot_ref": "a.i" },
    { "code": "AK1", "profile": "AK", "criterion": "Expands the bracket and collects like terms", "mark_value": 2, "slot_ref": "b.i" },
    { "code": "AK2", "profile": "AK", "criterion": "CAO $s = 500$", "mark_value": 1, "slot_ref": "b.i" },
    { "code": "R1", "profile": "R", "criterion": "Divides by \\"their\\" large-bottle capacity and rounds up to whole bottles", "mark_value": 2, "slot_ref": "c.i" }
  ],
  "final_answer": "3s = 2(s + 250); 500 ml; 8",
  "worked_solution": "(a) $3s = 2(s + 250)$. (b) $3s = 2s + 500$, so $s = 500$ ml. (c) Large bottle $= 750$ ml; $6000 \\\\div 750 = 8$ bottles.",
  "misconceptions": [
    { "trigger": "12", "name": "Used small bottles", "remediation": "Part (c) asks about large bottles: $6000 \\\\div 750 = 8$, not $6000 \\\\div 500 = 12$." }
  ]
}`;

const M1_MCQ = `{
  "kind": "mcq",
  "stem": "A shirt priced at EC$60 is sold at a 15% discount. What is the sale price?",
  "options": ["EC$51", "EC$45", "EC$9", "EC$69"],
  "answer_key": 0,
  "profile": "AK",
  "archetype": "direct-procedure",
  "representation": "prose",
  "visual": null,
  "difficulty": 1,
  "marks": 1,
  "parts": [{ "label": "a", "prompt": "Select the sale price.", "marks": 1, "slots": [{ "label": "i", "answer": "EC$51" }] }],
  "worked_solution": "Discount $= 0.15 \\\\times 60 = 9$; sale price $= 60 - 9 = 51$, so EC$51.",
  "misconceptions": [
    { "trigger": "EC$9", "name": "Discount instead of price", "remediation": "EC$9 is the discount amount. Subtract it from EC$60 to get the sale price." }
  ]
}`;

const M2_STRUCTURED = `{
  "kind": "structured",
  "stimulus": "The table shows the number of wickets taken by 30 bowlers in a regional cricket season.",
  "stem": "Use the table to answer the parts below.",
  "archetype": "interpretation",
  "representation": "table",
  "visual": {
    "template": "dataTable",
    "params": {
      "caption": "Wickets taken by 30 bowlers",
      "headers": ["Wickets", "Frequency"],
      "rows": [["0-4", "6"], ["5-9", "10"], ["10-14", "9"], ["15-19", "5"]],
      "row_header_column": false
    }
  },
  "difficulty": 2,
  "marks": 6,
  "parts": [
    { "label": "a", "prompt": "State the modal class.", "marks": 1, "slots": [{ "label": "i", "answer": "5-9" }] },
    { "label": "b", "prompt": "Calculate an estimate of the mean number of wickets.", "marks": 4, "slots": [{ "label": "i", "answer": "9.17" }] },
    { "label": "c", "prompt": "State ONE reason your answer to (b) is an estimate.", "marks": 1, "slots": [{ "label": "i", "answer": "grouped data uses class midpoints, not actual values", "accept": ["the actual values within each class are unknown"], "response_mode": "explain" }] }
  ],
  "rubric": [
    { "code": "CK1", "profile": "CK", "criterion": "Identifies the modal class from the frequencies", "mark_value": 1, "slot_ref": "a.i" },
    { "code": "AK1", "profile": "AK", "criterion": "Uses class midpoints to compute $\\\\sum fx$", "mark_value": 2, "slot_ref": "b.i" },
    { "code": "AK2", "profile": "AK", "criterion": "Divides \\"their\\" $\\\\sum fx$ by 30, CAO $9.17$", "mark_value": 2, "slot_ref": "b.i" },
    { "code": "R1", "profile": "R", "criterion": "Explains that midpoints stand in for the actual values", "mark_value": 1, "slot_ref": "c.i" }
  ],
  "final_answer": "5-9; 9.17; grouped data uses class midpoints, not actual values",
  "worked_solution": "(a) Highest frequency 10 → class $5$-$9$. (b) Midpoints 2, 7, 12, 17: $\\\\sum fx = 6(2)+10(7)+9(12)+5(17) = 275$; mean $\\\\approx 275 \\\\div 30 = 9.17$. (c) Individual values are unknown within classes.",
  "misconceptions": [
    { "trigger": "10", "name": "Frequency as mode", "remediation": "The modal class is the class with the highest frequency ($5$-$9$), not the frequency itself." }
  ]
}`;

const M2_MCQ = `{
  "kind": "mcq",
  "stem": "The line $y = 2x - 3$ crosses the $y$-axis at which point?",
  "options": ["$(0, -3)$", "$(0, 3)$", "$(-3, 0)$", "$(2, 0)$"],
  "answer_key": 0,
  "profile": "CK",
  "archetype": "direct-procedure",
  "representation": "prose",
  "visual": null,
  "difficulty": 1,
  "marks": 1,
  "parts": [{ "label": "a", "prompt": "Select the intercept.", "marks": 1, "slots": [{ "label": "i", "answer": "(0, -3)" }] }],
  "worked_solution": "At the $y$-axis $x = 0$, so $y = -3$: the point is $(0, -3)$.",
  "misconceptions": [
    { "trigger": "(-3, 0)", "name": "Axis swap", "remediation": "The $y$-intercept has $x = 0$; $(-3, 0)$ lies on the $x$-axis." }
  ]
}`;

const M3_STRUCTURED = `{
  "kind": "structured",
  "stimulus": "A drone flies from station $P$ on a bearing of 060° for 8 km to point $Q$, then on a bearing of 150° for 6 km to point $R$.",
  "stem": "Use the information above to answer the parts below.",
  "archetype": "multi-step-application",
  "representation": "prose",
  "visual": null,
  "difficulty": 3,
  "marks": 9,
  "parts": [
    { "label": "a", "prompt": "Show that angle $PQR = 90°$.", "marks": 2, "slots": [{ "label": "i", "answer": "180 - 150 + 60 = 90" }] },
    { "label": "b", "prompt": "Calculate the distance $PR$.", "marks": 3, "slots": [{ "label": "i", "answer": "10 km" }] },
    { "label": "c", "prompt": "Calculate the bearing of $R$ from $P$, to the nearest degree.", "marks": 4, "slots": [{ "label": "i", "answer": "097°" }] }
  ],
  "rubric": [
    { "code": "R1", "profile": "R", "criterion": "Uses co-interior/alternate angles on the north lines to justify $90°$", "mark_value": 2, "slot_ref": "a.i" },
    { "code": "AK1", "profile": "AK", "criterion": "Applies Pythagoras: $PR^2 = 8^2 + 6^2$", "mark_value": 3, "slot_ref": "b.i" },
    { "code": "AK2", "profile": "AK", "criterion": "Finds angle $QPR = \\\\tan^{-1}(6/8) \\\\approx 36.9°$", "mark_value": 2, "slot_ref": "c.i" },
    { "code": "R2", "profile": "R", "criterion": "Adds to the initial bearing: $060 + 37 = 097°$", "mark_value": 2, "slot_ref": "c.i" }
  ],
  "final_answer": "180 - 150 + 60 = 90; 10 km; 097°",
  "worked_solution": "(a) The north lines at $P$ and $Q$ are parallel: the angle between $QP$ produced and the second leg is $180° - 150° + 60° = 90°$. (b) $PR = \\\\sqrt{8^2 + 6^2} = 10$ km. (c) $\\\\angle QPR = \\\\tan^{-1}(6/8) = 36.87°$, bearing $= 060° + 37° = 097°$.",
  "misconceptions": [
    { "trigger": "217", "name": "Back bearing", "remediation": "097° is the bearing of $R$ FROM $P$. Adding 180° gives the bearing of $P$ from $R$." }
  ]
}`;

const M3_MCQ = `{
  "kind": "mcq",
  "stem": "Under the translation $\\\\binom{3}{-2}$, the image of the point $(1, 5)$ is:",
  "options": ["$(4, 3)$", "$(-2, 7)$", "$(4, 7)$", "$(3, -10)$"],
  "answer_key": 0,
  "profile": "AK",
  "archetype": "direct-procedure",
  "representation": "prose",
  "visual": null,
  "difficulty": 1,
  "marks": 1,
  "parts": [{ "label": "a", "prompt": "Select the image point.", "marks": 1, "slots": [{ "label": "i", "answer": "(4, 3)" }] }],
  "worked_solution": "$(1 + 3, 5 - 2) = (4, 3)$.",
  "misconceptions": [
    { "trigger": "(-2, 7)", "name": "Subtracted the vector", "remediation": "A translation ADDS the vector components: $(1+3, 5+(-2))$." }
  ]
}`;

const EXEMPLARS: Record<ModuleNumber, { structured: string; mcq: string }> = {
  1: { structured: M1_STRUCTURED, mcq: M1_MCQ },
  2: { structured: M2_STRUCTURED, mcq: M2_MCQ },
  3: { structured: M3_STRUCTURED, mcq: M3_MCQ },
};

// Two module-matched exemplars: the same-kind exemplar for this module plus
// the other kind as a shape reference.
export function exemplarsFor(module: ModuleNumber, kind: 'mcq' | 'structured'): string {
  const m = EXEMPLARS[module];
  return kind === 'structured'
    ? `${m.structured}\n\nSECOND EXEMPLAR (mcq shape, same module):\n${m.mcq}`
    : `${m.mcq}\n\nSECOND EXEMPLAR (structured shape, same module):\n${m.structured}`;
}
