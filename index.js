/*

TODO: 
explain why Number(window.getComputedStyle(snake).left.split('px')[0])
could not be used.

*/

const snake = document.querySelector('#snake');
const garden = document.querySelector('#garden');
const a_clod = document.querySelector('.clod');
const gameover_display = document.querySelector('#gameover-display');
const restart_game_btn = document.querySelector('#restart-game-btn');

/*

snake
*/

let clod_size = a_clod.offsetWidth; 
window.addEventListener('resize', () => {
    clod_size = a_clod.offsetWidth;
});

// let prev_key = null;
// let curr_key = null;
let is_moving = false;
let move_queue = [];

function move_snake(key) 
{    
    let move_left = 0;
    let move_top = 0;
    let gameover = false;

    if (key === 'd') {
        move_left = clod_size;
    } else if (key === 'a') {
        move_left = -clod_size;
    } else if (key === 'w') {
        move_top = -clod_size;
    } else if (key === 's') {
        move_top = clod_size;
    }

    if (move_left) 
    {
        let curr_left = snake.style.left ? Number(snake.style.left.split('px')[0]) : 0;
        let new_left = curr_left + move_left;
        if (new_left >= 0 && new_left < garden.clientWidth) {
            snake.style.left = `${new_left}px`;
        } else {
            gameover = true;
        }
    } 
    else if (move_top)
    {
        let curr_top = snake.style.top ? Number(snake.style.top.split('px')[0]) : 0;
        let new_top = curr_top + move_top;
        if (new_top >= 0 && new_top < garden.clientHeight) {
            snake.style.top = `${new_top}px`;
        } else {
            gameover = true;
        }
    }

    return gameover;
}

let num_calls = 0;
let gameover = false;
let curr_key = null;
function start_continuous_mov(key) 
{
    if (is_moving) 
    {
        const last_key = move_queue.length > 0 ? move_queue[move_queue.length - 1] : curr_key;
        if (key !== last_key) {
            if (key === 'd' && last_key !== 'a' ||
                key === 'a' && last_key !== 'd' ||
                key === 'w' && last_key !== 's' ||
                key === 's' && last_key !== 's'
            ) {
                move_queue.push(key);
            }
        }
        return;
    }
    
    curr_key = key;
    move_queue.push(key);
    is_moving = true;

    let last_move_time = 0;
    const move_interval = 200;

    const game_loop = (timestamp) => {

        if (timestamp - last_move_time >= move_interval) {
            const next_key = move_queue.shift();
            if (next_key) {
                // prev_key = curr_key;
                curr_key = next_key;
            }
            gameover = move_snake(curr_key);
            last_move_time = timestamp;
        }

        if (gameover) {
            gameover_display.classList.add('display-block');
            is_moving = false;
            move_queue = [];
        } else {
            self.requestAnimationFrame(game_loop);
        }
    }

    self.requestAnimationFrame(game_loop);
}

document.addEventListener('keydown', async e => {
    const key = e.key.toLowerCase();
    if (['w', 'd', 's', 'a'].includes(key)) {
        if (!gameover) {
            start_continuous_mov(key);
        }
    }
});

/*


gameover display

*/

restart_game_btn.addEventListener('click', () => {
    gameover_display.classList.remove('display-block');
    snake.style.top = '0';
    snake.style.left = '0';
    gameover = false;
});
