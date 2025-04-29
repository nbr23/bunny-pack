function showStatus(message, type) {
	const status = document.getElementById('status');
	status.textContent = message;
	status.className = type;
	setTimeout(() => {
		status.textContent = '';
		status.className = '';
	}, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
	const darkMode = await browser.storage.local.get('darkMode');
	const darkModeCheckbox = document.getElementById('dark-mode');
	darkModeCheckbox.checked = darkMode.darkMode || false;
	darkModeCheckbox.addEventListener('change', async () => {
		await browser.storage.local.set({ darkMode: darkModeCheckbox.checked });
		showStatus('Settings saved', 'success');
	});

	const saveButton = document.getElementById('save');
	saveButton.addEventListener('click', async () => {
		const darkMode = darkModeCheckbox.checked;
		await browser.storage.local.set({ darkMode });
		showStatus('Settings saved', 'success');
	});
});
