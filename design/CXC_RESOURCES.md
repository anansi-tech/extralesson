# CXC_RESOURCES.md — Official ground-truth documents for ExtraLesson

Place in repo `/design/`. These URLs are the canonical sources. The syllabus PDF overrides
everything, including model memory. Verified against cxc.org, August 2026.

## 1. Syllabus (THE ground truth)

- **2027 syllabus (build target):** CSEC Mathematics, CXC 05/G/SYLL 16, Amended Oct 2025,
  effective May–June 2027 examinations.
  https://www.cxc.org/wp-content/uploads/2018/11/CSEC-Mathematics-AmendedOct2025.pdf
  → Save as `/design/syllabus-2027.pdf`. Source for `topics` and `blueprints` seeds.
- **Legacy syllabus (January 2027 sitting only):** "until January 2027 examinations" per CXC.
  https://www.cxc.org/wp-content/uploads/2018/11/CSEC-Mathematics-Syllabus.pdf
  → Reference only. No structural branching in code; display copy for `legacy-jan` students only.
- CXC's own labeling of the fork: https://www.cxc.org/syllabus-downloads/ (CSEC section).

## 2. Subject Reports (misconception library seed corpus)

Examiner commentary per question: where candidates lost marks, common errors, advice.
Mine into `lib/misconceptions/` data and generation-pipeline prompt context. Founder task.

**January (re-sit cohort — highest priority):**
- Jan 2026: https://www.cxc.org/wp-content/uploads/2018/11/RPT2026CSECJanuaryMathematicsSubjectReport.pdf
- Jan 2021: https://www.cxc.org/wp-content/uploads/2018/11/RPT2021CSECJanuaryMathematicsSubjectReport.pdf
- Jan 2017: https://www.cxc.org/wp-content/uploads/2018/11/RPT2017CSECJanuaryMathematicsSubjectReport.pdf

**May–June:**
- 2025: https://www.cxc.org/wp-content/uploads/2018/11/RPT2025CSECMayJuneMathematicsSubjectReport.pdf
- 2024: https://www.cxc.org/wp-content/uploads/2018/11/01RPT2024CSECMayJuneMathematicsSubjectReportv1.pdf
- 2022: https://www.cxc.org/wp-content/uploads/2018/11/RPT2022CSECMayJuneMathematicsSubjectReport.pdf
- 2021: https://www.cxc.org/wp-content/uploads/2018/11/RPT2021CSECMayJuneMathematicsSubjectReport.pdf
- 2019: https://www.cxc.org/wp-content/uploads/2018/11/RPT2019CSECMayJuneMathematicsSubjectReport.pdf
- 2018: https://www.cxc.org/wp-content/uploads/2018/11/RPT2018CSECMayJuneMathematicsSubjectReport.pdf
- 2017: https://www.cxc.org/wp-content/uploads/2018/11/RPT2017CSECMayJuneMathematicsSubjectReport.pdf
- 2016: https://www.cxc.org/wp-content/uploads/2018/11/RPT2016CSECMayJuneMathematicsSubjectReport.pdf

Index page: https://www.cxc.org/subject-reports/

## 3. CXC AI governance (compliance + positioning)

- AI Policy Framework: https://www.cxc.org/ai-policy/
- AI Standards and Guidelines: https://www.cxc.org/ai-standards-and-guidelines/
- CXC's concern is AI *doing* assessed work (SBA declaration form exists). AI *tutoring* for
  exam preparation is outside that concern. Standing rule: read both pages before building
  anything SBA-adjacent (currently kill-listed). Marketing may reference alignment with CXC's
  published AI standards — never imply endorsement.

## 4. Copyright boundaries

- CXC syllabuses are © CXC; past papers are © CXC and sold commercially.
- NEVER reproduce past-paper content verbatim or near-verbatim. Original questions in
  exam *style*, written to public syllabus objectives, marked to public grid conventions.
- CXC IP page: https://www.cxc.org/about/intellectual-property/

## 5. Roadmap adjacencies (do not build; recorded for schema awareness)

- English A/B modularized for May/June 2027+ (same 3-module architecture — schema generalizes):
  https://www.cxc.org/wp-content/uploads/2018/11/CSEC-English-Syllabus-Amended-2026-for-Exams-2027V2.pdf
- Additional Mathematics (Amended 2020):
  https://www.cxc.org/wp-content/uploads/2018/11/CSEC-ADDITIONAL-MATHEMATICS-SYLLABUS-Amended-2020.pdf
- CCSLC Mathematics (feeder exam):
  https://www.cxc.org/wp-content/uploads/2018/11/CCSLC-MATHEMATICS-SYLLABUS.pdf
- Exam timetables (registration/sitting dates): https://www.cxc.org/download-timetables/
