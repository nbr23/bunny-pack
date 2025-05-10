function showStatus(message, type) {
	const status = document.getElementById('status');
	status.textContent = message;
	status.className = type;
	setTimeout(() => {
		status.textContent = '';
		status.className = '';
	}, 3000);
}

async function getStorageData(key) {
	return new Promise((resolve) => {
		if (typeof browser !== 'undefined') {
			browser.storage.local.get(key).then(resolve);
		} else if (typeof chrome !== 'undefined') {
			chrome.storage.local.get(key, resolve);
		}
	});
}

async function setStorageData(data) {
	return new Promise((resolve) => {
		if (typeof browser !== 'undefined') {
			browser.storage.local.set(data).then(resolve);
		} else if (typeof chrome !== 'undefined') {
			chrome.storage.local.set(data, resolve);
		}
	});
}

document.addEventListener('DOMContentLoaded', async () => {
	try {
		const darkModeData = await getStorageData('darkMode');
		const darkModeCheckbox = document.getElementById('dark-mode');
		darkModeCheckbox.checked = darkModeData.darkMode || false;
		
		darkModeCheckbox.addEventListener('change', async () => {
			await setStorageData({ darkMode: darkModeCheckbox.checked });
			showStatus('Settings saved', 'success');
		});

		const saveButton = document.getElementById('save');
		saveButton.addEventListener('click', async (event) => {
			event.preventDefault();
			const darkMode = darkModeCheckbox.checked;
			await setStorageData({ darkMode });
			showStatus('Settings saved', 'success');
		});
	} catch (error) {
		console.error('Error loading options:', error);
		showStatus('Error loading settings', 'error');
	}
});
