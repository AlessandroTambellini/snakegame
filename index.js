/*

TODO: 
explain why Number(window.getComputedStyle(snake).left.split('px')[0])
could not be used.

*/

let snake = document.querySelectorAll('.snake-segment');
const garden = document.querySelector('#garden');
const a_clod = document.querySelector('.clod');
const gameover_display = document.querySelector('#gameover-display');
const restart_game_btn = document.querySelector('#restart-game-btn');

let clod_size = a_clod.offsetWidth; 
let rows_on_screen = garden.clientHeight / clod_size;
let cols_on_screen = garden.clientWidth / clod_size;
window.addEventListener('resize', () => {
    clod_size = a_clod.offsetWidth;
    rows_on_screen = garden.clientHeight / clod_size;
    cols_on_screen = garden.clientWidth / clod_size;
});

function generate_mouse() {
    let new_mouse_row = Math.floor(Math.random() * rows_on_screen);
    let new_mouse_col = Math.floor(Math.random() * cols_on_screen);
    garden.querySelectorAll('.row')[new_mouse_row].children[new_mouse_col].classList.add('mouse');
}

let keys_queue = [];
let snake_is_moving = false;
let curr_key = null;
let gameover = false;

function calc_snake_pos(key) 
{    
    let snake_head_left = Number(window.getComputedStyle(snake[0]).left.split('px')[0]);
    let snake_head_top = Number(window.getComputedStyle(snake[0]).top.split('px')[0]);

    if (key === 'd') {
        snake_head_left += clod_size;
    } else if (key === 'a') {
        snake_head_left -= clod_size;
    } else if (key === 's') {
        snake_head_top += clod_size;
    } else if (key === 'w') {
        snake_head_top -= clod_size;
    }

    /* Reason to loose #1: crash on the hedge. */
    if (snake_head_left < 0 ||
        snake_head_left >= garden.clientWidth ||
        snake_head_top < 0 ||
        snake_head_top >= garden.clientHeight
    ) {
        return true;
    }

    const curr_segment_pos = new Set();
    for (let i = snake.length - 1; i > 0; i--) {
        let curr_segment_left = Number(window.getComputedStyle(snake[i]).left.split('px')[0]);
        let curr_segment_top = Number(window.getComputedStyle(snake[i]).top.split('px')[0]);
        curr_segment_pos.add(curr_segment_left + ',' + curr_segment_top);
    }
    
    /* Reason to loose #2: crash on itself. */
    if (curr_segment_pos.has(snake_head_left + ',' + snake_head_top)) {
        return true;
    }
    
    for (let i = snake.length - 1; i > 0; i--) {
        let curr_segment_left = Number(window.getComputedStyle(snake[i]).left.split('px')[0]);
        let next_segment_left = Number(window.getComputedStyle(snake[i-1]).left.split('px')[0]);
        let next_segment_top = Number(window.getComputedStyle(snake[i-1]).top.split('px')[0]);
        
        /* If two segments are adjecent, 
        I can make them coincide by shifting one of them on the x or y axis
        by a distance of clod_size */
        if ((curr_segment_left + clod_size) === next_segment_left ||
            (curr_segment_left - clod_size) === next_segment_left
        ) {
            snake[i].style.left = `${next_segment_left}px`;
        } else {
            snake[i].style.top = `${next_segment_top}px`;
        }
    }
    
    snake[0].style.left = `${snake_head_left}px`;
    snake[0].style.top = `${snake_head_top}px`;

    return false;
}

function main(key) 
{
    if (snake_is_moving) 
    {
        const last_key = keys_queue.length > 0 ? keys_queue[keys_queue.length - 1] : curr_key;
        if (key !== last_key) {
            // The snake cannot move in opposite directions
            if (key === 'd' && last_key !== 'a' ||
                key === 'a' && last_key !== 'd' ||
                key === 'w' && last_key !== 's' ||
                key === 's' && last_key !== 'w'
            ) {
                keys_queue.push(key);
            }
        }
        return;
    }
    
    /* the game starts */
    curr_key = key;
    keys_queue.push(key);
    snake_is_moving = true;

    let last_move_time = 0;
    const move_interval = 200;

    const game_loop = (timestamp) => 
    {
        if (timestamp - last_move_time >= move_interval) 
        {
            const next_key = keys_queue.shift();
            if (next_key) {
                curr_key = next_key;
            }
            gameover = calc_snake_pos(curr_key);

            if (!gameover) {
                last_move_time = timestamp;

                let snake_head_left = Number(window.getComputedStyle(snake[0]).left.split('px')[0]);
                let snake_head_top = Number(window.getComputedStyle(snake[0]).top.split('px')[0]);
        
                let snake_head_col_idx = snake_head_left / clod_size;
                let snake_head_row_idx = snake_head_top / clod_size;
        
                const clod_of_head = garden.querySelectorAll('.row')[snake_head_row_idx].children[snake_head_col_idx];
                if (clod_of_head.classList.contains('mouse')) 
                {
                    const new_snake_segment = document.createElement('div');
                    new_snake_segment.classList.add('snake-segment');
                    garden.appendChild(new_snake_segment);
                    new_snake_segment.style.left = window.getComputedStyle(snake[snake.length-1]).left;
                    new_snake_segment.style.top = window.getComputedStyle(snake[snake.length-1]).top;
        
                    clod_of_head.classList.remove('mouse');
                    snake = document.querySelectorAll('.snake-segment');
        
                    generate_mouse();
                }
            } // endif (!gameover)
        } // endif (timestamp - last_move_time >= move_interval)

        if (gameover) {
            curr_key = null;
            keys_queue = [];
            snake_is_moving = false;
            gameover_display.classList.remove('display-none');
        } else {
            self.requestAnimationFrame(game_loop);
        }
    }

    self.requestAnimationFrame(game_loop);
}

document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (['w', 'd', 's', 'a'].includes(key)) {
        if (!gameover) {
            main(key);
        }
    }
});

restart_game_btn.addEventListener('click', () => 
{
    /* Reset elements */
    for (let i = snake.length-1; i > 0; i--) {
        snake[i].remove();
    }
    snake = document.querySelectorAll('.snake-segment');
    snake[0].style.left = `${garden.clientWidth / 2}px`;
    snake[0].style.top = `${garden.clientHeight / 2}px`;
    
    document.querySelector('.mouse').remove();
    generate_mouse();

    gameover_display.classList.add('display-none');
    
    gameover = false;
});
