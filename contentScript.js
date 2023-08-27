import {unpack} from 'msgpackr';
import {Buffer} from 'buffer'; 


const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.addedNodes && mutation.addedNodes.length > 0) {
			if (mutation.target.nodeName != 'DIV') {
				return;
			}
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				if (mutation.addedNodes[i].textContent.indexOf('content_type:application/msgpack') < 0 || mutation.addedNodes[i].textContent.indexOf('Encoding: base64') < 0) {
					continue;
				}
				const message = mutation.addedNodes[i].querySelector('div > table > tbody > tr:nth-child(5) > td > pre');
				if (message) {
					try {
						const updatedMessage = JSON.stringify(unpack(Buffer.from(message.textContent.trim(), 'base64')));
						message.textContent = updatedMessage;
					} catch (e) {
						console.log(`error unpacking "${message.textContent.trim()}"`, e);
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
