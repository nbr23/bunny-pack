import { unpack } from 'msgpackr';
import { Buffer } from 'buffer';

function isQueueDetailsPage() {
	const fragment = window.location.hash.substring(1);
	const [path, queryString] = fragment.split('?');
	return path.startsWith('/queues/') && path.split('/').length >= 2;
}

function getCurrentVhost() {
	const fragment = window.location.hash.substring(1);
	const [path] = fragment.split('?');
	const parts = path.split('/');
	return parts[2] ? decodeURIComponent(parts[2]) : '%2F';
}

async function isDarkModeEnabled() {
	let result = {};
	if (typeof browser !== 'undefined') {
		result = await browser.storage.local.get('darkMode');
	} else if (typeof chrome !== 'undefined') {
		result = await new Promise(resolve => chrome.storage.local.get('darkMode', resolve));
	}
	return result.darkMode || false;
}

async function createSendToQueueForm(message, onClose) {
	const darkMode = await isDarkModeEnabled();

	const overlay = document.createElement('div');
	overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.5);
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
	`;

	const form = document.createElement('div');
	form.style.cssText = `
		background: ${darkMode ? 'rgb(31,32,35)' : 'white'};
		color: ${darkMode ? 'rgb(195, 195, 195)' : 'black'};
		padding: 20px;
		border-radius: 8px;
		min-width: 300px;
		box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		border: ${darkMode ? '1px solid rgb(56,58,64)' : 'none'};
	`;

	const title = document.createElement('h3');
	title.textContent = 'Copy Message to Queue';
	title.style.marginTop = '0';

	const queueLabel = document.createElement('label');
	queueLabel.textContent = 'Queue Name:';
	queueLabel.style.display = 'block';
	queueLabel.style.marginBottom = '5px';

	const queueInput = document.createElement('input');
	queueInput.type = 'text';
	queueInput.placeholder = 'Enter queue name';
	queueInput.style.cssText = `
		width: 100%;
		padding: 8px;
		margin-bottom: 15px;
		border: 1px solid ${darkMode ? 'rgb(56,58,64)' : '#ccc'};
		border-radius: 4px;
		box-sizing: border-box;
		background-color: ${darkMode ? 'rgb(43, 43, 46)' : 'white'};
		color: ${darkMode ? 'rgb(195, 195, 195)' : 'black'};
	`;

	const buttonContainer = document.createElement('div');
	buttonContainer.style.cssText = `
		display: flex;
		gap: 10px;
		justify-content: flex-end;
	`;

	const sendButton = document.createElement('button');
	sendButton.textContent = 'Send';
	sendButton.style.cssText = `
		padding: 8px 16px;
		background: ${darkMode ? '#005a8b' : '#007cba'};
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	`;

	const cancelButton = document.createElement('button');
	cancelButton.textContent = 'Cancel';
	cancelButton.style.cssText = `
		padding: 8px 16px;
		background: ${darkMode ? '#4a5055' : '#6c757d'};
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	`;

	sendButton.addEventListener('click', async () => {
		const queueName = queueInput.value.trim();
		if (!queueName) {
			alert('Please enter a queue name');
			return;
		}

		try {
			const currentVhost = getCurrentVhost();
			const credentials = localStorage.getItem('rabbitmq.credentials');
			const response = await fetch(`/api/exchanges/${encodeURIComponent(currentVhost)}/amq.default/publish`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${credentials}`,
				},
				body: JSON.stringify({
					vhost: currentVhost,
					name: 'amq.default',
					properties: {
						delivery_mode: 2,
						headers: {},
						content_type: 'application/json',
					},
					routing_key: queueName,
					delivery_mode: '2',
					payload: JSON.stringify(message),
					payload_encoding: 'string',
					headers: {},
					props: {},
				}),
			});

			if (response.ok) {
				alert('Message sent successfully!');
				onClose();
			} else {
				const errorText = await response.text();
				alert(`Failed to send message: ${response.status} ${errorText}`);
			}
		} catch (error) {
			alert(`Error sending message: ${error.message}`);
		}
	});

	cancelButton.addEventListener('click', onClose);
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) {
			onClose();
		}
	});

	buttonContainer.appendChild(cancelButton);
	buttonContainer.appendChild(sendButton);

	form.appendChild(title);
	form.appendChild(queueLabel);
	form.appendChild(queueInput);
	form.appendChild(buttonContainer);

	overlay.appendChild(form);

	return overlay;
}

function handleRabbitMQMessageDecoding(mutations) {
	if (!isQueueDetailsPage()) {
		return;
	}

	mutations.forEach((mutation) => {
		if (mutation.addedNodes && mutation.addedNodes.length > 0) {
			if (mutation.target.nodeName != 'DIV') {
				return;
			}
			if (mutation.target.id == 'main') {
				const getMessageForm = mutation.target.querySelector('form[action="#/queues/get"]');
				if (getMessageForm) {
					const truncateField = getMessageForm.querySelector('input[name="truncate"]');
					if (truncateField) {
						truncateField.remove();
					}
				}
				return;
			}
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				let parsedMsgObject = null;
				let message = null;
				if (mutation.addedNodes[i].textContent.indexOf('content_type:application/msgpack') >= 0 || mutation.addedNodes[i].textContent.indexOf('Encoding: base64') >= 0) {
					message = mutation.addedNodes[i].querySelector('div > table > tbody > tr:nth-child(5) > td > pre');
					if (message) {
						try {
							parsedMsgObject = unpack(Buffer.from(message.textContent.trim(), 'base64'));
						} catch (e) {
							console.log(`error unpacking "${message.textContent.trim()}"`, e);
						}
					}
				} else if (mutation.addedNodes[i].textContent.indexOf('content_type:application/json') >= 0 || mutation.addedNodes[i].textContent.indexOf('Encoding: string') >= 0) {
					message = mutation.addedNodes[i].querySelector('div > table > tbody > tr:nth-child(5) > td > pre');
					if (message) {
						try {
							parsedMsgObject = JSON.parse(message.textContent.trim());
						} catch (e) {
							console.log(`error jsonparsing "${message.textContent.trim()}"`, e);
						}
					}
				} else {
					continue;
				}

				if (parsedMsgObject) {
					try {
						message.textContent = JSON.stringify(parsedMsgObject, null, 2);
					} catch (e) {
						console.log(`error setting message`, e);
					}
					try {
						const base64Msg = btoa(unescape(encodeURIComponent(JSON.stringify(parsedMsgObject, null, 2))));
						const messageText = decodeURIComponent(escape(atob(`${base64Msg}`)));

						const buttonContainer = document.createElement('div');
						buttonContainer.style.cssText = `
							display: flex;
							gap: 10px;
							margin-bottom: 10px;
						`;

						const copyButton = document.createElement('button');
						copyButton.className = 'copy-msg-btn';
						copyButton.textContent = 'Copy';
						copyButton.addEventListener('click', function () {
							navigator.clipboard.writeText(messageText);
						});

						const sendButton = document.createElement('button');
						sendButton.className = 'send-msg-btn';
						sendButton.textContent = 'Send to queue';
						sendButton.addEventListener('click', async function () {
							const form = await createSendToQueueForm(parsedMsgObject, function() {
								document.body.removeChild(form);
							});
							document.body.appendChild(form);
						});

						buttonContainer.appendChild(copyButton);
						buttonContainer.appendChild(sendButton);

						const targetElement = mutation.addedNodes[i].querySelector('div > table > tbody > tr:nth-child(5) > td');
						targetElement.prepend(buttonContainer);
					} catch (e) {
						console.log(`error adding buttons`, e);
					}
				}
			}
		}
	});
}

const observer = new MutationObserver((mutations) => {
	handleRabbitMQMessageDecoding(mutations);
});

const darkModeMappingBackground = {
	'white': 'rgb(31,32,35)',
	'#ffffff': 'rgb(31,32,35)',
	'#fff': 'rgb(31,32,35)',
	'rgb(255, 255, 255)': 'rgb(31,32,35)',

	'rgb(255, 102, 0)': 'rgb(121, 52, 0)',


	'#F8F8F8': 'rgb(31,32,35)',

	'rgb(102, 102, 102)': 'rgb(121, 120, 120)',
	'rgba(255, 255, 255, 1)': 'rgb(31,32,35)',

	'rgb(240, 240, 240)': 'rgb(31,32,35)',

	'rgb(68, 68, 68)': 'rgb(162, 162, 162)',


	'rgb(248, 248, 248)': 'rgb(56,58,64)',
	'#f0f0f0': 'rgb(56,58,64)',
	'#eee': 'rgb(56,58,64)',

	'rgb(136, 136, 136)': 'rgb(56,58,64)',
	'rgb(228, 228, 228)': 'rgb(56,58,64)',
	'rgb(250, 250, 250)': 'rgb(56,58,64)',
	'rgb(255, 240, 243)': 'rgb(74, 77, 85)',
	'rgb(255, 240, 243) !important': 'rgb(87, 45, 12)',
	'rgb(221, 221, 221)': 'rgb(56,58,64)',
	'rgb(238, 238, 238)': 'rgb(56,58,64)',

	'rgb(152, 248, 152)': 'rgb(0, 117, 0)',

	'rgb(153, 235, 255)': 'rgb(87, 45, 12)',

	'rgba(0, 0, 0, 0)': '#fff0f3',
	'black': '#fff0f3',

	// Chrome specific
	'-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(240, 240, 240)), to(rgb(224, 224, 224)))': '-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(50, 50, 50)), to(rgb(40, 40, 40)))',
	'-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(248, 248, 248)), to(rgb(255, 255, 255)))': '-webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(34, 34, 34)), to(rgb(24, 24, 24)))',
};


const darkModeMappingForeground = {
	'#484848': '#989898',
	'#444': '#rgb(152, 152, 152)',
	'#F60': '#rgb(99, 99, 99)',
	'#fff': 'rgb(31,32,35)',
	'white': 'rgb(31,32,35)',
	'black': '#e0e0e0',
	'#ddd': 'rgb(195, 195, 195)',
	'#666': 'rgb(195, 195, 195)',
	'#aaa': 'rgb(195, 195, 195)',
	'#888': 'rgb(195, 195, 195)',
	'#f88': 'rgb(133, 25, 25)',
	'rgb(136, 136, 136)': 'rgb(208, 208, 208)',
	'rgb(68, 68, 68)': 'rgb(141, 141, 141)',
};


const darkModeMappingBackgroundImage = {
	'linear-gradient(rgb(240, 240, 240) 0%, rgb(224, 224, 224) 100%)': 'linear-gradient(rgb(50, 50, 50) 0%, rgb(40, 40, 40) 100%)',
	'linear-gradient(rgb(248, 248, 248) 0%, rgb(255, 255, 255) 100%)': 'linear-gradient(rgb(34, 34, 34) 0%, rgb(24, 24, 24) 100%)',
};

const borderColorMapping = {
	'rgb(204, 204, 204)': 'rgb(85, 85, 85)',
	'rgb(240, 240, 240)': 'rgb(129, 129, 129)',
};

async function applyDarkMode() {
	const darkMode = await isDarkModeEnabled();

	if (document.title !== 'RabbitMQ Management') {
		console.log('Not on RabbitMQ Management page, skipping dark mode');
		return;
	}
	if (!darkMode) {
		console.log('Dark Bunny mode is not enabled');
		return;
	}
	console.log('Dark Bunny mode is enabled');
	const customStyles = document.createElement('style');
	customStyles.textContent = `
		body {
			background: rgb(31,32,35);
			color: rgb(195, 195, 195);
		}
		abbr.type {
			color: rgb(195, 195, 195);
			background-color: transparent !important;
		}
		abbr.normal {
			color: rgb(195, 195, 195);
			background-color: transparent !important;
		}
		input, textarea, select {
			background-color :rgb(43, 43, 46);
			color: rgb(195, 195, 195);
			border: 1px solid rgb(56,58,64);
		}
		`;
	document.head.appendChild(customStyles);

	const styleSheets = Array.from(document.styleSheets);
	styleSheets.forEach(sheet => {
		try {
			const cssRules = Array.from(sheet.cssRules || []);

			cssRules.forEach(rule => {
				if (rule.style) {
					if (rule.style.backgroundColor && Object.keys(darkModeMappingBackground).includes(rule.style.backgroundColor)) {
						rule.style.setProperty('background-color', darkModeMappingBackground[rule.style.backgroundColor], 'important');
					}
					if (rule.style.color && Object.keys(darkModeMappingForeground).includes(rule.style.color)) {
						rule.style.setProperty('color', darkModeMappingForeground[rule.style.color], 'important');
					}
					if (rule.style.borderColor && Object.keys(borderColorMapping).includes(rule.style.borderColor)) {
						rule.style.setProperty('border-color', borderColorMapping[rule.style.borderColor], 'important');
					}
					if (rule.style.background && Object.keys(darkModeMappingBackground).includes(rule.style.background)) {
						rule.style.setProperty('background', darkModeMappingBackground[rule.style.background], 'important');
					}
					if (rule.style.backgroundImage && Object.keys(darkModeMappingBackgroundImage).includes(rule.style.backgroundImage)) {
						rule.style.setProperty('background-image', darkModeMappingBackgroundImage[rule.style.backgroundImage], 'important');
					}
				}
			});
		} catch (e) {
			console.log('Could not process stylesheet:', e);
		}
	});
}

function bunnyPackSetup() {
	if (document.title !== 'RabbitMQ Management') {
		console.log('Not on RabbitMQ Management page, skipping dark mode');
		return;
	}

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	applyDarkMode();
}

bunnyPackSetup();
