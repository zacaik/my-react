import path from 'path';
import fs from 'fs';
import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';

// packages 所在路径
const pkgPath = path.resolve(__dirname, '../../packages');

// packages 打包后的产物路径
const distPath = path.resolve(__dirname, '../../dist/node_modules');

/**
 * 根据包名获取其路径
 * @param {string} pkgName 包名
 * @returns 包所在的路径
 */
export function getPkgPath(pkgName) {
	return `${pkgPath}/${pkgName}`;
}

/**
 * 根据包名获取其构建产物的路径
 * @param {string} pkgName 包名
 * @returns 包对应的构建产物的路径
 */
export function getPkgDistPath(pkgName) {
	return `${distPath}/${pkgName}`;
}

/**
 * 根据包名获取其 package.json 文件的内容
 * @param {string} name 包名
 * @returns 指定包的 package.json 文件的内容
 */
export function getPackageJSON(name) {
	const pkgJSONPath = `${getPkgPath(name)}/package.json`;
	const contentStr = fs.readFileSync(pkgJSONPath, { encoding: 'utf-8' });
	return JSON.parse(contentStr);
}

/**
 * 获取打包所需的公共插件
 * @param {{ typescript: any}} config
 * @returns 公共插件
 */
export function getCommonPlugins(config) {
	const { typescript = {} } = config || {};
	return [cjs(), ts(typescript)];
}
