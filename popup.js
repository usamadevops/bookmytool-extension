function openTab(evt, tabName) {
  let tabcontent = document.getElementsByClassName("tabContent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  let tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

document.addEventListener('DOMContentLoaded', async function () {
    document.getElementById('newBookmarkBtn').addEventListener('click', function(event) {
        openTab(event, 'form');
    });
    document.getElementById('savedToolsBtn').addEventListener('click', function(event) {
        openTab(event, 'categoryList');
    });

    document.getElementById('newBookmarkBtn').click();

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
        alert('New Tool Saved Successfully');
        
        document.getElementById('toolName').value = '';
        document.getElementById('toolLink').value = '';
        document.getElementById('toolDescription').value = '';
        document.getElementById('categorySelect').value = '';
        document.getElementById('savedToolsBtn').click();

        await loadTools();
    });
});

async function loadDefaultCategories() {
    const defaultCategories = ["General", "Programming", "Design", "Marketing", "Finance", "Education", "Health", "Entertainment", "News", "Travel", "Sports", "Food", "Shopping", "Social Media", "Productivity", "Others"];
    return new Promise((resolve) => {
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
            select.innerHTML += `<option value="newCategory">Add new category...</option>`;
            select.onchange = function() {
                if (this.value === "newCategory") {
                    let newCategory = prompt("Enter new category:");
                    if (newCategory) {
                        addCategory(newCategory);
                        this.value = newCategory;
                    } else {
                        this.value = categories[0];
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
            // Iterate over each item in the storage
            Object.keys(items).forEach(function (key) {
                if (key !== 'categories') { // Ensure we're only dealing with tool items
                    const item = items[key];
                    if (!categoryMap[item.category]) {
                        categoryMap[item.category] = []; // Create an array for new categories
                    }
                    // Add a tool pill for each tool in the category
                    categoryMap[item.category].push(`<div class="tool-pill"><a href="${item.link}" target="_blank">${key}</a></div>`);
                }
            });

            const categoryList = document.getElementById('categoryList');
            // Map each category to its header and corresponding pills
            categoryList.innerHTML = Object.keys(categoryMap).map(cat => `
                <h2 class="category-heading">${cat}</h2>
                <div class="pills">${categoryMap[cat].join('')}</div>
            `).join('');

            resolve();
        });
    });
}
