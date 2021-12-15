import path from 'path';
import fs from 'fs';
import ExtraBrowser from './extra-browser';
import { NoThrow } from './utils';
import { setTimeout } from 'timers/promises';
import { Browser, ElementHandle } from 'puppeteer';
import Jimp from 'jimp';

const _30secs = 30 * 1000;
const _3secs = 3 * 1000;
const _1sec = 1 * 1000;
export default class DefiWarrior {
  account: string;
  exb: ExtraBrowser;
  page: Browser;
  constructor(account: string) {
    this.account = account;
    this.exb = new ExtraBrowser();
  }

  async loadGame() {
    await this.openBrowser();
  }

  async autoPvP() {
    await this.exb.goto('https://app.defiwarrior.io/playing');
    await this.exb.waitSelector('#iframe-game', true, _30secs);
    await setTimeout(_3secs);

    const frame = await (await this.exb.$('#iframe-game')).contentFrame();
    await frame.waitForSelector('#unity-canvas');
    await setTimeout(_3secs);

    const playButton = { // Play game color point
      colors: [2612461567],
      x: 1041,
      y: 750
    };
    while (true) {
      const data = await this.saveGameScreennshot() as Buffer;
      const img = await Jimp.read(data);

      const color = img.getPixelColor(playButton.x, playButton.y);
      if (playButton.colors.includes(color)) {
        await this.exb.page.mouse.click(playButton.x, playButton.y);
        await setTimeout(_3secs);
        break;
      }
      await setTimeout(_1sec);
    }

    const pvpButton = { // PvP
      colors: [4227795199],
      x: 1081,
      y: 616
    };
    while (true) {
      const data = await this.saveGameScreennshot() as Buffer;
      const img = await Jimp.read(data);

      const color = img.getPixelColor(pvpButton.x, pvpButton.y);
      if (pvpButton.colors.includes(color)) {
        await this.exb.page.mouse.click(pvpButton.x, pvpButton.y);
        await setTimeout(_3secs);
        break;
      }
      await setTimeout(_1sec);
    }

    const autoBattleBtn = { // Auto battle button
      colors: [4294967295],
      x: 483,
      y: 830
    };

    const ortherMath = { // Other match
      colors: [214292735, 500286719],
      x: 762,
      y: 789
    };

    while (true) {
      const data = await this.saveGameScreennshot() as Buffer;
      const img = await Jimp.read(data);
      const color = img.getPixelColor(autoBattleBtn.x, autoBattleBtn.y);
      
      if (autoBattleBtn.colors.includes(color)) {
        await this.exb.page.mouse.click(autoBattleBtn.x, autoBattleBtn.y);
        await setTimeout(_3secs);
        // break;
      }

      await this.exb.page.mouse.click(ortherMath.x, ortherMath.y);

      await setTimeout(_1sec);
    }
  }

  async saveGameScreennshot() {
    const data = await this.exb.page.screenshot({
      path: 'D:\\Tmp\\image.png',
      type: 'jpeg',
      quality: 100,
      omitBackground: true,
      encoding: 'binary',
    });


    return data;
  }


  async openBrowser() {
    const profilePath = path.join(__dirname, '../../', `.data/${this.account}`);
    fs.mkdirSync(profilePath, {
      recursive: true,
    });
    await this.exb.open(profilePath);
  }
}

interface ColorClickPoint {
  colors: number[];
  x: number,
  y: number;
}