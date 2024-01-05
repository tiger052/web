import * as THREE from "./modules/three.module.js";

// 전역 장면 값
var btn, gl, glCanvas, camera, scene, renderer, cube;

// 전역 xr 값
var xrSession = null;

loadScene();
init();

//WebGL 콘텍스트와 Three.js 장면의 구성 요소 설정
function loadScene() {
    glCanvas = document.createElement('canvas');
    gl = glCanvas.getContext('webgl', { antialias: true });
    
    // Three.js 장면 셋업
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
    );

    scene = new THREE.Scene();

    var light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
				light.position.set( 0.5, 1, 0.25 );
                scene.add( light );

    var geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
    var material = new THREE.MeshPhongMaterial({color: 0x89CFF0});
    cube = new THREE.Mesh( geometry, material );
    cube.position.y = 0.2;
    scene.add( cube );

    // setup Three.js WebGL renderer
    renderer = new THREE.WebGLRenderer({
        canvas: glCanvas,
        context: gl
    });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    document.body.appendChild( renderer.domElement );
}

// 스크립트 실행 시작
function init() {
        navigator.xr.isSessionSupported('immersive-ar')
            .then((supported) => {
                if (supported) {
                    // XR 호출을 위한 버튼 요소를 생성
                    btn = document.createElement("button");
                    // 버튼에 클릭 이벤트 리스너 추가 
                    btn.addEventListener('click', onRequestSession);
                    btn.innerHTML = "Enter XR";
                    var header = document.querySelector("header");
                    header.appendChild(btn);
                }
                else {
                    // 예외 세션 생성
                    navigator.xr.isSessionSupported('inline')
                        .then((supported) => {
                            if (supported) {
                                console.log('inline session supported')
                            }
                            else {console.log('inline not supported')};
                        })
                }
            })
            .catch((reason) => {
                console.log('WebXR not supported: ' + reason);
            });
}

// XR 세션 요청 처리
function onRequestSession() {
    console.log("requesting session");
    navigator.xr.requestSession('immersive-ar', {requiredFeatures: ['viewer', 'local']})
        .then(onSessionStarted)
        .catch((reason) => {
            console.log('request disabled: ' + reason);
        });
}

// XR 세션이 생성되면 처리 
function onSessionStarted(session) {
    console.log('starting session');
    btn.removeEventListener('click', onRequestSession);
    btn.addEventListener('click', endXRSession);
    btn.innerHTML = "STOP AR";
    xrSession = session;
    xrSession.addEventListener("end", onSessionEnd);
    setupWebGLLayer()
        .then(()=> {
            renderer.xr.setReferenceSpaceType('local');
            renderer.xr.setSession(xrSession);
            animate();
        })
}

// WebGL 콘텍스트를 XR 세션에 연결
function setupWebGLLayer() {
    return gl.makeXRCompatible().then(() => {
        xrSession.updateRenderState( {baseLayer: new XRWebGLLayer(xrSession, gl) });
    });
}

// 애니메이션 루프 시작
function animate() {
    renderer.setAnimationLoop(render);
}

// GPU에 그리기 명령 실행 
function render(time) {
    if (!xrSession) {
        renderer.clear(true, true, true);
        return;
    } else {
        time *= 0.001;
        cube.translateY(0.2 * Math.sin(time) / 100);
        cube.rotateY(Math.PI / 180);
        renderer.render(scene, camera);
        //renderer.render(scene, camera);
    }
}

// XR 세션 종료
function endXRSession() {
    if (xrSession) {
        console.log('ending session...');
        xrSession.end().then(onSessionEnd);
    }
}

// XR 세션의 '종료' 이벤트 처리
function onSessionEnd() {
    xrSession = null;
    console.log('session ended');
    btn.innerHTML = "START AR";
    btn.removeEventListener('click', endXRSession);
    btn.addEventListener('click', onRequestSession);
}