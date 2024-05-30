
function visibleexport(tabName) {
    if (tabName == 'categoryList') {
        document.getElementsByClassName('export')[0].style.display = "block";
    }
    else {
        document.getElementsByClassName('export')[0].style.display = "none";
    }
}

function openTab(evt, tabName) {

    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    visibleexport(tabName);
}

function exportCSV() {
    chrome.storage.sync.get(null, function(items) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Tool Name,Tool Description,URL,Category\n"; 
        for (const key in items) {
            if (items.hasOwnProperty(key) && key !== 'categories') {
                const tool = items[key];
                const row = [
                    `"${key.replace(/"/g, '""')}"`,
                    `"${tool.description.replace(/"/g, '""')}"`,
                    `"${tool.link.replace(/"/g, '""')}"`,
                    `"${tool.category.replace(/"/g, '""')}"`
                ];
                csvContent += row.join(",") + "\n";
            }
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const date = new Date();
        const formattedDate = date.getDate() + " " + date.toLocaleString('default', { month: 'short' }) + " " + date.getFullYear().toString().substr(-2);
        link.setAttribute("download", formattedDate + " tools.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

document.addEventListener('DOMContentLoaded', async function () {

    document.getElementById('newBookmarkBtn').addEventListener('click', function (event) {
        openTab(event, 'form');
    });
    document.getElementById('savedToolsBtn').addEventListener('click', function (event) {
        openTab(event, 'categoryList');
    });
    document.getElementById('newBookmarkBtn').click();

    document.getElementById('cross_button').addEventListener('click', function () {
        window.close();
    });
    document.getElementById('exported').addEventListener('click', function (event) {
        exportCSV();
    });

    if (chrome && chrome.tabs) {
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
                document.getElementById('categorySelect').value = category; // Auto select the new added category
            }
        }
        const toolData = { link: toolLink, description: toolDescription, category: category };
        await chrome.storage.sync.set({ [toolName]: toolData });
        document.getElementById('toolName').value = '';
        document.getElementById('toolLink').value = '';
        document.getElementById('toolDescription').value = '';
        document.getElementById('savedToolsBtn').click();
        await loadTools();
    });
});

async function loadDefaultCategories() {
    const defaultCategories = ["Select a Category","Programming", "Design", "Marketing", "Finance", "Education", "Health", "Entertainment", "News", "Travel", "Sports", "Food", "Shopping", "Social Media", "Productivity"];
    return new Promise((resolve, reject) => {
        chrome?.storage?.sync?.get('categories', function (data) {
            const categories = data.categories || defaultCategories;
            categories[0] = "Select a Category";
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
            select.innerHTML = `<option value="" disabled selected>${categories[0]}</option>` + categories.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('');
            select.innerHTML += `<option value="newCategory">Add new category...</option>`;
            select.onchange = function () {
                if (this.value === "newCategory") {
                    let newCategory = prompt("Enter new category:");
                    if (newCategory) {
                        addCategory(newCategory);
                        this.value = newCategory;
                    } else {
                        this.value = categories[1];
                    }
                }
            };
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
                    categoryMap[item.category].push(`<div class="tool-pill"><a href="${item.link}" target="_blank" style="outline: none;">${key}</a><button class="remove-tool" data-tool="${key}" style="outline: none;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.6668 2.66667H10.3335L9.66683 2H6.3335L5.66683 2.66667H3.3335V4H12.6668M4.00016 12.6667C4.00016 13.0203 4.14064 13.3594 4.39069 13.6095C4.64074 13.8595 4.97987 14 5.3335 14H10.6668C11.0205 14 11.3596 13.8595 11.6096 13.6095C11.8597 13.3594 12.0002 13.0203 12.0002 12.6667V4.66667H4.00016V12.6667Z" fill="#FDA4AF"/>
                    </svg>
                    </button></div>`);
                }
            });
            const categoryList = document.getElementById('categoryList');
            categoryList.innerHTML = Object.keys(categoryMap).map(cat => `
                <h2 class="category-heading">${cat}</h2>
                <div class="pills">${categoryMap[cat].join('')}</div>
            `).join('');

            const removeButtons = document.getElementsByClassName('remove-tool');
            for (let i = 0; i < removeButtons.length; i++) {
                removeButtons[i].addEventListener('click', async function (event) {
                    const toolName = event.target.getAttribute('data-tool');
                    await chrome.storage.sync.remove(toolName);
                    await loadTools();
                });
            }

            resolve();
        });
    });
}
