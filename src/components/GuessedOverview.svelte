<script>
    import {currentGameScreen, changeCurrentTeamPoints, getCurrentPlayer, currentFiveWords, goToNextRound, getCurrentTeam } from '../stores/stores.js'
	import InterimScore from './InterimScore.svelte'
	import { fly } from 'svelte/transition';

function changePoints(inputEvent) {
    //Get Input if not form-check-input
    let target = inputEvent.target;
    if(target.classList.contains('form-check')) {
        target = target.firstChild;
        target.checked = !target.checked;
    } else if (target.classList.contains('form-check-label')){
        target = target.parentNode.firstChild;
        target.checked = !target.checked;
    }

    if(target.checked) {
        changeCurrentTeamPoints(1);
    } else {
        changeCurrentTeamPoints(-1);
    }
}
</script>

<div class="vertical-center" in:fly>
    <div class="container-fluid">
        <div class="row justify-content-center pt-3">
            <div class="col-12 mb-5 text-center">
                <h5 class="c-white mb-0">{getCurrentTeam().name}</h5>
                <h5 class="c-white">{getCurrentPlayer().name}</h5>
            </div>
        </div>
        <div class="row justify-content-center pt-3">
            <div class="col-12 mb-5 text-center">
                <h5 class="c-white">Select the</h5>
                <h5 class="c-white">guessed words</h5>
            </div>
        </div>
        <div class="row justify-content-center pt-3">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card">
                    <div class="card-body text-center c-purple border border-secondary m-3">
                        {#each $currentFiveWords as word, i}
                        {#if i == 4}
                        <h4 class="">
                            <div class="form-check" on:click="{(inputBox) => {changePoints(inputBox)}}">
                                <input class="form-check-input" type="checkbox" value="">
                                <label class="form-check-label" for="flexCheckDefault">
                                    {word}
                                </label>
                            </div>
                        </h4>
                        {:else}
                        <h4 class="mb-3">
                            <div class="form-check" on:click="{(inputEvent) => {changePoints(inputEvent)}}">
                                <input class="form-check-input" type="checkbox" value="" >
                                <label class="form-check-label" for="flexCheckDefault">
                                    {word}
                                </label>
                            </div>
                        </h4>
                        {/if}
                        {/each}
                        
                    </div>
                </div>
            </div>
            <div class="row justify-content-center pt-3">
                <div class="col-12 col-md-8 col-lg-6 mt-3">
                    <div class="card bg-blue" on:click="{() => {currentGameScreen.set(InterimScore); goToNextRound()}}">
                        <div class="card-body text-center">
                            <h2 class="c-white mb-0">Move on <i class="fas fa-chevron-right"></i></h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 
<style>

</style>

