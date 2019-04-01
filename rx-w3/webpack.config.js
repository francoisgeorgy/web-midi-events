const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        app_bundle: "./src/index.js"
    },
    plugins: [
        // new webpack.ProvidePlugin({
        //     $: "jquery",
        //     jQuery: "jquery",
        //     "window.jQuery": "jquery",
        //     "window.$": "jquery"
        // }),
        // new WebpackAutoInject({
        //     components: {
        //         AutoIncreaseVersion: false
        //     }
        // }),
        // new CopyWebpackPlugin([
        //     { from: "./src/midi.html" },
        //     { from: "./src/print/preset-template.html", to: "templates"},
        //     { from: "./src/css/midi.css", to: "css" },
        //     { from: "./src/img/favicon-16x16.png" },
        //     { from: "./src/img/favicon-32x32.png" },
        //     { from: "./src/img/favicon-96x96.png" },
        //     // { from: "./src/img/editor-0.31.0.jpg", to: "img" }
        // ]),
        new HtmlWebpackPlugin({
            chunks: ["app_bundle"],
            hash: true,
            inject: 'head',
            template: './src/index.html',
            favicon: './src/images/favicon.png',
            filename: './index.html' //relative to root of the application
        })
    ],
    performance: {
        maxAssetSize: 1000000,
        maxEntrypointSize: 1000000
    }
};

const config = {
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },
    plugins: [
        // new webpack.optimize.UglifyJsPlugin(),
        new HtmlWebpackPlugin({template: './src/index.html'})
    ]
};
