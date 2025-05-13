import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'https://trustful-stellar-mainet.trust.ful.xyz',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      // Add any other frontend domains that need access
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Trustful Stellar Backend')
    .setDescription(`
    Backend API for the Trustful Stellar project. This API provides endpoints to manage communities
    in the Stellar blockchain network.
    
    ## Features
    - List all communities
    - Get detailed community information
    - Update community visibility
    
    ## Authentication
    Currently, endpoints are publicly accessible.
    
    ## Rate Limiting
    Please be mindful of rate limits and implement appropriate caching strategies.
    `)
    .setVersion('1.0')
    .addTag('Communities', 'Endpoints for managing Stellar communities')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
