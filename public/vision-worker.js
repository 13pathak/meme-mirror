// Classic worker: MediaPipe's WASM loader uses importScripts. ESM is imported dynamically.
let model, mode, delegate;
async function initialise(preference = 'GPU') {
  const { FaceLandmarker, FilesetResolver } = await import('./vendor/vision_bundle.mjs');
  const vision = await FilesetResolver.forVisionTasks('/vendor/wasm');
  const create = async d => FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: d },
    runningMode: 'VIDEO', numFaces: 2, outputFaceBlendshapes: true,
    minFaceDetectionConfidence: .5, minFacePresenceConfidence: .5, minTrackingConfidence: .5,
  });
  try { model = await create(preference); delegate = preference; }
  catch (error) { if (preference === 'CPU') throw error; model = await create('CPU'); delegate = 'CPU'; }
  mode = 'VIDEO';
}
self.onmessage = async ({ data }) => {
  const { id, type, bitmap } = data;
  try {
    if (type === 'init') { await initialise(data.delegate); self.postMessage({ id, delegate }); return; }
    const nextMode = type === 'reference' ? 'IMAGE' : 'VIDEO';
    if (mode !== nextMode) { await model.setOptions({ runningMode: nextMode }); mode = nextMode; }
    const start = performance.now();
    let result;
    try { result = mode === 'IMAGE' ? model.detect(bitmap) : model.detectForVideo(bitmap, data.time); }
    catch (error) {
      if (delegate !== 'GPU') throw error;
      model.close(); await initialise('CPU');
      if (nextMode !== mode) { await model.setOptions({ runningMode: nextMode }); mode = nextMode; }
      result = mode === 'IMAGE' ? model.detect(bitmap) : model.detectForVideo(bitmap, data.time);
    }
    self.postMessage({ id, count: result.faceLandmarks.length, categories: result.faceLandmarks.length === 1 ? result.faceBlendshapes[0]?.categories : null, ms: performance.now() - start, delegate });
  } catch (error) { self.postMessage({ id, error: error.message || String(error) }); }
  finally { bitmap?.close(); }
};
