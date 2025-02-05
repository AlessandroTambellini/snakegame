/*

NOTE: There is no snake entity neither in the form of a HTML element
nor in the form of a JS data-structure.
snake-segments are appended to the HTML file
and queried again when there is a change in the body.
They are not even adjacent in the HTML file. 
The only important thing is that a new segment is appended after the last one.

*/

let snake = document.querySelectorAll('.snake-segment');
const mouse = document.querySelector('#mouse');
const garden = document.querySelector('#garden');
const gameover_display = document.querySelector('#gameover-display');

let clod_size = document.querySelector('.clod').offsetWidth; 
let rows_on_screen = garden.clientHeight / clod_size;
let cols_on_screen = garden.clientWidth / clod_size;
window.addEventListener('resize', () => {
    clod_size = document.querySelector('.clod').offsetWidth;
    rows_on_screen = garden.clientHeight / clod_size;
    cols_on_screen = garden.clientWidth / clod_size;
});

function check_start_key(e) {
    const key = e.key.toLowerCase();
    /* Before the game starts,
    the head of the snake points towards the bottom 
    so, it cannot immediately move upwords ('w' key) */
    if (['d', 's', 'a', 'arrowright', 'arrowdown', 'arrowleft'].includes(key)) {
        document.removeEventListener('keydown', check_start_key);
        start_game(key);
    }
}

document.addEventListener('keydown', check_start_key);

function start_game(start_key) 
{
    let curr_key = start_key;
    const keys_queue = [ start_key ];
    const segment_pos = new Set();
    let mouses_eaten = 0;
    const game_tick = 200;
    const start_time = new Date().getTime();
    let prev_timestamp = 0;

    const queue_direction_key = e => {
        const key = e.key.toLowerCase();
        if (!['w', 'd', 's', 'a',
            'arrowup', 'arrowright', 'arrowdown', 'arrowleft'
        ].includes(key)) {
            return;
        }
        const last_key = keys_queue.length > 0 ? keys_queue[keys_queue.length - 1] : curr_key;
        if (key !== last_key) {
            // The snake cannot move in opposite directions
            if (
                (key === 'w' || key === 'arrowup') && last_key !== 's' && last_key !== 'arrowdown' ||
                (key === 'd' || key === 'arrowright') && last_key !== 'a' && last_key !== 'arrowleft' ||
                (key === 's' || key === 'arrowdown') && last_key !== 'w' && last_key !== 'arrowup' ||
                (key === 'a' || key === 'arrowleft') && last_key !== 'd' && last_key !== 'arrowright'
            ) {
                keys_queue.push(key);
            }
        }
    }

    document.addEventListener('keydown', queue_direction_key);

    const game_loop = (timestamp) => 
    {
        if (timestamp - prev_timestamp > game_tick) {
            prev_timestamp = timestamp;

            const next_key = keys_queue.shift();
            if (next_key) {
                curr_key = next_key;
            }
            rotate_snake_head(curr_key);
            if (move_snake(curr_key, segment_pos)) {
                mouses_eaten += eat_mouse(segment_pos);
            }
            else { // gameover
                document.removeEventListener('keydown', queue_direction_key);
                gameover_display.style.display = 'flex';
                gameover_display.querySelector('#time-survived').textContent = 
                    `${((new Date().getTime() - start_time)/1000).toFixed(1)}s`;
                gameover_display.querySelector('#mouses-eaten').textContent = mouses_eaten;
                return;
            }
        }
        
        self.requestAnimationFrame(game_loop);
    }

    game_loop();
}

function move_snake(key, segment_pos) 
{
    let snake_head_left = Number(window.getComputedStyle(snake[0]).left.split('px')[0]);
    let snake_head_top = Number(window.getComputedStyle(snake[0]).top.split('px')[0]);
    
    if (key === 'w' || key === 'arrowup') {
        snake_head_top -= clod_size;
    } else if (key === 'd' || key === 'arrowright') {
        snake_head_left += clod_size;
    } else if (key === 's' || key === 'arrowdown') {
        snake_head_top += clod_size;
    } else if (key === 'a' || key === 'arrowleft') {
        snake_head_left -= clod_size;
    }
    
    /* Reason to loose #1: crash on the hedge. */
    if (snake_head_left < 0 ||
        snake_head_left >= garden.clientWidth ||
        snake_head_top < 0 ||
        snake_head_top >= garden.clientHeight
    ) {
        return false;
    }
    
    /* Reason to loose #2: the head crashes on the body. */
    if (segment_pos.has(snake_head_left + ',' + snake_head_top)) {
        return false;
    }

    segment_pos.clear(); // reset the set for the next positions
    segment_pos.add(snake_head_left + ',' + snake_head_top);

    for (let i = snake.length - 1; i > 0; i--) 
    {
        let curr_segment_left = Number(window.getComputedStyle(snake[i]).left.split('px')[0]);
        let next_segment_left = Number(window.getComputedStyle(snake[i-1]).left.split('px')[0]);
        let next_segment_top = Number(window.getComputedStyle(snake[i-1]).top.split('px')[0]);
        segment_pos.add(next_segment_left + ',' + next_segment_top);
        
        /* If two segments are adjecent, 
        I can guess where one is in relation to the other 
        by shifting one of them on the x or y axis by one position. */
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

    return true;
}

function rotate_snake_head(key) {
    if (key === 'w' || key === 'arrowup') {
        snake[0].style.rotate = '180deg';
    } else if (key === 'd' || key === 'arrowright') {
        snake[0].style.rotate = '-90deg';
    } else if (key === 's' || key === 'arrowdown') {
        snake[0].style.rotate = '0deg';
    } else if (key === 'a' || key === 'arrowleft') {
        snake[0].style.rotate = '90deg';
    }
}

function eat_mouse(segment_pos) 
{
    let snake_head_left = Number(window.getComputedStyle(snake[0]).left.split('px')[0]);
    let snake_head_top = Number(window.getComputedStyle(snake[0]).top.split('px')[0]);
    let mouse_left = Number(window.getComputedStyle(mouse).left.split('px')[0]);
    let mouse_top = Number(window.getComputedStyle(mouse).top.split('px')[0]);

    if (mouse_left === snake_head_left && 
        mouse_top === snake_head_top) 
    {
        const new_snake_segment = document.createElement('div');
        new_snake_segment.classList.add('snake-segment');
        garden.appendChild(new_snake_segment);
        new_snake_segment.style.left = window.getComputedStyle(snake[snake.length-1]).left;
        new_snake_segment.style.top = window.getComputedStyle(snake[snake.length-1]).top;
        snake = document.querySelectorAll('.snake-segment');
        generate_mouse(segment_pos);

        return 1;
    } 
    else {
        return 0;
    }
}

function generate_mouse(segment_pos) 
{
    let mouse_col = Math.floor(Math.random() * cols_on_screen);
    let mouse_row = Math.floor(Math.random() * rows_on_screen);
    /* GOAL: do not generate a mouse on a clod occupied by the snake. */
    while (segment_pos.has(mouse_col * clod_size + ',' + mouse_row * clod_size)) {
        mouse_col = Math.floor(Math.random() * cols_on_screen);
        mouse_row = Math.floor(Math.random() * rows_on_screen);
    }
    mouse.style.left = `${mouse_col * clod_size}px`;
    mouse.style.top = `${mouse_row * clod_size}px`;
}

document.querySelector('#restart-game-btn').addEventListener('click', () => 
{
    /* reset UI */
    for (let i = snake.length-1; i > 0; i--) {
        snake[i].remove();
    }
    snake = document.querySelectorAll('.snake-segment');
    snake[0].style.left = `${garden.clientWidth / 2}px`;
    snake[0].style.top = `${garden.clientHeight / 2}px`;
    snake[0].style.rotate = '0deg';
    mouse.style.left = null;
    mouse.style.top = null;
    gameover_display.style.display = 'none';

    document.addEventListener('keydown', check_start_key);
});
