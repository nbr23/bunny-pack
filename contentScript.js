import { unpack } from 'msgpackr';
import { Buffer } from 'buffer';


const observer = new MutationObserver((mutations) => {
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
						const copyButton = document.createElement('button');
						copyButton.className = 'copy-msg-btn';
						copyButton.textContent = 'Copy';
						copyButton.addEventListener('click', function () {
							navigator.clipboard.writeText(decodeURIComponent(escape(atob(`${base64Msg}`))));
						});

						const targetElement = mutation.addedNodes[i].querySelector('div > table > tbody > tr:nth-child(5) > td');
						targetElement.prepend(copyButton);
					} catch (e) {
						console.log(`error adding copy button`, e);
					}
				}
			}
		}
	});
});
observer.observe(document.body, {
	childList: true,
	subtree: true,
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
	'linear-gradient(rgb(240, 240, 240) 0%, rgb(224, 224, 224) 100%)': 'linear-gradient(rgb(101, 101, 101) 0%, rgb(87, 87, 87) 100%)',
	'linear-gradient(rgb(248, 248, 248) 0%, rgb(255, 255, 255) 100%)': 'linear-gradient(rgb(54, 54, 54) 0%, rgb(24, 24, 24) 100%)',
};

const borderColorMapping = {
	'rgb(204, 204, 204)': 'rgb(85, 85, 85)',
	'rgb(240, 240, 240)': 'rgb(129, 129, 129)',
};

async function applyDarkMode() {
	const { darkMode } = await browser.storage.local.get('darkMode') || { darkMode: false };
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

applyDarkMode();
