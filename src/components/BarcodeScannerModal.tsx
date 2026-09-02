import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { playScanSound, isSoundEnabled, setSoundEnabled } from '../lib/sound';
import {
  Camera,
  X,
  ScanLine,
  Volume2,
  VolumeX,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Package,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  products: Product[];
  onScan: (barcode: string) => boolean | void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onScan,
  onClose,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(true);
  const [lastScannedProduct, setLastScannedProduct] = useState<{
    product: Product;
    time: string;
  } | null>(null);
  const [scanStatus, setScanStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef(false);

  // Toggle sound
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập máy ảnh (MediaDevices).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startBarcodeDetection();
      }
    } catch (err: any) {
      console.warn('Camera start failed:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.'
          : err.message || 'Không thể khởi động Camera.'
      );
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Barcode Detection Loop
  const startBarcodeDetection = () => {
    if (!('BarcodeDetector' in window)) {
      // BarcodeDetector not natively available in this browser
      return;
    }

    try {
      const detector = new (window as any).BarcodeDetector({
        formats: [
          'code_128',
          'code_39',
          'code_93',
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
          'qr_code',
          'data_matrix',
        ],
      });

      let lastScannedValue = '';
      let lastScannedTimestamp = 0;

      const detectFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue?.trim();
            const now = Date.now();

            // Prevent spamming the same barcode within 1.5 seconds
            if (rawValue && (rawValue !== lastScannedValue || now - lastScannedTimestamp > 1500)) {
              lastScannedValue = rawValue;
              lastScannedTimestamp = now;
              handleExecuteScan(rawValue);

              if (!continuousMode) {
                stopCamera();
                onClose();
                return;
              }
            }
          }
        } catch {
          // Ignore transient detection errors
        }

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      };

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    } catch (e) {
      console.warn('BarcodeDetector initialization error:', e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleExecuteScan = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const matchedProduct = products.find(
      (p) =>
        p.barcode?.toLowerCase() === trimmed.toLowerCase() ||
        p.id.toString() === trimmed ||
        p.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchedProduct) {
      playScanSound('success');
      setLastScannedProduct({
        product: matchedProduct,
        time: new Date().toLocaleTimeString('vi-VN'),
      });
      setScanStatus({
        type: 'success',
        message: `Đã quét: ${matchedProduct.name} (${matchedProduct.barcode || trimmed})`,
      });
      onScan(trimmed);
    } else {
      playScanSound('error');
      setScanStatus({
        type: 'error',
        message: `Không tìm thấy sản phẩm có mã vạch: "${trimmed}"`,
      });
    }

    setManualCode('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleExecuteScan(manualCode.trim());
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Quét mã vạch sản phẩm</span>
                <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  POS Scanner
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ máy quét cầm tay HID, Camera điện thoại/webcam và nhập mã nhanh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundOn ? 'Tắt âm thanh bíp' : 'Bật âm thanh bíp'}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundOn
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Message */}
          {scanStatus && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
                scanStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{scanStatus.message}</span>
              </div>
              <button
                onClick={() => setScanStatus(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Camera Scanner Viewport */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden flex flex-col items-center">
            {cameraActive ? (
              <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Laser scan line overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-3/4 h-3/5 border-2 border-emerald-400/80 rounded-lg relative">
                    <div className="absolute inset-x-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                    <div className="absolute top-1 left-2 text-[10px] text-emerald-300 font-mono">
                      Đưa mã vạch vào khung
                    </div>
                  </div>
                </div>

                <button
                  onClick={stopCamera}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Dừng Camera</span>
                </button>
              </div>
            ) : (
              <div className="w-full py-8 px-4 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100">Quét bằng Camera / Webcam</div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Sử dụng camera thiết bị để quét trực tiếp mã vạch 1D (EAN-13, Code 128) hoặc QR Code
                  </p>
                </div>

                {cameraError && (
                  <div className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-2 rounded-xl max-w-md">
                    {cameraError}
                  </div>
                )}

                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Bật Camera quét mã</span>
                </button>
              </div>
            )}

            {/* Mode toggles */}
            <div className="w-full mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => setContinuousMode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Chế độ quét liên tục (Không tự đóng cửa sổ)</span>
              </label>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Máy quét HID sẵn sàng</span>
              </div>
            </div>
          </div>

          {/* Manual Input Barcode Form */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nhập mã vạch thủ công hoặc quét từ máy đọc mã vạch
            </label>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Nhập mã barcode (VD: 893456001003, 893456002001...)"
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-4 h-4" />
                <span>Thêm (+1)</span>
              </button>
            </form>
          </div>

          {/* Quick Barcode Simulator Chips (For instant demo testing) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Mã vạch sản phẩm mẫu (Nhấn để quét thử)</span>
              </span>
              <span className="text-[11px] text-slate-400">Giả lập tín hiệu máy quét</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {products
                .filter((p) => p.barcode)
                .slice(0, 8)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleExecuteScan(p.barcode)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                          {p.barcode}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 flex items-center justify-center text-xs font-bold transition flex-shrink-0">
                      +1
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Phím tắt: <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">F1</kbd> Tìm kiếm &bull; <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">F2</kbd> Máy quét &bull; <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">F9</kbd> Thanh toán
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
