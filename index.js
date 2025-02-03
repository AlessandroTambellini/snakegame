/*

NOTE: There is no snake entity neither in the form of a HTML element
nor in the form of a JS data-structure.
snake-segments are appended to the HTML file
and queried again when there is a change in the body.
They are not even adjacent in the HTML file. The only important thing 
is that a new segment is appended after the last one.

*/

let snake = document.querySelectorAll('.snake-segment');
const mouse = document.querySelector('#mouse');
const garden = document.querySelector('#garden');
const a_clod = document.querySelector('.clod');
const gameover_display = document.querySelector('#gameover-display');
const restart_game_btn = document.querySelector('#restart-game-btn');

const direction_keys = ['w', 'd', 's', 'a'];

let clod_size = a_clod.offsetWidth; 
let rows_on_screen = garden.clientHeight / clod_size;
let cols_on_screen = garden.clientWidth / clod_size;
window.addEventListener('resize', () => {
    clod_size = a_clod.offsetWidth;
    rows_on_screen = garden.clientHeight / clod_size;
    cols_on_screen = garden.clientWidth / clod_size;
});

document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (direction_keys.includes(key)) {
        start_game(key);
    }
}, { once: true });

/*

I structured the core logic of the game
as a big function splitted in lamda functions for each task.
There is no particular reason, I just wanted to try and do it.
I just noticed that, given the codebase is a single file,
there is no difference in having local variables instead of global ones,
given they are still shared among all the lamda functions.
A better approach would be to...

*/

function start_game(start_key) 
{
    let gameover = false;
    let curr_key = start_key;
    let keys_queue = [ start_key ];
    const segment_pos = new Set();
    let mouses_eaten = 0;
    let start_time = new Date().getTime();

    const game_tick = 200;
    let prev_timestamp = 0;

    const game_loop = (timestamp) => 
    {
        if (timestamp - prev_timestamp > game_tick) 
        {
            const next_key = keys_queue.shift();
            if (next_key) {
                curr_key = next_key;
            }

            gameover = calc_snake_pos(curr_key);

            if (!gameover) {
                prev_timestamp = timestamp;

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
                    
                    mouses_eaten += 1;
                    generate_mouse();
                }
            } // endif (!gameover)
        } // endif (timestamp - prev_timestamp > game_tick)

        if (gameover) 
        {
            gameover_display.style.display = 'flex';
            gameover_display.querySelector('#time-survived').textContent = 
                `${((new Date().getTime() - start_time)/1000).toFixed(1)}s`;
            gameover_display.querySelector('#mouses-eaten').textContent = mouses_eaten;
        } 
        else 
        {
            self.requestAnimationFrame(game_loop);
        }
    }
    self.requestAnimationFrame(game_loop);

    const calc_snake_pos = (key) => 
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
            by shifting one of them on the x or y axis
            by a distance of clod_size. */
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

    const change_direction = (key) => 
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
    }

    const generate_mouse = () => 
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

    if (!gameover) {
        document.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            if (direction_keys.includes(key)) {
                change_direction(key);
            }
        });
    }
        
    restart_game_btn.addEventListener('click', () => 
    {
        /* reset data */
        curr_key = null;
        keys_queue = [];
        segment_pos.clear();                
        mouses_eaten = 0;

        /* reset UI */
        for (let i = snake.length-1; i > 0; i--) {
            snake[i].remove();
        }
        snake = document.querySelectorAll('.snake-segment');
        snake[0].style.left = `${garden.clientWidth / 2}px`;
        snake[0].style.top = `${garden.clientHeight / 2}px`;
        generate_mouse();
        gameover_display.style.display = 'none';
        
        /* wait for the player to start the game */
        document.addEventListener('keydown', e => {
            const key = e.key.toLowerCase();
            if (direction_keys.includes(key)) {
                gameover = false;
                start_time = new Date().getTime();
                self.requestAnimationFrame(game_loop);
            }
        }, { once: true });
    });
}

