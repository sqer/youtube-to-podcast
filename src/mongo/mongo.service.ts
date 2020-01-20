import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PodcastFile } from '../models/file';
import { Podcast } from '../models/podcast';

@Injectable()
export class MongoService {

    constructor(@InjectModel('podcasts') private readonly podcastModel: Model<Podcast>) {
    }

    /**
     * Checks if video was previously processed
     * @param id the id of youtube video
     * @param playlistId the id of playlist
     */
    checkIfExists(id: string, playlistId: string): Promise<boolean> {
        return this.podcastModel.countDocuments({ id: id, playlistId: playlistId }).exec().then((count) => count !== 0);
    }

    /**
     * Saves data of uploaded and processed podcast in database 
     * @param podcast podcast data
     */
    savePodcastAsUploaded(file: PodcastFile): void {
        return this.podcastModel(file.podcast).save().then(() => { }).catch(error => console.error(`Error during saving podcast ${file.podcast.title} as uploaded.`, error));
    }

}
