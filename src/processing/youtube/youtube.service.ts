import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { YoutubeDataAPI } from 'youtube-v3-api';
import { Podcast } from '../../models/podcast';
import { EventService } from '../../event/event.service';
import { ConfigService } from '../../config/config.service';
const youtubedl = require('youtube-dl')
const sanitize = require("sanitize-filename");


@Injectable()
export class YoutubeService {

    readonly youtube;

    constructor(private readonly eventService: EventService,
        private readonly configService: ConfigService) {
        this.youtube = new YoutubeDataAPI(this.configService.get("YOUTUBE_API_KEY"));
    }

    /**
     * Fetch last 10 videos for each of configured playlist and return all as podcast array
     */
    getVideoList(): Promise<Podcast[]> {
        const configuredPlaylists: string[] = this.configService.getPlaylists().map(c => c.playlistId);
        return Promise.all(configuredPlaylists.map(id => this.youtube.searchPlaylistItems(id, 10, { type: "video", eventType: "completed", order: "date" })))
            .then((toConcat: any[]) => [].concat.apply([], toConcat.map(playlist => playlist.items)))
            .then((toMap: any[]) => toMap.map(item => {
                return {
                    id: item.snippet.resourceId.videoId,
                    playlistId: item.snippet.playlistId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: this.getImageUrlForVideo(item),
                    etag: item.etag,
                    publishedAt: item.snippet.publishedAt
                }
            }));
    }

    /**
     * Downloads audio file with given id and sends downloaded file event
     * @param podcast the podcast data 
     */
    downloadAudioFile(podcast: Podcast): void {
        try {
            if (!podcast.id) {
                throw new Error("no video url found");
            }

            const filename: string = this.createFilename(podcast);
            const format: string = this.configService.get("YOUTUBE_DOWNLOAD_FORMAT");
            const video = youtubedl(
                `http://www.youtube.com/watch?v=${podcast.id}`,
                [`--format=${format} `],
                { cwd: this.configService.getDownloadFolderPath() }
            );

            video.on('info', (info) => {
                console.log(`Started downloading ${podcast.title}, filename ${filename}, size ${info.size}`)
            })

            video.on('error', (error) => this.handleError(error, podcast))

            video.pipe(createWriteStream(`${this.configService.getDownloadFolderPath()}${filename}`))

            video.on('end', () => {
                console.log(`Finished downloading ${podcast.title}, filename ${filename}`);
                this.eventService.fileDownloaded$.next({ podcast, filename });
            });
        } catch (error) {
            this.handleError(error, podcast);
        }
    }

    private handleError(error, podcast: Podcast): void {
        console.error(`Could not download video ${podcast.title}`, error);
    }

    private createFilename(podcast: Podcast): string {
        return sanitize(
            this.configService.getPlaylistFilePrefix(podcast.playlistId) + "-" + podcast.title
        )
            .replace("ą", "a")
            .replace("ć", "c")
            .replace("ę", "e")
            .replace("ł", "l")
            .replace("ń", "n")
            .replace("ó", "o")
            .replace("ś", "s")
            .replace("ż", "z")
            .replace("ź", "z")
            .replace("Ą", "A")
            .replace("Ć", "C")
            .replace("Ę", "E")
            .replace("Ł", "L")
            .replace("Ń", "N")
            .replace("Ó", "O")
            .replace("Ś", "S")
            .replace("Ż", "Z")
            .replace("Ź", "Z")
            .replace(/ /g, '');
    }

    private getImageUrlForVideo(youtubeResponse: any): string {
        return youtubeResponse.snippet.thumbnails ? youtubeResponse.snippet.thumbnails.high.url.replace("hqdefault", "maxresdefault") : null;
    }
}
