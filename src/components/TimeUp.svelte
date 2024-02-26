<script>
   	import {currentGameScreen, getCurrentPlayer, getCurrentTeam } from '../stores/stores.js'
    import GuessedOverview from './GuessedOverview.svelte';
	import { fly } from 'svelte/transition';


    function checkGuessedOverview() {
        currentGameScreen.set(GuessedOverview)
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
                <h5 class="c-white">Time's Up!</h5>
            </div>
        </div>
        <div class="row justify-content-center pt-3">
            <div class="col-12 col-md-8 col-lg-6 mb-3">
                <div class="card bg-blue" on:click="{() => checkGuessedOverview()}">
                    <div class="card-body text-center">
                        <h2 class="c-white mb-0">Move on <i class="fas fa-chevron-right"></i></h2>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<style>

</style>