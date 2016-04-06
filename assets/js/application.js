'use strict';

requirejs.config({
    baseUrl: './app',
    paths: {
        lib: '../bower_components',
        jquery: '../bower_components/jquery/dist/jquery.min',
        bacon: '../bower_components/bacon/dist/Bacon.min',
        handlebars: '../bower_components/handlebars/handlebars.amd.min'
    }
});

require(['jquery','bacon','handlebars'], function ($, bcn, Handlebars) {

    let counter = 0;

    const
        FIELD_SIZE = 40,
        source   = $("#field-template").html(),
        template = Handlebars.compile(source),

        updateStream = Bacon.interval(100, 1),
        increaseStream = Bacon.interval(1000, 1),
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

    //directionStream =
        directionStream = keyStream
            .sampledBy(updateStream);

    function randomInt(min=4, max=FIELD_SIZE-5){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomCell(){
        let head = [randomInt(), randomInt()],
            body = [head[0]-1,head[1]],
            tail = [head[0]-2,head[1]];

        return [head, body, tail];
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
        .scan(randomCell(), (snake,vector)=>{

            let head = snake[0];
            head = [
                (vector[0] + head[0] + FIELD_SIZE) % FIELD_SIZE,
                (vector[1] + head[1] + FIELD_SIZE) % FIELD_SIZE
            ];

            snake.pop();
            counter++;
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