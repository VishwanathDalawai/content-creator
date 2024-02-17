import React, { useRef, useState, useEffect } from "react";
import { getCurrentDate } from "../utils.js";

const VideoRecorder = () => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const blobRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraSetupDone, setIsCameraSetupDone] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [error, setError] = useState(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  const getNewStream = async () => {
    try {
      const constraints = { video: true, audio: { echoCancellation: true } };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      return newStream;
    } catch (err) {
      if (
        err?.name === "NotAllowedError" &&
        err?.message === "Permission denied"
      ) {
        setError(
          "Permission denied. Please allow camera and audio permissions"
        );
      }
      //   console.error(err?.message, err?.name);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  const setupCamera = async () => {
    videoRef.current.srcObject = await getNewStream();
    if (videoRef.current.srcObject) {
      setIsCameraSetupDone(true);
      setIsDownloadable(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setIsDownloadable(false);
    const options = { mimeType: "video/webm;codecs=vp9,opus" };
    const newStream = await getNewStream();
    videoRef.current.srcObject = newStream;
    mediaRecorderRef.current = new MediaRecorder(
      videoRef.current.srcObject,
      options
    );
    mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        setIsDownloadable(true);
        blobRef.current = new Blob([event.data], {
          type: "video/webm",
        });
      }
    };
    mediaRecorderRef.current.start();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    }, 1000);
  };

  const pauseRecording = () => {
    setIsRecordingPaused(true);
    mediaRecorderRef.current.pause();
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const resumeRecording = () => {
    setIsRecordingPaused(false);
    mediaRecorderRef.current.resume();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current.stop();
    // const stream = videoRef.current.srcObject;
    // const tracks = stream.getTracks();
    // tracks.forEach((track) => {
    //   track.stop();
    // });
    setCount(0);
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const downloadVideo = () => {
    const url = URL.createObjectURL(blobRef.current);
    const downloadElement = document.createElement("a");
    downloadElement.href = url;
    const fileName = getCurrentDate();
    downloadElement.download = fileName;
    downloadElement.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <video ref={videoRef} autoPlay muted></video>
      <div className="flex gap-4 flex-col md:flex-row md:gap-8">
        {!isCameraSetupDone && (
          <button
            className="border border-gray-900 rounded-lg p-2"
            onClick={setupCamera}
          >
            Setup camera and audio
          </button>
        )}
        {isRecording && (
          <button
            onClick={!isRecordingPaused ? pauseRecording : resumeRecording}
            className="border rounded-lg p-2 border-gray-900"
          >
            {isRecordingPaused ? "Resume Recording" : "Pause Recording"}
          </button>
        )}
        <button
          className={`border rounded-lg p-2 ${
            isCameraSetupDone ? "border-gray-900" : "border-gray-400 opacity-60"
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isCameraSetupDone}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
        {isDownloadable && (
          <button
            onClick={downloadVideo}
            className="border border-gray rounded-lg p-2 bg-black text-white"
          >
            Download lastest Video
          </button>
        )}
      </div>
      {count > 0 ? <p>Recording time: {count}</p> : null}
      {error && <p className="text-red-700">{error}</p>}
    </div>
  );
};

export default VideoRecorder;
