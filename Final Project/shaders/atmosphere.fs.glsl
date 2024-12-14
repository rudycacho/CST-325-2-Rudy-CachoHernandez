precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;
uniform sampler2D uTexture;

varying vec2 vTexcoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;


void main(void) {
    // diffuse contribution
    // #1 normalize the light direction and store in a separate variable
    vec3 nLightDirection = normalize(uLightPosition - vWorldPosition);
    // #2 normalize the world normal and store in a separate variable
    vec3 nWorldNormal = normalize(vWorldNormal);
    // #3 calculate the lambert term
    float lambert = dot(nLightDirection,nWorldNormal);
    // specular contribution
    // #4 in world space, calculate the direction from the surface point to the eye (normalized)
    vec3 vEyeDirection = normalize(uCameraPosition - vWorldPosition);
    // #5 in world space, calculate the reflection vector (normalized)
    vec3 vReflection = normalize(reflect(-nLightDirection,nWorldNormal));
    // #6 calculate the phong term
    float phong = pow(max(dot(vReflection,vEyeDirection),0.0),64.0);

    // combine
    // #7 apply light and material interaction for diffuse value by using the texture color as the material

    // #8 apply light and material interaction for phong, assume phong material color is (0.3, 0.3, 0.3)


    vec3 albedo = texture2D(uTexture, vTexcoords).rgb;

    //vec3 ambient = albedo * 0.1;
    vec3 diffuseColor = albedo * lambert;
    //vec3 specularColor = vec3(0.3,0.3,0.3) * phong;

    // #9
    // add "diffuseColor" and "specularColor" when ready
    vec3 finalColor = diffuseColor;

    //gl_FragColor = vec4(vReflection, 1.0);
    //gl_FragColor = vec4(phong,phong,phong, 1.0);
    gl_FragColor = vec4(finalColor, finalColor.r);
}

// EOF 00100001-10