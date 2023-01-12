import { Command, CommandRunner, Option } from 'nest-commander';
import FsHandler from '../lib/handlers/FsHandler';
import { PuppeteerService } from '../puppeteer/puppeteer.service';
import * as moment from 'moment';
import * as path from 'path';
import { readFile } from 'fs/promises';

const sleep = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

@Command({
  name: 'record',
  arguments: '<path>',
  description: 'Basic command for testing commander',
  options: { isDefault: true },
})
export class BasicCommand extends CommandRunner {
  constructor(private readonly puppeteerService: PuppeteerService) {
    super();
  }

  async run(inputs: string[], options: Record<string, any>) {
    console.log(`got inputes ${inputs.length} ${JSON.stringify(options)}`);

    const token = await this.getToken();

    if (!token) {
      console.log(`Token is not set`);
      return;
    }

    const basePath = path.resolve(inputs[0]);

    const fileExists = await FsHandler.verifyFileExists(basePath);
    if (!fileExists) {
      console.log('File does not exist');
      return;
    }
    //TODO do multiple geodata checks?
    let data = await FsHandler.readJSONFile(basePath);
    console.log(`data type ${data.type}`);
    if (data.type === 'FeatureCollection') {
      data = data.features[0];
    }

    if (!data) {
      console.log('No data to record');
      return;
    }

    const appFlags = {
      mapLoaded: false,
      animationFinished: false,
    };

    const splitPath = basePath.split('/');
    const filename = splitPath.pop().split('.')[0];
    const pathToVideo = splitPath.join('/') + '/';

    await this.puppeteerService.init(appFlags, {
      geo: data,
      title: options.title || undefined,
      subtitle: options.subtitle || undefined,
      date: options.date || undefined,
      style: options.style,
      token: token,
      downloadFolder: pathToVideo,
      filename: filename,
    });

    while (!appFlags.mapLoaded) {
      await sleep(500);
    }

    // const splitPath = basePath.split('/');
    // const filename = splitPath.pop().split('.')[0];
    // const pathToVideo = splitPath.join('/') + '/';

    // await this.puppeteerService.startCapturingScreen(pathToVideo, filename);
    // await this.puppeteerService.captureScreen(pathToVideo, filename);

    while (!appFlags.animationFinished) {
      await sleep(500);
    }

    console.time('wait');
    await this.puppeteerService.waitForDownload();
    console.timeEnd('wait');
    const res = await this.puppeteerService.makeVideo();
    console.log(`Res ${res}`);

    await this.puppeteerService.close();
    // const res = await this.puppeteerService.stopCapturingScreen();
    // console.log(`Result of record: ${res}`);
    if (!res) {
      console.log('Error during record');
      return;
    }

    console.log(`Video sucessfully saved to ${pathToVideo}${filename}.mp4`);
  }

  @Option({
    flags: '-t, --title [title]',
    description: 'Title of journey',
  })
  parseTitle(val: string) {
    return val;
  }

  @Option({
    flags: '-s, --subtitle [subtitle]',
    description: 'Subtitle of journey',
  })
  parseSubtitle(val: string) {
    return val;
  }

  @Option({
    flags: '-d, --date [date]',
    description: 'Date of journey',
  })
  parseDate(val: string) {
    let res;
    const pattern = 'Do MMMM YYYY';
    try {
      res = moment(new Date(val)).format(pattern);
    } catch (e) {
      console.log('Error during parsing data');
      res = moment().format(pattern);
    }
    return res;
  }

  @Option({
    flags: '-st, --style [style]',
    description: 'Style of mapbox map',
  })
  parseStyle(val: string) {
    return val;
  }

  async getToken() {
    const path = __dirname;
    let token;
    try {
      token = await readFile(`${path}/../../keys/token`, 'utf8');
    } catch (e) {
      console.log(`getToken | err ${e}`);
      return null;
    }
    return token;
  }
}
