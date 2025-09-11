"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Share, Plus, Download } from "lucide-react";

interface PWAInstallPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallPopover({ isOpen, onClose }: PWAInstallPopoverProps) {
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">(
    "desktop",
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setDeviceType("ios");
    } else if (isAndroid) {
      setDeviceType("android");
    } else {
      setDeviceType("desktop");
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  const renderIOSInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Install on iOS</h3>
          <p className="text-sm text-gray-400">
            Add Calari to your home screen
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
            1
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              Tap the <Share className="w-4 h-4 inline mx-1" /> share button at
              the bottom of Safari
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
            2
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              Scroll down and tap <Plus className="w-4 h-4 inline mx-1" />{" "}
              &quot;Add to Home Screen&quot;
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
            3
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-300">
              Tap &quot;Add&quot; to install Calari on your home screen
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAndroidInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Install on Android</h3>
          <p className="text-sm text-gray-400">Add Calari to your device</p>
        </div>
      </div>

      {deferredPrompt ? (
        <Button
          onClick={handleInstallClick}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Install Calari App
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Tap the menu (⋮) in your browser
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Select &quot;Add to Home Screen&quot; or &quot;Install App&quot;
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
              3
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">Confirm the installation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDesktopInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Install on Desktop</h3>
          <p className="text-sm text-gray-400">Add Calari to your computer</p>
        </div>
      </div>

      {deferredPrompt ? (
        <Button
          onClick={handleInstallClick}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Install Calari App
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Look for the install icon in your browser&quot;s address bar
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                Click &quot;Install&quot; to add Calari to your desktop
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Install Calari</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {deviceType === "ios" && renderIOSInstructions()}
        {deviceType === "android" && renderAndroidInstructions()}
        {deviceType === "desktop" && renderDesktopInstructions()}

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Get faster access and offline support by installing the app
          </p>
        </div>
      </div>
    </div>
  );
}
