document.addEventListener('DOMContentLoaded', async () => {
    const childIdInput = document.getElementById('childId');
    const authTokenInput = document.getElementById('authToken');
    const saveBtn = document.getElementById('saveBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusDiv = document.getElementById('status');

    const loginSection = document.getElementById('login-section');
    const activeSection = document.getElementById('active-section');
    const displayChildId = document.getElementById('display-childId');

    // Remove legacy parentId key from older extension versions.
    await chrome.storage.local.remove(['parentId']);

    // Load existing data from Chrome storage
    const data = await chrome.storage.local.get(['childId', 'authToken']);

    if (data.childId) {
        // Already configured
        loginSection.style.display = 'none';
        activeSection.style.display = 'block';
        displayChildId.textContent = data.childId;
    } else {
        // Needs configuration
        loginSection.style.display = 'block';
        activeSection.style.display = 'none';
    }

    // Handle saving configuration
    saveBtn.addEventListener('click', async () => {
        const childId = childIdInput.value.trim();
        const authToken = authTokenInput.value.trim();

        if (childId) {
            await chrome.storage.local.set({ childId, authToken });

            statusDiv.textContent = 'Settings saved!';
            statusDiv.style.display = 'block';

            // Briefly show success message then switch views
            setTimeout(() => {
                statusDiv.style.display = 'none';
                loginSection.style.display = 'none';
                activeSection.style.display = 'block';
                displayChildId.textContent = childId;
            }, 1500);
        } else {
            alert('Child ID is required to start monitoring.');
        }
    });

    // Handle clearing configuration
    logoutBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove(['childId', 'authToken', 'parentId']);

        loginSection.style.display = 'block';
        activeSection.style.display = 'none';

        // Clear inputs
        childIdInput.value = '';
        authTokenInput.value = '';
    });
});
