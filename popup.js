document.addEventListener('DOMContentLoaded', function() {
    if(chrome?.tabs?.query) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {text: 'get_page_details'}, function(response) {
                if (response) {
                    document.getElementById('toolName').value = response.title;
                    document.getElementById('toolLink').value = response.url;
                    document.getElementById('toolDescription').value = response.description;
                }
            });
        });
    }
  
    document.getElementById('toolForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const toolName = document.getElementById('toolName').value;
        const toolLink = document.getElementById('toolLink').value;
        const toolDescription = document.getElementById('toolDescription').value;
  
        chrome.storage.sync.set({[toolName]: {link: toolLink, description: toolDescription}}, function() {
            console.log('Tool saved:', toolName);
            loadTools();
        });
    });
  
    loadTools();
});
  
function loadTools() {
    chrome?.storage?.sync.get(null, function(items) {
        var allTools = Object.keys(items).map(function(key) {
            return `<div><strong>${key}</strong>: <a href="${items[key].link}" target="_blank">${items[key].link}</a><p>${items[key].description}</p></div>`;
        });
        document.getElementById('toolList').innerHTML = allTools.join('');
    });
}
