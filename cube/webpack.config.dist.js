// webpack.config.dist.js

const path = require('path');
const fs = require('fs');
const babelpolyfill = require('babel-polyfill');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');

const version = '3.0.0';

var CubeConfig = {
    target: "web",
    entry: [ 'babel-polyfill', './src/CubeBoot.js' ],
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "cube-"+ version + ".js"
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
                    path.resolve(__dirname, './src/facemonitor')
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            "@babel/plugin-transform-async-to-generator",
                            "@babel/plugin-proposal-class-properties"
                        ]
                    }
                }
            }
        ]
    },
    devtool: "source-map",
    plugins: [
        new CleanWebpackPlugin(),
        new FileManagerPlugin({
            onEnd: {
                copy: [{
                    source: path.resolve(__dirname, './dist') + '/cube-' + version + '.js',
                    destination: path.resolve(__dirname, '../web/public/javascripts/')
                }, {
                    source: path.resolve(__dirname, './dist') + '/cube-' + version + '.js.map',
                    destination: path.resolve(__dirname, '../web/public/javascripts/')
                }, {
                    source: path.resolve(__dirname, './dist') + '/cube-' + version + '.js',
                    destination: path.resolve(__dirname, './examples/js/')
                }, {
                    source: path.resolve(__dirname, './dist') + '/cube-' + version + '.js.map',
                    destination: path.resolve(__dirname, './examples/js/')
                }]
            }
        })
    ]
};

var CubeLibConfig = {
    target: "web",
    entry: [ 'babel-polyfill', './src/CubeLibBoot.js' ],
    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "cube-lib-"+ version + ".js"
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
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            "@babel/plugin-transform-async-to-generator",
                            "@babel/plugin-proposal-class-properties"
                        ]
                    }
                }
            }
        ]
    },
    devtool: "source-map",
    plugins: [
        new CleanWebpackPlugin()
    ]
};

module.exports = [ CubeConfig ];
