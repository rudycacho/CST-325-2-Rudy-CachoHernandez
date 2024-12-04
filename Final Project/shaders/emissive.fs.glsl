precision mediump float;

uniform sampler2D uTexture;
varying vec2 vTexcoords;


void main(void) {
    gl_FragColor = texture2D(uTexture,vTexcoords);
}

// EOF 00100001-10