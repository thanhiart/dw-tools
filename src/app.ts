import fs from 'fs';
import path from 'path/win32';
import DefiWarrior from "./lib/defi-warrior";
import fetch from 'node-fetch';
import { setTimeout } from "timers/promises";
import notifier from 'node-notifier';
import readline from 'readline';

export default class App {
  async start() {
    console.clear();
    while (true) {
      const anwser = await this.question(' 1. Tạo profile \n 2. Mỡ profile \n 3. Auto PvP \n Nhập lựa chọn: ');
      switch (parseInt(anwser)) {
        case 1:
          const name = await this.question(' Nhập tên profile: ');
          await this.openProfile(name);
          break;
        case 2: {
          const folders = fs
            .readdirSync(path.join(__dirname, '..', '.data'), { withFileTypes: true })
            .filter(fol => fol.isDirectory())
            .map(fol => fol.name);
          for (let i = 0; i < folders.length; i++) {
            console.log(` ${i + 1}. ${folders[i]}`);
          }

          const index = await this.question(' Chọn profile: ');
          await this.openProfile(folders[parseInt(index) - 1]);

          break;
        }
        case 3: {
          const folders = fs
            .readdirSync(path.join(__dirname, '..', '.data'), { withFileTypes: true })
            .filter(fol => fol.isDirectory())
            .map(fol => fol.name);
          for (let i = 0; i < folders.length; i++) {
            console.log(` ${i + 1}. ${folders[i]}`);
          }

          const index = await this.question(' Chọn profile: ');
          this.autoPvP(folders[parseInt(index) - 1]);
          break;
        }     
      }
    }
  }

  async openProfile(name: string) {
    const defi = new DefiWarrior(name);
    defi.openBrowser();
  }

  async autoPvP(name: string) {
    const defi = new DefiWarrior(name);
    defi.loadGame().then(defi.autoPvP.bind(defi));
  }


  question(text: string): Promise<string> {
    return new Promise(res => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question(text, (anwser) => {
        rl.close();
        res(anwser);
      });
    });
  }
}

interface MarketConfition {
  priceLowerEqual: number;
  classes: string[];
  planets: string[];
  skills: string[];
}