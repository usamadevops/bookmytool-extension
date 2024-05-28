chrome.runtime.onMessage.addListener((msg, sender, response) => {
    if (msg.text === 'get_page_details') {
      const details = {
        title: document.title,
        description: document.querySelector("meta[name='description']")?.content || "No description available.",
        url: window.location.href
      };
      response(details);
    }
  });
  