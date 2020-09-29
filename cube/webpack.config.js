const path = require('path');
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    target: "web",
    entry: [ 'babel-polyfill', './src/CubeBoot.js' ], 
    output: {
        path: path.resolve(__dirname, "./test/"),
        filename: "cube-dev.js"
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
    devServer: {
        open: false,    // 'google chrome',
        inline: true,
        contentBase: path.join(__dirname, './test'),
        compress: false,
        historyApiFallback: true,
        hot: true,
        https: false,
        noInfo: true,
        port: 8090,
        disableHostCheck: true
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './test/dev.html',
            inject: 'head'
        })
    ]
};
