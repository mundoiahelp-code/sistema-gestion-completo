import { useEffect, useRef } from 'react';

export default function ScanMobile() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1280, height: 720 },
      })
      .then((stream) => {
        if (video && video.current && canvas && canvas.current) {
          video.current.srcObject = stream;
          video.current.play();

          const canvasItem = canvas.current;
          const ctx = canvasItem.getContext('2d');
          if (ctx) {
            const width = video.current.videoWidth;
            const height = video.current.videoHeight;
            setInterval(() => {
              // ctx.drawImage(video.current, 0, 0, width, height);
            }, 100);
          }
        }
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <>
      <video ref={video} autoPlay muted />
      <canvas ref={canvas} />
    </>
  );
}
