// webpack.config.dist.js

const path = require('path');
const fs = require('fs');
const babelpolyfill = require('babel-polyfill');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');

var CubeAllConfig = {
    target: 'web',
    entry: {
        "cube": [ 'babel-polyfill', './src/CubeBoot.js', './src/CubeExtendBoot.js' ]
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.js', '.ts'],
        alias: {
            '@core': path.resolve(__dirname, './src/core'),
            '@lib': path.resolve(__dirname, './third_party')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [
                    /(node_modules|bower_components)/,
                    path.resolve(__dirname, './src/zoe')
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-transform-async-to-generator',
                            '@babel/plugin-proposal-class-properties'
                        ]
                    }
                }
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin({
            dry: false,
            cleanOnceBeforeBuildPatterns: [
                path.resolve(__dirname, './dist') + '/*.js',
                path.resolve(__dirname, './dist') + '/*.map'
            ]
        }),
        new FileManagerPlugin({
            events: {
                onEnd: {
                    copy: [{
                        source: path.resolve(__dirname, './dist') + '/*.js',
                        destination: path.resolve(__dirname, '../web/public/javascripts/')
                    }, {
                        source: path.resolve(__dirname, './dist') + '/*.js.map',
                        destination: path.resolve(__dirname, '../web/public/javascripts/')
                    }, {
                        source: path.resolve(__dirname, './worker') + '/*.js',
                        destination: path.resolve(__dirname, '../web/public/cube/')
                    }, {
                        source: path.resolve(__dirname, './dist') + '/*.js',
                        destination: path.resolve(__dirname, './examples/js/')
                    }, {
                        source: path.resolve(__dirname, './dist') + '/*.js.map',
                        destination: path.resolve(__dirname, './examples/js/')
                    }, {
                        source: path.resolve(__dirname, './worker') + '/*.js',
                        destination: path.resolve(__dirname, './examples/cube/')
                    }]
                }
            }
        })
    ]
};


var CubeConfig = {
    target: 'web',
    entry: {
        "cube": [ 'babel-polyfill', './src/CubeBoot.js' ],
        "cube-extend": [ 'babel-polyfill', './src/CubeExtendBoot.js' ]
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js'
    },
    optimization: {
        runtimeChunk: {
            name: 'cube-runtime'
        }
    },
    resolve: {
        extensions: ['.js', '.ts'],
        alias: {
            '@core': path.resolve(__dirname, './src/core'),
            '@lib': path.resolve(__dirname, './third_party')
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [
                    /(node_modules|bower_components)/,
                    path.resolve(__dirname, './src/zoe')
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-transform-async-to-generator',
                            '@babel/plugin-proposal-class-properties'
                        ]
                    }
                }
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin({
            dry: false,
            cleanOnceBeforeBuildPatterns: [
                path.resolve(__dirname, './dist') + '/*.js',
                path.resolve(__dirname, './dist') + '/*.map'
            ]
        }),
        new FileManagerPlugin({
            events: {
                onEnd: {
                    copy: [{
                        source: path.resolve(__dirname, './dist') + '/*.js',
                        destination: path.resolve(__dirname, '../web/public/javascripts/')
                    }, {
                        source: path.resolve(__dirname, './dist') + '/*.js.map',
                        destination: path.resolve(__dirname, '../web/public/javascripts/')
                    }, {
                        source: path.resolve(__dirname, './dist') + '/*.js',
                        destination: path.resolve(__dirname, './examples/js/')
                    }, {
                        source: path.resolve(__dirname, './dist') + '/*.js.map',
                        destination: path.resolve(__dirname, './examples/js/')
                    }]
                }
            }
        })
    ]
};

module.exports = [ CubeAllConfig ];
