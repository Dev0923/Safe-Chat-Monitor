// Content script injected into all web pages
// Monitors chat messages and message inputs for child safety

console.log("Safety Monitor Extension: Content script loaded. Chat monitoring active.");

// Configuration
const API_URL = "http://localhost:8080/api/messages/extension";
const MIN_MESSAGE_LENGTH = 5;
const DEBOUNCE_DELAY = 2000; // 2 seconds after user stops typing

// Track which fields we've already monitored to avoid duplicates
const monitoredFields = new WeakSet();
const messageQueue = new Map(); // Store pending messages with their timers

// Sensitive field patterns to ignore
const SENSITIVE_PATTERNS = [
  'password', 'passwd', 'pwd', 'pass',
  'ssn', 'social', 'credit', 'card', 'cvv', 'pin',
  'account', 'routing', 'bank', 'payment',
  'billing', 'email' // Don't capture email fields for privacy
];

/**
 * Check if a field is sensitive and should be ignored
 */
function isSensitiveField(element) {
  // Ignore password inputs
  if (element.type === 'password') {
    return true;
  }

  // Check field attributes for sensitive patterns
  const name = (element.name || '').toLowerCase();
  const id = (element.id || '').toLowerCase();
  const placeholder = (element.placeholder || '').toLowerCase();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
  const className = (element.className || '').toLowerCase();

  const allAttributes = `${name} ${id} ${placeholder} ${ariaLabel} ${className}`;

  return SENSITIVE_PATTERNS.some(pattern => allAttributes.includes(pattern));
}

/**
 * Check if element is likely a message/chat input
 */
function isMessageField(element) {
  const name = (element.name || '').toLowerCase();
  const id = (element.id || '').toLowerCase();
  const placeholder = (element.placeholder || '').toLowerCase();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
  const className = (element.className || '').toLowerCase();

  const allAttributes = `${name} ${id} ${placeholder} ${ariaLabel} ${className}`;

  // Common chat/message field patterns
  const messagePatterns = [
    'message', 'chat', 'comment', 'post', 'reply', 'text',
    'compose', 'send', 'write', 'type', 'msg', 'dm', 'conversation'
  ];

  return messagePatterns.some(pattern => allAttributes.includes(pattern));
}

/**
 * Send message to backend API
 */
async function sendMessageToBackend(messageText, source) {
  try {
    // Get stored childId
    const result = await chrome.storage.local.get(['childId']);
    
    if (!result.childId) {
      console.log('Safety Monitor: No child ID configured. Message not sent.');
      return;
    }

    const payload = {
      childId: result.childId,
      message: messageText,
      source: source,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Safety Monitor: Message analyzed successfully', {
        source,
        length: messageText.length,
        riskLevel: data.data?.riskLevel
      });
    } else {
      const errorData = await response.json();
      console.error('Safety Monitor: Failed to analyze message', errorData);
    }
  } catch (error) {
    console.error('Safety Monitor: Error sending message to backend', error);
  }
}

/**
 * Handle message input with debouncing
 */
function handleMessageInput(element, eventType) {
  const messageText = element.value || element.textContent || element.innerText;
  
  // Skip if message is too short
  if (!messageText || messageText.trim().length < MIN_MESSAGE_LENGTH) {
    return;
  }

  // Get current domain
  const domain = window.location.hostname;
  
  // Create unique key for this element
  const elementKey = element.id || element.name || Math.random().toString(36);
  
  // Clear existing timer for this element
  if (messageQueue.has(elementKey)) {
    clearTimeout(messageQueue.get(elementKey).timer);
  }

  // Set new debounced timer
  const timer = setTimeout(() => {
    // Send message to backend
    sendMessageToBackend(messageText.trim(), domain);
    
    // Remove from queue
    messageQueue.delete(elementKey);
  }, DEBOUNCE_DELAY);

  // Store timer in queue
  messageQueue.set(elementKey, { timer, text: messageText });
}

/**
 * Monitor a message input field
 */
function monitorField(element) {
  // Skip if already monitored
  if (monitoredFields.has(element)) {
    return;
  }

  // Skip if sensitive field
  if (isSensitiveField(element)) {
    console.log('Safety Monitor: Skipping sensitive field', element.type, element.name);
    return;
  }

  // Mark as monitored
  monitoredFields.add(element);

  console.log('Safety Monitor: Monitoring message field', {
    type: element.tagName,
    name: element.name || element.id,
    isMessageField: isMessageField(element)
  });

  // Listen for input events (typing)
  element.addEventListener('input', () => {
    handleMessageInput(element, 'input');
  }, { passive: true });

  // Listen for form submission or Enter key
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Clear debounce timer and send immediately on Enter
      const elementKey = element.id || element.name || Math.random().toString(36);
      if (messageQueue.has(elementKey)) {
        const { timer, text } = messageQueue.get(elementKey);
        clearTimeout(timer);
        
        if (text && text.trim().length >= MIN_MESSAGE_LENGTH) {
          sendMessageToBackend(text.trim(), window.location.hostname);
        }
        
        messageQueue.delete(elementKey);
      }
    }
  }, { passive: true });

  // Listen for blur event (when user leaves the field)
  element.addEventListener('blur', () => {
    // Trigger send if there's a pending message
    const elementKey = element.id || element.name || Math.random().toString(36);
    if (messageQueue.has(elementKey)) {
      const { timer, text } = messageQueue.get(elementKey);
      clearTimeout(timer);
      
      if (text && text.trim().length >= MIN_MESSAGE_LENGTH) {
        sendMessageToBackend(text.trim(), window.location.hostname);
      }
      
      messageQueue.delete(elementKey);
    }
  }, { passive: true });
}

/**
 * Scan page for message input fields
 */
function scanForMessageFields() {
  // Find all textareas
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    if (!isSensitiveField(textarea)) {
      monitorField(textarea);
    }
  });

  // Find text inputs (but not password, email for privacy, etc.)
  const textInputs = document.querySelectorAll('input[type="text"]');
  textInputs.forEach(input => {
    if (!isSensitiveField(input) && isMessageField(input)) {
      monitorField(input);
    }
  });

  // Find contenteditable elements (used by modern chat apps)
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(element => {
    if (!isSensitiveField(element)) {
      monitorField(element);
    }
  });
}

// Initial scan when page loads
scanForMessageFields();

// Watch for dynamically added message fields (for SPAs like Discord, Slack, etc.)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      // Small delay to let the DOM settle
      setTimeout(scanForMessageFields, 100);
      break; // Only scan once per batch of mutations
    }
  }
});

// Start observing the document for changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Safety Monitor: Chat monitoring initialized successfully');
