import Vue from 'vue';

var app = new Vue({
    el: '#app',
    data: {
        ctx: null,
        tempCanvas: null,
        tempCtx: null,
    },
    mounted() {
        this.canvas = document.getElementById("c")
        this.canvasCtx = this.canvas.getContext("2d");

        // We use a second canvas to write image data to directly.
        // Then we can resize the rendered image and draw it atop
        // our actual visible canvas.
        this.tempCanvas = document.createElement("canvas");
        this.tempCanvasCtx = this.tempCanvas.getContext("2d");
    },
    methods: {
        render: function(event) {
            const w = 80;
            const h = 40;
            const bytes_per_pixel = 4;

            this.tempCanvas.width = w;
            this.tempCanvas.height = h;

            const imageData = this.tempCanvasCtx.getImageData(0, 0, w, h);
            const buffer = imageData.data;

            // k addresses the first byte (the red byte) of a pixel
            // in the image buffer. The relationship between k and
            // the coordinates (i, j) of the image is
            // k = i * (width * 4) + j * 4
            var i, j, k = 0;

            const noise = 30.0;

            for (i = 0; i < h; i++) {
                for(j = 0; j < w; j++) {

                    const epsilon = Math.random() * noise;

                    buffer[k] = Math.floor(epsilon);
                    buffer[k+1] = Math.floor(epsilon + (256.0 * i) / h);
                    buffer[k+2] = Math.floor(epsilon + (256.0 * j) / w);
                    buffer[k+3] = 255;
                    k += bytes_per_pixel;
                }
            }

            this.tempCanvasCtx.putImageData(imageData, 0, 0);

            // OK, resize and draw the image atop the visible canvas.
            this.canvasCtx.drawImage(this.tempCanvas, 0, 0, w, h, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
});