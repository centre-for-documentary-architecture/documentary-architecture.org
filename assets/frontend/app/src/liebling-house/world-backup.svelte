<script>
	import LoadScript from '../helpers/loadScript.svelte';
	const dependencies = [
		"https://documentary-architecture.fra1.digitaloceanspaces.com/cda/assets/liebling-house/Build/UnityLoader.js"
	];

	export let view;
	export let classname;

	/*

	view.content
		worlditemStart: worlditem
		worlditemsList: ./i/liebling-house/worlditems.json
		unityLoader:    ./Build/UnityLoader.js
		unityJson:      ./Build/liebling-house-world.json

	world.state
		ViewingKiosk     // rotating building at the beginning of program -> explore
		ViewingDollhouse // DHV -> explore
		ViewingItem      // camera fixed in hotspot -> explore + dollhouse
		ViewingPlatform  // world deactivated (controls remain from previous state)
		FreeRoaming      // walking in wolrd -> dollhouse
		MovingToItem     // automated walk to destination -> stop + dollhouse

	*/

	var world = {
		loaded: false,
		progress: 0,

		tooltips: {
			item: false,
			help: false
		},
		roaming: "Start exploring",
		dollhouse: false,
		help: "Click on the builing to start exploring.",
		state: 'ViewingKiosk',
		states: {
			ViewingKiosk: {
				roaming: false,
				dollhouse: false,
				help: "Click on the builing to start exploring."
			},
			ViewingDollhouse: {
				roaming: "Continue exploring",
				dollhouse: false,
				help: "Drag to rotate building or click on one of the highlighted spots."
			},
			ViewingItem: {
				roaming: false,
				dollhouse: true,
				help: "Click to start exploring."
			},
			FreeRoaming: {
				roaming: false,
				dollhouse: true,
				help: "Use ← ↑ ↓ → to navigate and mouse to rotate camera. ESC to leave."
			},
			MovingToItem: {
				roaming: "Stop",
				dollhouse: false,
				help: false
			}
		}
	};

	import { onDestroy } from 'svelte';
	onDestroy(() => {
		lieblingHouseWorldInstance.Quit(function() {
		    console.log("done!");
		});
		lieblingHouseWorldInstance = null;
	});
	/*
	* load and ini world
	*/
	function unityInit(){

		// return;

		// https://docs.unity3d.com/Manual/webgl-templates.html
		lieblingHouseWorldContainer = document.getElementById('worldContainer');
		lieblingHouseWorldInstance = UnityLoader.instantiate(
			lieblingHouseWorldContainer,
			view.content.unityJson,
			{ onProgress: UnityProgress }
		);

	};
	function UnityProgress(lieblingHouseWorldInstance, progress) {

		if (!lieblingHouseWorldInstance.Module) {
			return;
		}

		world.progress = Math.round( progress*100 );

		if (progress === 1 && !lieblingHouseWorldInstance.removeTimeout) {
			lieblingHouseWorldInstance.removeTimeout = setTimeout(function() {

				world.loaded = true;
				console.log('Unity loaded');

			}, 3000);
		}

	}
	window.onWorldReady = () => {

		console.log( 'onWorldReady' );

	}
	/*
	* control world -> website
	*/
	window.worldUpdateState = state => {

		console.log('worldUpdateState( ' + state + ' )' );

		if( state == 'ViewingPlatform' ){
			return;
		}

		world.state = state;

		world.roaming = world.states[ state ].roaming;
		world.dollhouse = world.states[ state ].dollhouse;
		world.help = world.states[ state ].help;

	}
	window.worldHoverItem = worlditemId => {
		if( worlditemId == '' ){
			// console.log('worldHoverItem() mouse leave');
			world.tooltips.item = false;
		} else {
			// console.log( 'worldHoverItem( ' + worlditemId + ' )' );
			world.tooltips.item = worlditemId;
		}
		// maybe highlight collection elements by id?
		return true;
	}
	window.worldSelectItem = worlditemId => {
		if( worlditemId == '' ){
			console.log('worldSelectItem() no selection');
			return false;
		}
		/* will directly navigate to this entity */
		console.log('worldSelectItem( ' + worlditemId + ' )');
		showWorlditemContent( worlditemId );
		return true;
	}
	window.worldSelectTourstopOfItem = tourstopId => {
		if( tourstopId == '' ){
			console.log('worldSelectTourstopOfItem() no selection');
			return false;
		}
		/* will navigate to tourstop within world */
		console.log('worldSelectTourstopOfItem( ' + tourstopId + ' )');
		naviFromWorld( tourstopId );
		return true;
	}
	/*
	* control website -> world
	*/
	window.worldSetRoaming = option => {
		console.log('WorldUpdateState( FreeRoaming )');
		lieblingHouseWorldInstance.SendMessage('GameManager', 'WorldUpdateState', 'FreeRoaming');
	}
	function worldSetRoaming2(){
		console.log('WorldUpdateState( FreeRoaming )');
		lieblingHouseWorldInstance.SendMessage('GameManager', 'WorldUpdateState', 'FreeRoaming');
	}
	function worldSetDollhouse(){
		console.log('WorldUpdateState( ViewingDollhouse )');
		lieblingHouseWorldInstance.SendMessage('GameManager', 'WorldUpdateState', 'ViewingDollhouse');
	}
	window.goThroughGlass = event => {
		console.log('went through glass');
		worldSetRoaming();
	}
</script>

<style>
	.hover {
		/* cursor: help; */
		background-color: #66f;
	}
	.section--content {
		position: relative;
	}
	.loader {
		width: 100%;
		height: 100%;
		background-color: #000;
		/* z-index: 30; */
		position: absolute;
		top: 0;
		left: 0;
	}
	.loader:after {
		content: "";
		position: absolute;
		display: block;
		height: 2rem;
		width: 2rem;
		top: 50%;
		left: 50%;
		margin-left: -1rem;
		margin-top: -1rem;
		border-radius: 5rem;
		z-index: 1;
		background-color: #00f;
		-webkit-animation: pulsate 2s ease infinite both;
				animation: pulsate 2s ease infinite both;
	}
	@keyframes pulsate {
		0% {
		-webkit-transform: scale(0.8);
				transform: scale(0.8);
		}
		50% {
		-webkit-transform: scale(1.6);
				transform: scale(1.6);
		}
		100% {
		-webkit-transform: scale(0.8);
				transform: scale(0.8);
		}
	}
</style>

<LoadScript on:loaded={unityInit} dependencies={dependencies}/>

<section class="{classname} {view.type}">

	<div class="section--content" id="view-liebling-house">
		<div id="worldContainer" class="presentation-container"></div>
		{#if world.loaded === false }
			<div class="loader"></div>
		{/if}
	</div>

	<div class="bar controls section--controls {world.tooltips.item ? 'hover' : ''}" id="view-liebling-house-controls">
		{#if world.loaded === false }
			<span class="message">Loading {world.progress}% ... Please wait.</span>
		{:else}

			{#if world.tooltips.item !== false}
				<span class="message">{world.tooltips.item}</span>
			{:else if world.help !== false }

				<span class="message">{world.help}</span>

				<span class="right">
					{#if world.roaming }

						<button on:click={window.worldSetRoaming}>{world.roaming}</button>

					{/if}
					{#if world.dollhouse }

						<button on:click={worldSetDollhouse}>Overview</button>

					{/if}
				</span>

			{/if}

		{/if}

	</div>

</section>
