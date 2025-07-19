/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");
const clearAllBtn = document.getElementById("clearAllBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Modal elements */
const productModal = document.getElementById("productModal");
const modalProductName = document.getElementById("modalProductName");
const modalProductBrand = document.getElementById("modalProductBrand");
const modalProductImage = document.getElementById("modalProductImage");
const modalProductDescription = document.getElementById(
  "modalProductDescription"
);
const closeModalBtn = document.getElementById("closeModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalSelectBtn = document.getElementById("modalSelectBtn");

/* Variable to store current modal product */
let currentModalProduct = null;

/* Array to store selected products */
let selectedProducts = [];

/* Array to store conversation history */
let conversationHistory = [];

/* Function to save conversation history to localStorage */
function saveConversationHistory() {
  localStorage.setItem(
    "conversationHistory",
    JSON.stringify(conversationHistory)
  );
}

/* Function to load conversation history from localStorage */
function loadConversationHistory() {
  const stored = localStorage.getItem("conversationHistory");
  if (stored) {
    try {
      conversationHistory = JSON.parse(stored);
      // Restore chat window content
      restoreChatWindow();
    } catch (error) {
      console.error("Error loading conversation history:", error);
      conversationHistory = [];
    }
  }
}

/* Function to add message to conversation history */
function addToConversationHistory(role, content) {
  conversationHistory.push({
    role: role,
    content: content,
    timestamp: new Date().toISOString(),
  });
  saveConversationHistory();
}

/* Function to clear conversation history */
function clearConversationHistory() {
  conversationHistory = [];
  chatWindow.innerHTML = `<div class="placeholder-message">
    Hi! I'm your L'Oréal beauty advisor. Select some products above, or ask me about skincare, haircare, makeup, or beauty routines!
  </div>`;
  saveConversationHistory();
}

/* Function to restore chat window from conversation history */
function restoreChatWindow() {
  chatWindow.innerHTML = "";

  if (conversationHistory.length === 0) {
    chatWindow.innerHTML = `<div class="placeholder-message">
      Hi! I'm your L'Oréal beauty advisor. Select some products above, or ask me about skincare, haircare, makeup, or beauty routines!
    </div>`;
    clearChatBtn.style.display = "none";
    return;
  }

  conversationHistory.forEach((message) => {
    if (message.role === "user") {
      addMessageToChat("user", message.content, false, false);
    } else if (message.role === "assistant") {
      addMessageToChat("assistant", message.content, false, false);
    }
  });

  // Show clear chat button if there are messages
  clearChatBtn.style.display = conversationHistory.length > 0 ? "flex" : "none";
}

/* LocalStorage functions for persisting selected products */
function saveSelectedProductsToStorage() {
  // Save the selected products array to localStorage
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

function loadSelectedProductsFromStorage() {
  // Load selected products from localStorage
  const stored = localStorage.getItem("selectedProducts");
  if (stored) {
    try {
      selectedProducts = JSON.parse(stored);
    } catch (error) {
      console.error("Error loading selected products from storage:", error);
      selectedProducts = [];
    }
  }
}

/* Update the selected products list display */
function updateSelectedProductsDisplay() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <p style="color: #666; font-style: italic;">No products selected yet</p>
    `;
    /* Update generate button text */
    generateRoutineBtn.innerHTML = `
      <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Routine
    `;
    generateRoutineBtn.disabled = true;
    generateRoutineBtn.style.opacity = "0.6";

    /* Hide clear all button when no products */
    clearAllBtn.style.display = "none";
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-product-item">
      <span>${product.name}</span>
      <button class="remove-btn" onclick="removeProductFromSelection(${product.id})" title="Remove product">
        ×
      </button>
    </div>
  `
    )
    .join("");

  /* Update generate button with count */
  generateRoutineBtn.innerHTML = `
    <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Routine (${selectedProducts.length} products)
  `;
  generateRoutineBtn.disabled = false;
  generateRoutineBtn.style.opacity = "1";

  /* Show clear all button when products are selected */
  clearAllBtn.style.display = "flex";
}

/* Show initial placeholder until user selects a category or searches */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or search for products
  </div>
`;

/* Initialize the selected products display */
// Load selected products from localStorage on page load
loadSelectedProductsFromStorage();
updateSelectedProductsDisplay();

// Load conversation history from localStorage on page load
loadConversationHistory();

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        <span>No products match your search criteria</span>
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map((product) => {
      /* Check if this product is already selected */
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      const selectedClass = isSelected ? " selected" : "";

      return `
    <div class="product-card${selectedClass}" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `;
    })
    .join("");

  /* Add click event listeners to all product cards */
  addProductCardListeners();
}

/* Combined filter function for category and search */
async function filterAndDisplayProducts() {
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value.toLowerCase().trim();

  let filteredProducts = products;

  // Filter by category if one is selected
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  // Filter by search term if provided
  if (searchTerm) {
    filteredProducts = filteredProducts.filter((product) => {
      // Search in product name, brand, and description
      const searchableText =
        `${product.name} ${product.brand} ${product.description}`.toLowerCase();
      return searchableText.includes(searchTerm);
    });
  }

  // If no filters are applied, show placeholder
  if (!selectedCategory && !searchTerm) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category or search for products
      </div>
    `;
    return;
  }

  displayProducts(filteredProducts);
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", filterAndDisplayProducts);

/* Filter and display products when user types in search */
productSearch.addEventListener("input", filterAndDisplayProducts);

/* Clear search when user focuses on search input (optional UX enhancement) */
productSearch.addEventListener("focus", () => {
  if (productSearch.value === "") {
    // If search is empty, ensure we show the current category results
    filterAndDisplayProducts();
  }
});

/* Chat form submission handler with OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const userMessage = userInput.value.trim();

  if (!userMessage) return;

  /* Add user message to chat window */
  addMessageToChat("user", userMessage);

  /* Clear input field */
  userInput.value = "";

  /* Show loading message */
  addMessageToChat("assistant", "Thinking...", true);

  try {
    /* Get AI response */
    const response = await getOpenAIResponse(userMessage);

    /* Remove loading message and add AI response */
    removeLoadingMessage();
    addMessageToChat("assistant", response);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    removeLoadingMessage();
    addMessageToChat(
      "assistant",
      "Sorry, I'm having trouble responding right now. Please try again."
    );
  }
});

/* Function to call OpenAI API with conversation history */
async function getOpenAIResponse(userMessage) {
  /* Create context about selected products with complete data */
  let selectedProductsContext = "";
  if (selectedProducts.length > 0) {
    const productSummary = selectedProducts
      .map((p) => `${p.name} by ${p.brand} (${p.category})`)
      .join(", ");

    selectedProductsContext = `\n\nCurrently selected products: ${productSummary}`;

    /* Add detailed product data for complex questions */
    if (
      userMessage.toLowerCase().includes("routine") ||
      userMessage.toLowerCase().includes("order") ||
      userMessage.toLowerCase().includes("how to use")
    ) {
      selectedProductsContext += `\n\nDetailed product information:\n${JSON.stringify(
        selectedProducts,
        null,
        2
      )}`;
    }
  }

  /* Create system message for L'Oréal beauty advisor with topic restrictions */
  const systemMessage = `You are a knowledgeable beauty advisor for L'Oréal. Help users with questions about:
- Skincare routines and products
- Haircare advice and styling
- Makeup application and techniques
- Fragrance recommendations
- Beauty product usage and benefits
- The products they have selected for their routine

IMPORTANT: Only respond to questions related to beauty, skincare, haircare, makeup, fragrance, and the user's selected products. If asked about unrelated topics, politely redirect the conversation back to beauty and wellness.

RESPONSE STYLE:
- Be conversational and approachable
- Use emojis when appropriate
- Keep responses concise but helpful
- Format tips with bullet points
- Mention specific product benefits
- Include application tips when relevant
- Reference previous parts of the conversation when relevant

Focus on L'Oréal and partner brands like CeraVe, Urban Decay, Lancôme, etc.
Always prioritize user safety and skin health.${selectedProductsContext}`;

  /* Build messages array with conversation history */
  const messages = [
    {
      role: "system",
      content: systemMessage,
    },
  ];

  /* Add conversation history (limit to last 10 messages to stay within token limits) */
  const recentHistory = conversationHistory.slice(-10);

  /* If we have more than 10 messages, add a context note */
  if (conversationHistory.length > 10) {
    messages.push({
      role: "system",
      content:
        "Note: This is a continuation of a longer conversation. Previous context may be relevant.",
    });
  }

  recentHistory.forEach((message) => {
    messages.push({
      role: message.role,
      content: message.content,
    });
  });

  /* Add current user message */
  messages.push({
    role: "user",
    content: userMessage,
  });

  /* Make API request to OpenAI */
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* Function to add message to chat window with enhanced formatting */
function addMessageToChat(
  sender,
  message,
  isLoading = false,
  saveToHistory = true
) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}-message${
    isLoading ? " loading" : ""
  }`;

  if (sender === "user") {
    messageDiv.innerHTML = `
      <div class="message-header">
        <strong>You</strong>
      </div>
      <div class="message-content">${message}</div>
    `;

    // Add to conversation history if not loading and should save
    if (!isLoading && saveToHistory) {
      addToConversationHistory("user", message);
    }
  } else {
    /* Format assistant messages for better readability */
    const formattedMessage = formatAssistantMessage(message);
    messageDiv.innerHTML = `
      <div class="message-header">
        <strong>💄 L'Oréal Beauty Advisor</strong>
      </div>
      <div class="message-content">${formattedMessage}</div>
    `;

    // Add to conversation history if not loading and should save
    if (!isLoading && saveToHistory) {
      addToConversationHistory("assistant", message);
    }
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Show clear chat button when there are messages
  if (!isLoading && conversationHistory.length > 0) {
    clearChatBtn.style.display = "flex";
  }
}

/* Function to format assistant messages for better readability */
function formatAssistantMessage(message) {
  /* Handle loading messages */
  if (
    message.includes("...") ||
    message.includes("Thinking") ||
    message.includes("Creating") ||
    message.includes("Analyzing")
  ) {
    return `<div class="loading-text">${message}</div>`;
  }

  /* Format routine responses with better structure */
  if (
    message.includes("routine") ||
    message.includes("step") ||
    message.includes("order")
  ) {
    return formatRoutineMessage(message);
  }

  /* Format regular messages with better typography */
  return formatRegularMessage(message);
}

/* Function to format routine messages with clear structure */
function formatRoutineMessage(message) {
  let formatted = message;

  /* Add icons and formatting for routine steps */
  formatted = formatted.replace(
    /(\d+\.\s)/g,
    '<div class="routine-step"><span class="step-number">$1</span>'
  );
  formatted = formatted.replace(
    /(\n\n)/g,
    '</div>$1<div class="routine-step">'
  );

  /* Format morning/evening sections */
  formatted = formatted.replace(
    /(Morning|AM|morning):/gi,
    '<div class="routine-section morning">🌅 <strong>Morning Routine:</strong></div>'
  );
  formatted = formatted.replace(
    /(Evening|PM|evening|night):/gi,
    '<div class="routine-section evening">🌙 <strong>Evening Routine:</strong></div>'
  );

  /* Format frequency information */
  formatted = formatted.replace(
    /(daily|Daily)/g,
    '<span class="frequency daily">Daily</span>'
  );
  formatted = formatted.replace(
    /(weekly|Weekly)/g,
    '<span class="frequency weekly">Weekly</span>'
  );
  formatted = formatted.replace(
    /(twice a week|2x week)/gi,
    '<span class="frequency twice-weekly">Twice a week</span>'
  );

  /* Format product names in bold */
  formatted = formatted.replace(
    /(\b[A-Z][a-zA-Z\s&']+(?:Cleanser|Moisturizer|Serum|Cream|Lotion|Toner|Treatment|Oil|Mask|SPF)\b)/g,
    '<strong class="product-name">$1</strong>'
  );

  /* Add tips section formatting */
  formatted = formatted.replace(
    /(Tips?:|Tip:|Pro tip:|Note:|Important:)/gi,
    '<div class="tip-section">💡 <strong>$1</strong>'
  );

  /* Format benefits */
  formatted = formatted.replace(
    /(Benefits?:|Why this works:|Results:)/gi,
    '<div class="benefits-section">✨ <strong>$1</strong>'
  );

  return `<div class="routine-content">${formatted}</div>`;
}

/* Function to format regular messages */
function formatRegularMessage(message) {
  let formatted = message;

  /* Make product names bold */
  formatted = formatted.replace(
    /(\b[A-Z][a-zA-Z\s&']+(?:Cleanser|Moisturizer|Serum|Cream|Lotion|Toner|Treatment|Oil|Mask|SPF)\b)/g,
    '<strong class="product-mention">$1</strong>'
  );

  /* Format bullet points */
  formatted = formatted.replace(
    /^\s*[-•]\s/gm,
    '<span class="bullet-point">• </span>'
  );

  /* Format line breaks for better readability */
  formatted = formatted.replace(/\n\n/g, "</p><p>");
  formatted = `<p>${formatted}</p>`;

  /* Add emoji for common topics */
  formatted = formatted.replace(/(cleanser|cleansing)/gi, "$1 🧼");
  formatted = formatted.replace(/(moisturizer|hydration)/gi, "$1 💧");
  formatted = formatted.replace(/(sunscreen|SPF)/gi, "$1 ☀️");
  formatted = formatted.replace(/(\bvitamin C\b)/gi, "$1 🍊");
  formatted = formatted.replace(/(\bretinol\b)/gi, "$1 🌟");

  return formatted;
}

/* Generate Routine button functionality */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    addMessageToChat(
      "assistant",
      "Please select some products first to generate a routine!"
    );
    return;
  }

  /* Create a summary of selected products for the user message */
  const productSummary = selectedProducts.map((p) => p.name).join(", ");
  const userMessage = `Generate my routine with these ${selectedProducts.length} products: ${productSummary}`;

  /* Add user message to chat */
  addMessageToChat("user", userMessage);

  /* Show loading message */
  addMessageToChat(
    "assistant",
    "Analyzing your selected products and creating your personalized routine...",
    true
  );

  try {
    /* Get AI response with complete product data */
    const response = await generateRoutineWithProducts(selectedProducts);

    /* Remove loading message and add AI response */
    removeLoadingMessage();
    addMessageToChat("assistant", response);
  } catch (error) {
    console.error("Error generating routine:", error);
    removeLoadingMessage();
    addMessageToChat(
      "assistant",
      "Sorry, I couldn't generate your routine right now. Please try again."
    );
  }
});

/* Function to generate routine with complete product JSON data */
async function generateRoutineWithProducts(products) {
  /* Create detailed JSON structure for selected products */
  const productDataForAI = products.map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    image: product.image,
  }));

  /* Create system message specifically for routine generation */
  const systemMessage = `You are an expert L'Oréal beauty advisor specializing in creating personalized skincare and beauty routines.

Your task is to analyze the provided product data and create a comprehensive, step-by-step routine that includes:
1. The correct order of application
2. Frequency of use (morning/evening/weekly)
3. Application tips and techniques
4. Benefits of each product in the routine
5. Any important warnings or considerations

FORMATTING REQUIREMENTS:
- Use clear section headers like "Morning:" and "Evening:"
- Number each step (1., 2., 3., etc.)
- Include "Tips:" sections for application advice
- Add "Benefits:" sections to explain why each product works
- Use simple, friendly language
- Keep steps concise but informative

Focus on L'Oréal family brands (CeraVe, Urban Decay, Lancôme, etc.) and provide professional beauty advice.
Be detailed but easy to follow with clear visual structure.`;

  /* Create the routine generation prompt with complete product JSON */
  const routinePrompt = `Please create a detailed beauty routine using these selected products:

${JSON.stringify(productDataForAI, null, 2)}

Create a well-structured routine that includes:

**Morning:**
1. [First step with product name]
2. [Second step with product name]
etc.

**Evening:**
1. [First step with product name]
2. [Second step with product name]
etc.

**Tips:**
- Include specific application techniques
- Mention frequency (daily, weekly, etc.)
- Add any important timing notes

**Benefits:**
- Explain what each product does
- Describe expected results

Format with clear headers and numbered steps for easy reading.`;

  /* Make API request to OpenAI */
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: routinePrompt,
        },
      ],
      max_tokens: 800, // Increased for detailed routine
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* Function to remove loading message */
function removeLoadingMessage() {
  const loadingMessage = chatWindow.querySelector(".loading");
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

/* Add click event listeners to product cards for modal */
function addProductCardListeners() {
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    card.addEventListener("click", async () => {
      const productId = parseInt(card.dataset.productId);

      /* Load products to get full product data */
      const products = await loadProducts();
      const product = products.find((p) => p.id === productId);

      if (!product) return;

      /* Open modal with product details */
      openProductModal(product);
    });
  });
}

/* Add a product to the selected products array and update display */
function addProductToSelection(product) {
  selectedProducts.push(product);
  updateSelectedProductsDisplay();
  // Save to localStorage whenever products are added
  saveSelectedProductsToStorage();
}

/* Remove a product from the selected products array and update display */
function removeProductFromSelection(productId) {
  selectedProducts = selectedProducts.filter((p) => p.id !== productId);
  updateSelectedProductsDisplay();
  // Save to localStorage whenever products are removed
  saveSelectedProductsToStorage();

  /* Remove visual selection from product card if it's currently visible */
  const productCard = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  if (productCard) {
    productCard.classList.remove("selected");
  }
}

/* Open product modal with details */
function openProductModal(product) {
  currentModalProduct = product;

  /* Populate modal content */
  modalProductName.textContent = product.name;
  modalProductBrand.textContent = product.brand;
  modalProductImage.src = product.image;
  modalProductImage.alt = product.name;
  modalProductDescription.textContent = product.description;

  /* Update select button text based on selection state */
  const isSelected = selectedProducts.some((p) => p.id === product.id);
  modalSelectBtn.textContent = isSelected
    ? "Remove from Routine"
    : "Add to Routine";
  modalSelectBtn.className = isSelected
    ? "modal-btn modal-btn-secondary"
    : "modal-btn modal-btn-primary";

  /* Show modal */
  productModal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

/* Close product modal */
function closeProductModal() {
  productModal.classList.remove("active");
  document.body.style.overflow = ""; // Restore scrolling
  currentModalProduct = null;
}

/* Handle modal select/deselect button */
function handleModalSelect() {
  if (!currentModalProduct) return;

  const isSelected = selectedProducts.some(
    (p) => p.id === currentModalProduct.id
  );

  if (isSelected) {
    removeProductFromSelection(currentModalProduct.id);
  } else {
    addProductToSelection(currentModalProduct);

    /* Update visual state of the card */
    const productCard = document.querySelector(
      `[data-product-id="${currentModalProduct.id}"]`
    );
    if (productCard) {
      productCard.classList.add("selected");
    }
  }

  /* Update button text and style */
  const newIsSelected = selectedProducts.some(
    (p) => p.id === currentModalProduct.id
  );
  modalSelectBtn.textContent = newIsSelected
    ? "Remove from Routine"
    : "Add to Routine";
  modalSelectBtn.className = newIsSelected
    ? "modal-btn modal-btn-secondary"
    : "modal-btn modal-btn-primary";
}

/* Clear all selected products */
function clearAllSelectedProducts() {
  // Ask for confirmation before clearing all products
  if (selectedProducts.length === 0) return;

  const confirmClear = confirm(
    `Are you sure you want to remove all ${selectedProducts.length} selected products?`
  );
  if (!confirmClear) return;

  // Clear the array
  selectedProducts = [];

  // Update display and save to localStorage
  updateSelectedProductsDisplay();
  saveSelectedProductsToStorage();

  // Remove visual selection from all product cards
  document.querySelectorAll(".product-card.selected").forEach((card) => {
    card.classList.remove("selected");
  });
}

/* Modal event listeners */
closeModalBtn.addEventListener("click", closeProductModal);
modalCloseBtn.addEventListener("click", closeProductModal);
modalSelectBtn.addEventListener("click", handleModalSelect);

/* Clear all button event listener */
clearAllBtn.addEventListener("click", clearAllSelectedProducts);

/* Clear chat button functionality */
clearChatBtn.addEventListener("click", () => {
  clearConversationHistory();
  clearChatBtn.style.display = "none";
});

/* Close modal when clicking outside */
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) {
    closeProductModal();
  }
});

/* Close modal with Escape key */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productModal.classList.contains("active")) {
    closeProductModal();
  }
});

/* RTL Language Support Functions */
function toggleDirection() {
  const html = document.documentElement;
  const currentDir = html.getAttribute("dir") || "ltr";
  const newDir = currentDir === "ltr" ? "rtl" : "ltr";
  const newLang = newDir === "rtl" ? "ar" : "en";

  html.setAttribute("dir", newDir);
  html.setAttribute("lang", newLang);

  // Update button text
  const toggleBtn = document.getElementById("directionToggle");
  if (toggleBtn) {
    toggleBtn.innerHTML = `<i class="fa-solid fa-language"></i> ${
      newDir === "rtl" ? "LTR" : "RTL"
    }`;
  }

  // Save preference to localStorage
  localStorage.setItem("preferredDirection", newDir);
  localStorage.setItem("preferredLanguage", newLang);
}

function initializeDirection() {
  // Load saved direction preference or detect from browser
  const savedDir = localStorage.getItem("preferredDirection");
  const savedLang = localStorage.getItem("preferredLanguage");
  const html = document.documentElement;

  if (savedDir && savedLang) {
    html.setAttribute("dir", savedDir);
    html.setAttribute("lang", savedLang);

    // Update button text
    const toggleBtn = document.getElementById("directionToggle");
    if (toggleBtn) {
      toggleBtn.innerHTML = `<i class="fa-solid fa-language"></i> ${
        savedDir === "rtl" ? "LTR" : "RTL"
      }`;
    }
  } else {
    // Auto-detect RTL languages from browser
    const browserLang = navigator.language || navigator.userLanguage;
    const rtlLanguages = ["ar", "he", "fa", "ur", "ku", "dv"];
    const isRTL = rtlLanguages.some((lang) => browserLang.startsWith(lang));

    if (isRTL) {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", browserLang);

      // Update button text
      const toggleBtn = document.getElementById("directionToggle");
      if (toggleBtn) {
        toggleBtn.innerHTML = `<i class="fa-solid fa-language"></i> LTR`;
      }
    }
  }
}

// Add keyboard shortcut for RTL toggle (Ctrl/Cmd + Shift + R)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "R") {
    e.preventDefault();
    toggleDirection();
  }
});

// Initialize direction on page load
document.addEventListener("DOMContentLoaded", initializeDirection);
