import React, { useState, useRef, useEffect } from "react";
import { FiMic, FiPauseCircle, FiPlayCircle } from "react-icons/fi";
import { useReports } from "./ReportsContext"; // make sure this path matches your project


export default function Working() {
  // Context (global reports)
  const { reports, setReports } = useReports(); // <-- uses global context
  const [reportCounter, setReportCounter] = useState(0);
  const [customIssueType, setCustomIssueType] = useState("");
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [lastLat, setLastLat] = useState("");
  const [lastLon, setLastLon] = useState("");
  const [lastCapturedImageUrl, setLastCapturedImageUrl] = useState("");
  const [lastCapturedVideoUrl, setLastCapturedVideoUrl] = useState("");


  // Image states
  const [images, setImages] = useState([]); // preview URLs
  const [rawFiles, setRawFiles] = useState([]); // actual File objects to send to backend


  // Camera
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const videoUploadInputRef = useRef(null);
  // Video capture (with overlay) states
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [videoPreviews, setVideoPreviews] = useState([]); // preview URLs for recorded videos
  const [videoFiles, setVideoFiles] = useState([]); // actual recorded video files
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const videoRecorderRef = useRef(null);
  const drawTimerRef = useRef(null);
  const overlayInfoRef = useRef({ lat: "", lon: "", address: "" });
  const offscreenCanvasRef = useRef(null);

  // Ensure the video element actually has non-zero dimensions before allowing capture
  const waitForVideoDimensions = async (videoEl, timeoutMs = 3000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) return true;
      // wait next frame
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => requestAnimationFrame(r));
    }
    return false;
  };

  // Wait for the very first rendered frame (more reliable on some browsers)
  const waitForFirstFrame = async (videoEl, timeoutMs = 3000) => {
    if (!videoEl) return false;
    if (typeof videoEl.requestVideoFrameCallback === "function") {
      let done = false;
      const p = new Promise((resolve) => {
        videoEl.requestVideoFrameCallback(() => {
          done = true;
          resolve(true);
        });
      });
      const t = new Promise((r) => setTimeout(() => r(false), timeoutMs));
      const res = await Promise.race([p, t]);
      return !!res || done;
    }
    // Fallback: use canplay/timeupdate
    return waitForVideoDimensions(videoEl, timeoutMs);
  };

  // Open camera with robust readiness + fallback if back camera fails
  const openCamera = async () => {
    try {
      let stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      setCameraStream(stream);
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        v.muted = true;
        // user gesture already happened (button click), so play should resolve
        try { await v.play(); } catch {}
        const ok = await waitForFirstFrame(v, 3000);
        if (!ok) {
          // fallback to generic camera
          stream.getTracks().forEach((t) => t.stop());
          setCameraStream(null);
          const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraStream(fallback);
          v.srcObject = fallback;
          try { await v.play(); } catch {}
          const ok2 = await waitForFirstFrame(v, 3000);
          setIsCameraReady(!!ok2);
          return fallback;
        }
        setIsCameraReady(true);
      }
      return stream;
    } catch (e) {
      alert("Camera access denied or not available!");
      throw e;
    }
  };

  // Do not initialize camera on mount; request permissions on-demand


  // Form fields
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");


  // Audio (voice note)
  const [audioBlob, setAudioBlob] = useState(null); // last recorded, kept for backward compatibility
  const [audioBlobs, setAudioBlobs] = useState([]); // all recorded voice notes
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);


  // ======= Utility: stop camera =======
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };


  // ======= Handle gallery image upload =======
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;


    // create preview URLs
    const uploadedPreviews = files.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...uploadedPreviews]);


    // keep real files for backend
    setRawFiles((prev) => [...prev, ...files]);
  };


  // ======= Camera handling =======

  const openCameraModal = async () => {
    setIsCameraModalOpen(true);
    try {
      await openCamera();
    } catch {}
  };

  const closeCameraModal = () => {
    setIsCameraModalOpen(false);
    stopCamera();
  };

  // ======= Video recording with overlay (time + location) =======
  const startVideoRecording = async () => {
    try {
      // Ensure camera stream is available
      let stream = cameraStream;
      if (!stream) {
        stream = await openCamera();
      } else if (videoRef.current) {
        // ensure current stream is producing frames
        const ok = await waitForFirstFrame(videoRef.current, 2000);
        if (!ok) {
          stream = await openCamera();
        }
      }

      // Get audio stream for recording
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get location/address for overlay (same API as photo)
      let lat = "";
      let lon = "";
      let address = "";
      try {
        const pos = await getCurrentPosition();
        lat = pos.coords.latitude.toFixed(6);
        lon = pos.coords.longitude.toFixed(6);
        address = await reverseGeocode(lat, lon);
      } catch (e) {
        console.warn("Could not get location for video:", e);
      }
      overlayInfoRef.current = { lat, lon, address };
      if (address) {
        setLocation(address);
      }
      if (lat) setLastLat(lat);
      if (lon) setLastLon(lon);

      // Prepare offscreen canvas to draw frames with overlay
      const videoEl = videoRef.current;
      if (!(await waitForVideoDimensions(videoEl))) {
        throw new Error("Camera not ready");
      }
      const canvas = document.createElement("canvas");
      offscreenCanvasRef.current = canvas;
      canvas.width = videoEl.videoWidth || 1280;
      canvas.height = videoEl.videoHeight || 720;
      const ctx = canvas.getContext("2d");

      // Draw loop ~30fps with overlay
      const draw = () => {
        if (!ctx || !videoEl) return;
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        // overlay background box
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        ctx.fillText(`${dateStr} ${timeStr}`, 10, canvas.height - 55);
        if (overlayInfoRef.current.address)
          ctx.fillText(overlayInfoRef.current.address, 10, canvas.height - 35);
        if (overlayInfoRef.current.lat && overlayInfoRef.current.lon)
          ctx.fillText(`Lat: ${overlayInfoRef.current.lat}  Lon: ${overlayInfoRef.current.lon}`, 10, canvas.height - 15);
      };
      drawTimerRef.current = setInterval(draw, 1000 / 30);

      // Capture canvas as video stream and merge with audio
      const canvasStream = canvas.captureStream(30);
      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combined, { mimeType: "video/webm" });
      videoRecorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        // stop timers and audio tracks
        if (drawTimerRef.current) {
          clearInterval(drawTimerRef.current);
          drawTimerRef.current = null;
        }
        audioStream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoPreviews((prev) => [url, ...prev]);
        const file = new File([blob], `vid_${Date.now()}.webm`, { type: "video/webm" });
        setVideoFiles((prev) => [file, ...prev]);
        setLastCapturedVideoUrl(url);
        setIsVideoRecording(false);
        setIsVideoPaused(false);
        // Keep camera open similar to after Take Photo; user can cancel if desired
      };

      recorder.start();
      setIsVideoRecording(true);
      setIsVideoPaused(false);
    } catch (err) {
      alert("Unable to start video recording (permissions or device issue).");
      console.error(err);
    }
  };

  const pauseVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state === "recording") {
      videoRecorderRef.current.pause();
      setIsVideoPaused(true);
    }
  };

  const resumeVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state === "paused") {
      videoRecorderRef.current.resume();
      setIsVideoPaused(false);
    }
  };

  const stopVideoRecording = () => {
    if (
      videoRecorderRef.current &&
      (videoRecorderRef.current.state === "recording" || videoRecorderRef.current.state === "paused")
    ) {
      videoRecorderRef.current.stop();
    }
  };


  // === Helpers for geolocation + reverse-geocoding ===
  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
      });
    });


  const reverseGeocode = async (lat, lon) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
    const data = await res.json();
    return data.display_name || `${lat}, ${lon}`;
  };


  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!(await waitForVideoDimensions(video))) return;


    // get geolocation
    let lat = "";
    let lon = "";
    let address = "";
    try {
      const pos = await getCurrentPosition();
      lat = pos.coords.latitude.toFixed(6);
      lon = pos.coords.longitude.toFixed(6);
      address = await reverseGeocode(lat, lon);
    } catch (e) {
      console.warn("Could not get location:", e);
    }


    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");


    // draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);


    // overlay text box at bottom
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    ctx.fillText(`${dateStr} ${timeStr}`, 10, canvas.height - 55);
    if (address) ctx.fillText(address, 10, canvas.height - 35);
    if (lat && lon) ctx.fillText(`Lat: ${lat}  Lon: ${lon}`, 10, canvas.height - 15);


    const imageUrl = canvas.toDataURL("image/png");


    // update previews
    setImages((prev) => [...prev, imageUrl]);
    setLastCapturedImageUrl(imageUrl);


    // convert to File for backend
    fetch(imageUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `img_${Date.now()}.png`, { type: "image/png" });
        setRawFiles((prev) => [...prev, file]);
      })
      .catch((err) => console.error("Error converting captured image:", err));


    // fill location field automatically
    if (address) setLocation(address);
    if (lat) setLastLat(lat);
    if (lon) setLastLon(lon);


    // Keep camera open for subsequent captures; user can cancel manually
  };


  // ======= Voice recording with pause/resume/stop =======
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];


      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };


      mediaRecorder.onstop = () => {
        const audio = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(audio);
        setAudioBlobs((prev) => [audio, ...prev]);
        // stop microphone tracks so mic isn't left open
        stream.getTracks().forEach((t) => t.stop());
      };


      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      alert("Microphone access denied or not available!");
      console.error(err);
    }
  };


  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };


  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };


  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };


  const playAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    }
  };

  const playAudioAt = (idx) => {
    const blob = audioBlobs[idx];
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  };


  // ======= Submit report =======
  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!description || !issueType || !department || !location) {
      alert("Please fill all required fields!");
      return;
    }


    const finalIssueType = issueType === "Other" ? customIssueType : issueType;
    const newId = Array.isArray(reports) ? reports.length + 1 : 1;
    const formatId = String(newId).padStart(5, "0");


    const localReport = {
      id: formatId,
      description,
      issueType: finalIssueType,
      department,
      location,
      lat: lastLat || "",
      lon: lastLon || "",
      images: images.slice(),
      videos: videoPreviews.slice(),
      voiceNote: audioBlob ? URL.createObjectURL(audioBlob) : null,
      voiceNotes: audioBlobs.map((b) => URL.createObjectURL(b)),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };


    setReportCounter(reportCounter + 1);


    // Immediately update global context so dashboards see it
    setReports((prev = []) => [localReport, ...prev]);


    // Prepare FormData for backend
    try {
      const formData = new FormData();
      formData.append("reportId", formatId);
      formData.append("description", description);
      formData.append("issueType", finalIssueType);
      formData.append("department", department);
      formData.append("location", location);


      rawFiles.forEach((file, idx) => {
        const filename = file.name || `img_${formatId}_${Date.now()}_${idx}.png`;
        formData.append("images", file, filename);
      });


      if (audioBlob) {
        formData.append("voiceNote", audioBlob, `voice_${formatId}.webm`);
      }
      // include all voice notes
      audioBlobs.forEach((blob, idx) => {
        formData.append("voiceNotes", blob, `voice_${formatId}_${idx}.webm`);
      });

      // include recorded videos
      videoFiles.forEach((file, idx) => {
        const filename = file.name || `vid_${formatId}_${Date.now()}_${idx}.webm`;
        formData.append("videos", file, filename);
      });


       // POST to backend (adjust URL to your backend)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reports`, {
        method: "POST",
        body: formData,
      });


      if (res.ok) {
        const savedReport = await res.json();
        // replace the local preview report with server-supplied object (image URLs etc)
        setReports((prev = []) =>
          prev.map((r) => (r.id === formatId ? savedReport : r))
        );
      } else {
        // backend not available or returned error — keep local report (we already added)
        console.warn("Backend returned non-OK response when submitting report.");
      }
    } catch (err) {
      // network/backend error — keep local report and warn
      console.warn("Could not POST to backend (network or server down).", err);
    }


    // reset form UI
    setImages([]);
    setRawFiles([]);
    setVideoPreviews([]);
    setVideoFiles([]);
    setDescription("");
    setIssueType("");
    setDepartment("");
    setLocation("");
    setAudioBlob(null);
    setAudioBlobs([]);
  };


  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const safeReports = Array.isArray(reports) ? reports : [];


  return (
    <section className="px-6 py-12 pt-28 bg-gray-50 min-h-screen" id="working">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-green-700">
        Report an Issue
      </h2>
      <p className="text-center text-gray-600 mt-2">
        Upload images, describe the issue, and submit directly to authorities.
      </p>


      <div className="mt-8 max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image & Video Upload */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="text-gray-700 font-semibold">Add Photos:</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="border border-gray-300 rounded-lg px-4 py-2 cursor-pointer"
            />
            <input
              ref={videoUploadInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                const previews = files.map((f) => URL.createObjectURL(f));
                setVideoPreviews((prev) => [...previews, ...prev]);
                setVideoFiles((prev) => [...files, ...prev]);
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {}}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videoUploadInputRef.current && videoUploadInputRef.current.click()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Upload Videos
            </button>
            <button
              type="button"
              onClick={openCameraModal}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              Open Camera Capture
            </button>
          </div>


          {/* Live Camera Stream */}
          {cameraStream && !isCameraModalOpen && (
            <div className="mt-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", maxHeight: "300px", background: "#000"}}
                className="rounded-lg shadow-md w-full"
                />
              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className={`px-4 py-2 rounded-lg transition text-white ${isCameraReady ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
                  disabled={!isCameraReady}
                >
                  Capture
                </button>
                {/* Inline Start Video removed per request; use modal */}
                {isVideoRecording && !isVideoPaused && (
                  <button
                    type="button"
                    onClick={pauseVideoRecording}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                  >
                    Pause Video
                  </button>
                )}
                {isVideoRecording && isVideoPaused && (
                  <button
                    type="button"
                    onClick={resumeVideoRecording}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Resume Video
                  </button>
                )}
                {isVideoRecording && (
                  <button
                    type="button"
                    onClick={stopVideoRecording}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    Stop Video
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Always-visible previews for captured or uploaded media with labels */}
          {(images.length > 0 || videoPreviews.length > 0) && (
            <div className="mt-4">
              {images.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px"}}>
                  {images.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg shadow" style={{ width: "150px" }}>
                      <img src={img} alt={`Captured ${idx}`} className="w-full h-auto rounded-lg" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5">
                        <div className="truncate">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                        {location && <div className="truncate">{location}</div>}
                        {(lastLat || lastLon) && (
                          <div className="truncate">Lat: {lastLat || ""}  Lon: {lastLon || ""}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {videoPreviews.length > 0 && (
                <div className="mt-3" style={{ display: "flex", flexWrap: "wrap", gap: "10px"}}>
                  {videoPreviews.map((vid, idx) => (
                    <div key={idx} className="relative rounded-lg shadow-md" style={{ width: "220px" }}>
                      <video src={vid} controls className="w-full h-auto rounded-lg" />
                      <div className="absolute left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5" style={{ pointerEvents: "none", bottom: 28 }}>
                        <div className="truncate">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                        {location && <div className="truncate">{location}</div>}
                        {(lastLat || lastLon) && (
                          <div className="truncate">Lat: {lastLat || ""}  Lon: {lastLon || ""}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Camera Modal */}
          {isCameraModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={closeCameraModal} />
              <div className="relative bg-white rounded-2xl shadow-2xl w-11/12 max-w-xl p-4 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Camera Capture</h3>
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="text-gray-600 hover:text-gray-900"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[360px]"
                    style={{ background: "#000" }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isCameraReady}
                    className={`px-4 py-2 rounded-lg transition text-white ${isCameraReady ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
                  >
                    Take Photo
                  </button>
                  {!isVideoRecording && (
                    <button
                      type="button"
                      onClick={startVideoRecording}
                      disabled={!isCameraReady}
                      className={`px-4 py-2 rounded-lg transition text-white ${isCameraReady ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"}`}
                    >
                      Start Video
                    </button>
                  )}
                  {isVideoRecording && !isVideoPaused && (
                    <button
                      type="button"
                      onClick={pauseVideoRecording}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Pause Video
                    </button>
                  )}
                  {isVideoRecording && isVideoPaused && (
                    <button
                      type="button"
                      onClick={resumeVideoRecording}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Resume Video
                    </button>
                  )}
                  {isVideoRecording && (
                    <button
                      type="button"
                      onClick={stopVideoRecording}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      Stop Video
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition ml-auto"
                  >
                    Close
                  </button>
                </div>
                {(lastCapturedImageUrl || lastCapturedVideoUrl) && (
                  <div className="mt-4">
                    {lastCapturedImageUrl && (
                      <img src={lastCapturedImageUrl} alt="Last captured" className="w-full max-h-60 object-contain rounded-lg shadow" />
                    )}
                    {lastCapturedVideoUrl && (
                      <video src={lastCapturedVideoUrl} controls className="w-full max-h-60 object-contain rounded-lg shadow mt-2" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Voice Note Recording (icons) */}
          <div className="flex items-center gap-4">
            {!isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="text-green-600 text-3xl"
                title="Start Recording"
              >
                <FiMic />
              </button>
            )}


            {isRecording && !isPaused && (
              <button
                type="button"
                onClick={pauseRecording}
                className="text-yellow-600 text-3xl"
                title="Pause Recording"
              >
                <FiPauseCircle />
              </button>
            )}


            {isRecording && isPaused && (
              <button
                type="button"
                onClick={resumeRecording}
                className="text-blue-600 text-3xl"
                title="Resume Recording"
              >
                <FiPlayCircle />
              </button>
            )}


            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="bg-red-500 text-white px-3 py-1 rounded-lg"
              >
                Stop
              </button>
            )}


            {audioBlob && (
              <button
                type="button"
                onClick={playAudio}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg"
              >
                ▶️ Play Voice Note
              </button>
            )}
          </div>

          {audioBlobs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {audioBlobs.map((b, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => playAudioAt(idx)}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition"
                >
                  ▶️ Voice {idx + 1}
                </button>
              ))}
            </div>
          )}


          {/* Issue Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            className="w-full border border-gray-300 rounded-lg p-3"
          />


          {/* Issue Type */}
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="">Select Issue Type</option>
            <option>Broken Street Light</option>
            <option>Garbage Overflow</option>
            <option>Road Blockage</option>
            <option>Waterlogging</option>
            <option>Illegal Parking</option>
            <option>Drainage Issue</option>
            <option value="Other">Other</option>
          </select>


          {issueType === "Other" && (
            <input
              type="text"
              value={customIssueType}
              onChange={(e) => setCustomIssueType(e.target.value)}
              placeholder="Describe your issue type..."
              className="w-full border border-gray-300 rounded-lg p-3 mt-2"
            />
          )}


          {/* Department */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="">Select Department</option>
            <option>PWD</option>
            <option>Electricity</option>
            <option>Municipality</option>
            <option>Sanitation</option>
            <option>Traffic</option>
          </select>


          {/* Manual Location */}
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location or address"
            className="w-full border border-gray-300 rounded-lg p-3"
          />


          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Submit Report
          </button>
        </form>
      </div>


      {/* Submitted Reports (from context) */}
      {safeReports.length > 0 && (
        <div className="mt-10 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">
            Submitted Reports
          </h3>
          <div className="space-y-6">
            {safeReports.map((report) => (
              <div
                key={report.id}
                className="bg-white shadow-md rounded-xl p-4 border border-gray-200"
              >
                {/* Images */}
                {report.images && report.images.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto mb-3">
                    {report.images.map((img, idx) => (
                      <div key={idx} className="relative h-24 w-24 rounded-lg shadow-md overflow-hidden">
                        <img
                          src={img}
                          alt="Uploaded"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5">
                          <div className="truncate">
                            {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}
                          </div>
                          {report.location && (
                            <div className="truncate">{report.location}</div>
                          )}
                          {(report.lat || report.lon) && (
                            <div className="truncate">Lat: {report.lat || ""}  Lon: {report.lon || ""}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Videos */}
                {report.videos && report.videos.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto mb-3">
                    {report.videos.map((vid, idx) => (
                      <div key={idx} className="relative h-24 w-36 rounded-lg shadow-md overflow-hidden">
                        <video
                          src={vid}
                          controls
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5" style={{ pointerEvents: "none", bottom: 28 }}>
                          <div className="truncate">
                            {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}
                          </div>
                          {report.location && (
                            <div className="truncate">{report.location}</div>
                          )}
                          {(report.lat || report.lon) && (
                            <div className="truncate">Lat: {report.lat || ""}  Lon: {report.lon || ""}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Voice Notes (multiple) */}
                {report.voiceNotes && report.voiceNotes.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {report.voiceNotes.map((v, idx) => (
                      <audio key={idx} controls src={v} className="h-10" />
                    ))}
                  </div>
                )}
                <p className="text-blue-700">Report ID:#{report.id}</p>
                <p className="text-gray-700">
                  <strong>Description:</strong> {report.description}
                </p>
                <p>
                  <strong>Issue:</strong> {report.issueType}
                </p>
                <p>
                  <strong>Department:</strong> {report.department}
                </p>
                <p>
                  <strong>Location:</strong> {report.location}
                </p>
                {/* {report.voiceNote && (
                  <audio controls src={report.voiceNote} className="mt-2 w-full" />
                )} */}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}