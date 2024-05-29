
// To get Active tab
function openTab(evt, tabName) {
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    evt.currentTarget.className += " active";
}

document.addEventListener('DOMContentLoaded', async function () {
    
    //    Get active Tab
    var firstTablink = document.getElementsByClassName("tablinks")[0];
    var clickEvent = new Event('click');
    firstTablink.dispatchEvent(clickEvent);
    // All Close

    if (chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { text: 'get_page_details' }, function (response) {
                    if (response) {
                        document.getElementById('toolName').value = response.title;
                        document.getElementById('toolLink').value = response.url;
                        document.getElementById('toolDescription').value = response.description;
                    }
                });
            }
        });
    }

    await loadCategories();
    await loadTools();

    document.getElementById('toolForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        const toolName = document.getElementById('toolName').value;
        const toolLink = document.getElementById('toolLink').value;
        const toolDescription = document.getElementById('toolDescription').value;
        let category = document.getElementById('categorySelect').value;

        if (!category) {
            category = document.getElementById('newCategory').value;
            if (category) {
                await addCategory(category);
                document.getElementById('newCategory').value = '';
            }
        }

        const toolData = { link: toolLink, description: toolDescription, category: category };

        await chrome.storage.sync.set({ [toolName]: toolData });
        console.log('Tool saved:', toolName);
        await loadTools();
    });
});

async function loadCategories() {
    return new Promise((resolve, reject) => {
        chrome?.storage?.sync.get('categories', function (data) {
            const categories = data.categories || ['General'];
            const select = document.getElementById('categorySelect');
            select.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
            resolve();
        });
    });
}

async function addCategory(category) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('categories', function (data) {
            const categories = data.categories || [];
            if (!categories.includes(category)) {
                categories.push(category);
                chrome.storage.sync.set({ 'categories': categories }, function () {
                    resolve(loadCategories());
                });
            } else {
                resolve();
            }
        });
    });
}

async function loadTools() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, function (items) {
            const categoryMap = {};
            Object.keys(items).forEach(function (key) {
                if (key !== 'categories') {
                    const item = items[key];
                    if (!categoryMap[item.category]) {
                        categoryMap[item.category] = [];
                    }
                    categoryMap[item.category].push(`<div><strong>${key}</strong>: <a href="${item.link}" target="_blank">${item.link}</a><p>${item.description}</p></div>`);
                }
            });
            const categoryList = document.getElementById('categoryList');
            categoryList.innerHTML = Object.keys(categoryMap).map(cat => `<h2>${cat}</h2>${categoryMap[cat].join('')}`).join('');
            resolve();
        });
    });
}
