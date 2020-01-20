import { Injectable, HttpService } from '@nestjs/common';
import { EventService } from '../../event/event.service';
import { PodcastFile } from '../../models/file';
import { AxiosResponse } from 'axios';
import { mergeMap } from "rxjs/operators";
import { createReadStream } from 'fs';
import { Observable, of } from 'rxjs';
import * as FormData from 'form-data';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class UploaderService {

    token: string;

    constructor(private readonly eventService: EventService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService) {

    }

    /**
     * Uploads podcast file to podcast service and creates episode on it (metadata)
     * @param file podcast file data
     */
    upload(file: PodcastFile): void {
        console.log(`Uploading ${file.podcast.title}, filename ${file.filename}`);
        this.getToken().pipe(
            mergeMap((response: AxiosResponse<any>) => {
                this.token = response.data.user.token;
                return this.uploadMedia(file);
            }),
            mergeMap((response: AxiosResponse<any>) => this.createEpisode(response.data.media.id.id, file))
        ).subscribe(() => {
            console.log(`Uploaded and created episode ${file.podcast.title}`);
            this.eventService.fileUploaded$.next(file);
        }, error => {
            console.error(`Could not upload podcast ${file.podcast.title}, filename ${file.filename} `, error)
        });
    }


    /**
     * Returns authentication token based on api key
     */
    private getToken(): Observable<any> {
        const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
        return this.httpService.post("https://api.captivate.fm/authenticate/token", `username=${this.configService.get("CAPTIVATE_USER_ID")}`, config);
    }

    /**
     * Uploads mp3 file on podcast service
     * @param file podcast file data
     */
    private uploadMedia(file: PodcastFile): Observable<any> {
        const formData = new FormData();
        formData.append("file", createReadStream(`${this.configService.getDownloadFolderPath()}${file.filename}`));
        const config = {
            'maxContentLength': Infinity,
            'maxBodyLength': Infinity, headers: { 'Authorization': 'Bearer ' + this.token, ...formData.getHeaders() }
        };
        return this.httpService.post(`https://api.captivate.fm/shows/${file.podcast.showId}/media`, formData, config);
    }

    /**
     * Creates episode on podcast service
     * @param mediaId id uploaded file
     * @param file podcast file data
     */
    private createEpisode(mediaId: string, file: PodcastFile): Observable<any> {
        const formData = new FormData();
        formData.append("shows_id", file.podcast.showId);
        formData.append("media_id", mediaId);
        formData.append("title", file.podcast.title);
        formData.append("shownotes", file.podcast.description);
        formData.append("episode_art", file.podcast.thumbnail);
        formData.append("date", file.podcast.publishedAt.replace("T", " ").substring(0, 19));
        const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Bearer ' + this.token, ...formData.getHeaders() } };
        return this.httpService.post("https://api.captivate.fm/episodes", formData, config).pipe(mergeMap(() => of(file)));
    }

}
