import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor(filePath: string) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath))
  }

  get(key: string): string {
    return this.envConfig[key];
  }

  getPlaylistFilePrefix(playlistId: string): string {
    return this.getPlaylists().find(p => p.playlistId === playlistId).filenamePrefix;
  }

  getPlaylists(): {
    filenamePrefix: string,
    showId: string,
    playlistId: string
  }[] {
    return JSON.parse(this.get("CAPTIVATE_SHOWS"));
  }

  getDownloadFolderPath(): string {
    return this.get("DOWNLOAD_FOLDER_PATH");
  }
}