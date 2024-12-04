'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

var sunGeo = null; // this will be created after loading from a file
var groundGeometry = null;
var frontGeometry = null;
var backGeometry = null;
var leftGeometry = null;
var rightGeometry = null;
var topGeometry = null;

// Planets
var mercuryGeo = null;
var venusGeo = null;
var earthGeo = null;
var marsGeo = null;
var jupiterGeo = null;
var saturnGeo = null;
var uranusGeo = null;
var neptuneGeo = null;


var projectionMatrix = new Matrix4();
var lightPosition = new Vector3(4,1.5,0);

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var phongShaderProgram;
var flatShaderProgram;
var emissiveShaderProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
var loadedAssets = {
    phongTextVS: null,
    phongTextFS: null,
    sphereJSON: null,
    sunImage: null,
    starsImage: null,
    flatColorVS: null,
    flatColorFS: null,
    emissiveVS: null,
    emissiveFS: null,
    mercuryImage: null,
    venusImage: null,
    venusAtmoImage: null,
    earthImage: null,
    earthCloudsImage: null,
    earthNightImage: null,
    marsImage: null,
    jupiterImage: null,
    saturnImage: null,
    saturnRingImage: null,
    uranusImage: null,
    neptuneImage: null,
    moonImage: null,
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        gl.enable(gl.DEPTH_TEST);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.pointlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/sun.jpg'),
        loadImage('./data/8k_stars.jpg'),
        fetch('./shaders/flat.color.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/emissive.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/emissive.fs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/8k_mercury.jpg'),
        loadImage('./data/8k_venus_surface.jpg'),
        loadImage('./data/4k_venus_atmosphere.jpg'),
        loadImage('./data/8k_earth_daymap.jpg'),
        loadImage('./data/8k_earth_clouds.jpg'),
        loadImage('./data/8k_earth_nightmap.jpg'),
        loadImage('./data/8k_mars.jpg'),
        loadImage('./data/8k_jupiter.jpg'),
        loadImage('./data/8k_saturn.jpg'),
        loadImage('./data/8k_saturn_ring_alpha.png'),
        loadImage('./data/2k_uranus.jpg'),
        loadImage('./data/2k_neptune.jpg'),
        loadImage('./data/8k_stars.jpg'),
    ];

    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.phongTextVS = values[0];
        loadedAssets.phongTextFS = values[1];
        loadedAssets.sphereJSON = values[2];
        loadedAssets.sunImage = values[3];
        loadedAssets.starsImage = values[4];
        loadedAssets.flatColorVS = values[5];
        loadedAssets.flatColorFS = values[6];
        loadedAssets.emissiveVS = values[7];
        loadedAssets.emissiveFS = values[8];
        loadedAssets.mercuryImage = values[9];
        loadedAssets.venusImage = values[10];
        loadedAssets.venusAtmosphere = values[11];
        loadedAssets.earthImage = values[12];
        loadedAssets.earthCloudsImage = values[13];
        loadedAssets.earthNightImage = values[14];
        loadedAssets.marsImage = values[15];
        loadedAssets.jupiterImage = values[16];
        loadedAssets.saturnImage = values[17];
        loadedAssets.saturnRingImage = values[18];
        loadedAssets.uranusImage = values[19];
        loadedAssets.neptuneImage = values[20];
        loadedAssets.moonImage = values[21];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    phongShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.phongTextVS, loadedAssets.phongTextFS);

    phongShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(phongShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(phongShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(phongShaderProgram, "aTexcoords")
    };

    phongShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uProjectionMatrix"),
        lightDirectionUniform: gl.getUniformLocation(phongShaderProgram, "uLightPosition"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture"),
    };

    flatShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.flatColorVS, loadedAssets.flatColorFS);

    flatShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(flatShaderProgram, "aVertexPosition")
    }

    flatShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(flatShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(flatShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(flatShaderProgram, "uProjectionMatrix"),
    }

    // Emissive Shaders
    emissiveShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.emissiveVS, loadedAssets.emissiveFS);

    emissiveShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(emissiveShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(emissiveShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(emissiveShaderProgram, "aTexcoords")
    }

    emissiveShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(emissiveShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(emissiveShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(emissiveShaderProgram, "uProjectionMatrix"),
        textureUniform: gl.getUniformLocation(emissiveShaderProgram, "uTexture"),
    }

}

// -------------------------------------------------------------------------
function createScene() {

    // Skybox
    groundGeometry = new WebGLGeometryQuad(gl, emissiveShaderProgram);
    groundGeometry.create(loadedAssets.starsImage);

    var scale = new Matrix4().makeScale(100.0, 100.0, 100.0);
    var translation = new Matrix4().makeTranslation(0, -50, 0);

    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationX(-90);

    groundGeometry.worldMatrix.makeIdentity();
    groundGeometry.worldMatrix.multiply(translation).multiply(rotation).multiply(scale);

    // Roof
    topGeometry = new WebGLGeometryQuad(gl, emissiveShaderProgram);
    topGeometry.create(loadedAssets.starsImage);

    var translation = new Matrix4().makeTranslation(0, 50, 0);
    var rotation = new Matrix4().makeRotationX(90);
    topGeometry.worldMatrix.makeIdentity();
    topGeometry.worldMatrix.multiply(translation).multiply(rotation).multiply(scale);

    // Back Wall
    backGeometry = new WebGLGeometryQuad(gl, emissiveShaderProgram);
    backGeometry.create(loadedAssets.starsImage);

    var translation = new Matrix4().makeTranslation(0, 0, -50);
    backGeometry.worldMatrix.makeIdentity();
    backGeometry.worldMatrix.multiply(translation).multiply(scale);

    // Front Wall
    frontGeometry = new WebGLGeometryQuad(gl, emissiveShaderProgram);
    frontGeometry.create(loadedAssets.starsImage);

    var translation = new Matrix4().makeTranslation(0, 0, 50);
    frontGeometry.worldMatrix.makeIdentity();
    frontGeometry.worldMatrix.multiply(translation).multiply(scale);

    // Left Wall
    leftGeometry = new WebGLGeometryQuad(gl, emissiveShaderProgram);
    leftGeometry.create(loadedAssets.starsImage);

    var translation = new Matrix4().makeTranslation(-50, 0, 0);
    var rotation = new Matrix4().makeRotationY(90);
    leftGeometry.worldMatrix.makeIdentity();
    leftGeometry.worldMatrix.multiply(translation).multiply(rotation).multiply(scale);

    // Right Wall
    rightGeometry = new WebGLGeometryQuad(gl, emissiveShaderProgram);
    rightGeometry.create(loadedAssets.starsImage);

    var translation = new Matrix4().makeTranslation(50, 0, 0);
    var rotation = new Matrix4().makeRotationY(-90);
    rightGeometry.worldMatrix.makeIdentity();
    rightGeometry.worldMatrix.multiply(translation).multiply(rotation).multiply(scale);

    // Solar System
    sunGeo = new WebGLGeometryJSON(gl, emissiveShaderProgram);
    sunGeo.create(loadedAssets.sphereJSON, loadedAssets.sunImage);

    var scale = new Matrix4().makeScale(0.05, 0.05, 0.05);

    sunGeo.worldMatrix.makeIdentity();
    sunGeo.worldMatrix.multiply(scale);


    // Mercury
    mercuryGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    mercuryGeo.create(loadedAssets.sphereJSON, loadedAssets.mercuryImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(2, 0, 0);
    mercuryGeo.worldMatrix.makeIdentity();
    mercuryGeo.worldMatrix.multiply(translation).multiply(scale);

    // Venus
    venusGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    venusGeo.create(loadedAssets.sphereJSON, loadedAssets.venusImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(4, 0, 0);
    venusGeo.worldMatrix.makeIdentity();
    venusGeo.worldMatrix.multiply(translation).multiply(scale);

    // Earth
    earthGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    earthGeo.create(loadedAssets.sphereJSON, loadedAssets.earthImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(6, 0, 0);
    earthGeo.worldMatrix.makeIdentity();
    earthGeo.worldMatrix.multiply(translation).multiply(scale);

    // Mars
    marsGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    marsGeo.create(loadedAssets.sphereJSON, loadedAssets.marsImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(8, 0, 0);
    marsGeo.worldMatrix.makeIdentity();
    marsGeo.worldMatrix.multiply(translation).multiply(scale);

    // Jupiter
    jupiterGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    jupiterGeo.create(loadedAssets.sphereJSON, loadedAssets.jupiterImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(10, 0, 0);
    jupiterGeo.worldMatrix.makeIdentity();
    jupiterGeo.worldMatrix.multiply(translation).multiply(scale);

    // Saturn
    saturnGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    saturnGeo.create(loadedAssets.sphereJSON, loadedAssets.saturnImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(12, 0, 0);
    saturnGeo.worldMatrix.makeIdentity();
    saturnGeo.worldMatrix.multiply(translation).multiply(scale);

    // Uranus
    uranusGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    uranusGeo.create(loadedAssets.sphereJSON, loadedAssets.uranusImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(14, 0, 0);
    uranusGeo.worldMatrix.makeIdentity();
    uranusGeo.worldMatrix.multiply(translation).multiply(scale);

    // Neptune
    neptuneGeo = new WebGLGeometryJSON(gl, phongShaderProgram);
    neptuneGeo.create(loadedAssets.sphereJSON, loadedAssets.neptuneImage);

    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);
    var translation = new Matrix4().makeTranslation(16, 0, 0);
    neptuneGeo.worldMatrix.makeIdentity();
    neptuneGeo.worldMatrix.multiply(translation).multiply(scale);

}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    time.update();
    camera.update(time.deltaTime);

    var angle = (time.deltaTime);
    var cosTheta = Math.cos(angle);
    var sinTheta = Math.sin(angle);
    var newX = lightPosition.x * cosTheta - lightPosition.z * sinTheta;
    var newZ = lightPosition.x * sinTheta + lightPosition.z * cosTheta;
    lightPosition.set(newX, lightPosition.y, newZ);

    var translation = new Matrix4().makeTranslation(newX, 1.5, newZ);
    var scale = new Matrix4().makeScale(0.007, 0.007, 0.007);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(phongShaderProgram);
    var uniforms = phongShaderProgram.uniforms;
    var cameraPosition = camera.getPosition();
    gl.uniform3f(uniforms.lightDirectionUniform, lightPosition.x, lightPosition.y, lightPosition.z);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);

    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);
    groundGeometry.render(camera, projectionMatrix, emissiveShaderProgram);
    topGeometry.render(camera, projectionMatrix, emissiveShaderProgram);
    backGeometry.render(camera, projectionMatrix, emissiveShaderProgram);
    frontGeometry.render(camera, projectionMatrix, emissiveShaderProgram);
    leftGeometry.render(camera, projectionMatrix, emissiveShaderProgram);
    rightGeometry.render(camera, projectionMatrix, emissiveShaderProgram);



    sunGeo.render(camera, projectionMatrix, emissiveShaderProgram);

    // Planet Rendering
    mercuryGeo.render(camera, projectionMatrix, phongShaderProgram)
    venusGeo.render(camera, projectionMatrix, phongShaderProgram)
    earthGeo.render(camera, projectionMatrix, phongShaderProgram)
    marsGeo.render(camera, projectionMatrix, phongShaderProgram)
    jupiterGeo.render(camera, projectionMatrix, phongShaderProgram)
    saturnGeo.render(camera, projectionMatrix, phongShaderProgram)
    uranusGeo.render(camera, projectionMatrix, phongShaderProgram)
    neptuneGeo.render(camera, projectionMatrix, phongShaderProgram)



}

// EOF 00100001-10