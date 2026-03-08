// The backend URL where activity logs are sent
const API_URL = "http://localhost:8080/api/activity";

// Website categorization and risk assessment
const categorizeWebsite = (domain, url) => {
  const educationDomains = ['edu', 'coursera', 'udemy', 'khan', 'wikipedia', 'academia', 'scholar', 'edx'];
  const entertainmentDomains = ['youtube', 'netflix', 'hulu', 'disney', 'twitch', 'spotify', 'soundcloud'];
  const socialDomains = ['facebook', 'twitter', 'instagram', 'snapchat', 'tiktok', 'reddit', 'linkedin', 'whatsapp'];
  const gamingDomains = ['steam', 'epicgames', 'roblox', 'minecraft', 'twitch', 'itch.io', 'ea.com'];
  const newsDomains = ['news', 'cnn', 'bbc', 'nytimes', 'reuters', 'theguardian', 'wsj', 'forbes'];
  const shoppingDomains = ['amazon', 'ebay', 'walmart', 'target', 'etsy', 'aliexpress', 'shop'];

  const domainLower = domain.toLowerCase();
  
  if (educationDomains.some(d => domainLower.includes(d))) return 'Education';
  if (entertainmentDomains.some(d => domainLower.includes(d))) return 'Entertainment';
  if (socialDomains.some(d => domainLower.includes(d))) return 'Social';
  if (gamingDomains.some(d => domainLower.includes(d))) return 'Gaming';
  if (newsDomains.some(d => domainLower.includes(d))) return 'News';
  if (shoppingDomains.some(d => domainLower.includes(d))) return 'Shopping';
  
  return 'Unknown';
};

const assessRiskLevel = (domain, url, category) => {
  const domainLower = domain.toLowerCase();
  
  // High-risk indicators
  const dangerousKeywords = ['xxx', 'adult', 'porn', 'gambling', 'casino', 'bet', 'torrent', 'pirate'];
  if (dangerousKeywords.some(k => domainLower.includes(k) || url.toLowerCase().includes(k))) {
    return 'Dangerous';
  }
  
  // Medium-risk: Social media, unknown sites
  if (category === 'Social' || category === 'Unknown') {
    return 'Warning';
  }
  
  // Low-risk: Known safe categories
  if (['Education', 'News'].includes(category)) {
    return 'Safe';
  }
  
  return 'Safe';
};

const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (err) {
    return 'unknown';
  }
};

const shouldTrackUrl = (rawUrl) => {
    if (!rawUrl) return false;

    try {
        const parsed = new URL(rawUrl);
        const protocol = parsed.protocol.toLowerCase();
        const nonWebProtocols = new Set([
            'about:',
            'blob:',
            'chrome:',
            'chrome-extension:',
            'data:',
            'devtools:',
            'edge:',
            'file:',
            'javascript:',
            'moz-extension:',
        ]);

        if (nonWebProtocols.has(protocol)) {
            return false;
        }

        if (protocol !== 'http:' && protocol !== 'https:') {
            return false;
        }

        const hostname = parsed.hostname.toLowerCase();
        const port = parsed.port || (protocol === 'https:' ? '443' : '80');
        const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
        const appPorts = new Set(['3000', '4173', '5173', '8080']);

        // Ignore first-party dashboard/dev URLs to avoid logging parent usage.
        if (localHosts.has(hostname) && appPorts.has(port)) {
            return false;
        }

        return true;
    } catch (err) {
        return false;
    }
};

// Track page visit times for duration calculation
const pageVisitTimes = new Map();

// Listen to tab updates to track when a user visits a new page
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // We only care when the page has completely loaded and it's an actual URL
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {

        if (!shouldTrackUrl(tab.url)) {
            return;
        }

        // Retrieve extension configuration from local storage
        const data = await chrome.storage.local.get(['childId', 'authToken']);

        if (!data.childId) {
            console.log('Safety Monitor: No child ID configured. Skipping activity report.');
            return;
        }

        const domain = extractDomain(tab.url);
        const category = categorizeWebsite(domain, tab.url);
        const riskLevel = assessRiskLevel(domain, tab.url, category);
        const timestamp = new Date().toISOString();

        // Calculate duration if there was a previous page
        let duration = 0;
        if (pageVisitTimes.has(tabId)) {
            const lastVisit = pageVisitTimes.get(tabId);
            duration = Math.floor((Date.now() - lastVisit.time) / 1000); // Duration in seconds
        }
        
        // Store current visit time
        pageVisitTimes.set(tabId, { time: Date.now(), url: tab.url });

        const payload = {
            childId: data.childId,
            url: tab.url,
            domain: domain,
            title: tab.title || '',
            timestamp: timestamp,
            duration: duration,
            category: category,
            riskLevel: riskLevel,
            device: 'Chrome'
        };

        try {
            // Send the browsing data to the backend API via POST
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Optional: Add Auth Token if your API requires it
                    // 'Authorization': `Bearer ${data.authToken}` 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorDetails = '';
                try {
                    const errorData = await response.json();
                    errorDetails = errorData?.message || JSON.stringify(errorData);
                } catch (_) {
                    try {
                        errorDetails = await response.text();
                    } catch (_) {
                        errorDetails = 'No additional error details available';
                    }
                }

                console.error(
                    'Safety Monitor: Failed to send activity data.',
                    'Status:', response.status,
                    'Details:', errorDetails,
                    'Child ID:', payload.childId
                );
            } else {
                console.log('Safety Monitor: Activity successfully sent to parent dashboard.', payload);
            }
        } catch (error) {
            console.error('Safety Monitor: Error sending activity data. Will retry later:', error);
            // More sophisticated retry logic (like adding to a local storage queue) could go here
        }
    }
});

// Clean up page visit tracking when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
    pageVisitTimes.delete(tabId);
});
