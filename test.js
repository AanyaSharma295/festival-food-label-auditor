// ============================================
// Festival Food-Label Auditor
// Automated Domain Tests
// ============================================

// --------------------------------------------
// Load Domain Logic
// --------------------------------------------

const fs = require("fs");
const path = require("path");

const auditCode = fs.readFileSync(path.join(__dirname, "audit.js"), "utf8");
eval(auditCode);

let passed = 0;
let failed = 0;

// --------------------------------------------
// Test Helpers
// --------------------------------------------

function test(name, callback) {
    try {
        callback();
        console.log(`✓ PASS: ${name}`);
        passed++;
    } catch (error) {
        console.error(`✗ FAIL: ${name}`);
        console.error(error.message);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${expected}\nReceived: ${actual}`);
    }
}

function assertDeepEqual(actual, expected, message) {
    const actualJSON = JSON.stringify(actual);
    const expectedJSON = JSON.stringify(expected);
    if (actualJSON !== expectedJSON) {
        throw new Error(`${message}\nExpected: ${expectedJSON}\nReceived: ${actualJSON}`);
    }
}

// --------------------------------------------
// Sample Dataset
// --------------------------------------------

const sampleProducts = [
    {
        id: "F01",
        name: "Lemon Rice",
        ingredients: ["rice", "tomato"],
        claimedTags: ["VEGETARIAN", "VEGAN"],
        declaredAllergens: []
    },
    {
        id: "F02",
        name: "Peanut Chaat",
        ingredients: ["peanut", "tomato"],
        claimedTags: ["VEGETARIAN", "VEGAN"],
        declaredAllergens: []
    },
    {
        id: "F03",
        name: "Egg Roll",
        ingredients: ["egg", "tomato"],
        claimedTags: ["VEGETARIAN", "VEGAN"],
        declaredAllergens: ["MILK"]
    },
    {
        id: "F04",
        name: "Milk Rice",
        ingredients: ["milk", "rice"],
        claimedTags: ["VEGETARIAN"],
        declaredAllergens: ["MILK"]
    }
];

// ============================================
// 1. Dietary Derivation
// ============================================

test("Rice and tomato are vegetarian and vegan", () => {
    assertDeepEqual(
        deriveDietaryFacts(["rice", "tomato"]),
        { vegetarian: true, vegan: true },
        "Rice + tomato should be vegetarian and vegan"
    );
});

test("Egg makes a product non-vegetarian and non-vegan", () => {
    assertDeepEqual(
        deriveDietaryFacts(["egg", "tomato"]),
        { vegetarian: false, vegan: false },
        "Egg should make the product non-vegetarian and non-vegan"
    );
});

test("Milk is vegetarian but not vegan", () => {
    assertDeepEqual(
        deriveDietaryFacts(["milk"]),
        { vegetarian: true, vegan: false },
        "Milk should be vegetarian but not vegan"
    );
});

test("Duplicate ingredients do not affect dietary derivation", () => {
    assertDeepEqual(
        deriveDietaryFacts(["egg", "egg", "tomato"]),
        { vegetarian: false, vegan: false },
        "Duplicate ingredients should not change the derived facts"
    );
});

test("Fully vegetarian product derives vegetarian=true", () => {
    const result = deriveDietaryFacts(["rice", "tomato", "peanut"]);
    assertEqual(result.vegetarian, true, "Rice + tomato + peanut should be vegetarian");
});

test("Non-vegetarian product derives vegetarian=false", () => {
    const result = deriveDietaryFacts(["rice", "egg"]);
    assertEqual(result.vegetarian, false, "Egg should make the product non-vegetarian");
});

test("Fully vegan product derives vegan=true", () => {
    const result = deriveDietaryFacts(["rice", "tomato", "peanut"]);
    assertEqual(result.vegan, true, "Rice + tomato + peanut should be vegan");
});

test("Non-vegan product derives vegan=false", () => {
    const result = deriveDietaryFacts(["rice", "milk"]);
    assertEqual(result.vegan, false, "Milk should make the product non-vegan");
});

// ============================================
// 2. Allergen Derivation
// ============================================

test("Egg derives EGG allergen", () => {
    assertDeepEqual(deriveAllergens(["egg"]), ["EGG"], "Egg should derive EGG");
});

test("Milk derives MILK allergen", () => {
    assertDeepEqual(deriveAllergens(["milk"]), ["MILK"], "Milk should derive MILK");
});

test("Multiple allergens are combined", () => {
    assertDeepEqual(deriveAllergens(["egg", "milk"]), ["EGG", "MILK"], "Allergens should be combined");
});

test("Duplicate ingredients do not duplicate allergens", () => {
    assertDeepEqual(deriveAllergens(["egg", "egg"]), ["EGG"], "Duplicate ingredients must not duplicate allergens");
});

test("Ingredients with no allergens derive an empty allergen list", () => {
    assertDeepEqual(deriveAllergens(["rice", "tomato"]), [], "Rice + tomato should derive no allergens");
});

test("All supported allergens are derived together", () => {
    assertDeepEqual(
        deriveAllergens(["egg", "milk", "peanut"]),
        ["EGG", "MILK", "PEANUT"],
        "Egg + milk + peanut should derive all allergens"
    );
});

// ============================================
// 3. Built-in Sample Oracle
// ============================================

test("Built-in sample produces 2 clean, 2 faulty, 5 issues", () => {
    const result = runAudit(sampleProducts);
    assert(result.valid, "Sample dataset should be valid");
    assertDeepEqual(
        result.summary,
        { clean: 2, faulty: 2, totalIssues: 5 },
        "Sample summary is incorrect"
    );
});

test("F01 is CLEAN", () => {
    const result = runAudit(sampleProducts);
    assertEqual(result.results[0].status, "CLEAN", "F01 should be clean");
    assertDeepEqual(result.results[0].issues, [], "F01 should have no issues");
});

test("F02 has exactly MISSING_ALLERGEN:PEANUT", () => {
    const result = runAudit(sampleProducts);
    assertDeepEqual(
        result.results[1].issues,
        ["MISSING_ALLERGEN:PEANUT"],
        "F02 issues are incorrect"
    );
});

test("F03 has all four issues in exact order", () => {
    const result = runAudit(sampleProducts);
    assertDeepEqual(
        result.results[2].issues,
        [
            "INCORRECT_DIETARY_TAG:VEGETARIAN",
            "INCORRECT_DIETARY_TAG:VEGAN",
            "MISSING_ALLERGEN:EGG",
            "INCORRECT_ALLERGEN:MILK"
        ],
        "F03 issue ordering is incorrect"
    );
});

test("F04 is CLEAN", () => {
    const result = runAudit(sampleProducts);
    assertEqual(result.results[3].status, "CLEAN", "F04 should be clean");
});

// ============================================
// 4. Corrected F02
// ============================================

test("Adding PEANUT to F02 makes it clean", () => {
    const products = structuredClone(sampleProducts);
    products[1].declaredAllergens.push("PEANUT");

    const result = runAudit(products);

    assertEqual(result.results[1].status, "CLEAN", "F02 should become clean");
    assertDeepEqual(
        result.summary,
        { clean: 3, faulty: 1, totalIssues: 4 },
        "Corrected F02 summary is incorrect"
    );
});

// ============================================
// 5. Empty Input
// ============================================

test("Empty product list is valid", () => {
    const result = runAudit([]);
    assert(result.valid, "Empty product list should be valid");
    assertDeepEqual(
        result.summary,
        { clean: 0, faulty: 0, totalIssues: 0 },
        "Empty audit summary is incorrect"
    );
    assertDeepEqual(result.results, [], "Empty audit should have no results");
});

// ============================================
// 6. Product ID Validation
// ============================================

test("Empty product ID is rejected", () => {
    const result = runAudit([
        { id: "", name: "Test", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "INVALID_PRODUCT_ID", "Empty product ID should be rejected");
});

test("Whitespace-only product ID is rejected", () => {
    const result = runAudit([
        { id: "   ", name: "Test", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "INVALID_PRODUCT_ID", "Whitespace-only ID should be rejected");
});

test("Duplicate product IDs are rejected", () => {
    const result = runAudit([
        { id: "F01", name: "Product A", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] },
        { id: "F01", name: "Product B", ingredients: ["tomato"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "DUPLICATE_PRODUCT_ID", "Duplicate product IDs should be rejected");
});

// ============================================
// 7. Ingredient Validation
// ============================================

test("Unknown ingredient is rejected", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice", "sesame"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "UNKNOWN_INGREDIENT:sesame", "Unknown ingredient should be rejected");
});

test("Multiple unknown ingredients report the first unknown ingredient", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice", "sesame", "almond"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "UNKNOWN_INGREDIENT:sesame", "First unknown ingredient should be reported");
});

test("Duplicate ingredients are allowed", () => {
    const result = runAudit([
        {
            id: "F01",
            name: "Test",
            ingredients: ["rice", "rice"],
            claimedTags: ["VEGETARIAN", "VEGAN"],
            declaredAllergens: []
        }
    ]);
    assert(result.valid, "Duplicate ingredients should be valid");
});

// ============================================
// 8. Claim Validation
// ============================================

test("VEGETARIAN is a valid claim", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice"], claimedTags: ["VEGETARIAN"], declaredAllergens: [] }
    ]);
    assert(result.valid, "VEGETARIAN should be valid");
});

test("VEGAN is a valid claim", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice"], claimedTags: ["VEGAN"], declaredAllergens: [] }
    ]);
    assert(result.valid, "VEGAN should be valid");
});

test("Empty claimed tags are valid", () => {
    const result = runAudit([
        { id: "F01", name: "Rice", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] }
    ]);
    assert(result.valid, "Empty claimed tags should be valid");
});

test("Unsupported dietary claim is rejected", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice"], claimedTags: ["PESCATARIAN"], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "INVALID_CLAIM:PESCATARIAN", "Unsupported claim should be rejected");
});

test("Multiple invalid claims report the first invalid claim", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice"], claimedTags: ["PESCATARIAN", "HALAL"], declaredAllergens: [] }
    ]);
    assertEqual(result.error, "INVALID_CLAIM:PESCATARIAN", "First invalid claim should be reported");
});

// ============================================
// 9. Allergen Validation
// ============================================

test("Empty declared allergens are valid", () => {
    const result = runAudit([
        { id: "F01", name: "Rice", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] }
    ]);
    assert(result.valid, "Empty declared allergens should be valid");
});

test("Unsupported allergen is rejected", () => {
    const result = runAudit([
        { id: "F01", name: "Test", ingredients: ["rice"], claimedTags: [], declaredAllergens: ["SESAME"] }
    ]);
    assertEqual(result.error, "INVALID_CLAIM:SESAME", "Unsupported allergen should be rejected");
});

test("Duplicate declared allergens are allowed", () => {
    const result = runAudit([
        { id: "F01", name: "Egg", ingredients: ["egg"], claimedTags: [], declaredAllergens: ["EGG", "EGG"] }
    ]);
    assert(result.valid, "Duplicate allergens should be valid");
    assertDeepEqual(result.results[0].issues, [], "Duplicate correct allergens should not create issues");
});

// ============================================
// 10. Audit Logic
// ============================================

test("Unclaimed supported dietary property is not an issue", () => {
    const result = runAudit([
        { id: "F01", name: "Rice", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertDeepEqual(result.results[0].issues, [], "Missing dietary claims should not create issues");
});

test("Missing allergen is detected", () => {
    const result = runAudit([
        { id: "F01", name: "Egg Rice", ingredients: ["egg", "rice"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertDeepEqual(result.results[0].issues, ["MISSING_ALLERGEN:EGG"], "Missing allergen should be detected");
});

test("Incorrect allergen is detected", () => {
    const result = runAudit([
        { id: "F01", name: "Rice", ingredients: ["rice"], claimedTags: [], declaredAllergens: ["MILK"] }
    ]);
    assertDeepEqual(result.results[0].issues, ["INCORRECT_ALLERGEN:MILK"], "Incorrect allergen should be detected");
});

test("Incorrect dietary claim is detected", () => {
    const result = runAudit([
        {
            id: "F01",
            name: "Egg Rice",
            ingredients: ["egg", "rice"],
            claimedTags: ["VEGETARIAN", "VEGAN"],
            declaredAllergens: ["EGG"]
        }
    ]);
    assertDeepEqual(
        result.results[0].issues,
        ["INCORRECT_DIETARY_TAG:VEGETARIAN", "INCORRECT_DIETARY_TAG:VEGAN"],
        "Incorrect dietary claims should be detected"
    );
});

test("Multiple missing allergens are detected in exact order", () => {
    const result = runAudit([
        { id: "F01", name: "Egg Milk Peanut", ingredients: ["egg", "milk", "peanut"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertDeepEqual(
        result.results[0].issues,
        ["MISSING_ALLERGEN:EGG", "MISSING_ALLERGEN:MILK", "MISSING_ALLERGEN:PEANUT"],
        "Missing allergens should follow EGG, MILK, PEANUT order"
    );
});

test("Multiple incorrect allergens are detected in exact order", () => {
    const result = runAudit([
        { id: "F01", name: "Rice", ingredients: ["rice"], claimedTags: [], declaredAllergens: ["PEANUT", "MILK", "EGG"] }
    ]);
    assertDeepEqual(
        result.results[0].issues,
        ["INCORRECT_ALLERGEN:EGG", "INCORRECT_ALLERGEN:MILK", "INCORRECT_ALLERGEN:PEANUT"],
        "Incorrect allergens should follow EGG, MILK, PEANUT order"
    );
});

test("Missing and incorrect allergens are ordered correctly", () => {
    const result = runAudit([
        { id: "F01", name: "Egg Rice", ingredients: ["egg", "rice"], claimedTags: [], declaredAllergens: ["MILK"] }
    ]);
    assertDeepEqual(
        result.results[0].issues,
        ["MISSING_ALLERGEN:EGG", "INCORRECT_ALLERGEN:MILK"],
        "Missing allergens must appear before incorrect allergens"
    );
});

test("Dietary issues follow exact dietary ordering", () => {
    const result = runAudit([
        {
            id: "F01",
            name: "Egg Rice",
            ingredients: ["egg", "rice"],
            claimedTags: ["VEGAN", "VEGETARIAN"],
            declaredAllergens: ["EGG"]
        }
    ]);
    assertDeepEqual(
        result.results[0].issues,
        ["INCORRECT_DIETARY_TAG:VEGETARIAN", "INCORRECT_DIETARY_TAG:VEGAN"],
        "Dietary issues should follow VEGETARIAN, VEGAN order"
    );
});

test("Combined issues follow exact ordering", () => {
    const result = runAudit([
        {
            id: "F01",
            name: "Egg Rice",
            ingredients: ["egg", "rice"],
            claimedTags: ["VEGAN", "VEGETARIAN"],
            declaredAllergens: ["MILK"]
        }
    ]);
    assertDeepEqual(
        result.results[0].issues,
        [
            "INCORRECT_DIETARY_TAG:VEGETARIAN",
            "INCORRECT_DIETARY_TAG:VEGAN",
            "MISSING_ALLERGEN:EGG",
            "INCORRECT_ALLERGEN:MILK"
        ],
        "Combined issues should follow exact specification order"
    );
});

test("Product with no issues is classified CLEAN", () => {
    const result = runAudit([
        { id: "F01", name: "Egg Rice", ingredients: ["egg", "rice"], claimedTags: [], declaredAllergens: ["EGG"] }
    ]);
    assertEqual(result.results[0].status, "CLEAN", "Correctly declared product should be CLEAN");
});

test("Product with an issue is classified FAULTY", () => {
    const result = runAudit([
        { id: "F01", name: "Egg Rice", ingredients: ["egg", "rice"], claimedTags: ["VEGAN"], declaredAllergens: ["EGG"] }
    ]);
    assertEqual(result.results[0].status, "FAULTY", "Incorrect dietary claim should make product FAULTY");
});

test("Audit summary counts clean, faulty, and total issues correctly", () => {
    const result = runAudit([
        { id: "F01", name: "Clean Rice", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] },
        { id: "F02", name: "Faulty Egg", ingredients: ["egg"], claimedTags: ["VEGAN"], declaredAllergens: [] }
    ]);
    assertDeepEqual(
        result.summary,
        { clean: 1, faulty: 1, totalIssues: 2 },
        "Audit summary counts are incorrect"
    );
});

test("Validation failure prevents audit processing", () => {
    const result = runAudit([
        { id: "F01", name: "Invalid Product", ingredients: ["unknown"], claimedTags: [], declaredAllergens: [] }
    ]);
    assertEqual(result.valid, false, "Invalid data should fail validation");
    assertDeepEqual(result.results, [], "Invalid data must not produce audit results");
    assertDeepEqual(
        result.summary,
        { clean: 0, faulty: 0, totalIssues: 0 },
        "Invalid data must not produce audit summary counts"
    );
});

// ============================================
// 11. Product Ordering
// ============================================

test("Product source order is preserved", () => {
    const products = [
        { id: "F03", name: "Third", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] },
        { id: "F01", name: "First", ingredients: ["egg"], claimedTags: [], declaredAllergens: ["EGG"] },
        { id: "F02", name: "Second", ingredients: ["milk"], claimedTags: [], declaredAllergens: ["MILK"] }
    ];

    const result = runAudit(products);

    assertDeepEqual(
        result.results.map(result => result.productId),
        ["F03", "F01", "F02"],
        "Product source order must be preserved"
    );
});

test("Product ordering remains unchanged with arbitrary IDs", () => {
    const products = [
        { id: "Z99", name: "Last ID", ingredients: ["rice"], claimedTags: [], declaredAllergens: [] },
        { id: "A01", name: "First ID", ingredients: ["tomato"], claimedTags: [], declaredAllergens: [] },
        { id: "M50", name: "Middle ID", ingredients: ["milk"], claimedTags: [], declaredAllergens: [] }
    ];

    const result = runAudit(products);

    assertDeepEqual(
        result.results.map(result => result.productId),
        ["Z99", "A01", "M50"],
        "Audit must preserve source order rather than sort by ID"
    );
});



// Edge case: Product ID must start with F and contain digits.
test("Product ID must follow F plus digits format", () => {

    const invalidIds = [
        "",
        "   ",
        "F",
        "P01",
        "f01",
        "FABC",
        "F-1",
        "F 1",
        "1F",
        "F1A"
    ];

    for (const id of invalidIds) {

        const result = runAudit([
            {
                id,
                name: "Test",
                ingredients: ["rice"],
                claimedTags: [],
                declaredAllergens: []
            }
        ]);

        assertEqual(
            result.error,
            "INVALID_PRODUCT_ID",
            `"${id}" should be rejected as an invalid Product ID`
        );
    }
});


// Edge case: F followed by one or more digits is valid.
test("Valid Product IDs follow F plus digits format", () => {

    const validIds = [
        "F1",
        "F2",
        "F10",
        "F01",
        "F999"
    ];

    for (const id of validIds) {

        const result = runAudit([
            {
                id,
                name: "Test",
                ingredients: ["rice"],
                claimedTags: [],
                declaredAllergens: []
            }
        ]);

        assert(
            result.valid,
            `"${id}" should be accepted as a valid Product ID`
        );
    }
});
// ============================================
// Final Test Report
// ============================================

console.log("\n============================================");
console.log("TEST RESULTS");
console.log("============================================");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed === 0) {
    console.log("✓ ALL TESTS PASSED");
} else {
    console.error("✗ SOME TESTS FAILED");
}