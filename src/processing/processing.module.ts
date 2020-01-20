import { Module, HttpModule } from '@nestjs/common';
import { YoutubeService } from './youtube/youtube.service';
import { ConverterService } from './converter/converter.service';
import { UploaderService } from './uploader/uploader.service';
import { EventModule } from '../event/event.module';
import { ConfigModule } from '../config/config.module';
import { ProcessingService } from './processing.service';
import { MongoModule } from '../mongo/mongo.module';

@Module({
    imports: [EventModule, ConfigModule, MongoModule, HttpModule],
    providers: [YoutubeService, ConverterService, UploaderService, ProcessingService],
    exports: [YoutubeService, ProcessingService]
})
export class ProcessingModule { }
