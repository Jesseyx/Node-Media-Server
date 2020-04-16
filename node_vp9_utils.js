const VP9_PARAMETERS = {
    '3840x2160': { speed: 5, threads: 16, tileColumns: 3, frameParallel: 1, bv: 7800 },
    '2560x1440': { speed: 5, threads: 16, tileColumns: 3, frameParallel: 1, bv: 6000 },
    '1920x1080': { speed: 5, threads: 8, tileColumns: 2, frameParallel: 1, bv: 4500 },
    '1280x720':  { speed: 5, threads: 8, tileColumns: 2, frameParallel: 1, bv: 3000 },
    '854x480':   { speed: 6, threads: 4, tileColumns: 1, frameParallel: 1, bv: 1800 },
    '640x360':   { speed: 7, threads: 4, tileColumns: 1, frameParallel: 0, bv: 730 },
    '426x240':   { speed: 8, threads: 2, tileColumns: 0, frameParallel: 0, bv: 365 }
};

function getNormalParameters(width, height) {
    const key = `${width}x${height}`;
    if (!VP9_PARAMETERS[key]) {
        const normals = Object.keys(VP9_PARAMETERS).map(key => key.split('x'));
        for (let i = 0; i < normals.length; i++) {
            if (width >= normals[i][0]) {
                return VP9_PARAMETERS[`${normals[i][0]}x${normals[i][1]}`]
            }
        }
        return null;
    } else {
        return VP9_PARAMETERS[key];
    }
}

const ALLOWED_OUT_PARAMETERS = ['r', 'bv', 'ratio'];

function parseOutputParameters(str) {
    const values = str.split(',').map(item => item.split(':'));
    const parameters = {};
    values.forEach((item) => {
        if (item[0] && item[1] && ALLOWED_OUT_PARAMETERS.indexOf(item[0]) >= 0) {
            parameters[item[0]] = Number(item[1]);
        }
    });
    return parameters;
}

function getVp9Parameters(config) {
    let { w: width, h: height, bv, output: outputStr = '' } = config;
    width = Number(width) || 1920;
    height = Number(height) || 1080;
    bv = Number(bv);

    const normal = getNormalParameters(width, height);
    if (!normal) return null;

    const output = parseOutputParameters(outputStr);
    const outputBv = output.bv ? output.bv :
        (bv && output.ratio) ? bv * output.ratio : normal.bv;

    const result = [];
    if (output.r) {
        result.push('-r', output.r);
    }
    result.push('-g', 90, '-quality', 'realtime', '-speed', normal.speed, '-threads', normal.threads, '-row-mt', 1,
        '-tile-columns', normal.tileColumns, '-frame-parallel', normal.frameParallel, '-qmin', 4, '-qmax', 48, '-b:v', `${outputBv}k`, '-c:v', 'vp9',
        '-b:a', '128k', '-c:a', 'libopus', '-strict', -2); // The encoder 'opus' is experimental but experimental codecs are not enabled, add '-strict -2' if you want to use it.

    return result;
}

module.exports = {
    getVp9Parameters,
};
