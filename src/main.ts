import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('bootstraping');
  await CommandFactory.run(AppModule);
}
bootstrap();
