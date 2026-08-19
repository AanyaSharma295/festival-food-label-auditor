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

// Existing-product edit state.
// Only one existing row can be edited at a time.
let editingIndex = null;

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
    dataChangeBanner.hidden = !dataChangedSinceAudit;
}


function clearValidationError() {
    validationError.hidden = true;
    validationErrorMessage.textContent = "";
}


function showValidationError(message) {
    validationErrorMessage.textContent = message;
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


function getProductForInput(index) {

    if (
        editingIndex === index &&
        editDraft !== null
    ) {
        return editDraft;
    }

    return products[index];
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
// 6. Product Table Rendering
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

        const product = products[index];

        let row;


        if (
            editingIndex === index &&
            editDraft !== null
        ) {
            row = createEditProductRow(
                editDraft,
                index
            );
        } else {
            row = createProductRow(
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
// 7. New / Normal Product Row
// ============================================

function createProductRow(product, index) {

    const row =
        document.createElement("tr");

    row.dataset.index = index;


    // ----------------------------------------
    // Newly Added Product
    // ----------------------------------------

    if (product.isNew) {

        row.innerHTML = `
            <td>
                <input
                    type="text"
                    class="edit-text-input new-product-id"
                    data-index="${index}"
                    value="${escapeHTML(product.id)}"
                    aria-label="Product ID"
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


    // ----------------------------------------
    // Existing Product
    // ----------------------------------------

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
// 8. Existing Product Edit Row
// ============================================

function createEditProductRow(product, index) {

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
// 9. HTML Escaping
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
// 10. Chip Rendering
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

            ${values.map((value, valueIndex) => `
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
            `).join("")}

        </div>
    `;
}


// ============================================
// 11. Reusable Tag Input
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
// 12. Product Event Listeners
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
                    input.value.trim();

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

                // Store immediately so future
                // renderProducts() calls preserve it.
                product.name =
                    input.value;

                markDataChanged();
            }
        );
    });


    // ----------------------------------------
    // Existing Product Edit - ID
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
                    input.value.trim();
            }
        );
    });


    // ----------------------------------------
    // Existing Product Edit - Name
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

                const productIndex =
                    Number(button.dataset.index);

                editProduct(productIndex);
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

                const productIndex =
                    Number(button.dataset.index);

                deleteProduct(productIndex);
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

                const productIndex =
                    Number(button.dataset.index);

                saveEditedProduct(
                    productIndex
                );
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
            () => {

                cancelEdit();
            }
        );
    });
}


// ============================================
// 13. Add Chip
// ============================================

function addChipFromInput(input) {

    let value =
        input.value.trim();

    if (value === "") {
        return;
    }


    const productIndex =
        Number(input.dataset.productIndex);

    const type =
        input.dataset.type;

    const normalize =
        input.dataset.normalize;


    // ----------------------------------------
    // Normalize
    // ----------------------------------------

    if (normalize === "lowercase") {
        value = value.toLowerCase();
    }

    if (normalize === "uppercase") {
        value = value.toUpperCase();
    }


    // ----------------------------------------
    // Get Correct Product
    // ----------------------------------------

    const product =
        getProductForInput(productIndex);

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


    // Existing-product edits are still
    // temporary until SAVE.
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


    // New product / normal live editing.
    markDataChanged();

    renderProducts();

    restoreTagInputFocus(
        type,
        productIndex
    );
}


// ============================================
// 14. Restore Tag Input Focus
// ============================================

function restoreTagInputFocus(
    type,
    productIndex
) {

    const selector =
        `.tag-input-field[data-type="${type}"][data-product-index="${productIndex}"]`;

    const newInput =
        document.querySelector(selector);

    if (newInput) {
        newInput.focus();
    }
}


// ============================================
// 15. Remove Chip
// ============================================

function removeChip(
    productIndex,
    type,
    valueIndex
) {

    const product =
        getProductForInput(productIndex);

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


    // Existing edit: keep it temporary.
    if (
        editingIndex === productIndex &&
        editDraft !== null
    ) {

        renderProducts();

        return;
    }


    markDataChanged();

    renderProducts();
}


// ============================================
// 16. Add New Product
// ============================================

function addProduct() {

    // Do not create another edit session.
    // A new product is edited directly.
    if (editingIndex !== null) {
        return;
    }


    const nextNumber =
        products.length + 1;


    products.push({
        id:
            `F${String(nextNumber).padStart(2, "0")}`,

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


    // New product starts with focus
    // on its name field.
    const nameInput =
        document.querySelector(
            `.new-product-name[data-index="${newIndex}"]`
        );

    if (nameInput) {
        nameInput.focus();
    }
}


// ============================================
// 17. Edit Existing Product
// ============================================

function editProduct(index) {

    if (!products[index]) {
        return;
    }


    // If another row is already being edited,
    // don't silently replace its draft.
    if (editingIndex !== null) {
        return;
    }


    // Newly created products don't need
    // the existing-product edit workflow.
    if (products[index].isNew) {
        return;
    }


    editingIndex = index;

    editDraft =
        cloneProduct(products[index]);

    editDraft.isNew = false;


    renderProducts();
}


// ============================================
// 18. Save Existing Product
// ============================================

function saveEditedProduct(index) {

    if (
        editingIndex !== index ||
        editDraft === null
    ) {
        return;
    }


    // Commit the complete draft.
    products[index] =
        cloneProduct(editDraft);

    products[index].isNew = false;


    editingIndex = null;

    editDraft = null;


    markDataChanged();

    renderProducts();
}


// ============================================
// 19. Cancel Existing Product Edit
// ============================================

function cancelEdit() {

    if (
        editingIndex === null ||
        editDraft === null
    ) {
        return;
    }


    // Simply discard the draft.
    editingIndex = null;

    editDraft = null;


    renderProducts();
}


// ============================================
// 20. Delete Product
// ============================================

function deleteProduct(index) {

    if (!products[index]) {
        return;
    }


    // If the deleted product is the one being
    // edited, discard the edit session.
    if (editingIndex === index) {

        editingIndex = null;

        editDraft = null;
    }


    // If a different row was being edited and
    // an earlier row is deleted, adjust index.
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
// 21. Load Sample
// ============================================

function loadSample() {

    editingIndex = null;

    editDraft = null;

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
// 22. Clear All
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

    dataChangedSinceAudit = false;

    filter = "ALL";

    editingIndex = null;

    editDraft = null;


    clearValidationError();

    clearAuditOutput();

    renderProducts();

    updateFilterButtons();

    updateDataChangeBanner();
}


// ============================================
// 23. Compute Audit
// ============================================

function computeAudit() {

    clearValidationError();


    // Audit ONLY the committed products.
    //
    // If an existing product is currently being
    // edited, its changes are still only in
    // editDraft and therefore are not audited
    // until SAVE.
    const result =
        runAudit(products);


    // ----------------------------------------
    // Validation Failure
    // ----------------------------------------

    if (!result.valid) {

        // Completely remove previous audit
        // summary and results.
        clearAuditOutput();


        // Keep current product data visible.
        showValidationError(
            formatValidationError(
                result.error
            )
        );


        // Failed validation does NOT reset
        // dataChangedSinceAudit.
        updateDataChangeBanner();

        return;
    }


    // ----------------------------------------
    // Successful Audit
    // ----------------------------------------

    auditResult = result;

    dataChangedSinceAudit = false;

    clearValidationError();

    renderAuditSummary();

    renderAuditResults();

    updateDataChangeBanner();
}


// ============================================
// 24. Format Validation Errors
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


    if (code === "UNKNOWN_INGREDIENT") {

        return `Unknown ingredient "${value}".`;
    }


    if (code === "INVALID_CLAIM") {

        return `Invalid claim or allergen "${value}".`;
    }


    if (code === "DUPLICATE_PRODUCT_ID") {

        return `Duplicate product ID "${value}".`;
    }


    if (code === "INVALID_PRODUCT_ID") {

        return "Product ID is required.";
    }


    return error;
}


// ============================================
// 25. Render Audit Summary
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


    auditSummary.hidden = false;

    noAuditState.hidden = true;
}


// ============================================
// 26. Render Audit Results
// ============================================

function renderAuditResults() {

    auditResults.innerHTML = "";


    if (!auditResult) {

        noResultsState.hidden = false;

        return;
    }


    let results =
        auditResult.results;


    if (filter === "FAULTY") {

        results =
            results.filter(
                result =>
                    result.status === "FAULTY"
            );
    }


    if (results.length === 0) {

        noResultsState.hidden = false;

        return;
    }


    noResultsState.hidden = true;


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


        let detailsHTML = "";


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
// 27. Result Filtering
// ============================================

function setFilter(newFilter) {

    filter = newFilter;

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
// 28. Button Events
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
// 29. Initial Render
// ============================================

function initializeApp() {

    products = [];

    auditResult = null;

    dataChangedSinceAudit = false;

    filter = "ALL";

    editingIndex = null;

    editDraft = null;


    clearValidationError();

    clearAuditOutput();

    renderProducts();

    updateFilterButtons();

    updateDataChangeBanner();
}


initializeApp();