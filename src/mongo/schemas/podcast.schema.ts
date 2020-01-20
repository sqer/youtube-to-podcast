import * as mongoose from 'mongoose';

export const PodcatSchema = new mongoose.Schema({
  id: String,
  showId: String,
  playlistId: String,
  title: String,
  description: String,
  etag: String,
  thumbnail: String,
  publishedAt: String,
});
