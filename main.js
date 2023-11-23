import "./style.css"

import WindowManager from './window';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

let camera, scene, renderer, world;
let near, far;
let objs = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

const getTime =() =>{
	return (new Date().getTime() - today) / 1000.0;
}

let internalTime = getTime();
let windowManager;
let initialized = false;


if (new URLSearchParams(window.location.search).get("clear")){
	localStorage.clear();
}
else {	
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			initialized = true;
			init();
			
		}
	};

	const init = () => {
		setTimeout(() => {
			paintScene()
			setupWindowManager();
			resize();
			updateWindowShape(false);
			animate();
			window.addEventListener('resize', resize);
		}, 300)	
	}

	const paintScene = () =>   {
		camera = new THREE.OrthographicCamera( window.innerWidth/-2, window.innerWidth/2, window.innerHeight/-2, window.innerHeight/2, 1, 1000);
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new THREE.Scene();
		scene.add( camera );

		renderer = new THREE.WebGLRenderer({antialias: true, depthBuffer: true});
        renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
		renderer.setClearColor("lightblue");

		const loader = new GLTFLoader();
	    loader.load('/coral_fort_wall_02_2k.gltf/coral_fort_wall_02_2k.gltf', (th) => {
			const text = th.scene.children[0].material.map;
			scene.background = text
		});
    
	    
	  	world = new THREE.Object3D();
        scene.add(world);
    
        const ambientLight = new THREE.AmbientLight('white', 1);
        scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight('white', 4);
        scene.add(directionalLight);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
	}

	const updateWindowShape = (easing = true)=> {
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}

	const setupWindowManager = ()=> {
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(updateWindow);

		let metaData = {foo: "bar"};
		windowManager.init(metaData);
		updateWindow();
	}

	const updateWindow =()=> {
		updateNumberOfobjs();
	}

	const updateNumberOfobjs = ()=> {
		let wins = windowManager.getWindows();
		objs.forEach((c) => {
			world.remove(c);
		})
		objs = [];
		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];

			let color = new THREE.Color();
			color.setHSL(i * .1, 1.0, .5);
			let shape = 100 + i * 2;
			let obj = new THREE.Mesh(new THREE.TorusGeometry(shape, 30, shape), new THREE.MeshPhongMaterial({color: color, wireframe:true }));
			obj.position.x = win.shape.x + (win.shape.w * .5);
			obj.position.y = win.shape.y + (win.shape.h * .5);
			world.add(obj);
			objs.push(obj);
		}
	}

	function animate () {
		let time = getTime();
		windowManager.update();
		let falloff = 0.5;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();
		for (let i = 0; i < objs.length; i++) {
			let obj = objs[i];
			let win = wins[i];
			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}
			obj.position.x = obj.position.x + (posTarget.x - obj.position.x) * falloff;
			obj.position.y = obj.position.y + (posTarget.y - obj.position.y) * falloff;
			obj.rotation.y = time * 1;
		};
		renderer.render(scene, camera);
		requestAnimationFrame(animate)
	}



	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new THREE.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}