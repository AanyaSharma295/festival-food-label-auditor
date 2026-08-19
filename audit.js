// ============================================
// Festival Food-Label Auditor
// Domain / Business Logic
// ============================================

// --------------------------------------------
// 1. Fixed Ingredient Rules
// --------------------------------------------

const INGREDIENT_RULES = Object.freeze({
    rice: Object.freeze({
        vegetarian: true,
        vegan: true,
        allergens: Object.freeze([])
    }),

    tomato: Object.freeze({
        vegetarian: true,
        vegan: true,
        allergens: Object.freeze([])
    }),

    milk: Object.freeze({
        vegetarian: true,
        vegan: false,
        allergens: Object.freeze(["MILK"])
    }),

    egg: Object.freeze({
        vegetarian: false,
        vegan: false,
        allergens: Object.freeze(["EGG"])
    }),

    peanut: Object.freeze({
        vegetarian: true,
        vegan: true,
        allergens: Object.freeze(["PEANUT"])
    })
});


// --------------------------------------------
// 2. Valid Tokens
// --------------------------------------------

const VALID_CLAIMS = Object.freeze([
    "VEGETARIAN",
    "VEGAN"
]);

const VALID_ALLERGENS = Object.freeze([
    "EGG",
    "MILK",
    "PEANUT"
]);


// --------------------------------------------
// 3. Validation
// --------------------------------------------

function validateProducts(products) {
    const seenIds = new Set();

    for (const product of products) {

        // Product ID
        const productId = String(product.id ?? "").trim();

        if (productId === "") {
            return {
                valid: false,
                error: "INVALID_PRODUCT_ID"
            };
        }

        if (seenIds.has(productId)) {
            return {
                valid: false,
                error: "DUPLICATE_PRODUCT_ID"
            };
        }

        seenIds.add(productId);


        // Ingredients
        for (const ingredient of product.ingredients) {
            const ingredientId = String(ingredient).trim();

            if (!INGREDIENT_RULES[ingredientId]) {
                return {
                    valid: false,
                    error: `UNKNOWN_INGREDIENT:${ingredientId}`
                };
            }
        }


        // Dietary claims
        for (const claim of product.claimedTags) {
            const tag = String(claim).trim();

            if (!VALID_CLAIMS.includes(tag)) {
                return {
                    valid: false,
                    error: `INVALID_CLAIM:${tag}`
                };
            }
        }


        // Declared allergens
        for (const allergen of product.declaredAllergens) {
            const value = String(allergen).trim();

            if (!VALID_ALLERGENS.includes(value)) {
                return {
                    valid: false,
                    error: `INVALID_CLAIM:${value}`
                };
            }
        }
    }

    return {
        valid: true,
        error: null
    };
}


// --------------------------------------------
// 4. Dietary Fact Derivation
// --------------------------------------------

function deriveDietaryFacts(ingredients) {
    let vegetarian = true;
    let vegan = true;

    const seenIngredients = new Set();

    for (const ingredient of ingredients) {
        const ingredientId = String(ingredient).trim();

        // Repeated ingredients must not affect
        // the result more than once.
        if (seenIngredients.has(ingredientId)) {
            continue;
        }

        seenIngredients.add(ingredientId);

        const rule = INGREDIENT_RULES[ingredientId];

        if (!rule.vegetarian) {
            vegetarian = false;
        }

        if (!rule.vegan) {
            vegan = false;
        }
    }

    return {
        vegetarian,
        vegan
    };
}


// --------------------------------------------
// 5. Allergen Derivation
// --------------------------------------------

function deriveAllergens(ingredients) {
    const derivedAllergens = new Set();

    for (const ingredient of ingredients) {
        const ingredientId = String(ingredient).trim();
        const rule = INGREDIENT_RULES[ingredientId];

        for (const allergen of rule.allergens) {
            derivedAllergens.add(allergen);
        }
    }

    return Array.from(derivedAllergens);
}


// --------------------------------------------
// 6. Issue Ordering
// --------------------------------------------

const DIETARY_ORDER = Object.freeze([
    "VEGETARIAN",
    "VEGAN"
]);

const ALLERGEN_ORDER = Object.freeze([
    "EGG",
    "MILK",
    "PEANUT"
]);


// --------------------------------------------
// 7. Audit One Product
// --------------------------------------------

function auditProduct(product) {
    const facts = deriveDietaryFacts(product.ingredients);
    const derivedAllergens = deriveAllergens(product.ingredients);

    const issues = [];


    // Dietary issues
    for (const tag of DIETARY_ORDER) {

        if (!product.claimedTags.includes(tag)) {
            continue;
        }

        const supported =
            tag === "VEGETARIAN"
                ? facts.vegetarian
                : facts.vegan;

        if (!supported) {
            issues.push(`INCORRECT_DIETARY_TAG:${tag}`);
        }
    }


    // Missing allergens
    for (const allergen of ALLERGEN_ORDER) {

        if (
            derivedAllergens.includes(allergen) &&
            !product.declaredAllergens.includes(allergen)
        ) {
            issues.push(`MISSING_ALLERGEN:${allergen}`);
        }
    }


    // Incorrect allergens
    for (const allergen of ALLERGEN_ORDER) {

        if (
            product.declaredAllergens.includes(allergen) &&
            !derivedAllergens.includes(allergen)
        ) {
            issues.push(`INCORRECT_ALLERGEN:${allergen}`);
        }
    }


    return {
        productId: product.id,
        status: issues.length === 0 ? "CLEAN" : "FAULTY",
        issues
    };
}


// --------------------------------------------
// 8. Audit Complete Dataset
// --------------------------------------------

function runAudit(products) {

    // Validation must happen before
    // any audit processing.
    const validation = validateProducts(products);

    if (!validation.valid) {
        return {
            valid: false,
            error: validation.error,
            results: [],
            summary: {
                clean: 0,
                faulty: 0,
                totalIssues: 0
            }
        };
    }


    const results = products.map(product =>
        auditProduct(product)
    );


    // Summary is based on the complete
    // audit, not any UI filtering.
    let clean = 0;
    let faulty = 0;
    let totalIssues = 0;

    for (const result of results) {

        if (result.status === "CLEAN") {
            clean++;
        } else {
            faulty++;
        }

        totalIssues += result.issues.length;
    }


    return {
        valid: true,
        error: null,
        results,
        summary: {
            clean,
            faulty,
            totalIssues
        }
    };
}