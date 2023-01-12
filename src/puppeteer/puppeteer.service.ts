import { Injectable } from '@nestjs/common';
import { Page, Browser, launch } from 'puppeteer';
import PuppeteerVideoRecorder from '../lib/videoRecorder';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';

export interface Result {
  err?: any;
  done?: boolean;
}

export interface Config {
  geo: any;

  title: string;

  subtitle: string;

  date: string;

  style?: string;

  token: string;

  downloadFolder: string;

  filename: string;
}

export interface AppFlags {
  mapLoaded: boolean;
  animationFinished: boolean;
}

@Injectable()
export class PuppeteerService {
  private browser: Browser;
  private page: Page;
  private recorder;
  private client;

  async init(appFlags: AppFlags, config: Config) {
    console.log('init');
    this.browser = await launch({
      headless: 'new',
      devtools: false,
      args: [
        // '--use-gl=egl',
        // '--enable-usermedia-screen-capturing',
        // '--allow-http-screen-capture',
        '--no-sandbox',
        // '--auto-select-tab-capture-source-by-title="Hiiker Animations"',
        // '--auto-accept-this-tab-capture',
        // '--auto-select-desktop-capture-source=display',
        '--allow-file-access-from-files',
        '--enable-local-file-accesses',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    this.page.on('console', (msg) => console.log(`msg ${msg.text()}`));
    // .on('load', () => console.log('page loaded'))
    // .on('mapLoaded', () => console.log('map loaded'))
    // .on('error', (msg) => console.log(`msg ${msg.text()}`));

    await this.addListeners(appFlags, config);

    // this.recorder = new PuppeteerVideoRecorder();
    this.recorder = new PuppeteerVideoRecorder();
    this.recorder.init({
      outputFolder: config.downloadFolder,
      filename: config.filename,
    });

    this.client = await this.page.target().createCDPSession();
    await this.client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: config.downloadFolder + 'images/',
    });
    const pathToHtml = `${__dirname}/../public/index.html`;
    const htmlUrl = `file://${pathToHtml}`;
    console.log(`html ${htmlUrl}`);
    await this.page.goto(htmlUrl, {
      waitUntil: 'networkidle0',
      timeout: 60 * 1000 * 60,
    });

    await this.page.evaluate(() => {
      console.log('init');
      document.dispatchEvent(
        new CustomEvent('init', { detail: window['getData']() }),
      );
    });
  }

  private async addListeners(appFlags: AppFlags, config: Config) {
    console.log(`addListeners ${appFlags} ${config}`);
    await this.page.exposeFunction('getData', () => {
      console.log('getData');
      return config;
    });

    await this.page.exposeFunction('onMapLoaded', ({ type }) => {
      console.log(`onMapLoaded fired: ${type}`);
      appFlags.mapLoaded = true;
    });

    await this.page.exposeFunction('onAnimationFinished', ({ type }) => {
      console.log(`onAnimationFinished fired: ${type}`);
      appFlags.animationFinished = true;
    });

    await this.page.evaluateOnNewDocument(() => {
      window.addEventListener('mapLoaded', ({ type }) => {
        window['onMapLoaded']({ type });
      });
    });

    await this.page.evaluateOnNewDocument(() => {
      window.addEventListener('animationFinished', ({ type }) => {
        window['onAnimationFinished']({ type });
      });
    });
  }

  async close() {
    await this.browser.close();
  }

  getPage() {
    return this.page;
  }

  async getPageContent() {
    return await this.page.content();
  }

  // async captureScreen(pathToSave, filename) {
  //   try {
  //     console.log(`${pathToSave}${filename}`);
  //     await this.recorder.start(`${pathToSave}${filename}.mp4`);
  //   } catch (e) {
  //     console.log(`captureScreen | Err ${JSON.stringify(e)}`);
  //   }
  // }

  // async startCapturingScreen(pathToSave, filename) {
  //   console.log('Start capturing screen', pathToSave);
  //   try {
  //     await this.recorder.init({
  //       page: this.page,
  //       outputFolder: pathToSave,
  //       filename: filename,
  //     });

  //     await this.recorder.start();
  //   } catch (e) {
  //     console.log(`startCapturingScreen | Err ${JSON.stringify(e)}`);
  //   }
  // }

  // async stopCapturingScreen(): Promise<any> {
  //   console.log('Stop capturing screen');
  //   if (!this.page) {
  //     console.log('No page opened');
  //     return null;
  //   }
  //   if (!this.recorder) {
  //     console.log('No recorder detected');
  //     return null;
  //   }
  //   try {
  //     const res = await this.recorder.stop();
  //     await this.browser.close();
  //     return res;
  //   } catch (e) {
  //     console.log(`stopCapturingScreen | Error ${JSON.stringify(e)}`);
  //     return null;
  //   }
  // }
  async makeVideo(ffmpegCommand = '') {
    return await this.recorder.createVideo(ffmpegCommand);
  }

  async waitForDownload(): Promise<any> {
    return await this.page.waitForNetworkIdle({
      idleTime: 30000,
      timeout: 60000,
    });
  }
}
