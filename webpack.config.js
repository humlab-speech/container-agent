const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  target: 'node',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "scripts", to: "scripts" }
      ],
    }),
  ]
};
