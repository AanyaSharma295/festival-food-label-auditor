// ============================================
// Festival Food-Label Auditor
// Automated Domain Tests
// ============================================


// --------------------------------------------
// Test Helpers
// --------------------------------------------

let passed = 0;
let failed = 0;

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
        throw new Error(
            `${message}\nExpected: ${expected}\nReceived: ${actual}`
        );
    }
}

function assertDeepEqual(actual, expected, message) {
    const actualJSON = JSON.stringify(actual);
    const expectedJSON = JSON.stringify(expected);

    if (actualJSON !== expectedJSON) {
        throw new Error(
            `${message}\nExpected: ${expectedJSON}\nReceived: ${actualJSON}`
        );
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
// 1. Fixed Ingredient Rules
// ============================================

test("Fixed ingredient rules contain all required ingredients", () => {

    const expectedIngredients = [
        "rice",
        "tomato",
        "milk",
        "egg",
        "peanut"
    ];

    assertDeepEqual(
        Object.keys(INGREDIENT_RULES),
        expectedIngredients,
        "Ingredient rule table does not match specification"
    );
});


// ============================================
// 2. Dietary Derivation
// ============================================

test("Rice and tomato are vegetarian and vegan", () => {

    assertDeepEqual(
        deriveDietaryFacts(["rice", "tomato"]),
        {
            vegetarian: true,
            vegan: true
        },
        "Rice + tomato should be vegetarian and vegan"
    );
});


test("Egg makes a product non-vegetarian and non-vegan", () => {

    assertDeepEqual(
        deriveDietaryFacts(["egg", "tomato"]),
        {
            vegetarian: false,
            vegan: false
        },
        "Egg should make the product non-vegetarian and non-vegan"
    );
});


test("Milk is vegetarian but not vegan", () => {

    assertDeepEqual(
        deriveDietaryFacts(["milk"]),
        {
            vegetarian: true,
            vegan: false
        },
        "Milk should be vegetarian but not vegan"
    );
});


test("Duplicate ingredients do not affect dietary derivation", () => {

    assertDeepEqual(
        deriveDietaryFacts(["egg", "egg", "tomato"]),
        {
            vegetarian: false,
            vegan: false
        },
        "Duplicate ingredients should not change the derived facts"
    );
});


// ============================================
// 3. Allergen Derivation
// ============================================

test("Egg derives EGG allergen", () => {

    assertDeepEqual(
        deriveAllergens(["egg"]),
        ["EGG"],
        "Egg should derive EGG"
    );
});


test("Milk derives MILK allergen", () => {

    assertDeepEqual(
        deriveAllergens(["milk"]),
        ["MILK"],
        "Milk should derive MILK"
    );
});


test("Multiple allergens are combined", () => {

    assertDeepEqual(
        deriveAllergens(["egg", "milk"]),
        ["EGG", "MILK"],
        "Allergens should be combined"
    );
});


test("Duplicate ingredients do not duplicate allergens", () => {

    assertDeepEqual(
        deriveAllergens(["egg", "egg"]),
        ["EGG"],
        "Duplicate ingredients must not duplicate allergens"
    );
});


// ============================================
// 4. Built-in Sample Oracle
// ============================================

test("Built-in sample produces 2 clean, 2 faulty, 5 issues", () => {

    const result = runAudit(sampleProducts);

    assert(result.valid, "Sample dataset should be valid");

    assertDeepEqual(
        result.summary,
        {
            clean: 2,
            faulty: 2,
            totalIssues: 5
        },
        "Sample summary is incorrect"
    );
});


test("F01 is CLEAN", () => {

    const result = runAudit(sampleProducts);

    assertEqual(
        result.results[0].status,
        "CLEAN",
        "F01 should be clean"
    );

    assertDeepEqual(
        result.results[0].issues,
        [],
        "F01 should have no issues"
    );
});


test("F02 has exactly MISSING_ALLERGEN:PEANUT", () => {

    const result = runAudit(sampleProducts);

    assertDeepEqual(
        result.results[1].issues,
        [
            "MISSING_ALLERGEN:PEANUT"
        ],
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

    assertEqual(
        result.results[3].status,
        "CLEAN",
        "F04 should be clean"
    );
});


// ============================================
// 5. Corrected F02
// ============================================

test("Adding PEANUT to F02 makes it clean", () => {

    const products = structuredClone(sampleProducts);

    products[1].declaredAllergens.push("PEANUT");

    const result = runAudit(products);

    assertEqual(
        result.results[1].status,
        "CLEAN",
        "F02 should become clean"
    );

    assertDeepEqual(
        result.summary,
        {
            clean: 3,
            faulty: 1,
            totalIssues: 4
        },
        "Corrected F02 summary is incorrect"
    );
});


// ============================================
// 6. Empty Input
// ============================================

test("Empty product list is valid", () => {

    const result = runAudit([]);

    assert(result.valid, "Empty product list should be valid");

    assertDeepEqual(
        result.summary,
        {
            clean: 0,
            faulty: 0,
            totalIssues: 0
        },
        "Empty audit summary is incorrect"
    );

    assertDeepEqual(
        result.results,
        [],
        "Empty audit should have no results"
    );
});


// ============================================
// 7. Product ID Validation
// ============================================

test("Empty product ID is rejected", () => {

    const result = runAudit([
        {
            id: "",
            name: "Test",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: []
        }
    ]);

    assertEqual(
        result.error,
        "INVALID_PRODUCT_ID",
        "Empty product ID should be rejected"
    );
});


test("Whitespace-only product ID is rejected", () => {

    const result = runAudit([
        {
            id: "   ",
            name: "Test",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: []
        }
    ]);

    assertEqual(
        result.error,
        "INVALID_PRODUCT_ID",
        "Whitespace-only ID should be rejected"
    );
});


test("Duplicate product IDs are rejected", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Product A",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: []
        },
        {
            id: "F01",
            name: "Product B",
            ingredients: ["tomato"],
            claimedTags: [],
            declaredAllergens: []
        }
    ]);

    assertEqual(
        result.error,
        "DUPLICATE_PRODUCT_ID",
        "Duplicate product IDs should be rejected"
    );
});


// ============================================
// 8. Ingredient Validation
// ============================================

test("Unknown ingredient is rejected", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Test",
            ingredients: ["rice", "sesame"],
            claimedTags: [],
            declaredAllergens: []
        }
    ]);

    assertEqual(
        result.error,
        "UNKNOWN_INGREDIENT:sesame",
        "Unknown ingredient should be rejected"
    );
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
// 9. Claim Validation
// ============================================

test("VEGETARIAN is a valid claim", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Test",
            ingredients: ["rice"],
            claimedTags: ["VEGETARIAN"],
            declaredAllergens: []
        }
    ]);

    assert(result.valid, "VEGETARIAN should be valid");
});


test("VEGAN is a valid claim", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Test",
            ingredients: ["rice"],
            claimedTags: ["VEGAN"],
            declaredAllergens: []
        }
    ]);

    assert(result.valid, "VEGAN should be valid");
});


test("Unsupported dietary claim is rejected", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Test",
            ingredients: ["rice"],
            claimedTags: ["PESCATARIAN"],
            declaredAllergens: []
        }
    ]);

    assertEqual(
        result.error,
        "INVALID_CLAIM:PESCATARIAN",
        "Unsupported claim should be rejected"
    );
});


// ============================================
// 10. Allergen Validation
// ============================================

test("Unsupported allergen is rejected", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Test",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: ["SESAME"]
        }
    ]);

    assertEqual(
        result.error,
        "INVALID_CLAIM:SESAME",
        "Unsupported allergen should be rejected"
    );
});


// ============================================
// 11. Audit Logic
// ============================================

test("Unclaimed supported dietary property is not an issue", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Rice",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: []
        }
    ]);

    assertDeepEqual(
        result.results[0].issues,
        [],
        "Missing dietary claims should not create issues"
    );
});


test("Missing allergen is detected", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Egg Rice",
            ingredients: ["egg", "rice"],
            claimedTags: [],
            declaredAllergens: []
        }
    ]);

    assertDeepEqual(
        result.results[0].issues,
        [
            "MISSING_ALLERGEN:EGG"
        ],
        "Missing allergen should be detected"
    );
});


test("Incorrect allergen is detected", () => {

    const result = runAudit([
        {
            id: "F01",
            name: "Rice",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: ["MILK"]
        }
    ]);

    assertDeepEqual(
        result.results[0].issues,
        [
            "INCORRECT_ALLERGEN:MILK"
        ],
        "Incorrect allergen should be detected"
    );
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
        [
            "INCORRECT_DIETARY_TAG:VEGETARIAN",
            "INCORRECT_DIETARY_TAG:VEGAN"
        ],
        "Incorrect dietary claims should be detected"
    );
});


// ============================================
// 12. Product Ordering
// ============================================

test("Product source order is preserved", () => {

    const products = [
        {
            id: "F03",
            name: "Third",
            ingredients: ["rice"],
            claimedTags: [],
            declaredAllergens: []
        },
        {
            id: "F01",
            name: "First",
            ingredients: ["egg"],
            claimedTags: [],
            declaredAllergens: ["EGG"]
        },
        {
            id: "F02",
            name: "Second",
            ingredients: ["milk"],
            claimedTags: [],
            declaredAllergens: ["MILK"]
        }
    ];

    const result = runAudit(products);

    assertDeepEqual(
        result.results.map(result => result.productId),
        ["F03", "F01", "F02"],
        "Product source order must be preserved"
    );
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