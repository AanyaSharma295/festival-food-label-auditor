// ============================================
// Festival Food-Label Auditor
// Application / UI Logic
// ============================================


// ============================================
// 1. Application State
// ============================================

let products = [];

let auditResult = null;

let dataChangedSinceAudit = false;

let filter = "ALL";

// Existing product currently being edited.
// null means no existing product is being edited.
let editingIndex = null;

// Temporary copy of the existing product
// currently being edited.
let editDraft = null;


// ============================================
// 2. DOM References
// ============================================

const productTableBody =
    document.getElementById("product-table-body");

const emptyProducts =
    document.getElementById("empty-products");

const productCount =
    document.getElementById("product-count");

const addProductButton =
    document.getElementById("add-product-button");

const loadSampleButton =
    document.getElementById("load-sample-button");

const clearAllButton =
    document.getElementById("clear-all-button");

const computeAuditButton =
    document.getElementById("compute-audit-button");

const dataChangeBanner =
    document.getElementById("data-change-banner");

const validationError =
    document.getElementById("validation-error");

const validationErrorMessage =
    document.getElementById("validation-error-message");

const summaryClean =
    document.getElementById("summary-clean");

const summaryFaulty =
    document.getElementById("summary-faulty");

const summaryIssues =
    document.getElementById("summary-issues");

const auditSummary =
    document.getElementById("audit-summary");

const noAuditState =
    document.getElementById("no-audit-state");

const auditResults =
    document.getElementById("audit-results");

const noResultsState =
    document.getElementById("no-results-state");

const filterAllButton =
    document.getElementById("filter-all-button");

const filterFaultyButton =
    document.getElementById("filter-faulty-button");


// ============================================
// 3. Sample Dataset
// ============================================

const SAMPLE_PRODUCTS = [
    {
        id: "F01",
        name: "Lemon Rice",
        ingredients: ["rice", "tomato"],
        claimedTags: ["VEGETARIAN", "VEGAN"],
        declaredAllergens: [],
        isNew: false
    },

    {
        id: "F02",
        name: "Peanut Chaat",
        ingredients: ["peanut", "tomato"],
        claimedTags: ["VEGETARIAN", "VEGAN"],
        declaredAllergens: [],
        isNew: false
    },

    {
        id: "F03",
        name: "Egg Roll",
        ingredients: ["egg", "tomato"],
        claimedTags: ["VEGETARIAN", "VEGAN"],
        declaredAllergens: ["MILK"],
        isNew: false
    },

    {
        id: "F04",
        name: "Milk Rice",
        ingredients: ["milk", "rice"],
        claimedTags: ["VEGETARIAN"],
        declaredAllergens: ["MILK"],
        isNew: false
    }
];


// ============================================
// 4. Utility Functions
// ============================================

function cloneProduct(product) {

    return {
        id: product.id,
        name: product.name,
        ingredients: [...product.ingredients],
        claimedTags: [...product.claimedTags],
        declaredAllergens: [...product.declaredAllergens],
        isNew: Boolean(product.isNew)
    };
}


function cloneProducts(source) {

    return source.map(product => ({
        id: product.id,
        name: product.name,
        ingredients: [...product.ingredients],
        claimedTags: [...product.claimedTags],
        declaredAllergens: [...product.declaredAllergens],
        isNew: false
    }));
}


function markDataChanged() {

    dataChangedSinceAudit = true;

    updateDataChangeBanner();
}


function updateDataChangeBanner() {

    dataChangeBanner.hidden =
        !dataChangedSinceAudit;
}


function clearValidationError() {

    validationError.hidden = true;

    validationErrorMessage.textContent = "";
}


function showValidationError(message) {

    validationErrorMessage.textContent =
        message;

    validationError.hidden = false;
}


function clearAuditOutput() {

    auditResult = null;

    summaryClean.textContent = "0";

    summaryFaulty.textContent = "0";

    summaryIssues.textContent = "0";

    auditSummary.hidden = true;

    noAuditState.hidden = false;

    auditResults.innerHTML = "";

    noResultsState.hidden = false;
}


// ============================================
// 5. Product Count
// ============================================

function updateProductCount() {

    const count = products.length;

    productCount.textContent =
        `${String(count).padStart(2, "0")} PRODUCTS`;
}


// ============================================
// 6. Main Product Rendering
// ============================================

function renderProducts() {

    productTableBody.innerHTML = "";

    emptyProducts.hidden =
        products.length !== 0;


    for (
        let index = 0;
        index < products.length;
        index++
    ) {

        const product =
            products[index];

        let row;


        // Existing product currently being edited.
        if (
            editingIndex === index &&
            editDraft !== null
        ) {

            row =
                createEditProductRow(
                    editDraft,
                    index
                );
        }

        // Newly added product.
        else if (product.isNew) {

            row =
                createNewProductRow(
                    product,
                    index
                );
        }

        // Normal existing product.
        else {

            row =
                createReadOnlyProductRow(
                    product,
                    index
                );
        }


        productTableBody.appendChild(row);
    }


    attachProductListeners();

    updateProductCount();
}


// ============================================
// 7. Read-Only Existing Product Row
// ============================================

function createReadOnlyProductRow(
    product,
    index
) {

    const row =
        document.createElement("tr");

    row.dataset.index = index;


    row.innerHTML = `
        <td>
            <span class="product-id">
                ${escapeHTML(product.id)}
            </span>
        </td>

        <td>
            <span class="product-name">
                ${escapeHTML(product.name || "—")}
            </span>
        </td>

        <td>
            ${renderReadOnlyTags(
                product.ingredients
            )}
        </td>

        <td>
            ${renderReadOnlyTags(
                product.claimedTags
            )}
        </td>

        <td>
            ${renderReadOnlyTags(
                product.declaredAllergens
            )}
        </td>

        <td>
            <div class="product-actions">

                <button
                    type="button"
                    class="table-action-button edit-button"
                    data-index="${index}"
                >
                    EDIT
                </button>

                <button
                    type="button"
                    class="table-action-button delete-button"
                    data-index="${index}"
                >
                    DELETE
                </button>

            </div>
        </td>
    `;


    return row;
}


// ============================================
// 8. New Product Row
// ============================================

function createNewProductRow(
    product,
    index
) {

    const row =
        document.createElement("tr");

    row.dataset.index = index;


    row.innerHTML = `
        <td>
    <input
        type="text"
        class="edit-text-input new-product-id"
        data-index="${index}"
        value="${escapeHTML(product.id)}"
        placeholder="F01"
        aria-label="Product ID"
        pattern="F[0-9]+"
        title="Product ID must be F followed by one or more digits, e.g. F01"
        autocomplete="off"
    >
</td>

        <td>
            <input
                type="text"
                class="edit-text-input new-product-name"
                data-index="${index}"
                value="${escapeHTML(product.name)}"
                placeholder="Product name"
                aria-label="Product name"
            >
        </td>

        <td>
            ${renderChips(
                product.ingredients,
                "ingredient",
                index
            )}

            ${createTagInputHTML(
                "ingredient",
                index
            )}
        </td>

        <td>
            ${renderChips(
                product.claimedTags,
                "claim",
                index
            )}

            ${createTagInputHTML(
                "claim",
                index
            )}
        </td>

        <td>
            ${renderChips(
                product.declaredAllergens,
                "allergen",
                index
            )}

            ${createTagInputHTML(
                "allergen",
                index
            )}
        </td>

        <td>
            <div class="product-actions">

                <button
                    type="button"
                    class="table-action-button delete-button"
                    data-index="${index}"
                >
                    DELETE
                </button>

            </div>
        </td>
    `;


    return row;
}


// ============================================
// 9. Existing Product Edit Row
// ============================================

function createEditProductRow(
    product,
    index
) {

    const row =
        document.createElement("tr");

    row.dataset.index = index;


    row.innerHTML = `
        <td>
            <input
            type="text"
            class="edit-text-input edit-product-id"
            data-index="${index}"
            value="${escapeHTML(product.id)}"
            aria-label="Product ID"
            pattern="F[0-9]+"
            title="Product ID must be F followed by one or more digits, e.g. F01"
            autocomplete="off"
            >
        </td>

        <td>
            <input
                type="text"
                class="edit-text-input edit-product-name"
                data-index="${index}"
                value="${escapeHTML(product.name)}"
                aria-label="Product name"
            >
        </td>

        <td>
            ${renderChips(
                product.ingredients,
                "ingredient",
                index
            )}

            ${createTagInputHTML(
                "ingredient",
                index
            )}
        </td>

        <td>
            ${renderChips(
                product.claimedTags,
                "claim",
                index
            )}

            ${createTagInputHTML(
                "claim",
                index
            )}
        </td>

        <td>
            ${renderChips(
                product.declaredAllergens,
                "allergen",
                index
            )}

            ${createTagInputHTML(
                "allergen",
                index
            )}
        </td>

        <td>
            <div class="product-actions">

                <button
                    type="button"
                    class="table-action-button save-button"
                    data-index="${index}"
                >
                    SAVE
                </button>

                <button
                    type="button"
                    class="table-action-button cancel-button"
                    data-index="${index}"
                >
                    CANCEL
                </button>

            </div>
        </td>
    `;


    return row;
}


// ============================================
// 10. Read-Only Tags
// ============================================

function renderReadOnlyTags(values) {

    if (values.length === 0) {

        return `
            <span class="empty-cell">
                —
            </span>
        `;
    }


    return `
        <div class="readonly-tags">

            ${values.map(value => `
                <span class="readonly-tag">
                    ${escapeHTML(value)}
                </span>
            `).join("")}

        </div>
    `;
}


// ============================================
// 11. HTML Escaping
// ============================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================
// 12. Editable Chips
// ============================================

function renderChips(
    values,
    type,
    productIndex
) {

    if (values.length === 0) {
        return "";
    }


    return `
        <div class="chip-container">

            ${values.map(
                (value, valueIndex) => `
                    <span class="tag-chip">

                        <span>
                            ${escapeHTML(value)}
                        </span>

                        <button
                            type="button"
                            class="chip-remove"
                            data-type="${type}"
                            data-product-index="${productIndex}"
                            data-value-index="${valueIndex}"
                            aria-label="Remove ${escapeHTML(value)}"
                        >
                            ×
                        </button>

                    </span>
                `
            ).join("")}

        </div>
    `;
}


// ============================================
// 13. Reusable Tag Input
// ============================================

function createTagInputHTML(
    type,
    productIndex
) {

    let listId =
        "ingredient-options";

    let placeholder =
        "Type ingredient and press Enter...";

    let normalize =
        "lowercase";


    if (type === "claim") {

        listId =
            "claim-options";

        placeholder =
            "Type claim and press Enter...";

        normalize =
            "uppercase";
    }


    if (type === "allergen") {

        listId =
            "allergen-options";

        placeholder =
            "Type allergen and press Enter...";

        normalize =
            "uppercase";
    }


    return `
        <div class="tag-input">

            <input
                type="text"
                class="tag-input-field"
                data-type="${type}"
                data-product-index="${productIndex}"
                data-normalize="${normalize}"
                list="${listId}"
                placeholder="${placeholder}"
                autocomplete="off"
            >

        </div>
    `;
}


// ============================================
// 14. Attach Event Listeners
// ============================================

function attachProductListeners() {


    // ----------------------------------------
    // New Product ID
    // ----------------------------------------

    const newProductIdInputs =
        document.querySelectorAll(
            ".new-product-id"
        );


    newProductIdInputs.forEach(input => {

        input.addEventListener(
            "input",
            () => {

                const index =
                    Number(input.dataset.index);

                const product =
                    products[index];


                if (!product) {
                    return;
                }


                product.id =
                    input.value;

                markDataChanged();
            }
        );
    });


    // ----------------------------------------
    // New Product Name
    // ----------------------------------------

    const newProductNameInputs =
        document.querySelectorAll(
            ".new-product-name"
        );


    newProductNameInputs.forEach(input => {

        input.addEventListener(
            "input",
            () => {

                const index =
                    Number(input.dataset.index);

                const product =
                    products[index];


                if (!product) {
                    return;
                }


                // Store immediately so a re-render
                // does not lose the name.
                product.name =
                    input.value;

                markDataChanged();
            }
        );
    });


    // ----------------------------------------
    // Existing Edit: ID
    // ----------------------------------------

    const editIdInputs =
        document.querySelectorAll(
            ".edit-product-id"
        );


    editIdInputs.forEach(input => {

        input.addEventListener(
            "input",
            () => {

                if (!editDraft) {
                    return;
                }


                editDraft.id =
                    input.value;
            }
        );
    });


    // ----------------------------------------
    // Existing Edit: Name
    // ----------------------------------------

    const editNameInputs =
        document.querySelectorAll(
            ".edit-product-name"
        );


    editNameInputs.forEach(input => {

        input.addEventListener(
            "input",
            () => {

                if (!editDraft) {
                    return;
                }


                editDraft.name =
                    input.value;
            }
        );
    });


    // ----------------------------------------
    // Tag Inputs
    // ----------------------------------------

    const inputs =
        document.querySelectorAll(
            ".tag-input-field"
        );


    inputs.forEach(input => {

        input.addEventListener(
            "keydown",
            event => {

                if (event.key !== "Enter") {
                    return;
                }


                event.preventDefault();

                addChipFromInput(input);
            }
        );
    });


    // ----------------------------------------
    // Remove Chips
    // ----------------------------------------

    const removeButtons =
        document.querySelectorAll(
            ".chip-remove"
        );


    removeButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const productIndex =
                    Number(
                        button.dataset.productIndex
                    );

                const valueIndex =
                    Number(
                        button.dataset.valueIndex
                    );

                const type =
                    button.dataset.type;


                removeChip(
                    productIndex,
                    type,
                    valueIndex
                );
            }
        );
    });


    // ----------------------------------------
    // Edit Buttons
    // ----------------------------------------

    const editButtons =
        document.querySelectorAll(
            ".edit-button"
        );


    editButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const index =
                    Number(button.dataset.index);

                editProduct(index);
            }
        );
    });


    // ----------------------------------------
    // Delete Buttons
    // ----------------------------------------

    const deleteButtons =
        document.querySelectorAll(
            ".delete-button"
        );


    deleteButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const index =
                    Number(button.dataset.index);

                deleteProduct(index);
            }
        );
    });


    // ----------------------------------------
    // Save Buttons
    // ----------------------------------------

    const saveButtons =
        document.querySelectorAll(
            ".save-button"
        );


    saveButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const index =
                    Number(button.dataset.index);

                saveEditedProduct(index);
            }
        );
    });


    // ----------------------------------------
    // Cancel Buttons
    // ----------------------------------------

    const cancelButtons =
        document.querySelectorAll(
            ".cancel-button"
        );


    cancelButtons.forEach(button => {

        button.addEventListener(
            "click",
            cancelEdit
        );
    });
}


// ============================================
// 15. Get Editable Product
// ============================================

function getEditableProduct(index) {

    if (
        editingIndex === index &&
        editDraft !== null
    ) {

        return editDraft;
    }


    return products[index];
}


// ============================================
// 16. Add Chip
// ============================================

function addChipFromInput(input) {

    let value =
        input.value.trim();


    if (value === "") {
        return;
    }


    const productIndex =
        Number(
            input.dataset.productIndex
        );

    const type =
        input.dataset.type;

    const normalize =
        input.dataset.normalize;


    // ----------------------------------------
    // Normalize
    // ----------------------------------------

    if (normalize === "lowercase") {

        value =
            value.toLowerCase();
    }


    if (normalize === "uppercase") {

        value =
            value.toUpperCase();
    }


    // ----------------------------------------
    // Get Correct Product
    // ----------------------------------------

    const product =
        getEditableProduct(
            productIndex
        );


    if (!product) {
        return;
    }


    let targetArray =
        product.ingredients;


    if (type === "claim") {

        targetArray =
            product.claimedTags;
    }


    if (type === "allergen") {

        targetArray =
            product.declaredAllergens;
    }


    // ----------------------------------------
    // Duplicate Prevention
    // ----------------------------------------

    if (targetArray.includes(value)) {

        input.value = "";

        input.focus();

        return;
    }


    targetArray.push(value);

    input.value = "";


    // ----------------------------------------
    // Existing Product Edit
    // ----------------------------------------

    if (
        editingIndex === productIndex &&
        editDraft !== null
    ) {

        renderProducts();

        restoreTagInputFocus(
            type,
            productIndex
        );

        return;
    }


    // ----------------------------------------
    // New Product
    // ----------------------------------------

    markDataChanged();

    renderProducts();

    restoreTagInputFocus(
        type,
        productIndex
    );
}


// ============================================
// 17. Restore Tag Input Focus
// ============================================

function restoreTagInputFocus(
    type,
    productIndex
) {

    const selector =
        `.tag-input-field[data-type="${type}"][data-product-index="${productIndex}"]`;


    const newInput =
        document.querySelector(
            selector
        );


    if (newInput) {
        newInput.focus();
    }
}


// ============================================
// 18. Remove Chip
// ============================================

function removeChip(
    productIndex,
    type,
    valueIndex
) {

    const product =
        getEditableProduct(
            productIndex
        );


    if (!product) {
        return;
    }


    let targetArray =
        product.ingredients;


    if (type === "claim") {

        targetArray =
            product.claimedTags;
    }


    if (type === "allergen") {

        targetArray =
            product.declaredAllergens;
    }


    if (
        valueIndex < 0 ||
        valueIndex >= targetArray.length
    ) {
        return;
    }


    targetArray.splice(
        valueIndex,
        1
    );


    // Existing product edit:
    // modification is still only in the draft.
    if (
        editingIndex === productIndex &&
        editDraft !== null
    ) {

        renderProducts();

        return;
    }


    // New product:
    // modification is immediately real.
    markDataChanged();

    renderProducts();
}


// ============================================
// 19. Add New Product
// ============================================

function addProduct() {

    // Don't create a new product while an
    // existing product is being edited.
    if (editingIndex !== null) {
        return;
    }


    // Product ID is intentionally empty.
    // The user must provide their own ID.
    // Validation happens when Compute Audit
    // is pressed.
    products.push({

        id: "",

        name: "",

        ingredients: [],

        claimedTags: [],

        declaredAllergens: [],

        isNew: true
    });


    const newIndex =
        products.length - 1;


    markDataChanged();

    renderProducts();


    // Focus the Product ID field first.
    // The user enters the ID before the name
    // and the remaining product data.
    const idInput =
        document.querySelector(
            `.new-product-id[data-index="${newIndex}"]`
        );


    if (idInput) {
        idInput.focus();
    }
}


// ============================================
// 20. Edit Existing Product
// ============================================

function editProduct(index) {

    if (!products[index]) {
        return;
    }


    // Don't start another edit while one
    // already exists.
    if (editingIndex !== null) {
        return;
    }


    // New products are already directly editable.
    if (products[index].isNew) {
        return;
    }


    editingIndex =
        index;


    editDraft =
        cloneProduct(
            products[index]
        );


    editDraft.isNew =
        false;


    renderProducts();
}


// ============================================
// 21. Save Existing Product
// ============================================

function saveEditedProduct(index) {

    if (
        editingIndex !== index ||
        editDraft === null
    ) {
        return;
    }


    // Commit the entire draft at once.
    products[index] =
        cloneProduct(
            editDraft
        );


    products[index].isNew =
        false;


    editingIndex =
        null;

    editDraft =
        null;


    markDataChanged();

    renderProducts();
}


// ============================================
// 22. Cancel Existing Product Edit
// ============================================

function cancelEdit() {

    if (
        editingIndex === null ||
        editDraft === null
    ) {
        return;
    }


    // Discard the temporary draft.
    editingIndex =
        null;

    editDraft =
        null;


    renderProducts();
}


// ============================================
// 23. Delete Product
// ============================================

function deleteProduct(index) {

    if (!products[index]) {
        return;
    }


    // If deleting the currently edited row.
    if (editingIndex === index) {

        editingIndex =
            null;

        editDraft =
            null;
    }


    // If deleting something before the row
    // currently being edited, shift its index.
    else if (
        editingIndex !== null &&
        index < editingIndex
    ) {

        editingIndex--;
    }


    products.splice(
        index,
        1
    );


    markDataChanged();

    renderProducts();
}


// ============================================
// 24. Load Sample
// ============================================

function loadSample() {

    editingIndex =
        null;

    editDraft =
        null;


    products =
        cloneProducts(
            SAMPLE_PRODUCTS
        );


    clearValidationError();

    clearAuditOutput();

    markDataChanged();

    renderProducts();

    updateDataChangeBanner();
}


// ============================================
// 25. Clear All
// ============================================

function clearAll() {

    const hasMeaningfulData =
        products.length > 0 ||
        auditResult !== null;


    if (hasMeaningfulData) {

        const confirmed =
            window.confirm(
                "Clear all product data and audit results?"
            );


        if (!confirmed) {
            return;
        }
    }


    products = [];

    auditResult = null;

    dataChangedSinceAudit =
        false;

    filter =
        "ALL";

    editingIndex =
        null;

    editDraft =
        null;


    clearValidationError();

    clearAuditOutput();

    renderProducts();

    updateFilterButtons();

    updateDataChangeBanner();
}


// ============================================
// 26. Compute Audit
// ============================================

function computeAudit() {

    clearValidationError();


    // ----------------------------------------
    // Run Audit
    // ----------------------------------------

    const result =
        runAudit(products);


    // ----------------------------------------
    // Validation Failure
    // ----------------------------------------

    if (!result.valid) {

        // Completely remove any previous
        // audit summary and results.
        clearAuditOutput();


        // Keep the current product data visible.
        // New products remain editable.
        showValidationError(
            formatValidationError(
                result.error
            )
        );


        // IMPORTANT:
        // Failed validation does NOT reset
        // dataChangedSinceAudit.
        updateDataChangeBanner();


        return;
    }


    // ----------------------------------------
    // Successful Audit
    // ----------------------------------------

    // Once the data successfully passes
    // validation, every new product becomes
    // a normal existing product.
    products.forEach(product => {

        product.isNew =
            false;
    });


    auditResult =
        result;


    dataChangedSinceAudit =
        false;


    clearValidationError();


    // Re-render BEFORE showing results so that
    // new products become clean read-only rows.
    renderProducts();


    renderAuditSummary();

    renderAuditResults();

    updateDataChangeBanner();
}


// ============================================
// 27. Format Validation Errors
// ============================================

function formatValidationError(error) {

    const separatorIndex =
        error.indexOf(":");


    if (separatorIndex === -1) {
        return error;
    }


    const code =
        error.substring(
            0,
            separatorIndex
        );


    const value =
        error.substring(
            separatorIndex + 1
        );


    if (
        code === "UNKNOWN_INGREDIENT"
    ) {

        return `Unknown ingredient "${value}".`;
    }


    if (
        code === "INVALID_CLAIM"
    ) {

        return `Invalid claim or allergen "${value}".`;
    }


    if (
        code === "DUPLICATE_PRODUCT_ID"
    ) {

        return `Duplicate product ID "${value}".`;
    }


    if (
    code === "INVALID_PRODUCT_ID"
    ) {

    return "Invalid Product ID. Use the format F followed by one or more digits, e.g. F01.";
    }


    return error;
}


// ============================================
// 28. Render Audit Summary
// ============================================

function renderAuditSummary() {

    if (!auditResult) {
        return;
    }


    summaryClean.textContent =
        String(
            auditResult.summary.clean
        ).padStart(2, "0");


    summaryFaulty.textContent =
        String(
            auditResult.summary.faulty
        ).padStart(2, "0");


    summaryIssues.textContent =
        String(
            auditResult.summary.totalIssues
        ).padStart(2, "0");


    auditSummary.hidden =
        false;


    noAuditState.hidden =
        true;
}


// ============================================
// 29. Render Audit Results
// ============================================

function renderAuditResults() {

    auditResults.innerHTML = "";


    if (!auditResult) {

        noResultsState.hidden =
            false;

        return;
    }


    let results =
        auditResult.results;


    // ----------------------------------------
    // Faulty Filter
    // ----------------------------------------

    if (filter === "FAULTY") {

        results =
            results.filter(
                result =>
                    result.status === "FAULTY"
            );
    }


    // ----------------------------------------
    // No Results
    // ----------------------------------------

    if (results.length === 0) {

        noResultsState.hidden =
            false;

        return;
    }


    noResultsState.hidden =
        true;


    // ----------------------------------------
    // Render Results
    // ----------------------------------------

    results.forEach(result => {

        const product =
            products.find(
                item =>
                    item.id === result.productId
            );


        if (!product) {
            return;
        }


        const resultElement =
            document.createElement(
                "article"
            );


        resultElement.className =
            "audit-result";


        const statusClass =
            result.status === "CLEAN"
                ? "clean"
                : "faulty";


        let detailsHTML =
            "";


        if (
            result.status === "CLEAN"
        ) {

            detailsHTML = `
                <p class="no-issues">
                    No issues found.
                </p>
            `;

        } else {

            detailsHTML = `
                <ul class="issue-list">

                    ${result.issues.map(
                        issue => `
                            <li>
                                ${escapeHTML(issue)}
                            </li>
                        `
                    ).join("")}

                </ul>
            `;
        }


        resultElement.innerHTML = `

            <div>

                <h3 class="audit-result-product">
                    ${escapeHTML(
                        product.name ||
                        "Unnamed Product"
                    )}
                </h3>

                <p class="audit-result-id">
                    ${escapeHTML(
                        result.productId
                    )}
                </p>

            </div>

            <div
                class="audit-result-status ${statusClass}"
            >
                ${result.status}
            </div>

            <div class="audit-result-details">
                ${detailsHTML}
            </div>
        `;


        auditResults.appendChild(
            resultElement
        );
    });
}


// ============================================
// 30. Result Filtering
// ============================================

function setFilter(newFilter) {

    filter =
        newFilter;


    updateFilterButtons();

    renderAuditResults();
}


function updateFilterButtons() {

    const allActive =
        filter === "ALL";


    const faultyActive =
        filter === "FAULTY";


    filterAllButton.classList.toggle(
        "active",
        allActive
    );


    filterFaultyButton.classList.toggle(
        "active",
        faultyActive
    );


    filterAllButton.setAttribute(
        "aria-pressed",
        String(allActive)
    );


    filterFaultyButton.setAttribute(
        "aria-pressed",
        String(faultyActive)
    );
}


// ============================================
// 31. Button Events
// ============================================

addProductButton.addEventListener(
    "click",
    addProduct
);


loadSampleButton.addEventListener(
    "click",
    loadSample
);


clearAllButton.addEventListener(
    "click",
    clearAll
);


computeAuditButton.addEventListener(
    "click",
    computeAudit
);


filterAllButton.addEventListener(
    "click",
    () => setFilter("ALL")
);


filterFaultyButton.addEventListener(
    "click",
    () => setFilter("FAULTY")
);


// ============================================
// 32. Initial Render
// ============================================

function initializeApp() {

    products = [];

    auditResult = null;

    dataChangedSinceAudit =
        false;

    filter =
        "ALL";

    editingIndex =
        null;

    editDraft =
        null;


    clearValidationError();

    clearAuditOutput();

    renderProducts();

    updateFilterButtons();

    updateDataChangeBanner();
}


initializeApp();