import { Command, CommandRunner } from 'nest-commander';
import * as fs from 'fs/promises';
import axios from 'axios';
import FsHandler from '../lib/handlers/FsHandler';

export const MAPBOX_URL = 'https://api.mapbox.com/tokens/v2';

@Command({
  name: 'setToken',
  arguments: '<token>',
  description: 'Command to set token for Mapbox services',
})
export class SetTokenCommand extends CommandRunner {
  async run(inputs: string[]) {
    const [token] = inputs;
    const tokenValid = await SetTokenCommand.validateToken(token);
    if (!tokenValid) {
      console.log('Token is invalid');
      return;
    }
    await this.writeToken(token);
  }

  static async validateToken(token): Promise<boolean> {
    let res;
    try {
      res = await axios.get(MAPBOX_URL, {
        headers: {
          Accept: 'application/json',
        },
        params: {
          access_token: token,
        },
      });
    } catch (e) {
      console.log(`validateToken | err ${e}`);
      return false;
    }
    const { code } = res.data;
    console.log(`code ${code}`);
    if (code === 'TokenValid') {
      return true;
    }
    return false;
  }

  async writeToken(token) {
    try {
      const path = __dirname;
      await FsHandler.ensurePathExists(`${path}/../../keys`);
      await fs.writeFile(`${path}/../../keys/token`, token);
    } catch (e) {
      console.log(`writeToken | err ${e}`);
      return;
    }
    console.log(`token sucessfully saved`);
  }
}
