# Festival Food-Label Auditor

**Product Requirements Document/README — V1.2**

> A lightweight, deterministic, browser-based tool for auditing dietary claims and allergen declarations against a fixed ingredient rule set.

---

## 1. Quick Problem Statement

The Festival Food-Label Auditor is a small web application for volunteers preparing a college festival food-stall information board.

A user enters food products along with:

- Product ID
- Product name
- Ingredients
- Claimed dietary tags
- Declared allergens

The application derives the product's actual dietary properties and allergens using a **fixed ingredient rule table**, compares those derived facts against the user's claims and declarations, and produces a deterministic audit report.

The fixed rules are:

| Ingredient | Vegetarian | Vegan | Derived Allergen |
|---|---|---|---|
| rice | Yes | Yes | — |
| tomato | Yes | Yes | — |
| milk | Yes | No | MILK |
| egg | No | No | EGG |
| peanut | Yes | Yes | PEANUT |

A product is vegetarian only when **every ingredient** is vegetarian. A product is vegan only when **every ingredient** is vegan. Its derived allergens are the union of the allergens associated with its ingredients.

The system compares these derived facts against the product's claimed dietary tags and declared allergens and reports issues such as:

```
INCORRECT_DIETARY_TAG:VEGETARIAN
INCORRECT_DIETARY_TAG:VEGAN
MISSING_ALLERGEN:EGG
INCORRECT_ALLERGEN:MILK
UNKNOWN_INGREDIENT
INVALID_CLAIM
```

This is a deterministic auditing exercise based only on the supplied rules, not a real-world food-safety service. External food databases, recommendations, ordering, payments, recipe planning, and similar functionality are out of scope.

---

## 2. Product Vision

The finished product should feel like a small, polished real-world utility, rather than a coding-exercise interface or enterprise dashboard.

The guiding principles are:

- Simple technology
- Clean architecture
- Deterministic business logic
- Strong validation
- Clear feedback
- Minimal interaction complexity
- Calm editorial visual design

The user should always understand:

1. What data they entered.
2. What the system is auditing.
3. Whether the current data has been successfully audited.
4. Why a product is clean or faulty.
5. What needs to be fixed when validation fails.

---

## 3. Goals

**Primary Goals**

- Allow users to add and manage food products.
- Provide a one-click sample dataset.
- Make known values easy to enter using native browser suggestions.
- Allow arbitrary values to be manually entered.
- Convert entered values into removable chips.
- Validate product data before auditing.
- Derive dietary properties and allergens deterministically.
- Produce a repeatable audit report.
- Clearly distinguish clean and faulty products.
- Explain every detected issue.
- Clearly indicate when product data changed after the last successful audit.
- Provide comprehensive automated testing.
- Keep the application completely browser-based and zero-install.

---

## 4. Non-Goals

The application will **not** include:

Backend server · Database · Authentication · User accounts · Cloud storage · External APIs · External food databases · Internet search · AI/LLM food classification · Food recommendations · Recipe planning · Ordering · Payments · Real food-safety certification · PDF generation · CSV import/export · Audit history · Multi-user collaboration · Notifications · Complex analytics

The original problem intentionally limits the application to deterministic auditing against the supplied rule set.

---

## 5. Target User

The primary user is a **college festival volunteer** preparing or verifying food-stall information.

The user is not expected to understand: programming, JSON, audit algorithms, data structures, or technical configuration.

The interface should feel like a straightforward data-entry and verification tool.

---

## 6. Technology Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 |
| Application logic | Vanilla JavaScript |
| Domain/business logic | Vanilla JavaScript |
| Testing | JavaScript `test.js` |
| Runtime | Browser |
| Backend | None |
| Database | None |
| Build system | None |
| External dependencies | None |

The application should run simply by opening `index.html`. No `npm install`, package manager, build process, or server should be required.

---

## 7. Technology Choice Rationale

A framework such as React and a backend such as Node.js are intentionally not being used.

The application has:

- a fixed rule set
- a small in-memory dataset
- deterministic logic
- no persistence requirement
- no authentication
- no external API requirement
- no server-side computation requirement

The original specification permits browser-based and in-memory implementations.

> **The simplest technology that completely solves the problem is preferred.**
> The absence of a backend is a deliberate architectural choice.

---

## 8. Architecture

```
                         USER
                           │
                           ▼
                 ┌───────────────────┐
                 │    HTML / CSS     │
                 │       UI          │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │      app.js       │
                 │                   │
                 │ UI state          │
                 │ DOM manipulation  │
                 │ User actions      │
                 │ Rendering         │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │     audit.js      │
                 │                   │
                 │ Validation        │
                 │ Fact derivation   │
                 │ Audit engine      │
                 │ Issue generation  │
                 │ Summary           │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │     test.js       │
                 │                   │
                 │ Domain tests      │
                 │ Acceptance tests  │
                 │ Edge cases        │
                 └───────────────────┘
```

There is no network layer. `audit.js` is the domain/business layer, not a backend.

---

## 9. Project Structure

```
festival-food-label-auditor/
│
├── index.html
├── style.css
├── app.js
├── audit.js
├── test.js
└── README.md
```

**`index.html`** — the semantic application structure.

**`style.css`** — typography, colors, spacing, layout, borders, buttons, chips, input styling, validation styling, data-change banner, result styling, responsive behavior.

**`app.js`** — UI state, DOM manipulation, product CRUD, reusable tag-input behavior, sample loading, clear/reset, editing, audit triggering, data-change tracking, result rendering, filtering.

**`audit.js`** — fixed rules, validation, fact derivation, issue generation, issue ordering, product classification, summary calculation. *Must not depend on the DOM.*

**`test.js`** — acceptance tests, domain tests, edge cases, ordering tests, regression tests, audit synchronization tests.

---

## 10. Fixed Ingredient Rule Table

The application uses exactly this immutable rule set:

```
rice
    vegetarian: true
    vegan: true
    allergens: []

tomato
    vegetarian: true
    vegan: true
    allergens: []

milk
    vegetarian: true
    vegan: false
    allergens: ["MILK"]

egg
    vegetarian: false
    vegan: false
    allergens: ["EGG"]

peanut
    vegetarian: true
    vegan: true
    allergens: ["PEANUT"]
```

The rules are displayed to the user but cannot be modified.

---

## 11. Data Model

**11.1 Product**

```js
{
    id: "F01",
    name: "Lemon Rice",
    ingredients: ["rice", "tomato"],
    claimedTags: ["VEGETARIAN", "VEGAN"],
    declaredAllergens: []
}
```

**11.2 Audit Result**

```js
{
    productId: "F03",
    status: "FAULTY",
    issues: [
        "INCORRECT_DIETARY_TAG:VEGETARIAN",
        "INCORRECT_DIETARY_TAG:VEGAN",
        "MISSING_ALLERGEN:EGG",
        "INCORRECT_ALLERGEN:MILK"
    ]
}
```

**11.3 Audit Summary**

```js
{
    clean: 2,
    faulty: 2,
    totalIssues: 5
}
```

---

## 12. Application Layout

The application uses a single primary screen. Major sections:

```
01 / HEADER
02 / INGREDIENT RULES
03 / PRODUCT DATA
04 / AUDIT SUMMARY
05 / AUDIT RESULTS
```

Audit controls live within the Product Data section. The interface should not resemble a dense enterprise dashboard.

**Combined front-page layout:**

```
┌────────────────────────────────────────────────────────────┐
│                                                              │
│  FESTIVAL FOOD-LABEL AUDITOR                                │
│  Verify dietary claims and allergen declarations            │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  01 / INGREDIENT RULES                                      │
│                                                              │
│  ingredient   vegetarian   vegan   allergen                 │
│  rice         ✓            ✓       —                        │
│  tomato       ✓            ✓       —                        │
│  milk         ✓            ✗       MILK                     │
│  egg          ✗            ✗       EGG                      │
│  peanut       ✓            ✓       PEANUT                   │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  02 / PRODUCT DATA                          4 PRODUCTS      │
│                                                              │
│  ID   NAME          INGREDIENTS      CLAIMS       ALLERGENS │
│  F01  Lemon Rice     [rice ×][tomato ×]  [VEGETARIAN ×]     │
│                                           [VEGAN ×]          │
│  F02  Peanut Chaat   [peanut ×][tomato ×] ...        EDIT ✕ │
│  ...                                                         │
│                                                              │
│  + ADD PRODUCT     LOAD SAMPLE     CLEAR ALL                │
│                                                              │
│  ⚠ Data changed since last audit · Click Compute Audit      │
│                                                              │
│                                   [ COMPUTE AUDIT ]          │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  03 / AUDIT SUMMARY                                          │
│                                                              │
│       02              02              05                    │
│      CLEAN           FAULTY          ISSUES                 │
│                                                              │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  04 / AUDIT RESULTS         [ ALL PRODUCTS ] [ FAULTY ONLY ]│
│                                                              │
│  F01  LEMON RICE                              CLEAN         │
│       No issues found.                                      │
│                                                              │
│  F02  PEANUT CHAAT                            FAULTY        │
│       MISSING_ALLERGEN:PEANUT                                │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

This is the single primary screen — every section (rules, product data, controls, banner, summary, results) sits on one vertically-scrolling page, no separate views or tabs.

---

## 13. Visual Design Direction

The application follows a **Warm · Editorial · Calm · Minimal · Structured** visual language — closer to a thoughtfully designed personal/editorial website than a conventional SaaS dashboard.

The interface should rely on typography, whitespace, subtle borders, clear hierarchy, and restrained status colors — rather than excessive cards, gradients, shadows, or decorative effects.

---

## 14. Color System

**Background** — primary background: `#FAF3E9` (a close variation may be used if needed for contrast)

**Primary Text** — dark charcoal rather than pure black, e.g. `#252321`

**Status Colors** — restrained visual indicators for CLEAN, FAULTY, validation errors, and the data-changed warning. Color must not be the only method of communicating status.

---

## 15. Typography

Three typographic roles:

- **Sans-serif** — page headings, section headings, labels, buttons, interface metadata
- **Serif** — body text, product names, table content, descriptive copy
- **Monospace** — Product IDs, issue codes, technical values, audit metadata (e.g. `MISSING_ALLERGEN:PEANUT` should visually read as a distinct technical value, not normal prose)

---

## 16. Spacing

Use generous whitespace between the rule table, product table, controls, validation message, summary, and audit results. Sections should breathe. Avoid tightly packed cards — use subtle separators and whitespace to establish hierarchy.

---

## 17. Tables

Tables should use subtle borders, light separators, clean headers, generous cell padding, minimal visual noise, and no heavy grid lines. The product table should feel like part of the editorial design rather than a spreadsheet application.

---

## 18. Buttons

**Primary** — `COMPUTE AUDIT`: solid dark charcoal, light text, simple shape, strongest visual emphasis.

**Secondary** — `+ ADD PRODUCT`, `LOAD SAMPLE`, `CLEAR ALL`, `EDIT`: subtle outlined or ghost styling. Avoid excessive rounded SaaS-style controls.

---

## 19. Initial User Experience

When the application opens, the user sees: application title, short description, fixed ingredient rules, empty product table, `ADD PRODUCT`, `LOAD SAMPLE`, `CLEAR ALL`, `COMPUTE AUDIT`.

No products are automatically loaded. The user can either enter products manually or load the sample dataset.

---

## 20. Header

The header should communicate the purpose immediately:

```
FESTIVAL FOOD-LABEL AUDITOR
Verify dietary claims and allergen declarations
```

Keep the header visually strong but minimal.

---

## 21. Ingredient Rules Section

| Ingredient | Vegetarian | Vegan | Allergen |
|---|---|---|---|
| rice | ✓ | ✓ | — |
| tomato | ✓ | ✓ | — |
| milk | ✓ | ✗ | MILK |
| egg | ✗ | ✗ | EGG |
| peanut | ✓ | ✓ | PEANUT |

This is a fixed reference table.

---

## 22. Product Data Section

The main interactive area is an editable table.

| ID | Name | Ingredients | Claimed Tags | Declared Allergens | Actions |
|---|---|---|---|---|---|

Initially:

```
NO PRODUCTS YET
Add a product or load the sample dataset.
```

---

## 23. Add Product

Clicking `+ ADD PRODUCT` adds a new product row, e.g.:

```
F01
Lemon Rice
rice, tomato
VEGETARIAN, VEGAN
```

Every addition counts as a product-data change.

---

## 24. Load Sample

A **required** control, `LOAD SAMPLE`, must populate the product table with the four built-in products in one action.

The sample dataset is:

```
F01  Lemon Rice
     rice, tomato
     VEGETARIAN, VEGAN
     —

F02  Peanut Chaat
     peanut, tomato
     VEGETARIAN, VEGAN
     —

F03  Egg Roll
     egg, tomato
     VEGETARIAN, VEGAN
     MILK

F04  Milk Rice
     milk, rice
     VEGETARIAN
     MILK
```

These are the required built-in products from the specification.

> **Important:** `LOAD SAMPLE` does not automatically run the audit. The user must explicitly press `COMPUTE AUDIT`. Loading the sample counts as modifying the product dataset.

---

## 25. Product Controls

The product section provides `+ ADD PRODUCT`, `LOAD SAMPLE`, `CLEAR ALL`, with `COMPUTE AUDIT` as the primary action.

---

## 26. Reusable Tag Input

Ingredients, claimed dietary tags, and declared allergens all use **one reusable tag-input component**, consisting of one text input, one chip container, and one associated `<datalist>`. The same implementation is reused for all three fields — there should not be three separate versions.

---

## 27. Tag Input Interaction

The user types a value, may choose a native browser suggestion, and presses Enter. The value becomes a chip, the input clears, and the user can enter another value.

```
Ingredients

[ rice × ] [ tomato × ]

Type ingredient and press Enter...
```

---

## 28. Ingredient Datalist

Known suggestions: `rice`, `tomato`, `milk`, `egg`, `peanut`

```html
<input list="ingredient-options">

<datalist id="ingredient-options">
    <option value="rice">
    <option value="tomato">
    <option value="milk">
    <option value="egg">
    <option value="peanut">
</datalist>
```

The datalist provides suggestions but does not restrict input.

---

## 29. Dietary Claim Datalist

Known suggestions: `VEGETARIAN`, `VEGAN`

```html

<input list="claim-options">

<datalist id="claim-options">
    <option value="VEGETARIAN">
    <option value="VEGAN">
</datalist>
```

The user can still enter arbitrary text.

---

## 30. Allergen Datalist

Known suggestions: `EGG`, `MILK`, `PEANUT`

```html
<input list="allergen-options">

<datalist id="allergen-options">
    <option value="EGG">
    <option value="MILK">
    <option value="PEANUT">
</datalist>
```

Arbitrary values remain permitted.

---

## 31. Custom Values

If a value is not in the datalist, the user can still type it, e.g. `sesame`. Pressing Enter creates `[ sesame × ]`. The value is **not** added to the fixed rule table.

When auditing: `sesame` → not found in rules → `UNKNOWN_INGREDIENT`

This is required to support the unknown-ingredient validation scenario.

---

## 32. Chip Removal

Every chip contains an `×`, e.g. `[rice ×] [tomato ×]`. Clicking the `×` removes the value. Removing a chip counts as a product-data change.

---

## 33. Editing

The user can click `EDIT` to modify an existing product. Editable fields: Product ID, Product name, Ingredients, Claimed dietary tags, Declared allergens. Any edit counts as a product-data change.

---

## 34. Compute Audit

Auditing is explicitly triggered by `COMPUTE AUDIT`. The system does not automatically audit on every input change — this allows users to make multiple edits before evaluating the dataset.

---

## 35. Audit-Change Tracking

The application uses exactly **one** synchronization flag:

```js
let dataChangedSinceAudit = false;
```

**Set to `true`** when: a product is added, deleted, or edited; a chip is added or removed; sample data is loaded; product data is cleared.

**Set to `false`** only when `COMPUTE AUDIT` successfully completes validation and produces a new audit.

There is deliberately no audit state machine — no `NONE` / `CURRENT` / `STALE` / `ERROR` states are required.

---

## 36. Data-Changed Banner

When `dataChangedSinceAudit === true`, show one small banner:

> Data changed since last audit · Click Compute Audit to refresh

When `dataChangedSinceAudit === false`, show nothing. The banner exists solely to answer: *"Does the current product data differ from what was successfully audited?"*

---

## 37. Successful Audit

When Compute Audit succeeds:

1. Current product data is validated.
2. Facts are derived.
3. Issues are generated.
4. Product statuses are calculated.
5. Summary is calculated.
6. Results are rendered.
7. Previous audit output is replaced.
8. `dataChangedSinceAudit` becomes `false`.
9. The data-change banner disappears.

---

## 38. Validation Failure — Critical UI Behavior

Validation occurs when the user presses `COMPUTE AUDIT`. **If validation fails, the previous audit output must be completely removed from the screen.**

Specifically, clear:

- previous summary numbers
- previous audit result cards/list
- previous issue report

Do not leave the previous audit visible next to the new validation error. The screen should contain only: current (uncorrected) product data, the validation error message, and the normal product controls.

**Example:**

```
02 / PRODUCT DATA

F01  Lemon Rice
     [rice ×] [tomato ×]
     [VEGETARIAN ×] [VEGAN ×]

F02  Peanut Chaat
     [peanut ×] [sesame ×]
     [VEGETARIAN ×] [VEGAN ×]


⚠ VALIDATION ERROR

Product F02:
Unknown ingredient "sesame".


03 / AUDIT SUMMARY
(no previous summary)

04 / AUDIT RESULTS
(no previous results)
```

This prevents an old audit from being mistaken for the audit of the current dataset.

---

## 39. Validation Failure and `dataChangedSinceAudit`

A failed validation does **not** reset `dataChangedSinceAudit`. The flag remains unchanged — if it was `true` before the failed audit attempt, it remains `true`, because the current data has still not been successfully audited. A successful Compute Audit is the only operation that resets the flag to `false`.

---

## 40. Validation Errors

Validation errors are shown inline at the time Compute Audit fails. No separate persistent validation-state machine is required.

```
⚠ VALIDATION ERROR
Product F03:
Unknown ingredient "sesame".
```
```
⚠ VALIDATION ERROR
Product ID "F02" is duplicated.
```
```
⚠ VALIDATION ERROR
Invalid claim "PESCATARIAN".
```

The current product data remains available for correction.

---

## 41. Product ID Validation

Product IDs must be trimmed, non-empty, and unique.

There is no required format or prefix for Product IDs. Any non-empty Product ID is valid as long as it is unique.

Product IDs are trimmed before validation and auditing.

For example:

`" F01 "` → `"F01"`

An empty or whitespace-only Product ID produces:

`INVALID_PRODUCT_ID`

A duplicate Product ID produces:

`DUPLICATE_PRODUCT_ID:<id>`

Possible validation errors: `INVALID_PRODUCT_ID`, `DUPLICATE_PRODUCT_ID`

---

## 42. Ingredient Validation

Every ingredient ID must be trimmed and must exist in the fixed ingredient rule table.

For example:

`" rice "` → `"rice"`

An unknown ingredient such as `sesame` produces:

`UNKNOWN_INGREDIENT:sesame`

Repeated ingredient IDs must not duplicate derived facts or issues.

---

## 43. Claim Validation

Only `VEGETARIAN` and `VEGAN` are valid dietary claim tokens. An unsupported claim produces `INVALID_CLAIM`.

---

## 44. Allergen Validation

Valid allergen tokens are `EGG`, `MILK`, `PEANUT`. An unsupported allergen token results in `INVALID_CLAIM`, as specified by the validation contract.

---

## 45. Empty Input

An empty product dataset is valid. Expected audit summary: `CLEAN: 0`, `FAULTY: 0`, `ISSUES: 0`. No validation error should be generated.

---

## 46. Audit Processing Flow

```
Current Product Data
        │
        ▼
    Validation
        │
        ├──────── FAIL ────────┐
        │                      │
        │                Clear old audit
        │                Clear summary
        │                Clear results
        │                Show validation error
        │                Keep product data
        │                Preserve change flag
        │
        ▼
      PASS
        │
        ▼
  Derive Dietary Facts
        │
        ▼
   Derive Allergens
        │
        ▼
  Compare Claims
        │
        ▼
 Generate Issues
        │
        ▼
Classify Products
        │
        ▼
Calculate Summary
        │
        ▼
 Render New Audit
        │
        ▼
dataChangedSinceAudit = false
```

---

## 47. Dietary Derivation

A product is vegetarian only if every ingredient is vegetarian. A product is vegan only if every ingredient is vegan.

---

## 48. Allergen Derivation

The derived allergen set is the union of allergens associated with all ingredients. E.g. `egg + tomato` produces `EGG`, because tomato has no derived allergen.

---

## 49. Dietary Audit

For every claimed dietary tag, if the ingredients do not support it: `INCORRECT_DIETARY_TAG:<tag>`. A dietary property that is true but simply wasn't claimed is not an issue.

---

## 50. Missing Allergens

For every derived allergen that was not declared: `MISSING_ALLERGEN:<allergen>`

---

## 51. Incorrect Allergens

For every declared allergen that was not derived: `INCORRECT_ALLERGEN:<allergen>`

---

## 52. Issue Ordering

Within each product, issues must appear in this exact order:

1. **Dietary issues** — `VEGETARIAN`, `VEGAN`
2. **Missing allergens** — `EGG`, `MILK`, `PEANUT`
3. **Incorrect allergens** — `EGG`, `MILK`, `PEANUT`

Product order must remain the original input order.

---

## 53. Product Classification

A product is `CLEAN` if it has zero issues. Otherwise, `FAULTY`.

---

## 54. Audit Summary

Display three large numbers:

```
    02              02              05
   CLEAN           FAULTY          ISSUES
```

The summary represents the complete audit, regardless of result filtering.

---

## 55. Audit Results

**Clean:**
```
F01  LEMON RICE                         CLEAN

No issues found.
```

**Faulty:**
```
F03  EGG ROLL                           FAULTY

INCORRECT_DIETARY_TAG:VEGETARIAN
INCORRECT_DIETARY_TAG:VEGAN
MISSING_ALLERGEN:EGG
INCORRECT_ALLERGEN:MILK
```

Issue codes should use monospace typography.

---

## 56. Faulty-Only Filter

Provide `[ ALL PRODUCTS ] [ FAULTY ONLY ]`. `FAULTY ONLY` displays only faulty products. The summary remains based on the complete audit. The built-in filtered result should contain F02 followed by F03.

---

## 57. Clear All

`CLEAR ALL` removes all product data, current audit output, summary, displayed validation error, and relevant change-tracking state.

If meaningful data exists, request confirmation:

```
Clear all product data and audit results?
[ CANCEL ]  [ CLEAR ALL ]
```

After confirmation, the application returns to the empty state.

---

## 58. Product Count

The Product Data section should display the number of products, e.g. `02 / PRODUCT DATA   ·   4 PRODUCTS`. The count updates immediately as products are added or removed.

---

## 59. Empty States

**No Products**
```
NO PRODUCTS YET
Add a product or load the sample dataset.
```

**No Audit**
```
NO AUDIT RUN
Enter products and select "Compute Audit".
```

**Valid Empty Audit**
```
NO PRODUCTS TO AUDIT
CLEAN    0
FAULTY   0
ISSUES   0
```

---

## 60. Accessibility

The application should: use semantic HTML, provide visible focus states, maintain readable contrast, provide descriptive labels, support keyboard interaction, make chip removal accessible, not rely solely on color, communicate status using text, and maintain usable controls on small screens.

---

## 61. Responsive Design

Desktop is the primary target. On smaller screens: the product table may scroll horizontally, audit results stack vertically, summary metrics adapt, controls remain accessible, chips wrap naturally, tag inputs remain usable, and native datalist suggestions continue to work. The visual identity should remain consistent across screen sizes.

---

## 62. Application State

The application intentionally uses a minimal state model:

```js
{
    products: [],
    auditResult: null,
    dataChangedSinceAudit: false,
    filter: "ALL"
}
```

There is deliberately no four-state audit machine.

---

## 63. Core Synchronization Rule

> Any operation that changes the product dataset sets `dataChangedSinceAudit` to `true`. A successful Compute Audit sets it back to `false`.

| Action | Effect on flag |
|---|---|
| Add Product | → `true` |
| Delete Product | → `true` |
| Edit Product | → `true` |
| Add Chip | → `true` |
| Remove Chip | → `true` |
| Load Sample | → `true` |
| Clear All | → `true` / initial reset |
| Successful Audit | → `false` |
| Failed Audit | → unchanged |

The flag answers one question only: *"Has the current product data changed since the last successful audit?"*

---

## 64. Testing Strategy

Testing is a first-class project requirement. `test.js` should primarily test `audit.js` independently from the UI.

---

## 65. Required Acceptance Tests — Built-in Oracle

Loading the sample dataset and auditing it must produce: `CLEAN: 2`, `FAULTY: 2`, `TOTAL ISSUES: 5`

**F02:** `MISSING_ALLERGEN:PEANUT`

**F03:**
```
INCORRECT_DIETARY_TAG:VEGETARIAN
INCORRECT_DIETARY_TAG:VEGAN
MISSING_ALLERGEN:EGG
INCORRECT_ALLERGEN:MILK
```

F01 and F04 must be clean.

---

## 66. Corrected F02 Test

Adding `PEANUT` to F02's declared allergens must produce: `CLEAN: 3`, `FAULTY: 1`, `TOTAL ISSUES: 4`

---

## 67. Empty Input Test

Expected: `CLEAN: 0`, `FAULTY: 0`, `ISSUES: 0`. Empty input is valid.

---

## 68. Unknown Ingredient Test

Adding an unknown ingredient such as `sesame` must produce `UNKNOWN_INGREDIENT`, and must not leave an old audit result visible after the failed Compute Audit.

---

## 69. Validation Failure UI Test

**Given:** a valid dataset is audited successfully → the user changes a product → the user introduces invalid data → the user presses Compute Audit.

**Expected:**
- Previous summary → cleared
- Previous results → cleared
- Current product data → retained
- Validation error → displayed
- `dataChangedSinceAudit` → remains `true`

No old audit result may remain visible.

---

## 70. Additional Test Coverage

**Product Validation** — empty ID, whitespace-only ID, arbitrary non-empty ID, duplicate ID, trimmed ID

**Ingredients** — valid ingredient, unknown ingredient, duplicate ingredient, multiple unknown ingredients

**Claims** — valid VEGETARIAN, valid VEGAN, invalid claim, empty claim set, unsupported claim

**Allergens** — valid allergen, invalid allergen, empty declaration, duplicate allergen

**Derivation** — fully vegetarian, non-vegetarian, fully vegan, non-vegan, multiple allergens, no allergens, duplicate ingredients

**Audit** — incorrect dietary tag, missing allergen, incorrect allergen, missing + incorrect allergen, clean product, faulty product

**Ordering** — product source order, dietary issue order, missing allergen order, incorrect allergen order, combined ordering

**Summary** — clean count, faulty count, total issue count, empty summary

**Synchronization** — add/delete/edit product sets flag, add/remove chip sets flag, Load Sample sets flag, successful audit clears flag, failed validation preserves flag, failed validation clears old audit UI

---

## 71. Implementation Plan

**Phase 1 — Domain Foundation**
Build: fixed rule table, data structures, validation, dietary derivation, allergen derivation, audit engine, issue ordering, summary.
*Checkpoint: core domain tests pass.*

**Phase 2 — Core UI**
Build: HTML structure, editorial visual foundation, ingredient rules, product table, Add Product, Delete Product, reusable tag-input component, native datalists, Load Sample, Clear All, Compute Audit, audit result rendering.
*Checkpoint: basic end-to-end workflow works.*

**Phase 3 — UX Refinement**
Implement: Edit behavior, data-change banner, validation error display, validation failure clearing behavior, empty states, product count, clear confirmation, faulty-only filter, responsive layout, final typography/spacing/borders/status styling.
*Checkpoint: complete user walkthrough works smoothly.*

**Phase 4 — Testing and Hardening**
Complete: comprehensive `test.js`, acceptance tests, edge cases, ordering tests, synchronization tests, validation UI tests, regression tests.
*Checkpoint: all tests pass.*

**Phase 5 — Evaluation Preparation**
Prepare: screenshots, test evidence, architecture explanation, technology trade-offs, AI prompts, design explanation, implementation walkthrough, live modification demonstration.

The original evaluation explicitly requires planning, AI prompting strategy, design/technology choices, trade-offs, and testing evidence.

---

## 72. AI-Assisted Development Strategy

AI coding assistants may be used throughout development. AI should receive explicit constraints from this PRD.

**Domain Logic**
```
Implement the Festival Food-Label Auditor domain logic
according to the PRD.

Constraints:
- Vanilla JavaScript only.
- No DOM dependencies in audit.js.
- Fixed ingredient rules cannot be modified.
- Preserve exact issue ordering.
- Product IDs must be trimmed, non-empty, and unique.
- Any non-empty Product ID format is valid; do not require an F prefix or numeric format.
- Ingredient IDs must be trimmed before rule lookup.
- Unknown ingredients must be detected.
- Invalid claims must be detected.
- Do not add functionality outside the PRD.
```

**Testing**
```
Generate a comprehensive test.js for the Festival
Food-Label Auditor.

Cover:
- built-in sample oracle
- corrected F02
- empty input
- unknown ingredient
- empty and whitespace-only product IDs
- arbitrary valid Product IDs
- duplicate IDs
- trimmed Product IDs
- invalid claims
- duplicate ingredients
- missing allergens
- incorrect allergens
- issue ordering
- summary counts
- dataChangedSinceAudit behavior
- validation failure clearing old audit results

Do not change the business rules.
```

**Code Review**
```
Review the current implementation against the Festival
Food-Label Auditor PRD.

Identify:
- requirement violations
- incorrect audit logic
- incorrect issue ordering
- validation bugs
- audit synchronization bugs
- incorrect dataChangedSinceAudit behavior
- stale audit UI bugs
- unnecessary complexity

Do not introduce new features.
```

AI-generated code must be reviewed and understood before acceptance.

---

## 73. Design Trade-offs

**Vanilla JavaScript vs Framework** — Chosen: Vanilla JavaScript. *Benefits:* zero setup, zero dependencies, no build process, simple deployment, transparent architecture. *Trade-off:* more manual DOM/state handling. *Decision:* the application is small enough that simplicity outweighs a framework's abstraction benefits.

**No Backend vs Full Stack** — Chosen: No backend. *Benefits:* no server, database, API, deployment infra, or network dependency. *Trade-off:* no persistence after refresh. *Decision:* persistence is outside the problem requirements.

**Native Datalist vs Custom Autocomplete** — Chosen: native `<datalist>`. *Benefits:* no dependency, minimal implementation, browser-native suggestions, arbitrary input remains possible, directly supports the known-value/unknown-value workflow. *Trade-off:* datalist appearance/behavior can vary slightly between browsers. *Decision:* simplicity is more valuable than a custom autocomplete system.

**One Tag Component vs Three Components** — Chosen: one reusable tag-input implementation, configured with different datalists (ingredient / claim / allergen options). Avoids duplicated UI logic and ensures identical interaction behavior.

**Explicit Compute vs Automatic Audit** — Chosen: explicit Compute Audit. *Benefits:* user can make several changes before auditing, no calculation while typing, clear user control, predictable workflow. *Trade-off:* the user must press Compute Audit. *Mitigation:* the single data-change banner makes this state explicit.

**Editorial UI vs Conventional Dashboard** — Chosen: editorial/minimal design. *Benefits:* calmer interface, strong information hierarchy, less visual clutter, better fit for a small utility. *Trade-off:* less conventional than a typical admin dashboard. *Decision:* the application's relatively small amount of information benefits from restraint rather than dashboard density.

---

## 74. Privacy

No data is sent to a server. No personal information is required. All product data exists only in browser memory. Refreshing the page clears the current session.

---

## 75. Performance

The expected dataset is small. The audit should execute effectively instantaneously for the intended workload. No advanced optimization is required — correctness, clarity, and maintainability take priority.

---

## 76. Acceptance Criteria

**Core Functionality**
- Users can add, edit, and delete products.
- Users can load the four built-in products with one click.
- Users can enter ingredients, dietary claims, and allergens.
- Known values appear through native datalist suggestions; arbitrary values can be manually entered.
- Pressing Enter converts a value into a removable chip.
- The same tag-input implementation is used for ingredients, claims, and allergens.
- Users can run the audit, clear/reset the application, and filter faulty products.

**Audit**
- Fixed rules are respected; dietary and allergen derivation are correct.
- Issue types and ordering are correct; product ordering is preserved.
- Clean/faulty classification and summary counts are correct.

**Validation**
- Empty/whitespace-only Product IDs, duplicate Product IDs, unknown ingredients, and invalid claims are detected.
- Non-empty Product IDs are otherwise unrestricted and are trimmed before validation and auditing.
- Ingredient IDs are trimmed before rule lookup.
- Validation errors appear when Compute Audit fails; current product data remains visible.
- Previous audit summary and results are completely cleared after validation failure.
- No stale audit output remains next to a validation error.
- Empty product input is valid.

**Audit Synchronization**
- Any product-data modification sets `dataChangedSinceAudit` to `true`.
- The data-change banner appears when the flag is true and disappears after successful auditing.
- Failed validation leaves the flag unchanged.
- No four-state audit machine is used.

**UX**
- Audit status is understandable; results are easy to scan; empty states are intentional.
- Clear All asks for confirmation.
- Faulty-only filtering does not change summary counts.
- The interface is responsive and follows the warm editorial specification.

**Testing**
- Built-in oracle, corrected F02, empty input, and unknown ingredient tests pass.
- Validation-failure UI behavior, edge cases, issue ordering, and synchronization behavior are tested.
- Regression tests are maintained.

---

## 77. Future Change Policy

This PRD is the current source of truth for V1.

```
New Requirement → Evaluate Impact → Update PRD →
Update Architecture/Data Model if Required → Implement →
Update Tests → Verify Acceptance Criteria
```

No significant new behavior should be introduced without updating the PRD. The PRD can evolve as the project evolves.

---

## 78. Final Product Definition

> The Festival Food-Label Auditor is a zero-install, browser-based editorial-style auditing tool that lets festival volunteers enter food-product information, validate it against a fixed ingredient rule set, and receive a deterministic report identifying incorrect dietary claims and allergen declarations.

Its architecture is intentionally simple:

```
HTML + CSS + Vanilla JavaScript + Pure Audit Logic + Comprehensive Tests
```

Its workflow:

```
Add Product / Load Sample
          ↓
       Enter Data
          ↓
        Edit
          ↓
   Data Changed Banner
          ↓
     Compute Audit
          ↓
      Validation
       /      \
     FAIL     PASS
      ↓         ↓
 Clear Old    Audit Data
 Audit UI       ↓
 Show Error   Results
 Keep Data      ↓
      │       Summary
      │          ↓
      │     Change Flag OFF
      │
      └──────→ Correct Data
                    ↓
              Compute Again
```

Its visual philosophy: **Warm · Editorial · Calm · Minimal · Structured**

Its engineering philosophy:

> Use the simplest technology that fully solves the problem, keep business logic isolated and testable, and never allow outdated audit results to be mistaken for results belonging to the current product data.