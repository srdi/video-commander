/* eslint-disable prettier/prettier */
import typescript from '@rollup/plugin-typescript';
import {
  nodeResolve
} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'public/js-new/script.ts',
  output: {
    dir: './dist',
    format: 'umd',
  },
  plugins: [typescript({
    module: 'ESNext',
    exclude: ["node_modules", "test", "dist", "**/*spec.ts"],
  }), nodeResolve(), commonjs()],
};