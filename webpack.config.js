const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: 'node',
  optimization: {
    minimize: false
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/scripts", to: "scripts" }
      ],
    }),
  ]
};
