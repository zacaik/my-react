import alias from '@rollup/plugin-alias';
import {
	getCommonPlugins,
	getPackageJSON,
	getPkgDistPath,
	getPkgPath
} from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';

// react-dom 包的入口文件地址
const { module, peerDependencies } = getPackageJSON('react-dom');

// react-dom 包的所在路径
const pkgPath = getPkgPath('react-dom');

// react 包构建产物所在的路径
const pkgDistPath = getPkgDistPath('react-dom');

export default [
	// react
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'index.js',
				format: 'umd' // 打包成 umd 模块，在 node 和浏览器环境都可用
			},
			{
				file: `${pkgDistPath}/client.js`,
				name: 'client.js',
				format: 'umd' // 打包成 umd 模块，在 node 和浏览器环境都可用
			}
		],
		// 不要把 react 的代码打包进来
		external: [...Object.keys(peerDependencies)],
		plugins: [
			...getCommonPlugins(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			// 为构建出的包生成 package.json
			generatePackageJson({
				inputFolder: pkgPath, // 输入目录
				outputFolder: pkgDistPath, // 输入目录
				baseContents: ({ name, description, version }) => {
					return {
						name,
						description,
						version,
						peerDependencies: {
							react: version
						},
						main: 'index.js' // cjs umd 模块的入口文件
					};
				}
			})
		]
	}
];
