import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { EventModule } from './event/event.module';
import { ProcessingModule } from './processing/processing.module';
import { MongoModule } from './mongo/mongo.module';

@Module({
  imports: [
    ConfigModule,
    ProcessingModule,
    EventModule,
    MongoModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGO_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [AppService]
})
export class AppModule {}
