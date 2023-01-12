import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { BasicCommand } from './commands/basic';
import { SetTokenCommand } from './commands/token';
import { PuppeteerModule } from './puppeteer/puppeteer.module';

@Module({
  imports: [PuppeteerModule],
  providers: [AppService, BasicCommand, SetTokenCommand],
})
export class AppModule {}
