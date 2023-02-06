import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as morgan from 'morgan';
import { ValidationPipe } from '@nestjs/common';


const logStream = fs.createWriteStream('api.log', {
  flags: 'a'
})


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.use(morgan('combined', { stream: logStream }));
  await app.listen(3000);
}
bootstrap();
