export default function (config, env) {
  if (env.production) {
    config.output.publicPath = '/sierpinski-triangle-preact/';
  }
  return config;
}
