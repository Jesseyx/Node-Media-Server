```
# raw ffmpeg 参数
["-y","-fflags","nobuffer","-i","rtmp://127.0.0.1:1935/live/game_stream","-c:v","copy","-c:a","aac","-ab","64k","-ac","1","-ar","44100","-f","tee","-map","0:a?","-map","0:v?","[f=flv]rtmp://127.0.0.1:1935/live2/game_stream|[hls_time=2:hls_list_size=3:hls_flags=delete_segments]./media/live/game_stream/index.m3u8|[f=dash:window_size=3:extra_window_size=5]./media/live/game_stream/index.mpd"]

# 推流, APP_NAME = live_test
# w 推流宽; h 推流高; bv 推流码率; output 输出参数; output.r 输出帧率 fps; output.ratio 输出压缩率, 优先级低于 output.bv; output.bv 输出码率
ffmpeg -re -i "" -c copy -f flv rtmp://localhost/live_test/STREAM_NAME?w=1920&h=1080&bv=8192&output=r:30,ratio:0.75,bv:4600

# 播放
http://localhost:8000/live_test/STREAM_NAME/index.mpd
http://localhost:8000/live_test/STREAM_NAME_vp9/index.mpd

# 生成的 ffmpeg 参数
## 因为要转码，加上 -fflags nobuffer 会报错
["-y","-i","rtmp://127.0.0.1:1935/live_test/game_stream",
"-c:v","copy","-c:a","copy",
"-window_size",3,"-extra_window_size",5,"-f","dash","./media/live_test/game_stream/index.mpd",
"-r",30,"-g",90,"-quality","realtime","-speed",5,"-threads",8,"-row-mt",1,"-tile-columns",2,"-frame-parallel",1,"-qmin",4,"-qmax",48,"-b:v","4600k","-c:v","vp9","-b:a","128k","-c:a","libopus","-strict",-2,
"-window_size",3,"-extra_window_size",5,"-f","dash","./media/live_test/game_stream_vp9/index.mpd"]

# 生成的完整 ffmpeg 参数
ffmpeg -y -i rtmp://127.0.0.1:1935/live_test/game_stream \
-c:v copy -c:a copy \
-window_size 3 -extra_window_size 5 -f dash ./media/live_test/game_stream/index.mpd \
-r 30 -g 90 -quality realtime -speed 5 -threads 8 -row-mt 1 -tile-columns 2 -frame-parallel 1 -qmin 4 -qmax 48 -b:v 4600k -c:v vp9 -b:a 128k -c:a libopus -strict -2 \
-window_size 3 -extra_window_size 5 -f dash ./media/live_test/game_stream_vp9/index.mpd
```
