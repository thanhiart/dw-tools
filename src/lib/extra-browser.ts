import puppeteer, { Browser, ElementHandle, HTTPRequest, Page } from 'puppeteer';
import { setTimeout } from 'timers/promises';
const homepage = 'https://app.multiloginapp.com/WhatIsMyIP';
const _3min = 3 * 60 * 1000;
const _1min = 1 * 60 * 1000;
const _1sec = 1000;
const _3sec = 3000;
const _7sec = 7000;
const _30sec = 7000;

export default class ExtraBrowser {
	page: Page;
	browser: Browser;
	profile: string;
	market: string;
	isLoadImage = true;

	constructor(page?: Page) {
		this.page = page;
	}

	async open(userDataDir: string): Promise<{
		ok: boolean;
		page?: Page;
		message?: string;
	}> {
		// open home page and try catch Internal problem

		let message = '';
		let retry = 5;
		while (retry-- > 0) {
			try {
				this.browser = await puppeteer.launch({
					userDataDir,
					headless: false,
					defaultViewport: null,
					ignoreHTTPSErrors: true,
					args: [
						'--start-maximized',
						'--disable-web-security',
						'--disable-features=IsolateOrigins,site-per-process',
						'--disable-session-crashed-bubble',
						'--mute-audio',
						'--no-default-browser-check',
						'--disable-features=Translate',
					],
					ignoreDefaultArgs: ['--disable-extensions']
				});
				this.page = (await this.browser.pages()).shift();
				return {
					ok: true,
					page: this.page,
				};
			} catch (error) {
				message = error.message;
				console.debug(message);
				await setTimeout(10 * 1000);
			}
		}
		return {
			ok: false,
			message,
		};
	}

	async goto(url: string) {
		let retry = 3;
		let message = '';
		while (retry-- > 0) {
			try {
				await this.page.goto(url, {
					waitUntil: 'networkidle2',
					timeout: 180 * 1000,
				});
				return;
			} catch (error) {
				if (error.message.includes('ERR_INVALID_AUTH_CREDENTIALS')) {
					await setTimeout(7000);
					continue;
				}
				message = error.message;
			}
		}

		throw new Error(`go to url ${url} failed. ${message}`);
	}

	async clickJS(selector: string, throwError = true) {
		try {
			await this.page.$eval(selector, (ele: HTMLElement) => ele.click());
			await setTimeout(_1sec);
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async clickSelector(selector: string, throwError = true) {
		try {
			await this.clickElement(await this.page.$(selector));
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async waitForNavigation(timeout = 180 * 1000) {
		return await this.page.waitForNavigation({
			waitUntil: 'networkidle2',
			timeout,
		});
	}

	async waitButtonText(text: string, throwError = true, exact = false, timeout = _7sec) {
		return await this.waitText(text, 'button', throwError, exact, timeout);
	}

	async waitText(text: string, htmlTag = '*', throwError = true, exact = false, timeout = _7sec) {
		try {
			const slt = exact ? `//${htmlTag}[.='${text}']` : `//${htmlTag}[contains(.,'${text}')]`;
			await this.page.waitForXPath(slt, { timeout });
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async clickButtonText(text: string, throwError = true, exact = false) {
		return await this.clickText(text, 'button', throwError, exact);
	}

	async clickText(text: string, htmlTag = '*', throwError = true, exact = false) {
		try {
			const slt = exact ? `//${htmlTag}[.='${text}']` : `//${htmlTag}[contains(.,'${text}')]`;

			await this.clickElement((await this.page.$x(slt))[0]);
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async clickElement(element: ElementHandle<Element>) {
		// await element.click();
		await element.focus();
		await setTimeout(_1sec);

		const point = await element.clickablePoint();
		await this.page.mouse.click(point.x, point.y);
		await setTimeout(_1sec);
	}

	async waitTitleInclude(text: string, throwError = true, timeout = 7000) {
		try {
			await this.page.waitForFunction(async (text: string) => document.title.includes(text), { timeout }, text);
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async waitSelector(selector: string, throwError = true, timeout = 7000) {
		try {
			await this.page.waitForSelector(selector, { timeout });
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async type(selector: string, text: string, clear = true, throwError = true) {
		try {
			if (clear) {
				await this.setElementValue(selector, '');
				await setTimeout(500);
			}

			await this.page.type(selector, text, { delay: 70 });
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async setElementValue(selector: string, value: string, throwError = true) {
		try {
			await this.page.$eval(selector, (ele: any, value: string) => (ele.value = value), value);
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	$(selector: string) {
		return this.page.$(selector);
	}

	$$(selector: string) {
		return this.page.$$(selector);
	}

	async waitSelectorWithReload(selector: string, timeout = 7000) {
		if (!(await this.waitSelector(selector, false, timeout))) {
			await this.reload(false);
			return await this.waitSelector(selector, true, timeout);
		}

		return true;
	}

	async reload(throwError = true) {
		try {
			await this.page.reload({ waitUntil: 'networkidle2' });
			return true;
		} catch (error) {
			if (throwError) {
				throw error;
			}
			return false;
		}
	}

	async clean() {
		const pages = await this.browser.pages();
		for (let page of pages) {
			const client = await page.target().createCDPSession();
			await client.send('Network.clearBrowserCookies');
		}
	}

	async interceptRequest() {
		await this.page.setRequestInterception(true);
		this.page.on('request', (request: HTTPRequest) => {
			if (!this.isLoadImage && request.resourceType() == 'image') {
				request.abort();
				return;
			}
			request.continue();
		});
	}
}
