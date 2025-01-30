/*

TODO: 
explain why Number(window.getComputedStyle(snake).left.split('px')[0])
could not be used.

*/

const snake = document.querySelector('#snake');
const garden = document.querySelector('#garden');
const a_clod = document.querySelector('.clod');

let clod_size = a_clod.offsetWidth; 
window.addEventListener('resize', () => {
    clod_size = a_clod.offsetWidth;
});

let prev_key = null;
let curr_key = null;
let is_moving = false;
const move_queue = [];

function move_snake(curr_key, prev_key) 
{    
    let move_left = 0;
    let move_top = 0;

    /* The check for the prev_key is performed because
    the snake cannot be moved in opposite directions
    (it cannot traverse its body). */
    if (curr_key === 'd' && prev_key !== 'a') {
        move_left = clod_size;
    } else if (curr_key === 'a' && prev_key !== 'd') {
        move_left = -clod_size;
    } else if (curr_key === 'w' && prev_key !== 's') {
        move_top = -clod_size;
    } else if (curr_key === 's' && prev_key !== 'w') {
        move_top = clod_size;
    }

    if (move_left) 
    {
        let curr_left = snake.style.left ? Number(snake.style.left.split('px')[0]) : 0;
        let new_left = curr_left + move_left;
        if (new_left >= 0 && new_left < garden.clientWidth) {
            snake.style.left = `${new_left}px`;
        }
    } 
    else if (move_top)
    {
        let curr_top = snake.style.top ? Number(snake.style.top.split('px')[0]) : 0;
        let new_top = curr_top + move_top;
        if (new_top >= 0 && new_top < garden.clientHeight) {
            snake.style.top = `${new_top}px`;
        }
    }
}

function start_continuous_mov(key) {
    if (is_moving) {
        if (key !== move_queue[move_queue.length - 1]) {
            move_queue.push(key);
        }
        return;
    }
    
    move_queue.push(key);
    is_moving = true;

    let last_move_time = 0;
    const move_interval = 200;

    const game_loop = (timestamp) => {
        /* check for a new key in the queue, 
        if not present,
        continue with the current key. */
        if (timestamp - last_move_time >= move_interval) {
            const next_key = move_queue.shift();
            if (next_key) {
                prev_key = curr_key;
                curr_key = next_key;
            }
            move_snake(curr_key, prev_key);
            last_move_time = timestamp;
        }
        requestAnimationFrame(game_loop);
    }
    game_loop();
}

document.addEventListener('keydown', async e => {
    const key = e.key.toLowerCase();
    if (['w', 'd', 's', 'a'].includes(key)) {
        start_continuous_mov(key);
    }
});

