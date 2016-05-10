requirejs.config({
    baseUrl: './assets/js',
    paths: {
        lib: '../../bower_components',
        jquery: '../../bower_components/jquery/dist/jquery.min',
        bacon: '../../bower_components/bacon/dist/Bacon.min',
        handlebars: '../../bower_components/handlebars/handlebars.amd.min'
    }
});

require(['application']);
