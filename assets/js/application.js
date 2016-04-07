'use strict';

requirejs.config({
    baseUrl: './snake',
    paths: {
        lib: '../bower_components',
        jquery: '../bower_components/jquery/dist/jquery.min',
        bacon: '../bower_components/bacon/dist/Bacon.min',
        handlebars: '../bower_components/handlebars/handlebars.amd.min'
    }
});

require(['jquery','bacon','handlebars'], function ($, bcn, Handlebars) {

    const
        FIELD_SIZE = 40,
        INITIAL_SNAKE_SIZE = 5,
        source   = $("#field-template").html(),
        template = Handlebars.compile(source),

        updateStream = Bacon.interval(100, 1),
        keyStream = Bacon.fromEventTarget(document, 'keydown')
            .map((e) => {
                switch (e.which){
                    case 37:
                        return [-1,0];
                        break;
                    case 38:
                        return [0,-1];
                        break;
                    case 39:
                        return [1, 0];
                        break;
                    case 40:
                        return [0, 1];
                        break;
                    default:
                        return [0, 0];
                }
            }),

        directionStream = keyStream
                .sampledBy(updateStream)
                .scan([0, 0], (a,b)=> {
                    if ((a[0]+b[0]===0)&&(a[1]+b[1])===0){
                        return a;
                    }
                    return b;
                });

    function randomInt(min=4, max=FIELD_SIZE-5){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomCell(){
        return [randomInt(), randomInt()];
    }

    function initSnake(){
        let head = randomCell(),
            body = [];
        for(let i = 1; i < INITIAL_SNAKE_SIZE; i++){
            body.push([head[0]-i, head[1]]);
        }
        return [head].concat(body);
    }

    function generateField(){
        const cells = Array.apply(null, {length: FIELD_SIZE}).map(Number.call, Number);
        return cells.map((x, j) =>  {
            return {
                cells:[].concat(cells.map((y)=> {
                    return y+'-'+j;
                }))
            }
        });
    }

    directionStream
        .scan(initSnake(), (snake,vector)=>{
            let head = snake[0];
            head = [
                (vector[0] + head[0] + FIELD_SIZE) % FIELD_SIZE,
                (vector[1] + head[1] + FIELD_SIZE) % FIELD_SIZE
            ];
            snake.pop();
            return [head].concat(snake.length ? snake : []);
        })
        .onValue(draw);

    function draw(snake){
        if (!snake.length) {
            return;
        }
        $('.playing-field').html(template(generateField()));
        snake.forEach((coords) => {
            $('.js-cell-' + coords[0] + '-' +coords[1]).css('background-color', 'blue');
        });
        $('.js-cell-' + snake[0][0] + '-' +snake[0][1]).css('background-color', 'red');
    }
});