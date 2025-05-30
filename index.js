/*

NOTE 1: There is no snake entity neither in the form of a HTML element
nor in the form of a JS data-structure.
snake-segments are appended to the HTML file
and queried again when there is a change in the body.
I know it might not be efficient, but I wanted to try this approach.

NOTE 2: Touch and keyboard inputs are evaluated by the same functions.
It means you can play with both the input sources.
So, you may move up with the key 'w' and then move right 
by swapping to the right on the touchscreen. 

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

function get_key_dir(key) {
    let dir = null;
    switch (key) {
        case 'w':
        case 'arrowup':
            dir = 'u';
            break;
        case 'd':
        case 'arrowright':
            dir = 'r';
            break;
        case 's':
        case 'arrowdown':
            dir = 'd';
            break;
        case 'a':
        case 'arrowleft':
            dir = 'l';
            break;
    }

    return dir;
}

function get_touch_dir(prev_touch, curr_touch) {
    let dir = null;
    let top = left = false;
    if (prev_touch.clientX - curr_touch.clientX > 0) {
        left = true;
    }
    if (prev_touch.clientY - curr_touch.clientY > 0) {
        top = true;
    }

    /* It's rare a finger moves perfectly horizontally or vertically.
    Probably it moves diagonally. */
    let delta_x = Math.abs(prev_touch.clientX - curr_touch.clientX);
    let delta_y = Math.abs(prev_touch.clientY - curr_touch.clientY);
    if (delta_x > delta_y) {
        if (left) {
            dir = 'l';
        } else {
            dir = 'r';
        }
    } else {
        if (top) {
            dir = 'u';
        } else {
            dir = 'd';
        }
    }

    return dir;
}

let prev_touch = null;
function get_input(e) {
    let dir = null;
    if (e.changedTouches) {
        e.preventDefault(); // I guess there could be some scrolling behaviour. Not sure. Need to test it
        let curr_touch = e.changedTouches[0];
        if (!prev_touch) {
            prev_touch = curr_touch;
            return;
        }
        dir = get_touch_dir(prev_touch, curr_touch);
    } else {
        dir = get_key_dir(e.key.toLowerCase());
    }
    /* Before the game starts,
    the head of the snake points towards the bottom;
    Therefore, it cannot immediately move up. */
    if (dir && dir !== 'u') {
        document.removeEventListener('keydown', get_input);
        document.removeEventListener('touchmove', get_input);
        start_game(dir);
    }
}

document.addEventListener('keydown', get_input);
document.addEventListener('touchmove', get_input, { passive: false
    /* Info at: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive */
});

function start_game(dir) 
{
    let curr_dir = dir;
    const dir_queue = [ dir ];
    const segment_pos = new Set();
    let mouses_eaten = 0;
    const start_time = new Date().getTime();
    let prev_timestamp = 0;
    let prev_touch = null;
    let victory = false;
    let snake_crashed = false;

    const change_snake_direction = e => 
    {
        e.preventDefault();
        if (dir_queue.length === 2) {
            return;
        }

        let dir = null;
        if (e.changedTouches) 
        {
            let curr_touch = e.changedTouches[0];
            if (!prev_touch) {
                prev_touch = curr_touch;
                return;
            }

            dir = get_touch_dir(prev_touch, curr_touch);
            prev_touch = curr_touch;
        }
        else {
            dir = get_key_dir(e.key.toLowerCase());
        }
        
        const last_dir = dir_queue.length > 0 ? dir_queue[dir_queue.length - 1] : curr_dir;
        if (
            // The snake cannot move in opposite directions
            dir === 'u' && last_dir !== 'd' ||
            dir === 'r' && last_dir !== 'l' ||
            dir === 'd' && last_dir !== 'u' ||
            dir === 'l' && last_dir !== 'r'
        ) {
            dir_queue.push(dir);
        }
    }

    document.addEventListener('keydown', change_snake_direction);
    document.addEventListener('touchmove', change_snake_direction, { passive: false });
    
    const game_loop = (timestamp) => 
    {
        if (timestamp - prev_timestamp > 200) 
        {    
            prev_timestamp = timestamp;
            const next_dir = dir_queue.shift();
            if (next_dir) {
                curr_dir = next_dir;
                rotate_snake_head(curr_dir);
            }

            let mouse_eaten = eat_mouse();
            if (mouse_eaten) {
                mouses_eaten += 1;
                if (snake.length === rows_on_screen * cols_on_screen) {
                    victory = true;
                } else {
                    generate_mouse(segment_pos);
                }
            }

            if (!victory) {
                snake_crashed = move_snake(curr_dir, segment_pos);
            }

            if (victory || snake_crashed) {
                document.removeEventListener('keydown', change_snake_direction);
                document.removeEventListener('touchmove', change_snake_direction);       
                
                if (victory) {
                    // Send me a msg if it ever happens :)
                    gameover_display.querySelector('h2').textContent = 'WIN!';
                } else {
                    gameover_display.querySelector('h2').textContent = 'GAME OVER';
                }
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

function move_snake(dir, segment_pos) 
{
    let snake_head_left = Number(window.getComputedStyle(snake[0]).left.split('px')[0]);
    let snake_head_top = Number(window.getComputedStyle(snake[0]).top.split('px')[0]);
    
    if (dir === 'u') {
        snake_head_top -= clod_size;
    } else if (dir === 'r') {
        snake_head_left += clod_size;
    } else if (dir === 'd') {
        snake_head_top += clod_size;
    } else if (dir === 'l') {
        snake_head_left -= clod_size;
    }
    
    /* Reason to loose #1: crash on the hedge. */
    if (snake_head_left < 0 ||
        snake_head_left >= garden.clientWidth ||
        snake_head_top < 0 ||
        snake_head_top >= garden.clientHeight
    ) {
        return true;
    }
    
    /* Reason to loose #2: the head crashes on the body. */
    if (segment_pos.has(snake_head_left + ',' + snake_head_top)) {
        return true;
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

    return false;
}

function rotate_snake_head(dir) {
    if (dir === 'u') {
        snake[0].style.rotate = '180deg';
    } else if (dir === 'r') {
        snake[0].style.rotate = '-90deg';
    } else if (dir === 'd') {
        snake[0].style.rotate = '0deg';
    } else if (dir === 'l') {
        snake[0].style.rotate = '90deg';
    }
}

function eat_mouse() 
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
        return true;
    } 
    return false;
}

function generate_mouse(segment_pos) 
{
    let mouse_col = Math.floor(Math.random() * cols_on_screen);
    let mouse_row = Math.floor(Math.random() * rows_on_screen);
    
    /* Don't generate a mouse on a clod occupied by the snake. */
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
    snake[0].style = null;
    mouse.style = null;
    gameover_display.style.display = 'none';

    document.addEventListener('keydown', get_input);
    document.addEventListener('touchmove', get_input, { passive: false });
});
