```
# raw ffmpeg 参数
["-y","-fflags","nobuffer","-i","rtmp://127.0.0.1:1935/live/game_stream","-c:v","copy","-c:a","aac","-ab","64k","-ac","1","-ar","44100","-f","tee","-map","0:a?","-map","0:v?","[f=flv]rtmp://127.0.0.1:1935/live2/game_stream|[hls_time=2:hls_list_size=3:hls_flags=delete_segments]./media/live/game_stream/index.m3u8|[f=dash:window_size=3:extra_window_size=5]./media/live/game_stream/index.mpd"]

# 推流, 推流时加上码率，方便设置 vp9 编码参数, APP_NAME = live_test
ffmpeg -re -i "" -c copy -f flv rtmp://localhost/live_test/STREAM_NAME.[v:bitrate]

# 播放
http://localhost:8000/live_test/STREAM_NAME.[v:bitrate]/index.mpd
http://localhost:8000/live_test/STREAM_NAME.[v:bitrate]_vp9/index.mpd

# 生成的 ffmpeg 参数
## 因为要转码，加上 -fflags nobuffer 会报错
["-y","-i","rtmp://127.0.0.1:1935/live_test/game_stream",
"-c:v","copy","-c:a","copy",
"-window_size",3,"-extra_window_size",5,"-f","dash","./media/live_test/game_stream/index.mpd",
"-r",30,"-g",90,"-quality","realtime","-speed",5,"-threads",8,"-row-mt",1,"-tile-columns",2,"-frame-parallel",1,"-qmin",4,"-qmax",48,"-b:v","2000k","-c:v","vp9","-c:a","opus","-strict",-2,
"-window_size",3,"-extra_window_size",5,"-f","dash","./media/live_test/game_stream_vp9/index.mpd"]

# 生成的完整 ffmpeg 参数
ffmpeg -y -i rtmp://127.0.0.1:1935/live_test/game_stream \
-c:v copy -c:a copy \
-window_size 3 -extra_window_size 5 -f dash ./media/live_test/game_stream/index.mpd \
-r 30 -g 90 -quality realtime -speed 5 -threads 8 -row-mt 1 -tile-columns 2 -frame-parallel 1 -qmin 4 -qmax 48 -b:v 2000k -c:v vp9 -c:a opus -strict -2 \
-window_size 3 -extra_window_size 5 -f dash ./media/live_test/game_stream_vp9/index.mpd
```
