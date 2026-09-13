# Interview QUE check

Audit date: 13 September 2026  
Scope: candidate-side interview generation, **With MCQ** and **Without MCQ**, including job role, skills, experience, package, and mode selection.

## 1. Decision

**Replace the current generated sets before treating them as personalized interview assessments.** The generator substitutes role and skill names into three fixed sentence templates. It does not select technical questions by role or adjust their substance to experience or compensation. A question can mention the selected skill while still failing to assess it.

This report supplies:

- An audit of every generation branch and all 33 catalog roles.
- Results from 19,800 isolated generator calls covering the finite filter options and 12 representative skill-input cases.
- Exact faulty question patterns, affected question positions, reasons for rejection, and replacement rules.
- A complete replacement interview of 10 MCQs and 10 open-ended questions for one explicit selection, with old-to-new mapping.
- One additional MCQ and one open-ended replacement for **each of the 33 roles**, with explicit skill/experience selections.
- Experience-specific replacement pairs and a policy covering every package/experience combination.
- Acceptance checks for a future implementation.

**Delivery status:** this is an audit and proposed replacement content. Application code and stored data have not been changed by this audit. The replacement questions below are newly authored recommendations, not questions observed in a user's saved interview.

## 2. Evidence and limits

| Source | Evidence |
|---|---|
| `backend/app/routes/candidate.py:320-370` | `/api/candidate/interview/generate`, candidate authorization, skill selection, all three templates, answer construction. |
| `backend/app/schemas/candidate.py:102-116` | Request and question schemas; unrestricted string values for role/mode/experience/package and no question-quality constraints. |
| `backend/app/utils/roles_catalog.py` | 33 roles with required/preferred skills and minimum-experience metadata. Generation does not consult these role records. |
| `frontend/src/pages/CandidateInterview.jsx:7-12,38-88,102-191` | Form inputs, request, answer state, submission, and mode switches. |
| `frontend/src/pages/CandidateInterview.jsx:213-318` | Score, submission message, and question rendering. |

The runtime audit extracted the **actual `generate_interview` function body using Python AST**, removed its route decorator/type annotations/default dependency injection, supplied an in-memory candidate, and replaced the response wrapper with a dictionary constructor. The generation statements themselves were executed unchanged. This avoids importing unrelated database, authentication, and ML services.

These are **isolated logic results, not 19,800 HTTP requests or browser tests**. HTTP authentication, Pydantic validation, deployed server state, and end-to-end persistence were not exercised. The system Python did not have Pydantic installed; schema findings below therefore come from source inspection. No uploaded resumes, account credentials, or personal profile contents were needed.

No exact fetched question payload or active filter selection was supplied in this conversation. The report reconstructs the questions the checked local generator produces. The current endpoint neither loads an interview question bank nor saves generated interviews. It only reads the user role for authorization; it does not read the candidate's resume/profile for personalization. A deployed process running another revision could produce different results.

Snapshot fingerprint: SHA-256 of the UTF-8 generator source after Python text newline normalization: `ac03d36005ccd64b06888d94ce3eb054dcc705ba47c9078a80ada650cc4fe4c2`.

Free-text skills have infinitely many possible values. “All” here means all code paths and all finite dropdown combinations, supplemented by the explicitly listed skill equivalence/edge cases; it does not mean every possible string was tested.

## 3. Filter coverage and measured results

### 3.1 Inputs covered

| Filter | Audited values |
|---|---|
| Job role | Every one of the 33 backend catalog roles; see section 9. |
| Package | Empty, `< 5 LPA`, `5-10 LPA`, `10-20 LPA`, `20+ LPA`. |
| Experience | Empty, `Fresher`, `1-3 Years`, `3-5 Years`, `5+ Years`. |
| Interview type | `mcq`, `normal`. Additional probes: `typo`, ` mcq `. |
| Skills | 12 cases in section 3.3; the same strings were applied to all roles to expose the lack of role relevance checking. |

Grid size: **33 × 5 × 5 × 2 × 12 = 19,800 generated sets**, containing **198,000 question instances**. These are repeated generated instances, not 198,000 distinct questions in a database.

### 3.2 Results

| Check | Actual result | Interpretation |
|---|---:|---|
| Question count | All sets had 10 questions | Count requirement passes. |
| Unique IDs within a set | All sets had IDs 1–10 | Within-set ID requirement passes; no persistent interview identity is created. |
| Sets containing duplicate question text | 18,150 / 19,800 (91.67%) | Most tested selections repeat exact stems. |
| MCQ answer position | B in 99,000 / 99,000 MCQs | Choosing B for all questions produces 10/10 without technical knowledge. |
| Normal question instances | 99,000 | They use only the architecture or past-challenge template. |
| MCQ package/experience sensitivity | Identical output across all 25 combinations for fixed role/skills | Neither filter changes MCQ content or difficulty. |
| Regenerate fixed selection | Identical output | No variation or prior-question exclusion. |
| Unknown mode and padded ` mcq ` | Produce normal questions | Unrecognized values silently select the wrong branch. |
| 12 distinct skill tokens | Only tokens 2–11 appear | The first and twelfth selected skills are omitted. |

The 1,650 sets without exact duplicates belong to the 12-token case. Unique wording caused by different skill labels does **not** establish semantic variety or technical quality.

### 3.3 Skill-input cases

Unique counts are within a 10-question set, holding role, package, and experience fixed. “Blank slots” counts question stems with an empty skill insertion, in each mode.

| Skills input | Unique MCQ stems | Unique normal stems | Blank slots per mode | Fault / required handling |
|---|---:|---:|---:|---|
| Empty string | 4 | 4 | 0 | Uses generic concepts instead of selected-role skills. Resolve role defaults. |
| `React` | 1 | 2 | 0 | All MCQs duplicate; normal alternates two questions. Select different React competencies. |
| `React,JavaScript` | 2 | 2 | 0 | Skill choice and normal-template parity become locked together. |
| `React,JavaScript,CSS` | 3 | 6 | 0 | Repetition remains; no actual technical coverage. |
| `React,JavaScript,CSS,HTML` | 4 | 4 | 0 | Four skills do not produce eight normal variants because parity repeats. |
| `React,React` | 1 | 2 | 0 | Duplicate tokens are retained. Deduplicate canonical skills. |
| `React,,SQL` | 3 | 6 | 4 | Four questions contain no target skill. Remove empty tokens before generation. |
| Three spaces | 1 | 2 | 10 | A truthy input becomes one empty token after stripping. |
| `,,,` | 1 | 2 | 10 | Every token is empty. Treat normalized empty input as no skills. |
| `JS,JavaScript,js` | 3 | 6 | 0 | Three strings for the same competency; canonicalize before allocating coverage. |
| `Excel,React` | 2 | 2 | 0 | Both accepted for every role without determining relevance. |
| `Skill1,...,Skill12` | 10 | 10 | 0 | Synthetic coverage probe: selects `Skill2` through `Skill11`; no validation of unknown labels. |

The distinct raw-skill sequence is `skill_list[i % n]`, with `i = 1...10`. For three skills it is **second, third, first, second, third, first, second, third, first, second**. For four it is **second, third, fourth, first, second, third, fourth, first, second, third**. For 11 skills the first skill is never selected. When there are more than 10 skills, complete single-skill coverage is impossible in 10 questions; disclose a coverage allocation instead of silently implying all skills were assessed.

## 4. What should not be in the generated interview

### 4.1 With MCQ: all Q1–Q10

Exact current pattern:

> When working with {skill}, which of the following is considered a best practice for a {role}?

Current options:

- A. Avoid using {skill} completely in production.
- B. Implement {skill} using standard scalable patterns.
- C. Hardcode all configurations for {skill}.
- D. Only use {skill} on local development servers.

**Disposition: replace every occurrence.** Merely rearranging these options does not fix the question.

Reasons:

1. “Standard scalable patterns” has no defined technical meaning in the stem; the answer can be guessed from positive wording.
2. The question gives no task, constraints, code, observations, or competing trade-offs.
3. Distractors are implausible blanket statements. Some domain-specific restrictions might even make a supposedly wrong option defensible in a particular context that the stem never defines.
4. The same option is always correct, so scores measure recognition of a template.
5. Substitutions such as Scrum, Statistics, Excel, or Stakeholder Management into “hardcode all configurations” or “local development servers” are semantically inappropriate.
6. Neither experience nor package influences MCQs. A fresher and a senior receive identical questions for identical role/skills.
7. Changing the role mostly changes its name in the sentence; it does not change the competency assessed.

Replacement requirement: a bounded role-relevant task, one defensible answer under explicit assumptions, three plausible distractors, a brief explanation, and varied correct-answer positions across the set.

### 4.2 Without MCQ: Q1, Q3, Q5, Q7, Q9

Exact current pattern:

> How would you architect a solution utilizing {skill} that meets the expectations of a {package} compensation level?

**Disposition: replace all five questions.** Salary is not a technical requirement. The question does not specify what to build, users, workload, constraints, correctness, or success measures. Replacing “20+ LPA” with “advanced” would still leave it underspecified.

For freshers, replace with a small hypothetical implementation task. For experienced candidates, provide a bounded design/debugging scenario at the appropriate depth. For roles such as Scrum Master or Manual QA Tester, ask about the role's actual responsibilities instead of requiring software architecture. With empty package input, do not expose the implementation fallback “Standard compensation level.”

### 4.3 Without MCQ: Q2, Q4, Q6, Q8, Q10

Exact current pattern:

> Can you describe a challenging problem you faced related to {skill} as a {role}, and how you resolved it given your {experience} experience?

**Disposition: rewrite or replace all five in the current set.** One well-scoped experience question can be useful, but five repetitions do not cover an interview. For a fresher or career changer, prior employment in the target role must not be assumed. For empty experience, “your Any experience” is an internal fallback leaking into the wording.

For freshers, permit a course/personal project or use a hypothetical task. For experienced candidates, ask about a specific failure, evidence, action, outcome, and trade-off. Do not force five autobiographical stories about the same skill. Include evaluation criteria; no evaluation is currently implemented for these answers.

### 4.4 Severity and selection failures

| ID | Severity | Affected selection | Finding and required change |
|---|---|---|---|
| F01 | High | All MCQs | Fixed answer B and nontechnical options. Replace the question family and answer construction. |
| F02 | High | Both modes, ordinary skill lists | Exact duplicates and shallow semantic repetition. Select distinct competencies and deduplicate. |
| F03 | High | All roles, particularly non-development roles | Role title is interpolated without consulting its catalog skills. Use role-to-competency mapping. |
| F04 | High | All MCQ experience/package values | Filters do not change content. Apply an explicit difficulty policy. |
| F05 | High | Every normal odd position | Compensation is used as a design requirement. Replace with measurable task constraints. |
| F06 | Medium | Fresher/unknown experience, normal even positions | Assumes prior work as the target role. Offer a hypothetical/project-based prompt. |
| F07 | High | Whitespace, commas, empty skill tokens | Blank skill questions are generated. Normalize before applying fallbacks. |
| F08 | Medium | Aliases, duplicate skills, over 10 skills | Incorrect weighting, redundant coverage, and silent omissions. Normalize and disclose allocation. |
| F09 | Medium | Invalid role/mode/experience/package API values | Schema strings lack domain constraints. Reject unknown values and normalize documented aliases. Empty role currently becomes “Professional”; whitespace survives. |
| F10 | High | Changing any filter after generation | Existing questions stay visible under the new selection. Invalidate the set or display its immutable generation selection. |
| F11 | High | Switching mode after generation or while a request is pending | Rendering uses `q.options`, while submit logic uses mutable `formData.interview_type`; the modes can disagree. Bind both to a generated session. |
| F12 | Medium | Normal submission | UI says answers are saved, but only React state is updated; no submit/save API call exists here. Persist or change the message. |
| F13 | Medium | MCQ scoring | `correct_answer` is sent to the browser and scoring is local. Acceptable for transparent practice, insufficient for a trusted assessment. Grade on the server if authoritative scores are needed. |
| F14 | Medium | Any incomplete submission | Empty answers can be submitted without a completeness decision/message. Require completion or clearly count and report unanswered questions. |
| F15 | Low | Future non-10 response | UI hardcodes denominator 10. It is correct for the current generator, but should use validated session question count if the contract changes. |
| F16 | Medium | “Personalized based on profile” claim | Only submitted form strings are used, not the actual candidate profile. Describe the behavior accurately or implement explicit profile-derived input. |

F10/F11 are source-derived UI state defects; browser reproduction was not performed. A concrete F11 sequence is: generate normal questions, switch to MCQ without regenerating, then submit. Normal records have `correct_answer: null` and no selected MCQ answer, so the MCQ branch can report 0/10 for open-ended responses. Generating MCQs and switching to normal yields the opposite submission-message mismatch.

## 5. Proposed selection policy

These are recommended product rules, not behavior already implemented.

### 5.1 Selection precedence

1. **Role determines the work domain.** Resolve a supported role and its competency catalog. Unknown roles should produce a clear validation response.
2. **Skills determine topic coverage.** Trim tokens, remove empties, canonicalize aliases, and deduplicate while preserving intended order. Use selected-role defaults when nothing remains.
3. **Experience determines baseline depth.** Do not infer years of experience from salary. Empty experience uses a disclosed mixed foundation/applied set.
4. **Package may vary challenge mix within that baseline.** Keep it out of question wording. A fresher selecting 20+ LPA still gets project/hypothetical questions, not a demand to recount leading production incidents.
5. **Mode determines the response contract.** MCQ has four unique options, one valid answer, and explanation. Normal has no options, with an interviewer rubric rather than one mandatory answer.
6. **Validate the complete set.** Require 10 distinct stems, substantive competency diversity, relevant skills, correct difficulty, and consistent mode before returning it.

For a role/skill combination such as Frontend Developer + Excel, do not automatically label Excel useless. It could be relevant to a spreadsheet UI or import/export workflow. Either contextualize it explicitly within frontend work or identify it as an additional topic and explain the allocation. Do not silently replace an explicitly selected skill with unrelated material. An unsupported selection should receive a useful validation response rather than invented expertise.

### 5.2 All package/experience combinations

The number in each cell is the proposed number of challenge questions **within the selected experience band**, out of 10. The remaining questions test core competencies at that band. This is an editorial starting policy, not a validated measure of hiring difficulty or market compensation.

| Experience \ Package | Empty | < 5 LPA | 5–10 LPA | 10–20 LPA | 20+ LPA |
|---|---:|---:|---:|---:|---:|
| Empty: disclosed mixed foundation/applied | 2 | 1 | 2 | 3 | 4 |
| Fresher: concepts and small implementation | 2 | 1 | 2 | 3 | 4 |
| 1–3 Years: implementation and diagnosis | 2 | 1 | 2 | 3 | 4 |
| 3–5 Years: component design and trade-offs | 2 | 1 | 2 | 3 | 4 |
| 5+ Years: architecture/ownership appropriate to role | 2 | 1 | 2 | 3 | 4 |

“Challenge” means an additional constraint or reasoning step at the same experience level. It never means changing the role or requiring unselected specialist tools. A 5+ Years candidate selecting < 5 LPA still receives senior role content. A fresher selecting an architect role receives an explicitly labeled introductory target-role practice set; this must not imply readiness for an experienced architect vacancy. Catalog `min_exp` is role metadata, not a substitute for the user's actual experience.

For single-skill input, cover multiple subtopics within that skill. For multiple skills, use an explicit allocation that totals 10. More than 10 selected skills require a disclosed subset, combined-skill questions where appropriate, or a user-selectable longer interview.

## 6. Complete replacement interview: selected profile

Use this exact profile for **both** complete replacement sets below:

```json
{
  "job_role": "Frontend Developer",
  "package": "< 5 LPA",
  "skills": "React,JavaScript,CSS",
  "experience": "Fresher"
}
```

Mode is `mcq` for section 7 and `normal` for section 8. The original skill order is retained in the mapping so each faulty slot has a concrete replacement. New questions target fundamentals and small tasks; Q9 is the challenge slot. HTML semantics are supporting frontend context, not a new specialist topic.

### Exact old-to-new mapping

`M(skill)` is the exact MCQ stem and four options quoted in section 4.1 with role `Frontend Developer`. `A(skill)` is the exact architecture stem in section 4.2 with package `< 5 LPA`. `P(skill)` is the exact past-challenge stem in section 4.3 with role `Frontend Developer` and experience `Fresher`. This notation reconstructs every old question without repeating the same paragraph 20 times.

| Original ID | Skill inserted | Faulty MCQ | MCQ replacement | Faulty normal | Normal replacement |
|---|---|---|---|---|---|
| 1 | JavaScript | M(JavaScript) | M01 | A(JavaScript) | N01 |
| 2 | CSS | M(CSS) | M02 | P(CSS) | N02 |
| 3 | React | M(React) | M03 | A(React) | N03 |
| 4 | JavaScript | Same as Q1 | M04 | P(JavaScript) | N04 |
| 5 | CSS | Same as Q2 | M05 | A(CSS) | N05 |
| 6 | React | Same as Q3 | M06 | P(React) | N06 |
| 7 | JavaScript | Same as Q1 | M07 | Same as Q1: A(JavaScript) | N07 |
| 8 | CSS | Same as Q2 | M08 | Same as Q2: P(CSS) | N08 |
| 9 | React | Same as Q3 | M09 | Same as Q3: A(React) | N09 |
| 10 | JavaScript | Same as Q1 | M10 | Same as Q4: P(JavaScript) | N10 |

Every MCQ slot is rejected for F01/F02. Every normal odd slot is rejected for F05, and every normal even slot needs F06 rewriting for this fresher selection. All replacement answers/rubrics are reviewer material; decide deliberately when to reveal them in the product.

## 7. With MCQ: 10 replacement questions

### M01 — JavaScript: `const` and mutation

What is logged by `const items = ['a']; items.push('b'); console.log(items.length);`?

- A. `1`
- B. A reassignment error
- C. `2`
- D. `undefined`

**Answer: C.** `const` prevents reassignment of the variable binding; it does not freeze the array. This assesses a concrete language rule instead of generic “best practice.”

### M02 — CSS: box sizing

A card has `width: 200px; padding: 10px; border: 2px solid; box-sizing: border-box`. Ignoring margins, what is its total rendered width?

- A. 200px
- B. 220px
- C. 224px
- D. 176px

**Answer: A.** With `border-box`, the declared width includes padding and border.

### M03 — React: list identity

A list can be reordered and each record has a permanent unique `id`. Which value should be used as each item's React key?

- A. The item's current array index
- B. A random number generated during every render
- C. The same string for every item
- D. The record's permanent unique `id`

**Answer: D.** Stable IDs preserve the relationship between records and rendered items when order changes.

### M04 — JavaScript: array transformation

You have an array of users and want a new array containing each user's name, in the same order, without changing the original array. Which method directly expresses this operation?

- A. `filter`
- B. `map`
- C. `find`
- D. `sort`

**Answer: B.** `map` returns one transformed result for each element. `filter` selects elements; `find` returns a matching element; `sort` orders elements.

### M05 — CSS: Flexbox axes

A container uses `display: flex; flex-direction: row`. Which declaration centers its children along the main axis?

- A. `align-items: center`
- B. `text-align: center`
- C. `justify-content: center`
- D. `align-content: center`

**Answer: C.** `justify-content` controls distribution along the main axis. The specified direction removes axis ambiguity.

### M06 — React: parent-to-child data

A parent owns a user's display name and a child must display it. Which React mechanism passes that value directly from the parent to the child?

- A. A prop
- B. A key that the child reads as a regular prop
- C. A new independent state value in the child with no synchronization
- D. A CSS custom property

**Answer: A.** Props pass data from a parent to its child; `key` has a separate role in element identity.

### M07 — JavaScript: failed asynchronous requests

Inside an `async` function, an awaited request can reject. Which structure catches that rejection so the function can display an error message?

- A. Call it without `await` inside an otherwise empty `try` block
- B. Put `await request()` inside `try` and handle the error in `catch`
- C. Put only the success-message code in `try`
- D. Check whether the request function itself is `undefined` after calling it

**Answer: B.** Awaiting inside `try` lets the corresponding `catch` handle the rejected promise.

### M08 — CSS: responsive rules

A layout should use one column below 600px and two columns at 600px or above. Which feature applies CSS rules conditionally based on viewport width?

- A. A hover pseudo-class
- B. A keyframe animation
- C. The `z-index` property
- D. A media query

**Answer: D.** A width-based media query selects the layout rules for that viewport range.

### M09 — React: queued state updates — challenge

In a click handler, you want a counter to increase by two using two separate calls to its setter. Which pair correctly expresses both increments from the previous queued value?

- A. `setCount(c => c + 1); setCount(c => c + 1);`
- B. `setCount(count + 1); setCount(count + 1);`
- C. `setCount(count); setCount(count + 1);`
- D. `setCount(() => 1); setCount(() => 1);`

**Answer: A.** Functional updaters are applied in sequence to the pending state. Two calls using the same captured `count` do not express two successive increments.

### M10 — JavaScript: form submission

A client-side form's submit handler must validate input before deciding whether to send a request. Which event method prevents the browser's default form submission while the handler runs this logic?

- A. `stopPropagation()`
- B. `stopImmediatePropagation()`
- C. `preventDefault()`
- D. `dispatchEvent()`

**Answer: C.** `preventDefault()` cancels the event's default action when the event is cancelable. Propagation controls are different from canceling submission.

**Set check:** 10 distinct questions; JavaScript 4, CSS 3, React 3. Answer positions: A = 3, B = 2, C = 3, D = 2. Stable positional patterns should not be reused across generated sessions; shuffling must preserve the correct option identity.

## 8. Without MCQ: 10 replacement questions

For this practice set, score each question from 0–3 if evaluation is later implemented: 0 = no relevant reasoning, 1 = partial approach, 2 = correct core solution, 3 = correct solution plus the requested verification/edge case. This rubric is a proposal, not an existing score feature. Equivalent correct approaches should receive credit.

### N01 — JavaScript: deduplication

Given `['React', 'CSS', 'React']`, produce an array containing each skill once while preserving first occurrence order. Explain your approach and test it with an empty array.

**Look for:** a set or explicit membership tracking, result `['React', 'CSS']`, input preservation, and an empty-array result. Do not require experience designing a production architecture.

### N02 — CSS: overflowing card

A card has `width: 100%`, horizontal padding, and a border. It overflows its parent. Explain how the default box model can cause this and show one CSS change to fix it.

**Look for:** content-box width plus padding/borders, `box-sizing: border-box` or an equivalent justified sizing fix, and checking the result at a narrow viewport. No previous employment is assumed.

### N03 — React: controlled search input

Design a small React component with a text input and a filtered list of names. Explain where the input value lives and how the displayed list updates as the user types.

**Look for:** state, `value`/`onChange`, deriving filtered results, stable keys, and sensible behavior when no name matches.

### N04 — JavaScript: debugging an array operation

A function intended to return names uses `users.forEach(user => user.name)` and returns `undefined`. Explain why and rewrite it to return an array of names.

**Look for:** the difference between iteration and transformation, `map` or a correctly accumulated array, and a simple input/output example.

### N05 — CSS: small responsive layout

Create a product-card layout that uses one column on small screens and two equal columns when the viewport is at least 600px wide. Describe the CSS and how you would verify the breakpoint.

**Look for:** Grid or Flexbox, explicit width condition, spacing without overflow, and checks below/at/above 600px.

### N06 — React: state ownership

Two sibling components must show the same selected color, and either can change it. Explain where you would put the state and how updates reach both components.

**Look for:** common-parent state, values passed through props, change callbacks, and one source of truth. A personal project example is optional.

### N07 — JavaScript: asynchronous UI states

Describe how a page should behave while a list request is loading, when it succeeds with no results, and when it fails. Write pseudocode for the request and these states.

**Look for:** separate loading/empty/error/success states, awaited request handling, cleanup of loading state, and a usable retry path. A full backend design is out of scope.

### N08 — CSS: long content

A long unbroken word causes a card to exceed the width of a phone screen. Explain how you would inspect the problem and suggest a CSS fix without hiding the text.

**Look for:** identifying the overflowing element, a wrapping rule such as `overflow-wrap: anywhere`, checking width/minimum-size constraints when relevant, and verification with both short and long text.

### N09 — React: stale update — challenge

A counter starts at zero. Its click handler calls `setCount(count + 1)` twice, but the next rendered count is one. Explain this behavior and change the handler so one click adds two.

**Look for:** both expressions use the same render's state value, functional updates or a single `+ 2` update, and a second-click check. No advanced architecture is required.

### N10 — JavaScript: validating a form

Write pseudocode for a submit handler that rejects a name containing only spaces, displays a useful message, and sends a request only when validation passes. Explain how you would test it.

**Look for:** trimming before validation, preventing unwanted default submission, a clear validation branch, and blank/whitespace/valid-name cases. Server-side validation may be mentioned as an additional boundary.

**Set check:** 10 distinct tasks; JavaScript 4, CSS 3, React 3; no salary wording, no prior employment assumptions, no answer options, and one concrete rubric per question.

## 9. Replacement coverage for every role

Each entry below replaces an occurrence of the generic MCQ and a normal architecture/past-challenge question **for the explicitly named selection**. These are additional question pairs, not 33 complete 10-question interviews. They demonstrate domain-correct content for every catalog role; the generator still needs a larger reviewed bank to assemble varied sets.

For all entries, package is **empty**. Experience and skill are explicit. Apply section 5 to other package choices and to difficulty changes; do not merely change the experience label on an unchanged question. Each MCQ has four options and an answer explanation. Each normal question includes evaluation points. Do not repeat one pair ten times.

### R01 — Backend Developer

**Selection:** Python; 1–3 Years. Reject a generic scalable-pattern question that never tests request processing.

**MCQ:** A request handler stores each user's items in a function argument declared as `items=[]`. Calls unexpectedly share items. What is the relevant cause? A. A new default list is created for each call and then merged; B. A mutable default object is reused across calls; C. All local lists automatically become thread-local storage; D. Appending reassigns the function's default parameter declaration. **Answer: B.** The default list is created at function definition and reused.

**Normal:** Rewrite a function using a mutable default list so calls do not unintentionally share data. How would you test two independent calls? **Evaluate:** `None` sentinel or equivalent per-call construction, preservation of explicitly supplied arguments, isolation test.

### R02 — Frontend Developer

**Selection:** React; 1–3 Years. Reject a salary-defined architecture task.

**MCQ:** A filtered list uses array indices as keys; inputs can appear attached to different records after reordering. Records have immutable unique IDs. Which change addresses identity? A. Use those IDs as keys; B. Generate random keys each render; C. Use the list length for every key; D. Remove all keys. **Answer: A.** Stable record identity allows React to track the correct items.

**Normal:** Diagnose why editable rows display the wrong associated values after reordering. Explain how keys and state ownership affect your fix. **Evaluate:** stable IDs, controlled/local state reasoning, a reorder regression check.

### R03 — Full Stack Developer

**Selection:** SQL; 1–3 Years. Reject a question about generic production usage with no data integrity requirement.

**MCQ:** A transfer subtracts money from one row and adds it to another. Both updates must succeed or neither may persist. Which mechanism groups them? A. Sorting; B. Pagination; C. An index alone; D. A database transaction. **Answer: D.** Transaction atomicity prevents a partial committed transfer.

**Normal:** Describe a transfer endpoint whose debit succeeds but whose credit fails. Explain transaction boundaries, rollback, and a failure test. **Evaluate:** atomic updates, error handling, balances unchanged after rollback; concurrency is an optional extension.

### R04 — Mobile Developer (React Native)

**Selection:** REST APIs; 1–3 Years. Reject desktop/local-server assumptions that ignore a mobile connection.

**MCQ:** A mobile app submits an order and times out before seeing the response. Which server-supported approach lets it retry the same logical order without creating duplicates? A. Generate a fresh idempotency key for every retry; B. Retry the POST with exponential backoff but no operation identity; C. Reuse a server-enforced idempotency key; D. Extend the timeout without adding deduplication. **Answer: C.** The server recognizes the same operation across retries; backoff or longer timeouts alone cannot establish that identity.

**Normal:** Design the user-visible behavior when an order submission times out on a mobile network. **Evaluate:** uncertain outcome, stable operation identity, status/retry path, avoiding a false success or duplicate order.

### R05 — Mobile Developer (Flutter)

**Selection:** Dart; Fresher. Reject demands to recount production architecture experience.

**MCQ:** In an `async` Dart function, how can you obtain a value returned later by a `Future` before the next dependent statement? A. Await that future; B. Cast the future object directly to the result type; C. Mark the caller `async` but read the result immediately without awaiting it; D. Start a timer for an assumed network delay and read a shared variable afterward. **Answer: A.** `await` obtains the asynchronous result before dependent code continues.

**Normal:** Sketch a Flutter screen that loads a list and displays loading, success, and failure states. **Evaluate:** asynchronous result handling, explicit states, error/retry behavior, and no assumption that the request completes immediately.

### R06 — iOS Developer

**Selection:** Swift; Fresher. Reject a generic “implement Swift using scalable patterns” answer.

**MCQ:** A Swift value is optional and may be `nil`. Which construct conditionally binds its unwrapped value for use in a block? A. An unconditional force unwrap; B. `if let`; C. A plain assignment that retains the optional type; D. String interpolation of the optional. **Answer: B.** Optional binding makes the unwrapped value available only when present.

**Normal:** A profile response may omit the display name. Show how you would handle that optional value and choose a fallback label. **Evaluate:** safe optional handling, deliberate fallback, present/missing cases.

### R07 — Android Developer

**Selection:** Kotlin; Fresher. Reject a vague question with no Kotlin semantics.

**MCQ:** For nullable `name: String?`, which expression returns its length, or zero when it is null? A. `name.length`; B. `name!!.length`; C. `name?.length ?: 0`; D. `name?.length`. **Answer: C.** The safe call handles null and the Elvis operator supplies zero; D still returns null for a null name.

**Normal:** Handle a nullable user name in a profile screen without crashing. Include behavior for null and an empty string. **Evaluate:** null safety, distinction between null/empty, clear display behavior.

### R08 — Embedded Systems Engineer

**Selection:** C; 1–3 Years. Reject web-server distractors for a memory-bound embedded task.

**MCQ:** A buffer has capacity 16 bytes. Before copying an incoming byte sequence without a terminator, what condition prevents writing beyond it? A. Length is at least 16; B. Length is odd; C. Length is unrelated to capacity; D. Length is at most 16. **Answer: D.** Writes must remain within the buffer capacity; a required string terminator would need additional space.

**Normal:** Design bounds checks for an incoming message copied into a fixed-size buffer. Distinguish raw bytes from a null-terminated string. **Evaluate:** capacity accounting, rejection/truncation policy, boundary tests, terminator space when applicable.

### R09 — Game Developer

**Selection:** 3D Math; Fresher. Reject generic production deployment questions that do not assess game movement.

**MCQ:** A character should move at 5 units per second despite variable frame time. How much displacement should one frame apply? A. 5 units every frame; B. 5 multiplied by frame duration in seconds; C. 5 divided by total frame count; D. A fixed pixel count independent of time. **Answer: B.** Speed multiplied by elapsed time gives frame displacement.

**Normal:** Explain how you would make movement speed consistent across two frame rates and verify it over ten seconds. **Evaluate:** elapsed-time scaling, unit consistency, comparable traveled distance.

### R10 — DevOps Engineer

**Selection:** CI/CD; 3–5 Years. Reject “always use scalable patterns” without a deployment constraint.

**MCQ:** You must prove the artifact deployed to production is the artifact that passed staging. Which approach best preserves that identity? A. Rebuild from an unpinned branch separately for production; B. Copy whichever file has the newest timestamp; C. Promote the same immutable artifact by verified digest; D. Trust a mutable `latest` tag alone. **Answer: C.** Digest-based promotion identifies the exact tested artifact.

**Normal:** Design artifact promotion from staging to production with traceability and rollback. **Evaluate:** immutable identity, validation gates, approvals appropriate to the workflow, rollback artifact availability.

### R11 — Cloud Architect (AWS)

**Selection:** Architecture Design; 5+ Years. Reject salary as a substitute for availability requirements.

**MCQ:** A service must continue after one availability zone fails. Which design most directly addresses that failure domain? A. Service instances and necessary dependencies spread across zones with tested failover; B. More instances only in the same zone; C. Only longer client timeouts; D. A dashboard with no redundancy. **Answer: A.** Independent-zone redundancy and working failover address the stated outage boundary.

**Normal:** Outline a multi-zone design and a test for loss of one zone. State dependency, data-consistency, capacity, and recovery assumptions. **Evaluate:** failure domains, remaining capacity, data-layer behavior, measurable recovery goals.

### R12 — Site Reliability Engineer (SRE)

**Selection:** Monitoring (Prometheus/Grafana); 3–5 Years. Reject questions that ignore user-visible reliability.

**MCQ:** An alert must detect an increased proportion of user-visible request failures. Which measurement directly matches the requirement? A. Mean CPU utilization; B. Total request count alone; C. Median latency of successful requests only; D. Failed requests divided by total requests over a defined window. **Answer: D.** A defined request failure ratio measures the specified outcome; the other metrics can change independently.

**Normal:** Propose an alert for rising API failures, including the measurement window, low-traffic behavior, and investigation steps. **Evaluate:** numerator/denominator, actionable threshold, traffic context, evidence rather than alert volume alone.

### R13 — System Administrator

**Selection:** Linux; 1–3 Years. Reject assumptions about coding architectures unrelated to administration.

**MCQ:** A filesystem reports no space left and a required service cannot write. What is the best first diagnostic action among these choices? A. Increase the service's CPU limit; B. Inspect filesystem space/inode usage and identify what is consuming the exhausted resource; C. Increase the service's network timeout; D. Rotate credentials before inspecting storage. **Answer: B.** Usage inspection provides evidence for targeted remediation.

**Normal:** Investigate a Linux server reporting no space left on device. Explain how you would distinguish space and inode exhaustion and choose a controlled cleanup. **Evaluate:** measurement, file ownership/use, retention, service verification.

### R14 — Platform Engineer

**Selection:** Infrastructure as Code; 3–5 Years. Reject a generic question lacking a platform maintenance problem.

**MCQ:** A resource was changed manually after infrastructure was applied. What comparison detects drift? A. Desired declared configuration versus observed resource state; B. Two identical copies of the configuration repository without reading live state; C. The current deployment duration versus the previous duration; D. The module version string alone. **Answer: A.** Drift concerns divergence between intended and actual infrastructure.

**Normal:** Describe a drift-detection and remediation workflow for shared infrastructure. **Evaluate:** state comparison, impact review, deliberate reconciliation, avoiding blind overwrite of critical changes.

### R15 — Machine Learning Engineer

**Selection:** Machine Learning; 1–3 Years. Reject scalable-pattern wording that never tests model evaluation.

**MCQ:** A scaler's mean and variance are learned before evaluation. Which data should fit it in a standard train/held-out evaluation? A. The held-out set only; B. All data including held-out examples; C. The training set only; D. The final prediction outputs. **Answer: C.** Fitting preprocessing on training data avoids using held-out distribution information to train the pipeline.

**Normal:** Design a preprocessing/training/evaluation pipeline that avoids leakage. **Evaluate:** split discipline, train-only fitting, consistent transform at inference, cross-validation boundaries when used.

### R16 — Data Scientist

**Selection:** Statistics; 1–3 Years. Reject a generic architecture prompt without a statistical decision.

**MCQ:** A team wants to estimate the causal effect of a product change. Which design most directly reduces systematic assignment differences when feasible? A. Let users choose their group; B. Assign this month's users to treatment and last month's users to control; C. Assign the most active users to treatment and the least active to control; D. Randomly assign eligible users to treatment and control. **Answer: D.** Random assignment reduces systematic treatment-allocation bias in expectation.

**Normal:** Plan an experiment for a product change. Define a primary metric, randomization unit, and checks before interpreting results. **Evaluate:** assignment, metric definition, sample/uncertainty considerations, contamination and data quality.

### R17 — Data Engineer

**Selection:** ETL; 3–5 Years. Reject a question that never specifies ingestion correctness.

**MCQ:** A daily load can be retried after partial failure. Which destination behavior helps avoid duplicate logical records? A. Append every row on every retry with a new destination ID; B. Upsert using a stable source-record key and defined update semantics; C. Use retry execution time as the only uniqueness key; D. Deduplicate only within each batch and append it to the existing destination. **Answer: B.** Stable-key upserts can make repeated writes converge on the intended record state.

**Normal:** Design a retryable daily ingestion job with late updates. **Evaluate:** source keys, checkpoints, deduplication/upserts, late-arrival policy, reconciliation and partial-failure tests.

### R18 — Data Analyst

**Selection:** SQL; Fresher. Reject a general software architecture question for an introductory analysis task.

**MCQ:** Which SQL predicate selects rows where `email` is missing as SQL `NULL`? A. `email IS NULL`; B. `email = NULL`; C. `email = 'NULL'`; D. `email = ''`. **Answer: A.** SQL null testing uses `IS NULL`; a null, the string 'NULL', and an empty string are different values.

**Normal:** Count customers with missing email values and explain how you would handle empty strings separately. **Evaluate:** null semantics, clear counting rule, treatment of whitespace if relevant.

### R19 — NLP Engineer

**Selection:** NLP; 3–5 Years. Reject an unspecified system-design prompt without language evaluation.

**MCQ:** Near-identical versions of the same document occur in training and test data. What evaluation problem does this create most directly? A. A mismatch in model parameter count; B. A requirement to use identical class counts in each split; C. A guarantee that inference latency is underestimated; D. Potentially inflated evaluation from content overlap across the split. **Answer: D.** Overlapping content weakens the independence of the test set.

**Normal:** Design a split and evaluation procedure for document classification when duplicates and revised documents exist. **Evaluate:** grouping/deduplication, label balance, deployment-relevant time split when appropriate, error analysis.

### R20 — Computer Vision Engineer

**Selection:** Computer Vision; 3–5 Years. Reject generic “production best practice” answers without visual-data assumptions.

**MCQ:** Adjacent frames from the same video are randomly split across training and testing. What is a major evaluation risk? A. The split necessarily creates a different image resolution in testing; B. Random assignment guarantees independence even for adjacent frames; C. Highly similar frames can leak scene information across the split; D. Scene overlap makes all test labels invalid regardless of labeling quality. **Answer: C.** Correlated frames can make evaluation less representative of unseen videos.

**Normal:** Plan evaluation for a classifier trained on video frames and deployed on new camera recordings. **Evaluate:** video/session grouping, camera/domain coverage, representative held-out conditions, class-specific errors.

### R21 — BI Analyst

**Selection:** Data Modeling; 1–3 Years. Reject developer-server distractors for reporting grain.

**MCQ:** Order totals are joined to order lines, and summing the joined order-total column overstates revenue. What is the likely cause? A. A missing `ORDER BY` changes the arithmetic sum; B. One-to-many joining repeats the order-level total; C. Aliasing the total column changes its numeric value; D. Adding an index automatically multiplies stored values. **Answer: B.** The join changes row grain and repeats an order-level measure.

**Normal:** Diagnose an inflated revenue dashboard after a join. **Evaluate:** source grain, relationship cardinality, appropriate aggregation, reconciliation against a trusted total.

### R22 — Cybersecurity Analyst

**Selection:** Incident Response; 1–3 Years. Reject a generic scalability question that does not assess incident reasoning.

**MCQ:** An alert reports an unusual login, but compromise is unconfirmed. Which first investigative action most directly helps determine whether this login is suspicious? A. Correlate authentication details, source context, and related activity; B. Review only the server's average CPU utilization; C. Rank the incident solely by the alert rule's name; D. Review aggregate monthly login volume without examining this account or event. **Answer: A.** Event-specific correlation helps establish whether the alert reflects suspicious activity and its scope.

**Normal:** Triage an unusual successful login following failed attempts. **Evaluate:** timeline, identity/device context, evidence preservation, severity and escalation criteria.

### R23 — Penetration Tester (Ethical Hacker)

**Selection:** Vulnerability Assessment; 3–5 Years. Reject a generic production-use question without a defined assessment scope.

**MCQ:** A scanner reports a critical issue on a system inside an authorized assessment. What best supports a defensible finding? A. Report only the scanner's severity without affected-system evidence; B. Treat a matching version banner as proof of exploitability regardless of backported patches; C. Validate the condition within the agreed scope and document reproducible evidence and impact; D. Use the count of identical scanner alerts as the sole proof. **Answer: C.** Validation distinguishes an actionable finding from an unverified tool result.

**Normal:** Explain how you would validate and report a suspected vulnerability in an authorized test without relying solely on scanner severity. **Evaluate:** scope, reproducibility, affected condition, business impact, remediation and retest criteria.

### R24 — Information Security Engineer

**Selection:** IAM; 3–5 Years. Reject options about “hardcoding IAM” without an access-control task.

**MCQ:** A service only needs to read one storage location. Which permission design best follows least privilege? A. Administrator access to every service; B. Read/write access everywhere; C. Shared human administrator credentials; D. A service identity restricted to the necessary read operations and resource. **Answer: D.** Permissions should match the service's required actions and scope.

**Normal:** Design and verify permissions for a read-only service identity. **Evaluate:** resource/action scope, credential lifecycle, denied-operation tests, auditability.

### R25 — SOC Analyst

**Selection:** Log Analysis; Fresher. Reject an assumed history of leading incidents.

**MCQ:** Several failed logins are followed by a successful login for the same account. What additional evidence is most directly useful for investigating the sequence? A. Overall disk utilization on the log collector; B. Source addresses, device context, timestamps, and subsequent account actions; C. A monthly total of all logins without account or source details; D. A list of installed server packages without event timestamps. **Answer: B.** These details establish context and help distinguish benign mistakes from suspicious access.

**Normal:** Given a hypothetical failed-then-successful login sequence, describe what you would investigate and when you would escalate. **Evaluate:** relevant correlation, uncertainty, escalation evidence; prior SOC employment is not required.

### R26 — QA Automation Engineer

**Selection:** Test Automation; 1–3 Years. Reject a generic architecture question without a test reliability problem.

**MCQ:** A UI test intermittently fails because a result appears after variable network delay. Which approach best synchronizes with the required outcome? A. Wait for the expected result condition with a bounded timeout; B. Use a fixed sleep equal to yesterday's average delay; C. Wait only for the initial page load even though results load afterward; D. Retry the entire test until it passes without checking result readiness. **Answer: A.** A condition-based bounded wait checks readiness while still failing when the result never arrives.

**Normal:** Diagnose a flaky asynchronous UI test. **Evaluate:** observed timing/conditions, deterministic fixtures, appropriate wait, meaningful assertion, distinguishing product defects from test defects.

### R27 — SDET

**Selection:** Test Automation Frameworks; 3–5 Years. Reject scalable-pattern wording without a testing boundary.

**MCQ:** A payment service depends on a third-party API. Which combination best checks local failure handling and whether a simulated API matches the integration contract? A. Only interface snapshots of successful payment screens; B. Only a mock that always returns success; C. Only local failure mocks with no comparison to the actual API contract; D. Deterministic dependency-failure tests plus contract/integration checks. **Answer: D.** Controlled failures test behavior, and boundary checks reduce divergence from the real dependency.

**Normal:** Design tests for timeout, malformed response, and duplicate callback behavior in a payment integration. **Evaluate:** determinism, contract coverage, idempotent handling, appropriate test layers and fixtures.

### R28 — Performance Test Engineer

**Selection:** Load Testing; 3–5 Years. Reject a question with no workload or performance objective.

**MCQ:** A team wants to know whether at least 95% of requests finish within a latency threshold. Which percentile metric directly corresponds to that goal? A. 50th-percentile request latency; B. Mean request latency; C. 95th-percentile request latency; D. Request throughput per second. **Answer: C.** The requested percentile describes the upper boundary for the fastest 95% of measured requests; an average cannot establish that percentile.

**Normal:** Design a test for 500 requests per second with p95 latency below 300ms, stating workload mix and error constraints. **Evaluate:** realistic arrivals/data, warm-up and duration, percentile/error measurement, bottleneck correlation, limitations of the test environment.

### R29 — Manual QA Tester

**Selection:** Test Case Design; Fresher. Reject mandatory software architecture or previous production-debugging stories.

**MCQ:** A field accepts integer ages from 18 through 60 inclusive. Which set best targets both boundaries and adjacent invalid values? A. 30, 35, 40; B. 17, 18, 19, 59, 60, 61; C. Only 18; D. Only 60. **Answer: B.** It includes values immediately below, at, and above both boundaries.

**Normal:** Write test cases for this age field, including invalid formats and missing input. **Evaluate:** boundaries, equivalence classes, explicit expected results, clarity about any unspecified requirement.

### R30 — Solutions Architect

**Selection:** System Design; 5+ Years. Reject salary as a system requirement.

**MCQ:** A migration must minimize interruption and allow traffic to return to the old application if validation fails. Which plan addresses both aims? A. Parallel old/new environments with controlled traffic shifting and a data-compatible rollback plan; B. An in-place replacement with only a source-code rollback and no data-compatibility review; C. Parallel environments followed immediately by an irreversible schema change the old application cannot read; D. A database backup with no procedure or capacity for returning application traffic. **Answer: A.** Controlled transition and compatible rollback support the stated migration constraints.

**Normal:** Plan a staged migration with a rollback decision. Specify dependency mapping, data compatibility, success metrics, and the point after which rollback changes into recovery. **Evaluate:** explicit assumptions, reversibility, observable gates, failure handling.

### R31 — Technical Product Manager

**Selection:** Product Roadmap; 3–5 Years. Reject a coding architecture question that ignores product decisions.

**MCQ:** Two roadmap items compete for one team's capacity. Which input most directly supports an outcome-based prioritization decision? A. Request volume alone without affected-user impact; B. Estimated development effort alone without expected benefit; C. The seniority of the requester alone; D. Expected outcome/impact, supporting evidence, effort, and dependencies. **Answer: D.** Prioritization needs both expected value and delivery constraints.

**Normal:** Prioritize two competing features with uncertain benefit and a shared dependency. State what evidence you would gather and how you would explain the decision. **Evaluate:** outcome focus, uncertainty, effort/dependencies, stakeholder communication and reassessment.

### R32 — Scrum Master

**Selection:** Facilitation; 1–3 Years. Reject “hardcode all configurations for Facilitation” and software architecture assumptions.

**MCQ:** Retrospectives repeatedly discuss the same blocker without follow-through. Which facilitation outcome is most likely to help? A. Remove the topic from all future meetings; B. Agree on a specific improvement experiment, an owner, and a review point; C. Require longer status reports without an action; D. Assign blame instead of examining the process. **Answer: B.** A concrete, owned experiment creates an observable follow-up rather than repeated discussion.

**Normal:** Facilitate a retrospective where the same dependency blocker recurs. Explain how you would help the team select and review one improvement. **Evaluate:** participation, actionable experiment, ownership, evidence of outcome, coaching rather than unilateral control.

### R33 — Database Administrator (DBA)

**Selection:** Backup & Recovery; 5+ Years. Reject generic “scalable patterns” without recovery objectives.

**MCQ:** A backup job reports success. Which activity provides stronger evidence that the backup is usable for recovery? A. Checking only that its file size is nonzero; B. Checking only that its schedule ran on time; C. Restoring into an isolated environment and validating data and application checks; D. Verifying upload transport integrity without attempting recovery. **Answer: C.** A restore exercise tests usability beyond successful backup creation or transfer.

**Normal:** Plan a restore drill for stated recovery-time and recovery-point objectives. Include validation and what to do if the drill misses either objective. **Evaluate:** recovery chain, timing/data-loss measurement, integrity checks, dependencies and corrective actions.

## 10. Same selected skill, different experience: concrete replacements

Selection held constant: **Frontend Developer; React; package empty**. These pairs demonstrate real depth changes rather than merely inserting years into the same sentence. Each is an alternative to one faulty slot, not a complete interview.

| Experience | Must avoid | Appropriate replacement focus |
|---|---|---|
| Empty | “your Any experience” | Disclosed foundation/applied mixture; use F below as a foundation example. |
| Fresher | Assuming ownership of a live production system | State and interaction in a small component. |
| 1–3 Years | Repeated definition questions only | Diagnosing a realistic component bug. |
| 3–5 Years | Salary-based abstract architecture | Data consistency, asynchronous state, and component boundaries. |
| 5+ Years | Trivial API recall as the whole assessment | Shared UI architecture, isolation, rollout, and measurable trade-offs. |

**F — Fresher MCQ:** A React component must redraw when a user toggles a setting. Which mechanism directly stores local data and requests a render when updated? A. A plain variable inside the component function; B. Only assigning to a ref's `current` property; C. Component state updated through its setter; D. Mutating a module-level variable without a state update. **Answer: C.** A state update can request a render with the new value; the other assignments do not themselves request that render.

**F — Fresher normal:** Build a component that toggles whether details are visible. Explain its initial state and verify two successive clicks. **Evaluate:** state, event handler, conditional rendering, observable behavior.

**J — 1–3 Years MCQ:** A counter click handler calls `setCount(count + 1)` twice and increments once. Which change expresses two sequential increments? A. Use two functional updater calls; B. Make both calls read the same captured value again; C. Put the same two captured-value calls in a loop; D. Replace both arguments with the constant `1`. **Answer: A.** Functional updates compose from pending state.

**J — 1–3 Years normal:** Diagnose the counter behavior and propose a minimal regression test. **Evaluate:** captured state, queued updates, one-click and repeated-click results.

**M — 3–5 Years MCQ:** Search for A starts, then search for B starts; A finishes last. The UI must display only the latest query's result. Which design handles response ordering? A. Always display whichever response arrives last; B. Accept a response only if its request identity still matches the latest active query; C. Debounce new requests but still accept every in-flight response unconditionally; D. Use one loading Boolean as the only response-order check. **Answer: B.** Request identity prevents an obsolete response from replacing the current result; cancellation can additionally save work.

**M — 3–5 Years normal:** Design a React search component for rapid query changes, out-of-order responses, failures, and unmounting. **Evaluate:** request identity/cancellation, explicit states, lifecycle cleanup, deterministic race tests.

**S — 5+ Years MCQ:** Two independent React search widgets incorrectly overwrite each other's results because they share one unkeyed cache entry. Which change best restores isolation while preserving reuse for identical requests? A. Give each component a private cache with no cross-component reuse; B. Keep the shared constant key and increase the cache lifetime; C. Key only by endpoint while omitting query parameters that change the result; D. Key cached results by the complete relevant request identity and define invalidation. **Answer: D.** Correct cache identity isolates distinct requests while allowing deliberate reuse.

**S — 5+ Years normal:** Propose a reusable search/data-state architecture for several teams, including request identity, cache invalidation, race handling, migration, and success measures. **Evaluate:** explicit ownership and boundaries, trade-offs, compatibility, observability, incremental rollout.

When package changes, vary the number of core/challenge slots per section 5. For example, Fresher + 20+ LPA can include the queued-update challenge from M09; it should not be relabeled as a senior ownership question. For unspecified experience, label the mixture instead of inventing years.

## 11. Replacement and regeneration workflow

1. Capture a normalized selection snapshot with the generated interview. Keep it immutable for that session.
2. Resolve role-relevant topics and an explicit 10-slot coverage plan. Reject unsupported selections with a useful message.
3. Select or generate a question for each slot using its role, skill, experience band, mode, and competency objective.
4. Reject a candidate question if it is blank, repeats a prior stem/competency without justification, mentions salary as a task requirement, assumes inappropriate work history, introduces an unsupported topic, or fails the answer contract.
5. For an MCQ, independently verify one answer, unique options, plausible distractors, and a reasoning explanation. For normal mode, verify a bounded prompt and a rubric accepting equivalent correct reasoning.
6. Replace a failed question **within the same slot's selection constraints**. Exclude rejected and already-used items. Do not merely change the skill label, question ID, or option order.
7. Bound retries. If ten valid questions cannot be produced, return a clear generation failure or explicit smaller-set option; never silently pad with duplicates.
8. Store/return an interview ID, selection snapshot, question IDs, and the declared mode. Use stable option IDs if options can be shuffled.
9. Invalidate existing questions when the user edits filters, or require explicit regeneration while clearly showing the old session selection. Do not submit old questions under new mode settings.
10. For normal answers, add actual persistence before saying “saved.” If this remains local practice, use an accurate confirmation. For an authoritative MCQ assessment, keep the answer key and scoring server-side.

Suggested internal reviewer fields: `question_id`, `role`, `canonical_skills`, `experience_band`, `difficulty`, `mode`, `competency`, `stem`, `options`, `correct_option_id`, `explanation`, `rubric`, `review_status`. These are a proposed content model, not fields currently accepted by the existing response schema. Do not expose reviewer-only fields as if they were candidate answers.

## 12. Acceptance checklist

| Check | Expected result after implementation |
|---|---|
| Each of 33 roles × each package × each experience × both modes | Valid response contract and content aligned to the immutable selection. |
| React alone | 10 distinct React questions with different objectives, not one stem repeated ten times. |
| Empty skills, spaces, commas | Same normalized no-skill behavior; role-relevant defaults; no blank insertions. |
| `React,,SQL` | No blank questions; relevance of both explicit skills is resolved and coverage disclosed. |
| `JS,JavaScript,js` | One canonical JavaScript skill; no artificial threefold weighting. |
| More than 10 skills | Explicit topic allocation/coverage limits; no index-driven silent omissions. |
| Fresher × all package tiers | No mandatory previous-job/leadership narrative; depth remains appropriate. |
| 5+ Years × all package tiers | Role-appropriate experienced content, even at a low selected package. |
| Package omitted | No “Standard compensation level” text. |
| Experience omitted | No “Any experience” text; disclosed baseline. |
| MCQ set | Exactly four distinct options per item, one valid answer, explanation, varied answer positions, plausible distractors. |
| Normal set | No MCQ options; ten bounded tasks with evaluation points. |
| Regenerate | Maintains selection constraints and avoids prior questions where the bank has enough reviewed content. |
| Unknown role/mode or invalid selection | Explicit validation result; no silent conversion to normal/Professional. |
| Filter changed after generation | Old session is invalidated or visibly identified with its original selection. |
| Mode changed during request | Stale response is ignored/canceled or attached only to its original selection. |
| Normal submission | Accurate local-state message, or confirmed persistent save with reload verification. |
| Trusted MCQ score, if required | Answer key withheld until appropriate; server grades against stored question/option IDs. |
| Insufficient valid replacements | Controlled failure or explicit reduced set, never duplicated filler. |

## 13. Reproducing the core generator check

Run from the repository root with Python. This source-only harness intentionally does not test HTTP, request validation, authorization, or persistence. It performs no application/database writes and requires only the standard library.

```python
import ast
from collections import Counter
from itertools import product
from pathlib import Path
from types import SimpleNamespace

path = Path('backend/app/routes/candidate.py')
tree = ast.parse(path.read_text(encoding='utf-8-sig'))
fn = next(n for n in tree.body
          if isinstance(n, ast.FunctionDef) and n.name == 'generate_interview')
fn.decorator_list = []
fn.returns = None
fn.args.defaults = []
for arg in fn.args.args:
    arg.annotation = None
namespace = {'InterviewGenerateResponse': lambda **kwargs: kwargs}
isolated = ast.fix_missing_locations(ast.Module(body=[fn], type_ignores=[]))
exec(compile(isolated, str(path), 'exec'), namespace)

catalog_tree = ast.parse(Path('backend/app/utils/roles_catalog.py')
                         .read_text(encoding='utf-8-sig'))
roles = ast.literal_eval(next(
    n.value for n in catalog_tree.body if isinstance(n, ast.Assign)
    and any(isinstance(t, ast.Name) and t.id == 'IT_ROLES_CATALOG'
            for t in n.targets)))
packages = ['', '< 5 LPA', '5-10 LPA', '10-20 LPA', '20+ LPA']
experiences = ['', 'Fresher', '1-3 Years', '3-5 Years', '5+ Years']
skill_cases = [
    '', 'React', 'React,JavaScript', 'React,JavaScript,CSS',
    'React,JavaScript,CSS,HTML', 'React,React', 'React,,SQL',
    '   ', ',,,', 'JS,JavaScript,js', 'Excel,React',
    ','.join(f'Skill{i}' for i in range(1, 13)),
]
counts = Counter()
for role, package, experience, mode, skills in product(
        roles, packages, experiences, ['mcq', 'normal'], skill_cases):
    req = SimpleNamespace(job_role=role['name'], package=package,
                          experience=experience, interview_type=mode,
                          skills=skills)
    questions = namespace['generate_interview'](
        req, SimpleNamespace(role='candidate'))['questions']
    counts['sets'] += 1
    counts['questions'] += len(questions)
    counts['duplicate_sets'] += len({q['question'] for q in questions}) < 10
    assert len(questions) == 10
    assert len({q['id'] for q in questions}) == 10
    if mode == 'mcq':
        counts['mcq_answer_B'] += sum(
            q['correct_answer'] == q['options'][1] for q in questions)
print(dict(counts))
```

Observed output for the audited generator:

```text
{'sets': 19800, 'questions': 198000, 'duplicate_sets': 18150,
 'mcq_answer_B': 99000}
```

## 14. Recommended order of work

1. Replace the three generic template families and add normalized role/skill/difficulty selection.
2. Validate content and reject duplicates, blank skills, invalid modes, and faulty MCQ options before returning a set.
3. Bind question display and submission to the same generated selection and mode.
4. Correct normal-answer persistence messaging; implement server-side grading if trusted scoring is a product requirement.
5. Expand the reviewed role-specific bank and exercise the acceptance matrix above.

The current output passes question count and within-set ID checks. It fails the substantive standard for filtered, varied interview content in both modes. The replacement material in this file provides concrete alternatives; the application will continue using the original templates until those changes are implemented.
