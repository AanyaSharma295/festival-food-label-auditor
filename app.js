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
// 4. Utility Functions
// ============================================

function cloneProducts(source) {
    return source.map(product => ({
        id: product.id,
        name: product.name,
        ingredients: [...product.ingredients],
        claimedTags: [...product.claimedTags],
        declaredAllergens: [...product.declaredAllergens]
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

    emptyProducts.hidden = products.length !== 0;

    for (let index = 0; index < products.length; index++) {

        const product = products[index];

        const row = document.createElement("tr");

        row.dataset.index = index;

        row.innerHTML = `
            <td>
                <span class="product-id">
                    ${escapeHTML(product.id)}
                </span>
            </td>

            <td>
                <span class="product-name">
                    ${escapeHTML(product.name)}
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

        productTableBody.appendChild(row);
    }

    attachProductListeners();

    updateProductCount();
}


// ============================================
// 7. HTML Escaping
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
// 8. Chip Rendering
// ============================================

function renderChips(values, type, productIndex) {

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
// 9. Reusable Tag Input
// ============================================

function createTagInputHTML(type, productIndex) {

    let listId = "ingredient-options";

    let placeholder = "Type ingredient and press Enter...";

    if (type === "claim") {
        listId = "claim-options";
        placeholder = "Type claim and press Enter...";
    }

    if (type === "allergen") {
        listId = "allergen-options";
        placeholder = "Type allergen and press Enter...";
    }

    return `
        <div class="tag-input">

            <input
                type="text"
                class="tag-input-field"
                data-type="${type}"
                data-product-index="${productIndex}"
                list="${listId}"
                placeholder="${placeholder}"
                autocomplete="off"
            >

        </div>
    `;
}


// ============================================
// 10. Product Event Listeners
// ============================================

function attachProductListeners() {

    const inputs =
        document.querySelectorAll(".tag-input-field");

    inputs.forEach(input => {

        input.addEventListener("keydown", event => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            addChipFromInput(input);
        });
    });


    const removeButtons =
        document.querySelectorAll(".chip-remove");

    removeButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productIndex =
                Number(button.dataset.productIndex);

            const valueIndex =
                Number(button.dataset.valueIndex);

            const type =
                button.dataset.type;

            removeChip(
                productIndex,
                type,
                valueIndex
            );
        });
    });


    const editButtons =
        document.querySelectorAll(".edit-button");

    editButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productIndex =
                Number(button.dataset.index);

            editProduct(productIndex);
        });
    });


    const deleteButtons =
        document.querySelectorAll(".delete-button");

    deleteButtons.forEach(button => {

        button.addEventListener("click", () => {

            const productIndex =
                Number(button.dataset.index);

            deleteProduct(productIndex);
        });
    });
}


// ============================================
// 11. Add Chip
// ============================================

function addChipFromInput(input) {

    const value = input.value.trim();

    if (value === "") {
        return;
    }

    const productIndex =
        Number(input.dataset.productIndex);

    const type =
        input.dataset.type;

    const product = products[productIndex];

    let targetArray = product.ingredients;

    if (type === "claim") {
        targetArray = product.claimedTags;
    }

    if (type === "allergen") {
        targetArray = product.declaredAllergens;
    }


    // Prevent duplicate chips.
    if (targetArray.includes(value)) {
        input.value = "";
        return;
    }


    targetArray.push(value);

    input.value = "";

    markDataChanged();

    renderProducts();
}


// ============================================
// 12. Remove Chip
// ============================================

function removeChip(
    productIndex,
    type,
    valueIndex
) {

    const product = products[productIndex];

    let targetArray = product.ingredients;

    if (type === "claim") {
        targetArray = product.claimedTags;
    }

    if (type === "allergen") {
        targetArray = product.declaredAllergens;
    }

    targetArray.splice(valueIndex, 1);

    markDataChanged();

    renderProducts();
}


// ============================================
// 13. Add Product
// ============================================

function addProduct() {

    const nextNumber = products.length + 1;

    products.push({
        id: `F${String(nextNumber).padStart(2, "0")}`,
        name: "",
        ingredients: [],
        claimedTags: [],
        declaredAllergens: []
    });

    markDataChanged();

    renderProducts();

    editProduct(products.length - 1);
}


// ============================================
// 14. Edit Product
// ============================================

function editProduct(index) {

    const product = products[index];

    if (!product) {
        return;
    }


    const row =
        productTableBody.querySelector(
            `tr[data-index="${index}"]`
        );

    if (!row) {
        return;
    }


    row.innerHTML = `
        <td>
            <input
                type="text"
                class="edit-text-input"
                data-field="id"
                value="${escapeHTML(product.id)}"
                aria-label="Product ID"
            >
        </td>

        <td>
            <input
                type="text"
                class="edit-text-input"
                data-field="name"
                value="${escapeHTML(product.name)}"
                aria-label="Product name"
            >
        </td>

        <td>
            <div class="edit-field-note">
                Use the tag input after saving.
            </div>
        </td>

        <td>
            <div class="edit-field-note">
                Use the tag input after saving.
            </div>
        </td>

        <td>
            <div class="edit-field-note">
                Use the tag input after saving.
            </div>
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


    const saveButton =
        row.querySelector(".save-button");

    const cancelButton =
        row.querySelector(".cancel-button");


    saveButton.addEventListener("click", () => {

        const idInput =
            row.querySelector('[data-field="id"]');

        const nameInput =
            row.querySelector('[data-field="name"]');

        products[index].id =
            idInput.value.trim();

        products[index].name =
            nameInput.value.trim();

        markDataChanged();

        renderProducts();
    });


    cancelButton.addEventListener("click", () => {
        renderProducts();
    });
}


// ============================================
// 15. Delete Product
// ============================================

function deleteProduct(index) {

    if (!products[index]) {
        return;
    }

    products.splice(index, 1);

    markDataChanged();

    renderProducts();
}


// ============================================
// 16. Load Sample
// ============================================

function loadSample() {

    products = cloneProducts(SAMPLE_PRODUCTS);

    auditResult = null;

    clearValidationError();

    markDataChanged();

    renderProducts();

    clearAuditOutput();

    updateDataChangeBanner();
}


// ============================================
// 17. Clear All
// ============================================

function clearAll() {

    if (products.length > 0 || auditResult !== null) {

        const confirmed = window.confirm(
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

    clearValidationError();

    clearAuditOutput();

    renderProducts();

    updateFilterButtons();

    updateDataChangeBanner();
}


// ============================================
// 18. Compute Audit
// ============================================

function computeAudit() {

    // Every audit attempt begins by removing
    // any validation message from the previous attempt.
    clearValidationError();


    // Validate/audit the CURRENT product data.
    // Nothing is automatically audited while editing.
    const result = runAudit(products);


    // ----------------------------------------
    // Validation Failure
    // ----------------------------------------

    if (!result.valid) {

        // Critical requirement:
        // old summary/results must disappear.
        clearAuditOutput();

        showValidationError(
            formatValidationError(result.error)
        );

        // IMPORTANT:
        // dataChangedSinceAudit remains unchanged.
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
// 19. Format Validation Errors
// ============================================

function formatValidationError(error) {

    const separatorIndex =
        error.indexOf(":");

    if (separatorIndex === -1) {
        return error;
    }


    const code =
        error.substring(0, separatorIndex);

    const value =
        error.substring(separatorIndex + 1);


    if (code === "UNKNOWN_INGREDIENT") {

        return `Unknown ingredient "${value}".`;
    }


    if (code === "INVALID_CLAIM") {

        return `Invalid claim or allergen "${value}".`;
    }


    if (code === "INVALID_PRODUCT_ID") {

        return "Product ID is required.";
    }


    if (code === "DUPLICATE_PRODUCT_ID") {

        return `Product ID "${value}" is duplicated.`;
    }


    return error;
}


// ============================================
// 20. Render Audit Summary
// ============================================

function renderAuditSummary() {

    if (!auditResult) {
        return;
    }

    summaryClean.textContent =
        String(auditResult.summary.clean)
            .padStart(2, "0");

    summaryFaulty.textContent =
        String(auditResult.summary.faulty)
            .padStart(2, "0");

    summaryIssues.textContent =
        String(auditResult.summary.totalIssues)
            .padStart(2, "0");

    auditSummary.hidden = false;

    noAuditState.hidden = true;
}


// ============================================
// 21. Render Audit Results
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
                result => result.status === "FAULTY"
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
                item => item.id === result.productId
            );


        if (!product) {
            return;
        }


        const resultElement =
            document.createElement("article");

        resultElement.className =
            "audit-result";


        const statusClass =
            result.status === "CLEAN"
                ? "clean"
                : "faulty";


        let detailsHTML = "";


        if (result.status === "CLEAN") {

            detailsHTML = `
                <p class="no-issues">
                    No issues found.
                </p>
            `;

        } else {

            detailsHTML = `
                <ul class="issue-list">

                    ${result.issues.map(issue => `
                        <li>
                            ${escapeHTML(issue)}
                        </li>
                    `).join("")}

                </ul>
            `;
        }


        resultElement.innerHTML = `

            <div>

                <h3 class="audit-result-product">
                    ${escapeHTML(product.name || "Unnamed Product")}
                </h3>

                <p class="audit-result-id">
                    ${escapeHTML(result.productId)}
                </p>

            </div>

            <div class="audit-result-status ${statusClass}">
                ${result.status}
            </div>

            <div class="audit-result-details">
                ${detailsHTML}
            </div>
        `;


        auditResults.appendChild(resultElement);
    });
}


// ============================================
// 22. Result Filtering
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
// 23. Button Events
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
// 24. Initial Render
// ============================================

function initializeApp() {

    products = [];

    auditResult = null;

    dataChangedSinceAudit = false;

    filter = "ALL";

    clearValidationError();

    clearAuditOutput();

    renderProducts();

    updateFilterButtons();

    updateDataChangeBanner();
}


initializeApp();