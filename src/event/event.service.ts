import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PodcastFile } from '../models/file';

@Injectable()
export class EventService {

    fileDownloaded$: Subject<PodcastFile> = new Subject<PodcastFile>();
    fileConverted$: Subject<PodcastFile> = new Subject<PodcastFile>();
    fileUploaded$: Subject<PodcastFile> = new Subject<PodcastFile>();

}
