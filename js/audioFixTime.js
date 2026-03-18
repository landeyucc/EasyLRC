/**
 * 音频分析模块：负责音频PCM等功能
 */
const audioFixTime = (() => {
  const analyzeAudio = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const audioContext = new (
            window.AudioContext || window.webkitAudioContext
          )();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const channelData = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;
          const duration = audioBuffer.duration;

          resolve({
            data: channelData,
            sampleRate: sampleRate,
            duration: duration,
            numberOfChannels: audioBuffer.numberOfChannels,
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("文件读取失败"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const findPeakInRange = (data, startSample, endSample) => {
    let maxValue = 0;
    let maxIndex = startSample;

    for (let i = startSample; i < endSample && i < data.length; i++) {
      const absValue = Math.abs(data[i]);
      if (absValue > maxValue) {
        maxValue = absValue;
        maxIndex = i;
      }
    }

    return { index: maxIndex, value: maxValue };
  };

  const findBestPeakMatch = (
    data,
    sampleRate,
    targetTime,
    searchRangeSeconds = 0.5,
  ) => {
    const targetSample = Math.floor(targetTime * sampleRate);
    const searchRangeSamples = Math.floor(searchRangeSeconds * sampleRate);

    const startSample = Math.max(0, targetSample - searchRangeSamples);
    const endSample = Math.min(data.length, targetSample + searchRangeSamples);

    return findPeakInRange(data, startSample, endSample);
  };

  const fixAllLyricsTime = async (lyrics, audioData, sampleRate) => {
    const results = [];

    for (const lyric of lyrics) {
      if (lyric.time === null) {
        results.push({
          originalTime: null,
          fixedTime: null,
          peakIndex: null,
          peakValue: 0,
          success: false,
        });
        continue;
      }

      const peakResult = findBestPeakMatch(
        audioData,
        sampleRate,
        lyric.time,
        0.3,
      );

      const fixedTime = peakResult.index / sampleRate;

      results.push({
        originalTime: lyric.time,
        fixedTime: fixedTime,
        peakIndex: peakResult.index,
        peakValue: peakResult.value,
        success: true,
      });
    }

    return results;
  };

  const generateWaveformData = (data, samplesPerPixel = 1000) => {
    const waveform = [];
    const length = Math.ceil(data.length / samplesPerPixel);

    for (let i = 0; i < length; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, data.length);

      let min = 1.0;
      let max = -1.0;

      for (let j = start; j < end; j++) {
        const value = data[j];
        if (value < min) min = value;
        if (value > max) max = value;
      }

      waveform.push({ min, max });
    }

    return waveform;
  };

  return {
    analyzeAudio,
    findPeakInRange,
    findBestPeakMatch,
    fixAllLyricsTime,
    generateWaveformData,
  };
})();
