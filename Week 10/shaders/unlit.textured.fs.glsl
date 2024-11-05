precision mediump float;

uniform sampler2D uTexture;
uniform float uAlpha;
varying vec2 v_Textcoords;

void main(void) {
    gl_FragColor = texture2D(uTexture,v_Textcoords);
    gl_FragColor.w = uAlpha;
}

// EOF 00100001-10
