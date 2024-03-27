import {
	getCommonPlugins,
	getPackageJSON,
	getPkgDistPath,
	getPkgPath
} from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';

// react 包的入口文件地址
const { module } = getPackageJSON('react');

// react 包的所在路径
const pkgPath = getPkgPath('react');

// react 包构建产物所在的路径
const pkgDistPath = getPkgDistPath('react');

export default [
	// react
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'index.js',
			format: 'umd' // 打包成 umd 模块，在 node 和浏览器环境都可用
		},
		plugins: [
			...getCommonPlugins(),
			// 为构建出的包生成 package.json
			generatePackageJson({
				inputFolder: pkgPath, // 输入目录
				outputFolder: pkgDistPath, // 输入目录
				baseContents: ({ name, description, version }) => {
					return {
						name,
						description,
						version,
						main: 'index.js' // cjs umd 模块的入口文件
					};
				}
			})
		]
	},
	// jsx-runtime
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime.js',
				format: 'umd'
			},
			// jsx-dev-runtime
			{
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime.js',
				format: 'umd'
			}
		],
		plugins: getCommonPlugins()
	}
];
