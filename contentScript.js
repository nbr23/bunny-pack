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
						copyButton.addEventListener('click', function() {
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
