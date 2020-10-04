import Vue from 'vue';

var app = new Vue({
    el: '#app',
    data: {
        drawingContext: null,
    },
    mounted() {
        this.drawingContext = document.getElementById("c").getContext("2d");
    },
    methods: {
        render: function(event) {
            const w = 400;
            const h = 200;
            const bytes_per_pixel = 4;

            // const n = h * w * bytes_per_pixel;
            // const buffer = new Uint8ClampedArray(n);

            const imageData = this.drawingContext.getImageData(0, 0, w, h);
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

            this.drawingContext.putImageData(imageData, 0, 0);
        }
    }
});