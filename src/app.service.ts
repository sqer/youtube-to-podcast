import { Injectable } from '@nestjs/common';
import { YoutubeService } from './processing/youtube/youtube.service';
import { Podcast } from './models/podcast';
import { MongoService } from './mongo/mongo.service';
import { interval } from 'rxjs';
import { ProcessingService } from './processing/processing.service';
import { existsSync, mkdirSync, readdir, unlink } from 'fs';
import { ConfigService } from './config/config.service';
const schedule = require('node-schedule');

@Injectable()
export class AppService {

  constructor(private youtubeService: YoutubeService,
    private mongoService: MongoService,
    private processingService: ProcessingService,
    private configService: ConfigService) {
    //Init
    this.setupDownloadFolder();

    // check on start and then every 45 minutes
    this.checkAndDownloadIfNew();
    interval(1800000).subscribe(() => this.checkAndDownloadIfNew());
  }

  /**
   * Checks if there is a video on youtube which was not previously converted to podcast
   */
  private checkAndDownloadIfNew(): void {
    this.youtubeService.getVideoList().then((podcasts: Podcast[]) => {
      podcasts.forEach((podcast: Podcast) => {
        try {
          this.mongoService.checkIfExists(podcast.id, podcast.playlistId).then((exists: boolean) => {
            if (!exists) {
              this.processingService.startProcessing(podcast);
            }
          })
        } catch (error) {
          console.error(`Error during processing: ${podcast.title}`, error);
        }
      });
    }).catch(error => console.error(`Could not fetch youtube video list`, error));
  }

  private setupDownloadFolder(): void {
    const downloadFolderPath: string = this.configService.getDownloadFolderPath();
    if (!existsSync(downloadFolderPath)) {
      mkdirSync(downloadFolderPath);
    }
    schedule.scheduleJob('0 0 * * *', () => this.clearDownloadFolder(downloadFolderPath)); // run everyday at midnight
  }

  private clearDownloadFolder(path: string): void {
    readdir(path, (err, files) => {
      if (err) console.log("Could list download folder files");
      files.forEach(file => {
        unlink(`${path}/${file}`, err => {
          if (err) console.log(`Could not remove file ${file}`);
        });
      });
    });
  }

}

