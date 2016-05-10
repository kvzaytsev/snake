require(['jquery','utils', 'graphics', 'bacon'], function ($, _, graphics) {

    const
        KEYS = {
            SPACE : 32,
            LEFT : 37,
            UP : 38,
            RIGHT : 39,
            DOWN : 40
        },
        EMPTY_STRING = '',
        DIRECTION_KEYS = [KEYS.LEFT,KEYS.RIGHT,KEYS.UP,KEYS.DOWN],
        initDirection = _.randomDirection(),
        initSnake = _.initSnake(initDirection),
        initSpeed = 300;

    graphics.drawGrid();

    const
        speedB = new Bacon.Bus(),
        appleB = new Bacon.Bus(),
        keyboardS = Bacon.fromEventTarget(document, 'keydown'),
        //startedP = Bacon.sequentially(1000, [3, 2,1,0]).toProperty(),
        pausedP = keyboardS
            .startWith(false)
            //.skipWhile(startedP)
            .filter((e) => e.which === KEYS.SPACE)
            .scan(false, (v) => !v)
            .toProperty(),
        directionS = keyboardS
            .filter(pausedP)
            .filter((e) => DIRECTION_KEYS.includes(e.which))
            .flatMap((e) => {
                switch (e.which){
                    case KEYS.LEFT:
                        return [-1,0];
                        break;
                    case KEYS.UP:
                        return [0,-1];
                        break;
                    case KEYS.DOWN:
                        return [0, 1];
                        break;
                    case KEYS.RIGHT:
                        return [1, 0];
                        break;
                }
            })
            .skipDuplicates()
            .scan(initDirection, ([x1,y1], [x2,y2]) => {
                return (x1 + x2 === 0) && (y1 + y2 === 0)
                    ? [x1,y1]
                    : [x2,y2]
            }),

        speedP = speedB.toProperty(initSpeed),
        updateS = speedP
            //.startWith(initDirection)
            .sampledBy(directionS, (s,v) => {
                return [v,s];
            })
            .flatMapLatest(([v,s]) => {
                return Bacon
                    .interval(s, v)
                    .startWith(v);
            })
            //.skipWhile(startedP)
            .filter(pausedP),

        snakeS = updateS
            .scan(initSnake, (snake, [vx,vy]) => {
                let head = snake[0];

                head = [
                    vx + head[0],
                    vy + head[1]
                ];

                snake.pop();
                snake = [head].concat(snake.length ? snake : []);

                return snake;
            }).flatMap((snake) => {
                try {
                    _.checkSelfEating(snake);
                    _.checkFieldBorders(snake[0]);
                } catch (e) {
                    console.log('Fail: ', e.error);
                    return e;
                }
                return snake
            })
            .endOnError(),
        combinedS = appleB.sampledBy(snakeS, (apple, snake) => {
            let isApple = apple
                ? _.cellsEqual(apple, snake[0])
                : false;

            if (isApple) {
                snake[snake.length]=apple;
                appleB.push(_.generateApple(snake));

                // TODO: ugly
                speedB.push(initSpeed - Math.floor(snake.length / 5) * 25);
            }

            return {
                apple: apple,
                snake: snake
            }
        });

    snakeS.onValue((snake) => graphics.drawSnake(snake));
    snakeS.onError((e) => {
    });
    snakeS.onEnd((e) => {

        // TODO: wrap this piece of shit into applicable construction
        $('.playing-layer').css('opacity', 0.4);
        $('.playing-layer .grid-cell').css('border', 'solid 1px rgba(238,238,238,.4)');
        $('.js-message').text('game over');
    });

    appleB.onValue((apple) => graphics.drawApple(apple));
    combinedS.onValue((x) => graphics.draw(x));
    snakeS
        .flatMap((snake) => {
            return snake.length;
        })
        .assign($('.js-snake-length'), 'text');

    speedP.assign($('.js-snake-speed'), 'text');
    pausedP.map((v) => {
        return v
            ? EMPTY_STRING
            : 'paused'
    }).assign($('.js-status'), 'text');

    appleB.push(_.randomCell());
});