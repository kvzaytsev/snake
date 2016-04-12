

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

    /*
    class Vector {

        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        get x() {
            return this.x;
        }

        set x(value) {
            return this.x = value;
        }

        get y() {
            return this.y;
        }

        set y(value) {
            return this.y = value;
        }

        isZero() {
            return this.x === 0 && this.y === 0;
        }
    }

     */

    const
        FIELD_SIZE = 30,
        INITIAL_SNAKE_SIZE = 5,
        source   = $("#field-template").html(),
        template = Handlebars.compile(source),
        applePos = randomCell(),
        keyStream = Bacon.fromEventTarget(document, 'keydown'),
        tickStream = Bacon.interval(100, false),
        directionStream = keyStream
            .filter((e)=>[37,38,39,40].indexOf(e.which) !== -1)
            .map((e) => {
                switch (e.which){
                    case 37:
                        return [-1,0];
                    case 38:
                        return [0,-1];
                    case 40:
                        return [0, 1];
                    default :
                        return [1, 0];
                }
            })
            .scan([0,0], ([x1,y1], [x2,y2]) => {
                return (x1 + x2 === 0) && (y1 + y2 === 0)
                    ? [x1,y1]
                    : [x2,y2]
            });

    function generateField(){
        const cells = Array.apply(null, {length: FIELD_SIZE}).map(Number.call, Number);
        return cells.map((x, j) =>  {
            return {
                cells:[].concat(cells.map((y)=> {
                    return `${y}-${j}`;
                }))
            }
        });
    }

    function randomInt(min=4, max=FIELD_SIZE-5){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomCell() {
        return [randomInt(), randomInt()];
    }

    function drawGrid() {
        $('.playing-field').html(template(generateField()));
    }

    function initSnake() {
        let
            head = randomCell(),
            body = [];

        for (let i = 1; i < INITIAL_SNAKE_SIZE; i++ ) {
            body.push([head[0]-i, head[1]]);
        }

        return [head].concat(body);
    }

    function generateApple(){
        $(`.js-cell-${apple[0]}-${apple[1]}`).css('background-color', 'green');
    }

    drawGrid();

    let
        appleBus = new Bacon.Bus(),
        appleStream = appleBus,
        snakeStream =
            directionStream
                .sampledBy(tickStream, (vector) => vector)
                .skipWhile(([x,y]) => {
                    return x === 0 && y === 0
                })
                .scan(initSnake(), (snake, vector) => {

                    let head = snake[0];

                    head = [
                        (vector[0] + head[0] + FIELD_SIZE) % FIELD_SIZE,
                        (vector[1] + head[1] + FIELD_SIZE) % FIELD_SIZE
                    ];

                    if (checkSelfEating(snake)){
                        //TODO: return Bacon.Error
                    }

                    return [head].concat(snake.length ? snake : []);
                });

    let frame = appleStream.sampledBy(snakeStream, (apple, snake) => {

        if (snake.length && apple.length) {
            let tail,
                isApple = apple
                    ? snake[0][0] === apple[0] && snake[0][1] === apple[1]
                    : false;

            if (!isApple) {
                tail = snake.pop();
                $(`.js-cell-${tail[0]}-${tail[1]}`).css('background-color', '');
            } else {
                appleBus.push(randomCell());
            }

            return {
                snake: snake,
                apple: apple
            };
        }
    });

    frame.onValue((toDraw)=> {
        drawApple(toDraw.apple);
        drawSnake(toDraw.snake);
    });

    /*const streams = [snakeStream, appleStream];
    Bacon.combineWith(streams, (snake, apple) => {
        let tail,
            isApple = apple
                ? snake[0][0] === apple[0] && snake[0][1] === apple[1]
                : false;

        if (!isApple && ) {
            tail = snake.pop();
            $(`.js-cell-${tail[0]}-${tail[1]}`).css('background-color', '');
        }

        return {
            snake: snake,
            apple: apple
        };
    }).onValue((toDraw)=> {
        drawApple(toDraw.apple);
        drawSnake(toDraw.snake);
    });*/


    function checkSelfEating(snake) {
        let head = snake[0];
        for (let i = 1, l = snake.length; i < l; i++) {
            if (cellsEqual(head,snake[i])) {
                return true;
            }
        }
        return false;
    }

    function cellsEqual(c1, c2) {
        return c1[0] === c2[0] && c1[1] === c2[1];
    }

    function drawApple(apple){
        $(`.js-cell-${apple[0]}-${apple[1]}`).css('background-color', 'green');
    }

    function drawSnake(snake){
        console.log(snake.length);
        snake.forEach(([x,y]) => {
            $(`.js-cell-${x}-${y}`).css('background-color', 'blue');
        });

        $(`.js-cell-${snake[0][0]}-${snake[0][1]}`).css('background-color', 'red');
    }

    appleBus.push(randomCell());
});