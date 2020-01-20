import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoService } from './mongo.service';
import { PodcatSchema } from './schemas/podcast.schema';
import { EventModule } from '../event/event.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: 'podcasts', schema: PodcatSchema }]), EventModule],
    providers: [MongoService],
    exports: [MongoService]
})
export class MongoModule { }
    