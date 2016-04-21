

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
        FIELD_SIZE = 30,
        INITIAL_SNAKE_SIZE = 4,
        INITIAL_SNAKE_SPEED = 200;

    let GAME_SETTINGS = {
        SPEED: INITIAL_SNAKE_SPEED
    };

    const
        source   = $("#field-template").html(),
        template = Handlebars.compile(source),
        speedProperty = new Bacon.constant(INITIAL_SNAKE_SPEED);

    speedProperty.assign($('.js-snake-speed'), 'text');

    const
        keyStream = Bacon.fromEventTarget(document, 'keydown');

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

    function generateApple(snake) {
        let cell = randomCell();
        if (snake.filter((segment) => cellsEqual(cell,segment)).length > 0) {
            return generateApple(snake);
        }
        return cell;
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

    function cellsEqual(c1, c2) {
        return c1[0] === c2[0] && c1[1] === c2[1];
    }

    function checkSelfEating(snake) {
        let segment, i, l,
            head = snake[0];

        for (i = 1, l = snake.length; i < l; i++) {
            segment = snake[i];
            if (cellsEqual(head,segment)) {
                throw new Bacon.Error("Self-eating");
            }
        }
    }

    function checkFieldBorders([hx, hy]) {
        if (hx < 0|| hy < 0 || hx >= FIELD_SIZE || hy >=FIELD_SIZE) {
            throw new Bacon.Error("Out of field borders");
        }
    }

    function drawSnake(snake){
        snake.forEach(([x,y]) => {
            $(`.js-cell-${x}-${y}`).css('background-color', 'blue');
            $(`.js-cell-${x}-${y}`).css('border-color', 'blue');
        });

        $(`.js-cell-${snake[0][0]}-${snake[0][1]}`).css('background-color', 'red');
        $(`.js-cell-${snake[0][0]}-${snake[0][1]}`).css('border-color', 'red');
    }

    function drawApple(apple){
        $(`.js-cell-${apple[0]}-${apple[1]}`).css('background-color', 'green');
        $(`.js-cell-${apple[0]}-${apple[1]}`).css('border-color', 'green');
    }

    function draw(toDraw){
        drawGrid();
        drawApple(toDraw.apple);
        drawSnake(toDraw.snake);
    }

    drawGrid();

    const
        appleBus = new Bacon.Bus(),
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
            }),

        updateStream = directionStream
            .flatMapLatest((x) => {
                return Bacon.interval(INITIAL_SNAKE_SPEED, x).startWith(x);
            }),

        snakeStream = updateStream.scan(initSnake(), (snake, [vx,vy]) => {
            let head = snake[0];

            head = [
                vx + head[0],
                vy + head[1]
            ];

            //checkSelfEating(snake);
            checkFieldBorders(head);

            return [head].concat(snake.length ? snake : []);

        }),
        finalStream = appleBus.sampledBy(snakeStream, (apple, snake) => {

            let tail,
                isApple = apple
                    ? cellsEqual(apple, snake[0])
                    : false;

            if (!isApple) {
                tail = snake.pop();
            } else {
                appleBus.push(generateApple(snake));
            }

            return {
                apple: apple,
                snake: snake
            }
        });

    finalStream.onError((error)=>{
        alert(error);
    });

    finalStream.map((obj) => {
        return obj.snake.length;
    }).assign($('.js-snake-length'), 'text');

    finalStream.onValue(draw);
    appleBus.push(randomCell());
});