import { Injectable } from '@nestjs/common';
import { EventService } from '../../event/event.service';
import { PodcastFile } from '../../models/file';
import * as ffmpeg from "fluent-ffmpeg";
import { createWriteStream } from 'fs';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class ConverterService {

    constructor(private readonly eventService: EventService, private readonly configService: ConfigService) {
    }

    /**
     * Converts podcast mp4 file to mp3 
     * @param file the podcast file data
     */
    convert(file: PodcastFile) {
        console.log(`Converting ${file.podcast.title}, filename ${file.filename}`);
        ffmpeg(`${this.configService.getDownloadFolderPath()}${file.filename}`)
            .fromFormat("mp4")
            .toFormat("mp3")
            .on('error', error => this.handleError(error, file))
            .on('end', () => {
                try {
                    file.filename = file.filename + ".mp3";
                    this.eventService.fileConverted$.next(file);
                    console.log(`Finished converting ${file.podcast.title}, filename ${file.filename}`);
                } catch (error) {
                    this.handleError(error, file);
                }
            }).pipe(createWriteStream(`${this.configService.getDownloadFolderPath()}/${file.filename}.mp3`));
    }

    private handleError(error, file: PodcastFile): void {
        console.error(`Erorr during converting ${file.podcast.title}, filename ${file.filename} `, error);
    }

}
