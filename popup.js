function openTab(evt, tabName) {
 // Declare all variables
 var i, tabcontent, tablinks;

 tabcontent = document.getElementsByClassName("tabContent");
 for (i = 0; i < tabcontent.length; i++) {
   tabcontent[i].style.display = "none";
 }

 // Get all elements with class="tablinks" and remove the class "active"
 tablinks = document.getElementsByClassName("tablinks");
 for (i = 0; i < tablinks.length; i++) {
   tablinks[i].className = tablinks[i].className.replace(" active", "");
 }

 // Show the current tab, and add an "active" class to the button that opened the tab
 document.getElementById(tabName).style.display = "block";
 evt.currentTarget.className += " active";
}


document.addEventListener('DOMContentLoaded',  function () {
    document.getElementById("newBookmarkBtn").click();
})

document.addEventListener('DOMContentLoaded', async function () {
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

    await loadDefaultCategories();
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
        await loadTools();
    });
});

async function loadDefaultCategories() {
    const defaultCategories = ["General", "Programming", "Design", "Marketing", "Finance", "Education", "Health", "Entertainment", "News", "Travel", "Sports", "Food", "Shopping", "Social Media", "Productivity", "Others"];
    return new Promise((resolve, reject) => {
        chrome?.storage?.sync?.get('categories', function (data) {
            const categories = data.categories || defaultCategories;
            chrome?.storage?.sync?.set({ 'categories': categories }, function () {
                resolve();
            });
        });
    });
}

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
                    // categoryMap[item.category].push(`<div><strong>${key}</strong>: <a href="${item.link}" target="_blank">${item.link}</a><p>${item.description}</p></div>`);
                    categoryMap[item.category].push(`<div class="tool-pill"><a href="${item.link}" target="_blank">${key}</a></div>`);
                }
            });
            const categoryList = document.getElementById('categoryList');
            categoryList.innerHTML = Object.keys(categoryMap).map(cat => `<h2 class="category-heading">${cat}</h2>${categoryMap[cat].join('')}`).join('');
            resolve();
        });
    });
}
