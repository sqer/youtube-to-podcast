import { Injectable } from '@nestjs/common';
import { EventService } from '../event/event.service';
import { Podcast } from '../models/podcast';
import { YoutubeService } from './youtube/youtube.service';
import { PodcastFile } from '../models/file';
import { ConverterService } from './converter/converter.service';
import { UploaderService } from './uploader/uploader.service';
import { MongoService } from '../mongo/mongo.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ProcessingService {

    constructor(
        private readonly configService: ConfigService,
        private readonly eventService: EventService,
        private readonly youtubeService: YoutubeService,
        private readonly converterService: ConverterService,
        private readonly uploaderService: UploaderService,
        private readonly mongoService: MongoService) {

        // Listen and react on events
        this.eventService.fileDownloaded$.subscribe((file: PodcastFile) => this.converterService.convert(file));
        this.eventService.fileConverted$.subscribe((file: PodcastFile) => this.uploaderService.upload(file));
        this.eventService.fileUploaded$.subscribe((file: PodcastFile) => this.mongoService.savePodcastAsUploaded(file));
    }

    /**
     * Start processing 
     * [downlaod mp4 file, convert file to mp3, upload file to podcast service, create episode ]
     * @param podcast the podcast data
     */
    startProcessing(podcast: Podcast): void {
        const showId: string = this.getShowId(podcast);
        if (showId) {
            podcast.showId = showId;
            this.youtubeService.downloadAudioFile(podcast);
        }
        else {
            console.log(`Skipped ${podcast.title}, could not find show id for given video`);
        }
    }

    /**
     * Returns show id (id used to categorize podcast) based on playlist id
     * @param podcast the podcast data
     */
    private getShowId(podcast: Podcast): string {
        const showsConfig: { showId: string, playlistId: string }[] = JSON.parse(this.configService.get("CAPTIVATE_SHOWS"));
        const matchingConfig = showsConfig.find(entry => entry.playlistId === podcast.playlistId);
        return matchingConfig ? matchingConfig.showId : null;
    }

}
