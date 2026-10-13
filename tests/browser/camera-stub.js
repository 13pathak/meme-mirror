// Test-only camera: follow the displayed target unless a test supplies measurements.
export const cameraStub = `
import { EXPRESSIONS, FEATURES } from '/scoring.js';
import { BUILTIN_REFERENCES } from '/builtin-references.js';
export class VisionCamera {
  constructor(video,onSample) {
    this.video=video;this.onSample=onSample;this.running=false;this.count=1;this.override=null;
    this.frame=document.createElement('canvas');this.frame.width=640;this.frame.height=480;
    const ctx=this.frame.getContext('2d');ctx.fillStyle='#6ba4d2';ctx.fillRect(0,0,320,480);ctx.fillStyle='#e57386';ctx.fillRect(320,0,320,480);
    this.timer=setInterval(()=>{
      if(!this.running||this.paused)return;
      const src=document.querySelector('#reference-image').getAttribute('src');
      const profile=src.includes('grin.png')?BUILTIN_REFERENCES.smile:EXPRESSIONS.find(e=>src.endsWith('/'+e.id+'.svg'));
      const sample={...Object.fromEntries(Object.keys(FEATURES).map(k=>[k,0])),...(this.override||profile.target)};
      this.onSample({count:this.count,sample:this.count===1?sample:null,bitmap:this.frame,captured:performance.now(),received:performance.now(),ms:1});
    },100);
    window.addEventListener('test-face-count',e=>this.count=e.detail);
    window.addEventListener('test-sample',e=>this.override=e.detail);
  }
  async start(){this.running=true;this.stream={getVideoTracks:()=>[{getSettings:()=>({deviceId:'test'})}]};return[{deviceId:'test',label:'Simulated camera'}];}
  stop(){this.running=false;this.onSample({count:0,sample:null,captured:performance.now(),received:performance.now()});}
  dispose(){this.stop();} async analyse(){return {count:0,sample:null};}
}`;
