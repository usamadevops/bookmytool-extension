chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
  });
  
  // Migrate any event listeners to this format
  