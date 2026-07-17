import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, X, RefreshCw, Check, Image as ImageIcon } from "lucide-react";
import SecureImage from "./SecureImage";

export default function PhotoCapture({ currentPhotoUrl, onPhotoSelected, onCancel }) {
  const [mode, setMode] = useState("preview"); // preview, upload, camera
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl || "/patient/default/photo");
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop camera when unmounting or changing modes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      setStream(mediaStream);
      setMode("camera");
      // Need a small delay to allow video element to render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Calculate crop to make it square
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
        setMode("preview");
      }, "image/jpeg", 0.9);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.");
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode("preview");
  };

  const handleUsePhoto = () => {
    if (selectedFile) {
      onPhotoSelected(selectedFile, previewUrl);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800">Profile Photo</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {mode === "camera" ? (
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 rounded-full overflow-hidden bg-black mb-4 border-4 border-indigo-100 shadow-md">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => { stopCamera(); setMode("preview"); }}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={capturePhoto}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Camera size={16} /> Capture
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4 group">
            <SecureImage 
              src={previewUrl} 
              alt="Profile Preview" 
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-slate-100"
            />
            {selectedFile && (
              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-sm">
                <Check size={14} />
              </div>
            )}
          </div>

          {!selectedFile ? (
            <div className="flex gap-2 w-full justify-center">
              <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors border border-indigo-100">
                <Upload size={14} /> Upload
                <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <button 
                type="button"
                onClick={startCamera}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
              >
                <Camera size={14} /> Camera
              </button>
            </div>
          ) : (
            <div className="flex flex-col w-full gap-2 mt-2">
              <button 
                type="button"
                onClick={handleUsePhoto}
                className="w-full py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Use This Photo
              </button>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={startCamera}
                  className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Retake
                </button>
                <label className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-center">
                  Upload Other
                  <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
