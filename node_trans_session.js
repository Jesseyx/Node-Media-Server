//
//  Created by Mingliang Chen on 18/3/9.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
const Logger = require('./node_core_logger');

const EventEmitter = require('events');
const { spawn } = require('child_process');
const dateFormat = require('dateformat');
const mkdirp = require('mkdirp');
const fs = require('fs');

class NodeTransSession extends EventEmitter {
  constructor(conf) {
    super();
    this.conf = conf;
  }

  run() {
    let vc = this.conf.vc || 'copy';
    let ac = this.conf.ac || 'copy';
    let inPath = 'rtmp://127.0.0.1:' + this.conf.rtmpPort + this.conf.streamPath;
    let ouPath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}`;
    let mapStr = '';

    if (this.conf.rtmp && this.conf.rtmpApp) {
      if (this.conf.rtmpApp === this.conf.streamApp) {
        Logger.error('[Transmuxing RTMP] Cannot output to the same app.');
      } else {
        let rtmpOutput = `rtmp://127.0.0.1:${this.conf.rtmpPort}/${this.conf.rtmpApp}/${this.conf.streamName}`;
        mapStr += `[f=flv]${rtmpOutput}|`;
        Logger.log('[Transmuxing RTMP] ' + this.conf.streamPath + ' to ' + rtmpOutput);
      }
    }
    if (this.conf.mp4) {
      this.conf.mp4Flags = this.conf.mp4Flags ? this.conf.mp4Flags : '';
      let mp4FileName = dateFormat('yyyy-mm-dd-HH-MM') + '.mp4';
      let mapMp4 = `${this.conf.mp4Flags}${ouPath}/${mp4FileName}|`;
      mapStr += mapMp4;
      Logger.log('[Transmuxing MP4] ' + this.conf.streamPath + ' to ' + ouPath + '/' + mp4FileName);
    }
    if (this.conf.hls) {
      this.conf.hlsFlags = this.conf.hlsFlags ? this.conf.hlsFlags : '';
      let hlsFileName = 'index.m3u8';
      let mapHls = `${this.conf.hlsFlags}${ouPath}/${hlsFileName}|`;
      mapStr += mapHls;
      Logger.log('[Transmuxing HLS] ' + this.conf.streamPath + ' to ' + ouPath + '/' + hlsFileName);
    }
    if (this.conf.dash) {
      this.conf.dashFlags = this.conf.dashFlags ? this.conf.dashFlags : '';
      let dashFileName = 'index.mpd';
      let mapDash = `${this.conf.dashFlags}${ouPath}/${dashFileName}`;
      mapStr += mapDash;
      Logger.log('[Transmuxing DASH] ' + this.conf.streamPath + ' to ' + ouPath + '/' + dashFileName);
    }
    mkdirp.sync(ouPath);
    let argv = ['-y', '-fflags', 'nobuffer', '-i', inPath];
    Array.prototype.push.apply(argv, ['-c:v', vc]);
    Array.prototype.push.apply(argv, this.conf.vcParam);
    Array.prototype.push.apply(argv, ['-c:a', ac]);
    Array.prototype.push.apply(argv, this.conf.acParam);
    let vp9OuPath = '';
    if (!this.conf.dashvp9) {
      Array.prototype.push.apply(argv, ['-f', 'tee', '-map', '0:a?', '-map', '0:v?', mapStr]);
    } else {
      /** fix for dash vp9 test **/
      const dashFileName = 'index.mpd';
      // h264 dash
      Array.prototype.push.apply(argv, this.conf.dashParam);
      Array.prototype.push.apply(argv, ['-f', 'dash', `${ouPath}/${dashFileName}`]);
      // vp9 dash
      const vp9Parameters = {
        '8000': { speed: 5, threads: 8, tileColumns: 2, bV: 8000 * 0.6 },
        '6000': { speed: 5, threads: 8, tileColumns: 2, bV: 6000 * 0.6 },
        '4000': { speed: 5, threads: 8, tileColumns: 2, bV: 4000 * 0.6 },
        '1200': { speed: 6, threads: 4, tileColumns: 1, bV: 1200 * 0.6 },
        '500':  { speed: 6, threads: 4, tileColumns: 1, bV: 500 * 0.6 },
      };
      const inBitrate = this.conf.streamName.split('.').pop();
      const parameters = vp9Parameters[inBitrate] || vp9Parameters['4000'];
      Array.prototype.push.apply(argv, ['-r', 30, '-g', 90, '-quality', 'realtime', '-speed', parameters.speed, '-threads', parameters.threads, '-row-mt', 1, '-tile-columns', parameters.tileColumns, '-frame-parallel', 1, '-qmin', 4, '-qmax', 48, '-b:v', `${parameters.bV}k`]);
      Array.prototype.push.apply(argv, ['-c:v', 'vp9', '-c:a', 'opus', '-strict', -2]);  // The encoder 'opus' is experimental but experimental codecs are not enabled, add '-strict -2' if you want to use it.
      Array.prototype.push.apply(argv, this.conf.dashParam);
      vp9OuPath = `${this.conf.mediaroot}/${this.conf.streamApp}/${this.conf.streamName}_vp9`;
      mkdirp.sync(vp9OuPath);
      Array.prototype.push.apply(argv, ['-f', 'dash', `${vp9OuPath}/${dashFileName}`]);
      // remove nobuffer for vp9 encoder
      argv.splice(1, 2);
    }
    argv = argv.filter((n) => { return n }); //去空
    this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
    this.ffmpeg_exec.on('error', (e) => {
      Logger.ffdebug(e);
    });

    this.ffmpeg_exec.stdout.on('data', (data) => {
      Logger.ffdebug(`FF输出：${data}`);
    });

    this.ffmpeg_exec.stderr.on('data', (data) => {
      Logger.ffdebug(`FF输出：${data}`);
    });

    this.ffmpeg_exec.on('close', (code) => {
      Logger.log('[Transmuxing end] ' + this.conf.streamPath);
      this.emit('end');

      function unlinkFiles(path, files) {
        files.forEach((filename) => {
          if (filename.endsWith('.ts')
              || filename.endsWith('.m3u8')
              || filename.endsWith('.mpd')
              || filename.endsWith('.m4s')
              || filename.endsWith('.webm')
              || filename.endsWith('.tmp')) {
            fs.unlinkSync(path + '/' + filename);
          }
        })
      }

      fs.readdir(ouPath, function (err, files) {
        if (!err) {
          unlinkFiles(ouPath, files);
        }
      });
      if (vp9OuPath) {
        fs.readdir(vp9OuPath, function (err, files) {
          if (!err) {
            unlinkFiles(vp9OuPath, files);
          }
        });
      }
    });
  }

  end() {
    // this.ffmpeg_exec.kill();
  }
}

module.exports = NodeTransSession;
