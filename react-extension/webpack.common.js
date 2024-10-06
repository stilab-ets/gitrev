const CopyPlugin = require("copy-webpack-plugin");
const path = require('path');
const htmlPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: {
        popup: path.resolve('./src/popup/popup.tsx'),
        contentScript: path.resolve('./src/contentScript/index.tsx'),
        background: path.resolve('./src/background/background.ts'),
    },
    module: {
        rules: [
            {
                use : 'ts-loader',
                test: /\.tsx$/,
                exclude: /node_modules/
                

            },
            {
                test: /\.svg$/,
                use: 'svg-inline-loader'
              },

            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
              { from: path.resolve('src/assets/manifest.json') , 
              to: path.resolve('dist') },
                { from: path.resolve('src/assets/GitRev.png') ,
                    to: path.resolve('dist') }
            ],
        }),

        new htmlPlugin({
            title: 'GitRev',
            //template: path.resolve('src/index.html'),
            filename: 'popup.html',
            chunks: ['popup']
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: '[name].js',
    },
    optimization: {
        splitChunks: {
            chunks(chunk) {
                return chunk.name !== 'contentScript';
            }
        }
    }
    
};