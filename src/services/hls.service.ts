import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// ✅ CRITICAL: Tell fluent-ffmpeg exactly where ffmpeg is
// Find your path by running: where ffmpeg  (in terminal)
ffmpeg.setFfmpegPath("C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe");
ffmpeg.setFfprobePath("C:\\ffmpeg\\ffmpeg-8.0.1-essentials_build\\bin\\ffprobe.exe");

const hlsDir = path.join(__dirname, "../../uploads/hls");

// Ensure HLS directory exists
if (!fs.existsSync(hlsDir)) {
    fs.mkdirSync(hlsDir, { recursive: true });
}

export class HLSService {
    
     //Convert an uploaded MP4 file to HLS segments
     // Returns the public URL to the .m3u8 playlist
     
    async convertToHLS(videoFilePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const movieId   = uuidv4();
            const outputDir = path.join(hlsDir, movieId);
            fs.mkdirSync(outputDir, { recursive: true });

            const outputM3u8 = path.join(outputDir, "index.m3u8");

            console.log(` Starting HLS conversion for: ${videoFilePath}`);
            console.log(` Output directory: ${outputDir}`);

            ffmpeg(videoFilePath)
                .outputOptions([
                    "-codec:v libx264",
                    "-codec:a aac",
                    "-hls_time 10",
                    "-hls_playlist_type vod",
                    "-hls_segment_filename",
                    path.join(outputDir, "segment%03d.ts"),
                    "-start_number 0",
                ])
                .output(outputM3u8)
                .on("start", (cmd) => {
                    console.log("FFmpeg command:", cmd);
                })
                .on("progress", (progress) => {
                    console.log(`⏳ Processing: ${Math.round(progress.percent ?? 0)}% done`);
                })
                .on("end", () => {
                    console.log(`✅ HLS conversion complete: ${outputM3u8}`);

                    // Delete original uploaded MP4 to save space
                    if (fs.existsSync(videoFilePath)) {
                        fs.unlinkSync(videoFilePath);
                        console.log(`🗑️  Deleted original file: ${videoFilePath}`);
                    }

                    const publicUrl = `/uploads/hls/${movieId}/index.m3u8`;
                    resolve(publicUrl);
                })
                .on("error", (err) => {
                    console.error("❌ FFmpeg error:", err.message);

                    if (fs.existsSync(outputDir)) {
                        fs.rmSync(outputDir, { recursive: true });
                    }

                    reject(new Error(`HLS conversion failed: ${err.message}`));
                })
                .run();
        });
    }

    /**
     * Delete HLS files for a movie (used when deleting a movie)
     */
    deleteHLSFiles(videoUrl: string): void {
        try {
            const parts   = videoUrl.split("/");
            const movieId = parts[parts.length - 2];
            const dir     = path.join(hlsDir, movieId);

            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true });
                console.log(`🗑️  Deleted HLS folder: ${dir}`);
            }
        } catch (error) {
            console.error("Failed to delete HLS files:", error);
        }
    }
}