/**
 * Created by linfaxin on 15/12/11.
 */
///<reference path="../../android/graphics/Rect.ts"/>
///<reference path="../../android/graphics/Color.ts"/>

module androidui.image{
    import Rect = android.graphics.Rect;
    import Color = android.graphics.Color;

    export class NetImage {
        private browserImage;
        private mSrc:string;
        private mImageWidth=0;
        private mImageHeight=0;
        private mOnLoads = new Set<()=>void>();
        private mOnErrors = new Set<()=>void>();
        private mImageLoaded = false;
        private mOverrideImageRatio:number;

        constructor(src:string, overrideImageRatio?:number) {
            this.init(src);
            this.mOverrideImageRatio = overrideImageRatio;
        }

        protected init(src:string){
            this.createImage();
            this.src = src;
        }

        protected createImage(){
            this.browserImage = new Image();
        }

        protected loadImage(){
            this.browserImage.src = this.mSrc;
            this.browserImage.onload = ()=>{
                this.mImageWidth = this.browserImage.width;
                this.mImageHeight = this.browserImage.height;
                this.fireOnLoad();
            };
            this.browserImage.onerror = ()=>{
                this.mImageWidth = this.mImageHeight = 0;
                this.fireOnError();
            };
        }

        public get src():string {
            return this.mSrc;
        }

        public set src(value:string) {
            value = convertToAbsUrl(value);
            if(value!==this.mSrc){
                this.mSrc = value;
                this.loadImage();
            }
        }

        public get width():number {
            return this.mImageWidth;
        }

        public get height():number {
            return this.mImageHeight;
        }

        getImageRatio():number {
            if(this.mOverrideImageRatio) return this.mOverrideImageRatio;
            let url = this.src;
            if(!url) return 1;
            if(url.startsWith('data:')) return 1;//may base64 encode
            let idx = url.lastIndexOf('.'); // xxx@3x.png
            if(idx>0){
                url = url.substring(0, idx);
            }
            if(url.endsWith('.9')) url = url.substring(0, url.length-2);// xxx@3x.9.png

            if(url.endsWith('@2x')) return 2;
            if(url.endsWith('@3x')) return 3;
            if(url.endsWith('@4x')) return 4;
            if(url.endsWith('@5x')) return 5;
            if(url.endsWith('@6x')) return 6;
            return 1;
        }

        isImageLoaded():boolean {
            return this.mImageLoaded;
        }

        private fireOnLoad(){
            this.mImageLoaded = true;
            for(let load of this.mOnLoads){
                load();
            }
        }
        private fireOnError(){
            this.mImageLoaded = false;
            for(let error of this.mOnErrors){
                error();
            }
        }

        addLoadListener(onload:()=>void, onerror?:()=>void){
            if(onload){
                this.mOnLoads.add(onload);
            }
            if(onerror){
                this.mOnErrors.add(onerror);
            }
        }

        removeLoadListener(onload?:()=>void, onerror?:()=>void){
            if(onload){
                this.mOnLoads.delete(onload);
            }
            if(onerror){
                this.mOnErrors.delete(onerror);
            }
        }

        recycle():void {
            //no impl for web
        }

        getPixels(bound:Rect, callBack:(data:number[])=>void):void {
            if(!callBack) return;
            let canvasEle = document.createElement('canvas');
            if(!bound) bound = new Rect(0, 0, this.width, this.height);
            if(bound.isEmpty()) {
                callBack([]);
                return;
            }
            let w = bound.width();
            let h = bound.height();
            canvasEle.width = w;
            canvasEle.height = h;
            let canvas = canvasEle.getContext('2d');
            canvas.drawImage(this.browserImage, bound.left, bound.top, w, h, 0, 0, w, h);
            let data = canvas.getImageData(0, 0, w, h).data;
            let colorData = [];
            for(let i = 0; i<data.length; i+=4){
                colorData.push(Color.rgba(data[i], data[i+1], data[i+2], data[i+3]));
            }
            callBack(colorData);

            canvasEle.width = 0;
            canvasEle.height = 0;
        }

    }

    let convertA = document.createElement('a');
    function convertToAbsUrl(url:string){
        convertA.href = url;
        return convertA.href;
    }
}