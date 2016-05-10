define(['jquery','handlebars','utils'], function ($, Handlebars, _) {

    const
        source   = $("#field-template").html(),
        template = Handlebars.compile(source);

    return {

        drawGrid: function() {
            $('.playing-layer').html(template(_.generateField()));
        },

        drawSnake: function (snake){
            snake.forEach(([x,y]) => {
                $(`.js-cell-${x}-${y}`).css('background-color', 'blue');
                $(`.js-cell-${x}-${y}`).css('border-color', 'blue');
            });

            $(`.js-cell-${snake[0][0]}-${snake[0][1]}`).css('background-color', 'red');
            $(`.js-cell-${snake[0][0]}-${snake[0][1]}`).css('border-color', 'red');
        },

        drawApple: function(apple){
            $(`.js-cell-${apple[0]}-${apple[1]}`).css('background-color', 'green');
            $(`.js-cell-${apple[0]}-${apple[1]}`).css('border-color', 'green');
        },

        draw: function (toDraw){
            this.drawGrid();
            this.drawApple(toDraw.apple);
            this.drawSnake(toDraw.snake);
        },

        notify: function(message) {

        }

    };
});
